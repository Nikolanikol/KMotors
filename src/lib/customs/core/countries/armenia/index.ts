import { formatAmount } from "@/lib/customs/core/format";
import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { armeniaFields } from "./fields";
import {
  AGE_NEW_BELOW,
  AGE_OLD_FROM,
  ECO_BRACKETS,
  ELECTRIC_VAT_FREE_UNTIL_YEAR,
  EXCISE_AMD,
  LARGE_PETROL_CC_ABOVE,
  MID_DUTY_RATE,
  NEW_DUTY_RATE,
  NEW_DUTY_RATE_LARGE_PETROL,
  VAT_RATE,
  ecoRate,
  roundAmd,
  specificBracket,
} from "./tables";

export type ArmeniaFuel = "petrol" | "diesel" | "hybrid" | "electric";

export interface ArmeniaInput {
  fuel: ArmeniaFuel;
  /** Объём двигателя, см³. У электромобиля не используется. */
  volumeCc: number;
  year: number;
  /** Расчётный год. Приходит снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  /** Стоимость авто в валюте сделки. */
  price: number;
  /** Фрахт и страховка в той же валюте. */
  freight: number;
  /**
   * Сколько драмов за единицу валюты сделки.
   *
   * Ядро не знает, что это за валюта: доллар, вона или сам драм — для расчёта
   * безразлично. Благодаря этому эталон, снятый в долларах, подаётся в то же
   * ядро, что и форма с воной.
   */
  amdPerUnit: number;
  /** Сколько драмов за 1 евро. Нужен только для ставок за 1 см³. */
  amdPerEur: number;
  /** Код валюты сделки. Нужен только для подписи справочной строки. */
  priceCurrency: string;
}

export const armeniaDefaults: ArmeniaInput = {
  fuel: "petrol",
  volumeCc: 1998,
  year: 2021,
  currentYear: 2026,
  price: 9000,
  freight: 1100,
  // Снимки на 09.08.2026; в форме заменяются живыми курсами из слоя fx.
  amdPerUnit: 366.081469,
  amdPerEur: 422.7,
  priceCurrency: "USD",
};

interface DutyResult {
  amd: number;
  note: I18nText;
  /** Код бракета — машинное значение для meta и тестов, не для показа. */
  bandId: "electric" | "new" | "mid" | "old";
}

/**
 * Пониженная ставка 12,5% достаётся только бензину крупнее 2800 см³.
 *
 * Гибрид её не получает, хотя во всех остальных бракетах считается ровно как
 * бензин. Это не наша интерпретация: прогон эталона на 3500 см³ с типом
 * «гибрид» дал 15%. Дизель не получает её ни при каком объёме.
 */
function isLargePetrol(fuel: ArmeniaFuel, volumeCc: number): boolean {
  return fuel === "petrol" && volumeCc > LARGE_PETROL_CC_ABOVE;
}

function calcDuty(
  customsValueAmd: number,
  volumeCc: number,
  age: number,
  fuel: ArmeniaFuel,
  amdPerEur: number,
): DutyResult {
  if (fuel === "electric") {
    return {
      amd: 0,
      bandId: "electric",
      note: txt("armenia.notes.dutyElectric"),
    };
  }

  if (age < AGE_NEW_BELOW) {
    const large = isLargePetrol(fuel, volumeCc);
    const rate = large ? NEW_DUTY_RATE_LARGE_PETROL : NEW_DUTY_RATE;
    return {
      amd: customsValueAmd * rate,
      bandId: "new",
      note: txt(
        large ? "armenia.notes.dutyNewLargePetrol" : "armenia.notes.dutyNew",
        { rate: rate * 100, threshold: LARGE_PETROL_CC_ABOVE },
      ),
    };
  }

  const bracket = specificBracket(volumeCc, fuel === "diesel");

  if (age < AGE_OLD_FROM) {
    const byValue = customsValueAmd * MID_DUTY_RATE;
    const byVolume = bracket.mid * volumeCc * amdPerEur;
    const minWins = byVolume > byValue;
    return {
      amd: Math.max(byValue, byVolume),
      bandId: "mid",
      note: txt(
        minWins ? "armenia.notes.dutyMidByVolume" : "armenia.notes.dutyMidByValue",
        {
          rate: MID_DUTY_RATE * 100,
          perCc: bracket.mid,
          byVolume: formatAmount(byVolume),
          byValue: formatAmount(byValue),
        },
      ),
    };
  }

  return {
    amd: bracket.old * volumeCc * amdPerEur,
    bandId: "old",
    note: txt("armenia.notes.dutyOld", {
      perCc: bracket.old,
      volumeCc,
    }),
  };
}

