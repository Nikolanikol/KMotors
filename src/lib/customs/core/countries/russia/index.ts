import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { formatAmount } from "@/lib/customs/core/format";
import { russiaFields } from "./fields";
import {
  AGE_MID_BELOW,
  AGE_NEW_BELOW,
  ELECTRIC_DUTY_RATE,
  NEW_BRACKETS,
  RECYCLING_BASE_RUB,
  customsFeeRub,
  dutyRateByAge,
  recyclingCoeff,
} from "./tables";

export type RussiaFuel = "ice" | "hybrid" | "electric";

export interface RussiaInput {
  /** Стоимость авто в валюте сделки. */
  price: number;
  /** Код валюты сделки — нужен только для подписи справочной строки. */
  priceCurrency: string;
  /** Сколько рублей за единицу валюты сделки. */
  rubPerUnit: number;
  /** Сколько рублей за 1 евро. Ставки пошлины заданы в евро. */
  rubPerEur: number;
  /** Объём двигателя, см³. У электромобиля не используется. */
  volumeCc: number;
  /** Мощность, л.с. Ноль означает «не указана». */
  horsePower: number;
  year: number;
  /** Месяц выпуска, 1–12. */
  month: number;
  /** Расчётный год и месяц. Приходят снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  currentMonth: number;
  fuel: RussiaFuel;
}

export const russiaDefaults: RussiaInput = {
  price: 25_000,
  priceCurrency: "USD",
  // Снимки на 10.08.2026; в форме заменяются живыми курсами из слоя fx.
  rubPerUnit: 81.969182,
  rubPerEur: 94.7,
  volumeCc: 1998,
  horsePower: 150,
  year: 2021,
  month: 1,
  currentYear: 2026,
  currentMonth: 1,
  fuel: "ice",
};

/**
 * Возраст в годах с точностью до месяца.
 *
 * Прежний калькулятор брал точную разницу дат от `new Date()`. Ядро дату не
 * берёт, поэтому расчётный момент приходит извне годом и месяцем — той же
 * гранулярностью, что и дата выпуска. На границах бракетов (3 и 5 лет) это
 * может дать иной результат, чем прежняя версия, у которой к месяцам
 * примешивался день. Число одинаково точно, но сравнимо само с собой.
 */
function ageYears(input: RussiaInput): number {
  const months =
    (input.currentYear - input.year) * 12 + (input.currentMonth - input.month);
  return Math.max(0, months) / 12;
}

interface DutyResult {
  rub: number;
  note: I18nText;
  bandId: "electric" | "new" | "mid" | "old";
}

function calcDuty(
  priceEur: number,
  volumeCc: number,
  age: number,
  isElectric: boolean,
  rubPerEur: number,
): DutyResult {
  if (isElectric) {
    return {
      rub: priceEur * ELECTRIC_DUTY_RATE * rubPerEur,
      bandId: "electric",
      note: txt("russia.notes.dutyElectric", {
        rate: ELECTRIC_DUTY_RATE * 100,
      }),
    };
  }

  if (age < AGE_NEW_BELOW) {
    const bracket =
      NEW_BRACKETS.find((row) => priceEur <= row.maxEur) ??
      NEW_BRACKETS[NEW_BRACKETS.length - 1];
    const byValue = priceEur * bracket.pct;
    const byVolume = volumeCc * bracket.perCc;
    const minWins = byVolume > byValue;
    return {
      rub: Math.max(byValue, byVolume) * rubPerEur,
      bandId: "new",
      note: txt(
        minWins ? "russia.notes.dutyNewByVolume" : "russia.notes.dutyNewByValue",
        {
          rate: bracket.pct * 100,
          perCc: bracket.perCc,
          byVolume: formatAmount(byVolume, 2),
          byValue: formatAmount(byValue, 2),
        },
      ),
    };
  }

  const perCc = dutyRateByAge(age, volumeCc);
  return {
    rub: volumeCc * perCc * rubPerEur,
    bandId: age < AGE_MID_BELOW ? "mid" : "old",
    note: txt("russia.notes.dutyPerCc", { perCc, volumeCc }),
  };
}

function calcFlags(
  input: RussiaInput,
  age: number,
  recyclingApprox: boolean,
): Flag[] {
  const flags: Flag[] = [];

  if (recyclingApprox) {
    flags.push({
      level: "warn",
      text: txt(
        input.horsePower > 0
          ? "russia.flags.recyclingApproxTable"
          : "russia.flags.recyclingNoHp",
      ),
    });
  }

  if (input.fuel === "electric") {
    flags.push({
      level: "info",
      text: txt("russia.flags.electric", { rate: ELECTRIC_DUTY_RATE * 100 }),
    });
  }

  if (input.fuel === "hybrid") {
    flags.push({ level: "info", text: txt("russia.flags.hybrid") });
  }

  if (age >= AGE_NEW_BELOW && age < AGE_MID_BELOW) {
    flags.push({
      level: "info",
      text: txt("russia.flags.midBand", {
        from: AGE_NEW_BELOW,
        to: AGE_MID_BELOW,
      }),
    });
  }

  flags.push({ level: "info", text: txt("russia.flags.privatePerson") });
  flags.push({ level: "warn", text: txt("russia.flags.notIncluded") });

  return flags;
}

export function calculateRussia(input: RussiaInput): CalcResult {
  const age = ageYears(input);
  const isElectric = input.fuel === "electric";
  const isNew = age < AGE_NEW_BELOW;

  // Объём обнуляем в ядре, а не полагаемся на форму: поле прячется при выборе
  // электромобиля, но прежнее значение осталось бы в состоянии.
  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);
  const horsePower = input.horsePower > 0 ? input.horsePower : undefined;

