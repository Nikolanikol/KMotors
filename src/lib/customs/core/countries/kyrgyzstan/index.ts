import { formatAmount } from "@/lib/customs/core/format";
import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { kyrgyzstanFields } from "./fields";
import {
  COMMERCIAL_AGE_MID_MAX,
  COMMERCIAL_AGE_NEW_MAX,
  COMMERCIAL_MID_DUTY_RATE,
  COMMERCIAL_NEW_DUTY_RATE,
  CUSTOMS_FEE_RATE,
  ELECTRIC_DUTY_RATE,
  ELECTRIC_VAT_FREE_AGE_MAX,
  EXCISE_KGS,
  HS_CODE_ELECTRIC,
  HS_CODE_SERIES_HYBRID,
  PERSONAL_AGE_MID_MAX,
  PERSONAL_AGE_NEW_MAX,
  REGISTRATION_FEE_RATE,
  VAT_RATE,
  commercialBracket,
  personalNewBracket,
  personalRateEurPerCc,
  roundEur,
  roundKgs,
} from "./tables";

export type KyrgyzstanMode = "personal" | "commercial";
export type KyrgyzstanFuel =
  | "petrol"
  | "diesel"
  | "seriesHybrid"
  | "electric";

export interface KyrgyzstanInput {
  /** Физлицо считается по ЕЭК №107, юрлицо — по ЕТТ ЕАЭС. */
  mode: KyrgyzstanMode;
  fuel: KyrgyzstanFuel;
  /** Объём двигателя, см³. У электро и последовательного гибрида не используется. */
  volumeCc: number;
  year: number;
  /** Расчётный год. Приходит снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  /** Стоимость авто в валюте сделки. */
  price: number;
  /** Фрахт и страховка в той же валюте. */
  freight: number;
  /**
   * Сколько евро за единицу валюты сделки.
   *
   * Ядро не знает, что это за валюта: доллар, вона или сам евро — для расчёта
   * безразлично. Благодаря этому эталон, снятый в евро, подаётся в то же ядро,
   * что и форма с долларом.
   */
  eurPerUnit: number;
  /** Сколько сомов за 1 евро. Курс НБКР на дату оформления. */
  kgsPerEur: number;
  /** Код валюты сделки. Нужен только для подписи справочной строки. */
  priceCurrency: string;
}

export const kyrgyzstanDefaults: KyrgyzstanInput = {
  mode: "personal",
  fuel: "petrol",
  volumeCc: 1998,
  year: 2021,
  currentYear: 2026,
  price: 9000,
  freight: 1100,
  // Снимки на 09.08.2026; в форме заменяются живыми курсами из слоя fx.
  eurPerUnit: 0.865939,
  kgsPerEur: 100.77,
  priceCurrency: "USD",
};

/** Электромобиль и последовательный гибрид идут по одной квоте и одной ставке. */
function isQuotaVehicle(fuel: KyrgyzstanFuel): boolean {
  return fuel === "electric" || fuel === "seriesHybrid";
}

interface DutyResult {
  eur: number;
  note: I18nText;
  /** Код бракета — машинное значение для meta, не для показа. */
  bandId: "quota" | "new" | "mid" | "old";
}

/**
 * Личное пользование — Приложение №2 к Решению Совета ЕЭК №107.
 * Единый совокупный платёж: НДС и акциз сверху не начисляются.
 */
function personalDuty(
  valueEur: number,
  volumeCc: number,
  age: number,
  fuel: KyrgyzstanFuel,
): DutyResult {
  if (isQuotaVehicle(fuel)) {
    return {
      eur: valueEur * ELECTRIC_DUTY_RATE,
      bandId: "quota",
      note: txt("kyrgyzstan.notes.dutyQuotaPersonal", {
        rate: ELECTRIC_DUTY_RATE * 100,
      }),
    };
  }

  if (age <= PERSONAL_AGE_NEW_MAX) {
    const bracket = personalNewBracket(valueEur);
    const byValue = valueEur * bracket.rate;
    const byVolume = bracket.minEurPerCc * volumeCc;
    const minWins = byVolume > byValue;
    return {
      eur: Math.max(byValue, byVolume),
      bandId: "new",
      note: txt(
        minWins
          ? "kyrgyzstan.notes.dutyNewByVolume"
          : "kyrgyzstan.notes.dutyNewByValue",
        {
          rate: bracket.rate * 100,
          perCc: bracket.minEurPerCc,
          byVolume: formatAmount(byVolume, 2),
          byValue: formatAmount(byValue, 2),
        },
      ),
    };
  }

  const rate = personalRateEurPerCc(volumeCc, age);
  return {
    eur: rate * volumeCc,
    bandId: age <= PERSONAL_AGE_MID_MAX ? "mid" : "old",
    note: txt("kyrgyzstan.notes.dutyPerCc", { perCc: rate, volumeCc }),
  };
}

