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
  CERTIFICATE_MRP,
  CUSTOMS_FEE_MRP,
  DUTY_RATE,
  PLATES_MRP,
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

/**
 * ⚠️ Два вида гибрида разведены НАМЕРЕННО, это не избыточность формы.
 *
 * `erev` — последовательный гибрид: ДВС не связан с колёсами механически и
 * работает только генератором. Решением ЕЭК такие машины попали в ТН ВЭД
 * 8703 80, и КГД считает их электромобилями: пошлина 0%, утильсбор 0,
 * регистрация по электрической шкале. Это Li Auto L6–L9, AITO M5/M7/M9,
 * Voyah в версиях EVR, Leapmotor C10/C11, Deepal L07/S07.
 *
 * `hybrid` — параллельный и подключаемый (HEV/PHEV): у ДВС есть трансмиссия
 * на ведущую ось, и КГД считает такую машину обычной бензиновой, даже если
 * батарея большая и заряжается от розетки. Это все гибриды Toyota, BYD DM-i
 * и DM-p, Geely Hi-P. Разница между двумя ветками — миллионы тенге.
 */
export type KazakhstanFuel = "ice" | "hybrid" | "erev" | "electric";

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
 * Возраст в ПОЛНЫХ месяцах. Нужен ТОЛЬКО порогу 7 лет по пошлине.
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

/**
 * Возраст в календарных годах — разница годов, месяц не участвует.
 *
 * ⚠️ Отдельная функция, а не `ageMonths / 12`: регистрационный сбор ст. 830
 * НК РК считается «включая год выпуска», то есть по номеру года, а не по дате.
 * Машина декабря 2023 в августе 2026 — это 32 полных месяца, но 3 календарных
 * года, и разница между двумя прочтениями здесь 1,95 млн ₸.
 */
function ageYears(input: KazakhstanInput): number {
  return Math.max(0, input.currentYear - input.year);
}

function calcFlags(args: {
  isElectric: boolean;
  isErev: boolean;
  isOld: boolean;
  isLuxury: boolean;
  ageYears: number;
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
  if (args.isErev) {
    flags.push({ level: "warn", text: txt("kazakhstan.flags.erev") });
  }
  if (args.ageYears >= 2) {
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
  const years = ageYears(input);
  const isElectric = input.fuel === "electric";
  const isErev = input.fuel === "erev";
  /** Пошлина, утильсбор и шкала регистрации у EREV — как у электромобиля. */
  const isZeroDuty = isElectric || isErev;
  const isOld = months > AGE_OLD_ABOVE_MONTHS;

  // У EREV объём двигателя остаётся: он ни на что не влияет, пока не перешагнёт
  // порог акциза, а у чистого электромобиля объёма нет вовсе.
  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);
  const kztPerUnit = Math.max(0, input.kztPerUnit);
  const kztPerEur = Math.max(0, input.kztPerEur);

  const customsValueKzt = Math.max(0, input.price) * kztPerUnit;

  const feeKzt = CUSTOMS_FEE_MRP * MRP_KZT;

  let dutyKzt = 0;
  let dutyNote: I18nText = txt(
    isErev ? "kazakhstan.notes.dutyErev" : "kazakhstan.notes.dutyElectric",
  );
  if (!isZeroDuty) {
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

  // ⚠️ База НДС по ст. 466 НК РК — «матрёшка»: таможенная стоимость + пошлина +
  // таможенные СБОРЫ + акцизы, и акциз на роскошь входит наравне с акцизом по
  // объёму. До 11.08.2026 здесь не было ни сбора, ни акциза на роскошь.
  const vatKzt = Math.round(
    (customsValueKzt + dutyKzt + exciseEngineKzt + exciseLuxuryKzt + feeKzt) *
      VAT_RATE,
  );

  const registrationKzt = Math.round(
    registrationMrp(years, isZeroDuty ? "electric" : "ice") * MRP_KZT,
  );
  const registrationDocsKzt = Math.round(
    (PLATES_MRP + CERTIFICATE_MRP) * MRP_KZT,
  );
  const recyclingKzt = isZeroDuty
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
      note: txt("kazakhstan.notes.registration", {
        year: input.year,
        currentYear: input.currentYear,
      }),
      amount: registrationKzt,
      currency: "KZT",
    },
    {
      id: "registrationDocs",
      label: txt("kazakhstan.lines.registrationDocs"),
      note: txt("kazakhstan.notes.registrationDocs", {
        plates: PLATES_MRP,
        certificate: CERTIFICATE_MRP,
      }),
      amount: registrationDocsKzt,
      currency: "KZT",
    },
    {
      id: "recyclingFee",
      label: txt("kazakhstan.lines.recyclingFee"),
      note: txt(
        isErev
          ? "kazakhstan.notes.recyclingErev"
          : isElectric
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
    flags: calcFlags({ isElectric, isErev, isOld, isLuxury, ageYears: years }),
    subtitle,
    stampLabel: txt(
      isLuxury ? "kazakhstan.stamp.luxury" : "kazakhstan.stamp.eaeu",
    ),
    meta: {
      fuel: input.fuel,
      ageMonths: String(months),
      ageYears: String(years),
      ageBand: isOld ? "old" : "new",
      volumeCc: String(volumeCc),
      customsValueKzt: String(Math.round(customsValueKzt)),
      dutyKzt: String(Math.round(dutyKzt)),
      vatKzt: String(vatKzt),
      registrationKzt: String(registrationKzt),
      registrationScale: isZeroDuty ? "electric" : "ice",
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
