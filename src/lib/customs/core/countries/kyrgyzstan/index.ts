import { formatAmount } from "@/lib/customs/core/format";
import type { CalcResult, CountryCalculator, Flag, Line } from "@/lib/customs/core/types";
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
  note: string;
  band: string;
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
      band: "квота исчерпана",
      note: `${ELECTRIC_DUTY_RATE * 100}% от таможенной стоимости — квота 2026 на беспошлинный ввоз исчерпана`,
    };
  }

  if (age <= PERSONAL_AGE_NEW_MAX) {
    const bracket = personalNewBracket(valueEur);
    const byValue = valueEur * bracket.rate;
    const byVolume = bracket.minEurPerCc * volumeCc;
    const minWins = byVolume > byValue;
    return {
      eur: Math.max(byValue, byVolume),
      band: `до ${PERSONAL_AGE_NEW_MAX} лет`,
      note:
        `${bracket.rate * 100}% от стоимости, но не менее ${bracket.minEurPerCc} €/см³ — ` +
        (minWins
          ? `минимум по объёму выше (${formatAmount(byVolume, 2)} € против ${formatAmount(byValue, 2)} €)`
          : `процент выше минимума (${formatAmount(byValue, 2)} € против ${formatAmount(byVolume, 2)} €)`),
    };
  }

  const rate = personalRateEurPerCc(volumeCc, age);
  const band =
    age <= PERSONAL_AGE_MID_MAX
      ? `${PERSONAL_AGE_NEW_MAX + 1}–${PERSONAL_AGE_MID_MAX} лет`
      : `${PERSONAL_AGE_MID_MAX + 1} лет и старше`;
  return {
    eur: rate * volumeCc,
    band,
    note: `${rate} €/см³ × ${volumeCc} см³ — фиксировано, от стоимости не зависит`,
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
      band: "квота не положена",
      note: `${ELECTRIC_DUTY_RATE * 100}% от таможенной стоимости — льготная квота юрлицам не выделялась`,
    };
  }

  if (age <= COMMERCIAL_AGE_NEW_MAX) {
    return {
      eur: valueEur * COMMERCIAL_NEW_DUTY_RATE,
      band: `до ${COMMERCIAL_AGE_NEW_MAX} лет`,
      note: `${COMMERCIAL_NEW_DUTY_RATE * 100}% от таможенной стоимости — минимума по объёму нет`,
    };
  }

  const bracket = commercialBracket(volumeCc, fuel === "diesel");

  if (age <= COMMERCIAL_AGE_MID_MAX) {
    const byValue = valueEur * COMMERCIAL_MID_DUTY_RATE;
    const byVolume = bracket.mid * volumeCc;
    const minWins = byVolume > byValue;
    return {
      eur: Math.max(byValue, byVolume),
      band: `${COMMERCIAL_AGE_NEW_MAX + 1}–${COMMERCIAL_AGE_MID_MAX} лет`,
      note:
        `${COMMERCIAL_MID_DUTY_RATE * 100}% от стоимости, но не менее ${bracket.mid} €/см³ — ` +
        (minWins
          ? `минимум по объёму выше (${formatAmount(byVolume, 2)} € против ${formatAmount(byValue, 2)} €)`
          : `процент выше минимума (${formatAmount(byValue, 2)} € против ${formatAmount(byVolume, 2)} €)`),
    };
  }

  return {
    eur: bracket.old * volumeCc,
    band: `${COMMERCIAL_AGE_MID_MAX + 1} лет и старше`,
    note: `${bracket.old} €/см³ × ${volumeCc} см³ — заградительная ставка, от стоимости не зависит`,
  };
}