/** Общий порядок — ЕТТ ЕАЭС, группа 87. */
function commercialDuty(
  valueEur: number,
  volumeCc: number,
  age: number,
  fuel: KyrgyzstanFuel,
): DutyResult {
  if (isQuotaVehicle(fuel)) {
    return {
      eur: valueEur * ELECTRIC_DUTY_RATE,
      bandId: "quota",
      note: txt("kyrgyzstan.notes.dutyQuotaCommercial", {
        rate: ELECTRIC_DUTY_RATE * 100,
      }),
    };
  }

  if (age <= COMMERCIAL_AGE_NEW_MAX) {
    return {
      eur: valueEur * COMMERCIAL_NEW_DUTY_RATE,
      bandId: "new",
      note: txt("kyrgyzstan.notes.dutyNewFlat", {
        rate: COMMERCIAL_NEW_DUTY_RATE * 100,
      }),
    };
  }

  const bracket = commercialBracket(volumeCc, fuel === "diesel");

  if (age <= COMMERCIAL_AGE_MID_MAX) {
    const byValue = valueEur * COMMERCIAL_MID_DUTY_RATE;
    const byVolume = bracket.mid * volumeCc;
    const minWins = byVolume > byValue;
    return {
      eur: Math.max(byValue, byVolume),
      bandId: "mid",
      note: txt(
        minWins
          ? "kyrgyzstan.notes.dutyNewByVolume"
          : "kyrgyzstan.notes.dutyNewByValue",
        {
          rate: COMMERCIAL_MID_DUTY_RATE * 100,
          perCc: bracket.mid,
          byVolume: formatAmount(byVolume, 2),
          byValue: formatAmount(byValue, 2),
        },
      ),
    };
  }

  return {
    eur: bracket.old * volumeCc,
    bandId: "old",
    note: txt("kyrgyzstan.notes.dutyOld", {
      perCc: bracket.old,
      volumeCc,
    }),
  };
}

function calcFlags(args: {
  mode: KyrgyzstanMode;
  fuel: KyrgyzstanFuel;
  /** Начисленный НДС — по нему видно, сработало ли освобождение для EV. */
  vatEur: number;
  registrationKgs: number;
}): Flag[] {
  const flags: Flag[] = [];
  const quota = isQuotaVehicle(args.fuel);

  if (quota) {
    flags.push({
      level: "critical",
      text: txt("kyrgyzstan.flags.quotaExhausted", {
        codeElectric: HS_CODE_ELECTRIC,
        codeHybrid: HS_CODE_SERIES_HYBRID,
        rate: ELECTRIC_DUTY_RATE * 100,
      }),
    });
  }

  if (args.mode === "personal") {
    if (!quota) {
      flags.push({ level: "info", text: txt("kyrgyzstan.flags.fuelIrrelevant") });
    }
    flags.push({
      level: "warn",
      text: txt("kyrgyzstan.flags.feeSeparate", {
        rate: CUSTOMS_FEE_RATE * 100,
      }),
    });
    flags.push({ level: "info", text: txt("kyrgyzstan.flags.onePerYear") });
    if (args.registrationKgs > 0) {
      flags.push({
        level: "warn",
        text: txt("kyrgyzstan.flags.registrationEstimate", {
          rate: REGISTRATION_FEE_RATE * 100,
        }),
      });
    }
  } else {
    flags.push({ level: "info", text: txt("kyrgyzstan.flags.brokerRequired") });
    if (quota) {
      flags.push({
        level: args.vatEur > 0 ? "info" : "warn",
        text:
          args.vatEur > 0
            ? txt("kyrgyzstan.flags.electricVatCharged", {
                maxAge: ELECTRIC_VAT_FREE_AGE_MAX,
                rate: VAT_RATE * 100,
              })
            : txt("kyrgyzstan.flags.electricVatFree", {
                maxAge: ELECTRIC_VAT_FREE_AGE_MAX,
              }),
      });
    }
  }

  flags.push({ level: "info", text: txt("kyrgyzstan.flags.ratesInEur") });
  flags.push({ level: "warn", text: txt("kyrgyzstan.flags.notIncluded") });

  return flags;
}