  const rubPerUnit = Math.max(0, input.rubPerUnit);
  const rubPerEur = Math.max(0, input.rubPerEur);

  const priceRub = Math.max(0, input.price) * rubPerUnit;
  const priceEur = rubPerEur > 0 ? priceRub / rubPerEur : 0;

  const duty = calcDuty(priceEur, volumeCc, age, isElectric, rubPerEur);
  const dutyRub = Math.round(duty.rub);
  const feeRub = customsFeeRub(priceRub);

  const recycling = recyclingCoeff(volumeCc, horsePower, isNew, isElectric);
  const recyclingRub = Math.round(RECYCLING_BASE_RUB * recycling.coeff);

  const lines: Line[] = [
    {
      id: "duty",
      label: txt("russia.lines.duty"),
      note: duty.note,
      amount: dutyRub,
      currency: "RUB",
      muted: dutyRub === 0,
    },
    {
      id: "customsFee",
      label: txt("russia.lines.customsFee"),
      note: txt("russia.notes.customsFee", { value: formatAmount(priceRub) }),
      amount: feeRub,
      currency: "RUB",
    },
    {
      id: "recyclingFee",
      label: txt("russia.lines.recyclingFee"),
      note: txt("russia.notes.recyclingFee", {
        base: formatAmount(RECYCLING_BASE_RUB),
        coeff: recycling.coeff,
      }),
      amount: recyclingRub,
      currency: "RUB",
    },
  ];

  const totalRub = lines.reduce((sum, line) => sum + line.amount, 0);

  const alt: CalcResult["alt"] =
    rubPerUnit > 0
      ? [{ amount: totalRub / rubPerUnit, currency: input.priceCurrency }]
      : [];

  const subtitle: I18nText[] = [
    txt("russia.subtitle.yearMonth", {
      year: input.year,
      month: txt(`ui.month.${input.month}`),
    }),
    ...(isElectric ? [] : [txt("russia.subtitle.volume", { volumeCc })]),
    ...(horsePower ? [txt("russia.subtitle.power", { horsePower })] : []),
    txt(`russia.fuelShort.${input.fuel}`),
  ];

  return {
    lines,
    total: { amount: totalRub, currency: "RUB" },
    alt,
    flags: calcFlags(input, age, recycling.isApprox),
    subtitle,
    stampLabel: txt("russia.stamp.eaeu"),
    meta: {
      fuel: input.fuel,
      ageYears: String(Math.floor(age)),
      ageBand: duty.bandId,
      volumeCc: String(volumeCc),
      horsePower: String(horsePower ?? 0),
      priceRub: String(Math.round(priceRub)),
      priceEur: String(Math.round(priceEur)),
      dutyRub: String(dutyRub),
      feeRub: String(feeRub),
      recyclingRub: String(recyclingRub),
      recyclingApprox: String(recycling.isApprox),
      totalRub: String(totalRub),
    },
  };
}

export const russiaCalculator: CountryCalculator<RussiaInput> = {
  id: "russia",
  title: txt("russia.title"),
  fields: russiaFields,
  defaults: russiaDefaults,
  calculate: calculateRussia,
};
