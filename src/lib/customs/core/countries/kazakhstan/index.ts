import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { formatAmount } from "@/lib/customs/core/format";
import { kazakhstanFields } from "./fields";
import {
  ADDITIONAL_KZT,
  AGE_OLD_ABOVE_MONTHS,
  CUSTOMS_FEE_MRP,
  DUTY_RATE,
  EXCISE_KZT_PER_CC,
  EXCISE_VOLUME_ABOVE_CC,
  LUXURY_RATE,
  LUXURY_THRESHOLD_MRP,
  MRP_KZT,
  RECYCLING_BASE_MRP,
  VAT_RATE,
  minDutyEurPerCc,
  recyclingCoeff,
  registrationMrp,
} from "./tables";

export type KazakhstanFuel = "ice" | "hybrid" | "electric";

export interface KazakhstanInput {
  price: number;
  priceCurrency: string;
  /** Сколько тенге за единицу валюты сделки. */
  kztPerUnit: number;
  /** Сколько тенге за 1 евро. Нужен только минимуму по объёму у авто >7 лет. */
  kztPerEur: number;
  volumeCc: number;
  year: number;
  /** Месяц выпуска, 1–12. */
  month: number;
  /** Расчётные год и месяц. Приходят снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  currentMonth: number;
  fuel: KazakhstanFuel;
}

export const kazakhstanDefaults: KazakhstanInput = {
  price: 25_000,
  priceCurrency: "USD",
  // Снимки на 10.08.2026; в форме заменяются живыми курсами из слоя fx.
  kztPerUnit: 468.321957,
  kztPerEur: 541.1,
  volumeCc: 1998,
  year: 2021,
  month: 1,
  currentYear: 2026,
  currentMonth: 1,
  fuel: "ice",
};

/**
 * Возраст в ПОЛНЫХ месяцах.
 *
 * Таможня РК принимает датой выпуска последний день указанного месяца, и
 * формула без поправки на день этому правилу эквивалентна — так было
 * записано в исходном калькуляторе, сохранено дословно.
 */
function ageMonths(input: KazakhstanInput): number {
  return Math.max(
    0,
    (input.currentYear - input.year) * 12 + (input.currentMonth - input.month),
  );
}

function calcFlags(args: {
  isElectric: boolean;
  isOld: boolean;
  isLuxury: boolean;
  ageMonths: number;
}): Flag[] {
  const flags: Flag[] = [];

  if (args.isOld) {
    flags.push({
      level: "warn",
      text: txt("kazakhstan.flags.oldCar", {
        years: AGE_OLD_ABOVE_MONTHS / 12,
      }),
    });
  }
  if (args.isLuxury) {
    flags.push({
      level: "info",
      text: txt("kazakhstan.flags.luxury", {
        threshold: formatAmount(LUXURY_THRESHOLD_MRP * MRP_KZT),
        rate: LUXURY_RATE * 100,
      }),
    });
  }
  if (args.isElectric) {
    flags.push({ level: "info", text: txt("kazakhstan.flags.electric") });
  }
  if (args.ageMonths > 24) {
    flags.push({
      level: "info",
      text: txt("kazakhstan.flags.registrationJump"),
    });
  }

  flags.push({
    level: "warn",
    text: txt("kazakhstan.flags.additionalEstimate", {
      amount: formatAmount(ADDITIONAL_KZT),
    }),
  });
  flags.push({ level: "warn", text: txt("kazakhstan.flags.notIncluded") });

  return flags;
}

export function calculateKazakhstan(input: KazakhstanInput): CalcResult {
  const months = ageMonths(input);
  const isElectric = input.fuel === "electric";
  const isOld = months > AGE_OLD_ABOVE_MONTHS;

  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);
  const kztPerUnit = Math.max(0, input.kztPerUnit);
  const kztPerEur = Math.max(0, input.kztPerEur);

  const customsValueKzt = Math.max(0, input.price) * kztPerUnit;

  const feeKzt = CUSTOMS_FEE_MRP * MRP_KZT;

  let dutyKzt = 0;
  let dutyNote: I18nText = txt("kazakhstan.notes.dutyElectric");
  if (!isElectric) {
    const byValue = customsValueKzt * DUTY_RATE;
    if (isOld) {
      const perCc = minDutyEurPerCc(volumeCc);
      const byVolume = volumeCc * perCc * kztPerEur;
      dutyKzt = Math.max(byValue, byVolume);
      dutyNote = txt(
        byVolume > byValue
          ? "kazakhstan.notes.dutyByVolume"
          : "kazakhstan.notes.dutyByValue",
        {
          rate: DUTY_RATE * 100,
          perCc,
          byVolume: formatAmount(byVolume),
          byValue: formatAmount(byValue),
        },
      );
    } else {
      dutyKzt = byValue;
      dutyNote = txt("kazakhstan.notes.duty", { rate: DUTY_RATE * 100 });
    }
  }

  const exciseEngineKzt =
    volumeCc > EXCISE_VOLUME_ABOVE_CC ? volumeCc * EXCISE_KZT_PER_CC : 0;