export function calculateKyrgyzstan(input: KyrgyzstanInput): CalcResult {
  const age = Math.max(0, input.currentYear - input.year);
  const quota = isQuotaVehicle(input.fuel);

  // Объём обнуляем в ядре, а не полагаемся на форму: поле прячется при выборе
  // электро, но прежнее значение остаётся в состоянии и иначе утащило бы
  // электромобиль в бракет по объёму.
  const volumeCc = quota ? 0 : Math.max(0, input.volumeCc);

  const priceUnits = Math.max(0, input.price) + Math.max(0, input.freight);
  const eurPerUnit = Math.max(0, input.eurPerUnit);
  const kgsPerEur = Math.max(0, input.kgsPerEur);

  const customsValueEur = roundEur(priceUnits * eurPerUnit);

  const duty =
    input.mode === "personal"
      ? personalDuty(customsValueEur, volumeCc, age, input.fuel)
      : commercialDuty(customsValueEur, volumeCc, age, input.fuel);
  const dutyEur = roundEur(duty.eur);

  // Физлицо платит ЕСП — совокупный платёж, НДС сверх него не начисляется.
  // У юрлица НДС берётся от стоимости вместе с пошлиной; для электромобилей
  // и последовательных гибридов до 5 лет включительно действует освобождение.
  const vatFree =
    input.mode === "personal" ||
    (quota && age <= ELECTRIC_VAT_FREE_AGE_MAX);
  const vatEur = vatFree ? 0 : roundEur((customsValueEur + dutyEur) * VAT_RATE);

  const feeEur = roundEur(customsValueEur * CUSTOMS_FEE_RATE);

  const toKgs = (eur: number) => roundKgs(eur * kgsPerEur);

  const vatNote: I18nText =
    input.mode === "personal"
      ? txt("kyrgyzstan.notes.vatPersonal")
      : vatFree
        ? txt("kyrgyzstan.notes.vatElectricFree", {
            maxAge: ELECTRIC_VAT_FREE_AGE_MAX,
          })
        : txt("kyrgyzstan.notes.vat", {
            rate: VAT_RATE * 100,
            value: formatAmount(customsValueEur, 2),
            duty: formatAmount(dutyEur, 2),
          });

  const lines: Line[] = [
    {
      id: "duty",
      label: txt(
        input.mode === "personal"
          ? "kyrgyzstan.lines.dutyPersonal"
          : "kyrgyzstan.lines.duty",
      ),
      note: duty.note,
      amount: toKgs(dutyEur),
      currency: "KGS",
      muted: dutyEur === 0,
    },
    {
      id: "excise",
      label: txt("kyrgyzstan.lines.excise"),
      note: txt("kyrgyzstan.notes.excise"),
      amount: EXCISE_KGS,
      currency: "KGS",
      muted: true,
    },
    {
      id: "vat",
      label: txt("kyrgyzstan.lines.vat"),
      note: vatNote,
      amount: toKgs(vatEur),
      currency: "KGS",
      muted: vatEur === 0,
    },
    {
      id: "fee",
      label: txt("kyrgyzstan.lines.fee"),
      note: txt("kyrgyzstan.notes.fee", {
        rate: CUSTOMS_FEE_RATE * 100,
        value: formatAmount(customsValueEur, 2),
      }),
      amount: toKgs(feeEur),
      currency: "KGS",
    },
  ];

  const totalKgs = lines.reduce((sum, line) => sum + line.amount, 0);

  // Регистрация — расход постановки на учёт, а не ввоза. В итог не входит.
  const registrationKgs =
    input.mode === "personal"
      ? toKgs(roundEur(customsValueEur * REGISTRATION_FEE_RATE))
      : 0;

  const extra: Line[] =
    registrationKgs > 0
      ? [
          {
            id: "registration",
            label: txt("kyrgyzstan.lines.registration"),
            note: txt("kyrgyzstan.notes.registration", {
              rate: REGISTRATION_FEE_RATE * 100,
            }),
            amount: registrationKgs,
            currency: "KGS",
          },
        ]
      : [];

  // Евро показываем всегда: именно в нём ведётся расчёт, и эта сумма
  // не зависит от курса сома. Валюту сделки — только если курс задан.
  const totalEur = dutyEur + vatEur + feeEur;
  const alt: CalcResult["alt"] = [{ amount: totalEur, currency: "EUR" }];
  if (eurPerUnit > 0) {
    alt.push({ amount: totalEur / eurPerUnit, currency: input.priceCurrency });
  }

  const subtitle: I18nText[] = [
    txt("kyrgyzstan.subtitle.year", { year: input.year }),
    ...(quota ? [] : [txt("kyrgyzstan.subtitle.volume", { volumeCc })]),
    txt(`kyrgyzstan.fuelShort.${input.fuel}`),
    txt(`kyrgyzstan.modeShort.${input.mode}`),
  ];

  return {
    lines,
    extra,
    total: { amount: totalKgs, currency: "KGS" },
    alt,
    flags: calcFlags({
      mode: input.mode,
      fuel: input.fuel,
      vatEur,
      registrationKgs,
    }),
    subtitle,
    stampLabel: txt(
      input.mode === "personal"
        ? "kyrgyzstan.stamp.personal"
        : "kyrgyzstan.stamp.commercial",
    ),
    meta: {
      mode: input.mode,
      fuel: input.fuel,
      age: String(age),
      // Код бракета, а не подпись — подпись переводится и живёт в словаре.
      ageBand: duty.bandId,
      volumeCc: String(volumeCc),
      customsValueEur: String(customsValueEur),
      dutyEur: String(dutyEur),
      vatEur: String(vatEur),
      feeEur: String(feeEur),
      totalEur: String(roundEur(totalEur)),
    },
  };
}

export const kyrgyzstanCalculator: CountryCalculator<KyrgyzstanInput> = {
  id: "kyrgyzstan",
  title: txt("kyrgyzstan.title"),
  fields: kyrgyzstanFields,
  defaults: kyrgyzstanDefaults,
  calculate: calculateKyrgyzstan,
};
