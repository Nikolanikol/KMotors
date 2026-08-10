import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { formatAmount } from "@/lib/customs/core/format";
import { uzbekistanFields } from "./fields";
import {
  AGE_USED_ABOVE_YEARS,
  BRV_UZS,
  DUTY_RATE,
  VAT_RATE,
  customsFeeBrv,
  dutyUsdPerCc,
  recyclingCoeff,
} from "./tables";

export type UzbekistanFuel = "ice" | "hybrid" | "electric";

export interface UzbekistanInput {
  price: number;
  priceCurrency: string;
  /** Сколько долларов за единицу валюты сделки. Пошлина считается в долларах. */
  usdPerUnit: number;
  /** Сколько сумов за 1 доллар. */
  uzsPerUsd: number;
  volumeCc: number;
  year: number;
  /** Месяц выпуска, 1–12. */
  month: number;
  /** Расчётные год и месяц. Приходят снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  currentMonth: number;
  fuel: UzbekistanFuel;
}

export const uzbekistanDefaults: UzbekistanInput = {
  price: 25_000,
  priceCurrency: "USD",
  // Снимки на 10.08.2026; в форме заменяются живыми курсами из слоя fx.
  usdPerUnit: 1,
  uzsPerUsd: 11_851.454593,
  volumeCc: 1998,
  year: 2021,
  month: 1,
  currentYear: 2026,
  currentMonth: 1,
  fuel: "ice",
};

/** Возраст в годах с точностью до месяца — ядро дату не берёт. */
function ageYears(input: UzbekistanInput): number {
  const months =
    (input.currentYear - input.year) * 12 + (input.currentMonth - input.month);
  return Math.max(0, months) / 12;
}

function calcFlags(isUsed: boolean, isElectric: boolean): Flag[] {
  const flags: Flag[] = [];

  if (isUsed) {
    flags.push({
      level: "critical",
      text: txt("uzbekistan.flags.usedCar", { years: AGE_USED_ABOVE_YEARS }),
    });
  }
  if (isElectric) {
    flags.push({ level: "info", text: txt("uzbekistan.flags.electric") });
  } else {
    flags.push({ level: "info", text: txt("uzbekistan.flags.smallEngineLost") });
  }
  flags.push({ level: "info", text: txt("uzbekistan.flags.noExcise") });
  flags.push({ level: "warn", text: txt("uzbekistan.flags.notIncluded") });

  return flags;
}

export function calculateUzbekistan(input: UzbekistanInput): CalcResult {
  const age = ageYears(input);
  const isElectric = input.fuel === "electric";
  const isUsed = age > AGE_USED_ABOVE_YEARS;

  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);
  const usdPerUnit = Math.max(0, input.usdPerUnit);
  const uzsPerUsd = Math.max(0, input.uzsPerUsd);

  const priceUsd = Math.max(0, input.price) * usdPerUnit;
  const priceUzs = priceUsd * uzsPerUsd;

  const feeUzs = customsFeeBrv(priceUzs) * BRV_UZS;

  const perCc = dutyUsdPerCc(volumeCc);
  const dutyUsd = isElectric ? 0 : priceUsd * DUTY_RATE + volumeCc * perCc;
  const dutyUzs = dutyUsd * uzsPerUsd;

  // База НДС — стоимость вместе с пошлиной; утильсбор и сбор за оформление
  // в неё не входят. Порядок сохранён от прежней версии.
  const vatUzs = Math.round((priceUzs + dutyUzs) * VAT_RATE);

  const recyclingUzs = isElectric ? 0 : recyclingCoeff(volumeCc) * BRV_UZS;

  const lines: Line[] = [
    {
      id: "customsFee",
      label: txt("uzbekistan.lines.customsFee"),
      note: txt("uzbekistan.notes.customsFee", {
        brv: customsFeeBrv(priceUzs),
        value: formatAmount(priceUzs),
      }),
      amount: feeUzs,
      currency: "UZS",
    },
    {
      id: "duty",
      label: txt("uzbekistan.lines.duty"),
      note: txt(
        isElectric ? "uzbekistan.notes.dutyElectric" : "uzbekistan.notes.duty",
        {
          rate: DUTY_RATE * 100,
          perCc,
          volumeCc,
          usd: formatAmount(dutyUsd, 2),
        },
      ),
      amount: Math.round(dutyUzs),
      currency: "UZS",
      muted: dutyUzs === 0,
    },
    {
      id: "vat",
      label: txt("uzbekistan.lines.vat"),
      note: txt("uzbekistan.notes.vat", { rate: VAT_RATE * 100 }),
      amount: vatUzs,
      currency: "UZS",
    },
    {
      id: "recyclingFee",
      label: txt("uzbekistan.lines.recyclingFee"),
      note: txt(
        isElectric
          ? "uzbekistan.notes.recyclingElectric"
          : "uzbekistan.notes.recyclingFee",
        { coeff: recyclingCoeff(volumeCc) },
      ),
      amount: recyclingUzs,
      currency: "UZS",
      muted: recyclingUzs === 0,
    },
  ];

  const totalUzs = lines.reduce((sum, line) => sum + line.amount, 0);

  const alt: CalcResult["alt"] = [];
  if (uzsPerUsd > 0) alt.push({ amount: totalUzs / uzsPerUsd, currency: "USD" });
  if (usdPerUnit > 0 && uzsPerUsd > 0 && input.priceCurrency !== "USD") {
    alt.push({
      amount: totalUzs / uzsPerUsd / usdPerUnit,
      currency: input.priceCurrency,
    });
  }

  const subtitle: I18nText[] = [
    txt("uzbekistan.subtitle.yearMonth", {
      year: input.year,
      month: txt(`ui.month.${input.month}`),
    }),
    ...(isElectric ? [] : [txt("uzbekistan.subtitle.volume", { volumeCc })]),
    txt(`uzbekistan.fuelShort.${input.fuel}`),
  ];

  return {
    lines,
    total: { amount: totalUzs, currency: "UZS" },
    alt,
    flags: calcFlags(isUsed, isElectric),
    subtitle,
    stampLabel: txt(isUsed ? "uzbekistan.stamp.used" : "uzbekistan.stamp.new"),
    meta: {
      fuel: input.fuel,
      ageYears: String(Math.floor(age)),
      ageBand: isUsed ? "used" : "new",
      volumeCc: String(volumeCc),
      priceUsd: String(Math.round(priceUsd)),
      priceUzs: String(Math.round(priceUzs)),
      dutyUsd: String(Math.round(dutyUsd)),
      dutyUzs: String(Math.round(dutyUzs)),
      vatUzs: String(vatUzs),
      recyclingUzs: String(recyclingUzs),
      totalUzs: String(totalUzs),
    },
  };
}

export const uzbekistanCalculator: CountryCalculator<UzbekistanInput> = {
  id: "uzbekistan",
  title: txt("uzbekistan.title"),
  fields: uzbekistanFields,
  defaults: uzbekistanDefaults,
  calculate: calculateUzbekistan,
};