  const isLuxury = customsValueKzt > LUXURY_THRESHOLD_MRP * MRP_KZT;
  const exciseLuxuryKzt = isLuxury
    ? Math.round(customsValueKzt * LUXURY_RATE)
    : 0;

  // База НДС — стоимость вместе с пошлиной и акцизом по объёму;
  // акциз на роскошь в неё не входит. Порядок сохранён от прежней версии.
  const vatKzt = Math.round(
    (customsValueKzt + dutyKzt + exciseEngineKzt) * VAT_RATE,
  );

  const registrationKzt = Math.round(registrationMrp(months) * MRP_KZT);
  const recyclingKzt = isElectric
    ? 0
    : Math.round(RECYCLING_BASE_MRP * MRP_KZT * recyclingCoeff(volumeCc));

  const lines: Line[] = [
    {
      id: "customsFee",
      label: txt("kazakhstan.lines.customsFee"),
      note: txt("kazakhstan.notes.customsFee", { mrp: CUSTOMS_FEE_MRP }),
      amount: feeKzt,
      currency: "KZT",
    },
    {
      id: "duty",
      label: txt("kazakhstan.lines.duty"),
      note: dutyNote,
      amount: Math.round(dutyKzt),
      currency: "KZT",
      muted: dutyKzt === 0,
    },
    {
      id: "exciseEngine",
      label: txt("kazakhstan.lines.exciseEngine"),
      note: txt(
        exciseEngineKzt > 0
          ? "kazakhstan.notes.exciseEngine"
          : "kazakhstan.notes.exciseEngineNone",
        { threshold: EXCISE_VOLUME_ABOVE_CC, perCc: EXCISE_KZT_PER_CC },
      ),
      amount: exciseEngineKzt,
      currency: "KZT",
      muted: exciseEngineKzt === 0,
    },
    {
      id: "exciseLuxury",
      label: txt("kazakhstan.lines.exciseLuxury"),
      note: txt(
        isLuxury
          ? "kazakhstan.notes.exciseLuxury"
          : "kazakhstan.notes.exciseLuxuryNone",
        {
          rate: LUXURY_RATE * 100,
          threshold: formatAmount(LUXURY_THRESHOLD_MRP * MRP_KZT),
        },
      ),
      amount: exciseLuxuryKzt,
      currency: "KZT",
      muted: exciseLuxuryKzt === 0,
    },
    {
      id: "vat",
      label: txt("kazakhstan.lines.vat"),
      note: txt("kazakhstan.notes.vat", { rate: VAT_RATE * 100 }),
      amount: vatKzt,
      currency: "KZT",
    },
    {
      id: "registration",
      label: txt("kazakhstan.lines.registration"),
      note: txt("kazakhstan.notes.registration", { months }),
      amount: registrationKzt,
      currency: "KZT",
    },
    {
      id: "recyclingFee",
      label: txt("kazakhstan.lines.recyclingFee"),
      note: txt(
        isElectric
          ? "kazakhstan.notes.recyclingElectric"
          : "kazakhstan.notes.recyclingFee",
        { coeff: recyclingCoeff(volumeCc), base: RECYCLING_BASE_MRP },
      ),
      amount: recyclingKzt,
      currency: "KZT",
      muted: recyclingKzt === 0,
    },
    {
      id: "additional",
      label: txt("kazakhstan.lines.additional"),
      note: txt("kazakhstan.notes.additional"),
      amount: ADDITIONAL_KZT,
      currency: "KZT",
    },
  ];

  const totalKzt = lines.reduce((sum, line) => sum + line.amount, 0);

  const alt: CalcResult["alt"] =
    kztPerUnit > 0
      ? [{ amount: totalKzt / kztPerUnit, currency: input.priceCurrency }]
      : [];

  const subtitle: I18nText[] = [
    txt("kazakhstan.subtitle.yearMonth", {
      year: input.year,
      month: txt(`ui.month.${input.month}`),
    }),
    ...(isElectric ? [] : [txt("kazakhstan.subtitle.volume", { volumeCc })]),
    txt(`kazakhstan.fuelShort.${input.fuel}`),
  ];

  return {
    lines,
    total: { amount: totalKzt, currency: "KZT" },
    alt,
    flags: calcFlags({ isElectric, isOld, isLuxury, ageMonths: months }),
    subtitle,
    stampLabel: txt(
      isLuxury ? "kazakhstan.stamp.luxury" : "kazakhstan.stamp.eaeu",
    ),
    meta: {
      fuel: input.fuel,
      ageMonths: String(months),
      ageBand: isOld ? "old" : "new",
      volumeCc: String(volumeCc),
      customsValueKzt: String(Math.round(customsValueKzt)),
      dutyKzt: String(Math.round(dutyKzt)),
      vatKzt: String(vatKzt),
      registrationKzt: String(registrationKzt),
      recyclingKzt: String(recyclingKzt),
      luxury: String(isLuxury),
      totalKzt: String(totalKzt),
    },
  };
}

export const kazakhstanCalculator: CountryCalculator<KazakhstanInput> = {
  id: "kazakhstan",
  title: txt("kazakhstan.title"),
  fields: kazakhstanFields,
  defaults: kazakhstanDefaults,
  calculate: calculateKazakhstan,
};