const FUEL_LABELS: Record<KyrgyzstanFuel, string> = {
  petrol: "бензин",
  diesel: "дизель",
  seriesHybrid: "последовательный гибрид",
  electric: "электро",
};

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
      text:
        `Квота 2026 года на беспошлинный ввоз — 15 000 машин по кодам ТН ВЭД ` +
        `${HS_CODE_ELECTRIC} и ${HS_CODE_SERIES_HYBRID} — исчерпана, поэтому начислена ` +
        `ставка ЕТТ ${ELECTRIC_DUTY_RATE * 100}%. Официальный калькулятор ГТС по электромобилям ` +
        `до сих пор показывает нулевую пошлину: он не обновлён под исчерпание квоты.`,
    });
  }

  if (args.mode === "personal") {
    if (!quota) {
      flags.push({
        level: "info",
        text:
          "Личное пользование: тип топлива на сумму не влияет. ЕЭК №107 считает " +
          "только по объёму двигателя, возрасту и — для авто до 3 лет — стоимости.",
      });
    }
    flags.push({
      level: "warn",
      text:
        `Сбор за таможенное оформление ${CUSTOMS_FEE_RATE * 100}% начислен отдельной строкой. ` +
        `Калькулятор ГТС физлицу его не показывает, считая ЕСП всё включающим платежом.`,
    });
    flags.push({
      level: "info",
      text:
        "Физлицо вправе растаможить для личных нужд один автомобиль в календарный год. " +
        "Второй и последующие оформляются как коммерческий ввоз.",
    });
    if (args.registrationKgs > 0) {
      flags.push({
        level: "warn",
        text:
          `Первичная регистрация в ГРС/ЦОН показана оценкой: ${REGISTRATION_FEE_RATE * 100}% считаются ` +
          `от нашей таможенной стоимости, а МВД берёт их от своей среднерыночной оценки. ` +
          `Реальная сумма будет другой.`,
      });
    }
  } else {
    flags.push({
      level: "info",
      text:
        "Юрлицо обязано оформлять ввоз через лицензированного таможенного представителя — " +
        "самостоятельная подача декларации компанией не допускается. Услуги брокера в расчёт не входят.",
    });
    if (quota) {
      flags.push({
        level: args.vatEur > 0 ? "info" : "warn",
        text:
          args.vatEur > 0
            ? `Возраст больше ${ELECTRIC_VAT_FREE_AGE_MAX} лет — освобождение по Налоговому кодексу КР ` +
              `не действует, начислен полный импортный НДС ${VAT_RATE * 100}%.`
            : `Возраст до ${ELECTRIC_VAT_FREE_AGE_MAX} лет включительно — импортный НДС не начисляется. ` +
              `Границу эталон не проверяет: он вообще не берёт НДС с электромобилей.`,
      });
    }
  }

  flags.push({
    level: "info",
    text:
      "Ставки заданы в евро: и ЕЭК №107, и специфические ставки ЕТТ. Сомы получаются " +
      "пересчётом по курсу НБКР на дату оформления — он может отличаться от сегодняшнего.",
  });

  flags.push({
    level: "warn",
    text:
      "Доставка до Кыргызстана, СВХ, брокер и постановка на учёт в расчёт не входят. " +
      "Утилизационного сбора для личного пользования в КР нет.",
  });

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

  const vatNote =
    input.mode === "personal"
      ? "физлицо платит единый совокупный платёж — НДС сверх него не начисляется"
      : vatFree
        ? `электромобиль до ${ELECTRIC_VAT_FREE_AGE_MAX} лет включительно — освобождение по Налоговому кодексу КР`
        : `${VAT_RATE * 100}% от таможенной стоимости вместе с пошлиной: ` +
          `${formatAmount(customsValueEur, 2)} € + ${formatAmount(dutyEur, 2)} €`;

  const lines: Line[] = [
    {
      id: "duty",
      label:
        input.mode === "personal"
          ? "Совокупный таможенный платёж (ЕСП)"
          : "Таможенная пошлина",
      note: duty.note,
      amount: toKgs(dutyEur),
      currency: "KGS",
      muted: dutyEur === 0,
    },
    {
      id: "excise",
      label: "Акциз",
      note: "при ввозе легковых автомобилей в КР не взимается",
      amount: EXCISE_KGS,
      currency: "KGS",
      muted: true,
    },
    {
      id: "vat",
      label: "НДС",
      note: vatNote,
      amount: toKgs(vatEur),
      currency: "KGS",
      muted: vatEur === 0,
    },
    {
      id: "fee",
      label: "Сбор за таможенное оформление",
      note: `${CUSTOMS_FEE_RATE * 100}% от таможенной стоимости ${formatAmount(customsValueEur, 2)} €`,
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
            label: "Первичная регистрация в ГРС/ЦОН",
            note: `${REGISTRATION_FEE_RATE * 100}% — оценка: МВД считает от своей среднерыночной стоимости, а не от инвойса`,
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

  const subtitleParts: string[] = [
    String(input.year),
    ...(quota ? [] : [`${volumeCc} см³`]),
    FUEL_LABELS[input.fuel],
    input.mode === "personal" ? "физлицо" : "юрлицо",
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
    meta: {
      mode: input.mode,
      fuel: input.fuel,
      age: String(age),
      ageBand: duty.band,
      volumeCc: String(volumeCc),
      customsValueEur: String(customsValueEur),
      dutyEur: String(dutyEur),
      vatEur: String(vatEur),
      feeEur: String(feeEur),
      totalEur: String(roundEur(totalEur)),
      subtitle: subtitleParts.join(" · "),
      stampLabel: input.mode === "personal" ? "ЕЭК №107" : "ЕТТ ЕАЭС",
    },
  };
}

export const kyrgyzstanCalculator: CountryCalculator<KyrgyzstanInput> = {
  id: "kyrgyzstan",
  title: "Растаможка авто в Кыргызстане",
  fields: kyrgyzstanFields,
  defaults: kyrgyzstanDefaults,
  calculate: calculateKyrgyzstan,
};