function calcFlags(args: {
  fuel: ArmeniaFuel;
  age: number;
  volumeCc: number;
  ecoAmd: number;
}): Flag[] {
  const flags: Flag[] = [];
  const { fuel, age, volumeCc, ecoAmd } = args;

  // Первым делом — то, из-за чего Армению путают чаще всего.
  flags.push({ level: "info", text: txt("armenia.flags.notEec107") });

  if (fuel === "electric") {
    flags.push({ level: "warn", text: txt("armenia.flags.electricQuota") });
    flags.push({
      level: "warn",
      text: txt("armenia.flags.electricVat", {
        untilYear: ELECTRIC_VAT_FREE_UNTIL_YEAR,
      }),
    });
  }

  if (isLargePetrol(fuel, volumeCc) && age < AGE_NEW_BELOW) {
    flags.push({
      level: "info",
      text: txt("armenia.flags.largePetrol", {
        threshold: LARGE_PETROL_CC_ABOVE,
        ageBelow: AGE_NEW_BELOW,
        reducedRate: NEW_DUTY_RATE_LARGE_PETROL * 100,
        baseRate: NEW_DUTY_RATE * 100,
      }),
    });
  }

  if (fuel === "hybrid" && age < AGE_NEW_BELOW && volumeCc > LARGE_PETROL_CC_ABOVE) {
    flags.push({
      level: "warn",
      text: txt("armenia.flags.largeHybrid", {
        threshold: LARGE_PETROL_CC_ABOVE,
        ageBelow: AGE_NEW_BELOW,
        baseRate: NEW_DUTY_RATE * 100,
        reducedRate: NEW_DUTY_RATE_LARGE_PETROL * 100,
      }),
    });
  }

  flags.push({ level: "info", text: txt("armenia.flags.ecoOnce") });

  if (ecoAmd > 0) {
    flags.push({
      level: "info",
      text: txt("armenia.flags.ecoCurrent", {
        age,
        rate: ecoRate(age) * 100,
        next: nextEcoThreshold(age),
      }),
    });
  }

  flags.push({ level: "info", text: txt("armenia.flags.noExcise") });

  flags.push({
    level: "warn",
    text: txt("armenia.flags.ageByYear", {
      ageBelow: AGE_NEW_BELOW,
      ageOld: AGE_OLD_FROM,
    }),
  });

  flags.push({ level: "warn", text: txt("armenia.flags.notIncluded") });

  return flags;
}

/** Подсказка «когда станет дороже» — по границам экологического налога. */
function nextEcoThreshold(age: number): I18nText {
  for (const bracket of ECO_BRACKETS) {
    if (age <= bracket.maxAge && Number.isFinite(bracket.maxAge)) {
      return txt("armenia.ecoNext.years", { years: bracket.maxAge + 1 });
    }
  }
  return txt("armenia.ecoNext.none");
}

export function calculateArmenia(input: ArmeniaInput): CalcResult {
  const age = Math.max(0, input.currentYear - input.year);

  // Объём обнуляем в ядре, а не полагаемся на форму: поле прячется при выборе
  // электромобиля, но прежнее значение остаётся в состоянии и иначе утащило бы
  // электромобиль в бракет по объёму.
  const volumeCc =
    input.fuel === "electric" ? 0 : Math.max(0, input.volumeCc);

  const priceUnits = Math.max(0, input.price) + Math.max(0, input.freight);
  const amdPerUnit = Math.max(0, input.amdPerUnit);
  const amdPerEur = Math.max(0, input.amdPerEur);

  const customsValueAmd = roundAmd(priceUnits * amdPerUnit);

  const duty = calcDuty(customsValueAmd, volumeCc, age, input.fuel, amdPerEur);
  const dutyAmd = roundAmd(duty.amd);

  // НДС берётся от стоимости ВМЕСТЕ с пошлиной. Экологический налог в базу
  // не входит — проверено всеми кейсами эталона.
  const vatFree = input.fuel === "electric";
  const vatAmd = vatFree
    ? 0
    : roundAmd((customsValueAmd + dutyAmd) * VAT_RATE);

  // Электромобили и гибриды освобождены от экологического налога полностью.
  const ecoFree = input.fuel === "electric" || input.fuel === "hybrid";
  const ecoAmd = ecoFree ? 0 : roundAmd(customsValueAmd * ecoRate(age));

  const vatNote: I18nText = vatFree
    ? txt("armenia.notes.vatElectric", {
        untilYear: ELECTRIC_VAT_FREE_UNTIL_YEAR,
      })
    : txt("armenia.notes.vat", {
        rate: VAT_RATE * 100,
        value: formatAmount(customsValueAmd),
        duty: formatAmount(dutyAmd),
      });

  const ecoNote: I18nText = ecoFree
    ? txt(
        input.fuel === "electric"
          ? "armenia.notes.ecoElectric"
          : "armenia.notes.ecoHybrid",
      )
    : ecoAmd === 0
      ? txt("armenia.notes.ecoYoung", { years: ECO_BRACKETS[0].maxAge })
      : txt("armenia.notes.eco", { rate: ecoRate(age) * 100, age });

  const lines: Line[] = [
    {
      id: "duty",
      label: txt("armenia.lines.duty"),
      note: duty.note,
      amount: dutyAmd,
      currency: "AMD",
      muted: dutyAmd === 0,
    },
    {
      id: "excise",
      label: txt("armenia.lines.excise"),
      note: txt("armenia.notes.excise"),
      amount: EXCISE_AMD,
      currency: "AMD",
      muted: true,
    },
    {
      id: "vat",
      label: txt("armenia.lines.vat"),
      note: vatNote,
      amount: vatAmd,
      currency: "AMD",
      muted: vatAmd === 0,
    },
    {
      id: "eco",
      label: txt("armenia.lines.eco"),
      note: ecoNote,
      amount: ecoAmd,
      currency: "AMD",
      muted: ecoAmd === 0,
    },
  ];

  const totalAmd = lines.reduce((sum, line) => sum + line.amount, 0);

  const alt: CalcResult["alt"] = [];
  if (amdPerUnit > 0) {
    alt.push({ amount: totalAmd / amdPerUnit, currency: input.priceCurrency });
  }

  const subtitle: I18nText[] = [
    txt("armenia.subtitle.year", { year: input.year }),
    ...(input.fuel === "electric"
      ? []
      : [txt("armenia.subtitle.volume", { volumeCc })]),
    txt(`armenia.fuelShort.${input.fuel}`),
  ];

  return {
    lines,
    total: { amount: totalAmd, currency: "AMD" },
    alt,
    flags: calcFlags({ fuel: input.fuel, age, volumeCc, ecoAmd }),
    subtitle,
    stampLabel: txt("armenia.stamp.eaeu"),
    meta: {
      fuel: input.fuel,
      age: String(age),
      // Код бракета, а не подпись — подпись переводится и живёт в словаре.
      ageBand: duty.bandId,
      volumeCc: String(volumeCc),
      customsValueAmd: String(customsValueAmd),
      dutyAmd: String(dutyAmd),
      vatAmd: String(vatAmd),
      ecoAmd: String(ecoAmd),
      totalAmd: String(totalAmd),
    },
  };
}

export const armeniaCalculator: CountryCalculator<ArmeniaInput> = {
  id: "armenia",
  title: txt("armenia.title"),
  fields: armeniaFields,
  defaults: armeniaDefaults,
  calculate: calculateArmenia,
};
