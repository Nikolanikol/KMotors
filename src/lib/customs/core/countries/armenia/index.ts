import { formatAmount } from "@/lib/customs/core/format";
import type { CalcResult, CountryCalculator, Flag, Line } from "@/lib/customs/core/types";
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

const FUEL_LABELS: Record<ArmeniaFuel, string> = {
  petrol: "бензин",
  diesel: "дизель",
  hybrid: "гибрид",
  electric: "электро",
};

interface DutyResult {
  amd: number;
  note: string;
  band: string;
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
      band: "льготная квота",
      note: "электромобили ввозятся по беспошлинной квоте ЕАЭС — ставка 0%",
    };
  }

  if (age < AGE_NEW_BELOW) {
    const large = isLargePetrol(fuel, volumeCc);
    const rate = large ? NEW_DUTY_RATE_LARGE_PETROL : NEW_DUTY_RATE;
    return {
      amd: customsValueAmd * rate,
      band: `до ${AGE_NEW_BELOW} лет`,
      note: large
        ? `${rate * 100}% от таможенной стоимости — пониженная ставка для бензина крупнее ${LARGE_PETROL_CC_ABOVE} см³`
        : `${rate * 100}% от таможенной стоимости — минимума по объёму нет`,
    };
  }

  const bracket = specificBracket(volumeCc, fuel === "diesel");

  if (age < AGE_OLD_FROM) {
    const byValue = customsValueAmd * MID_DUTY_RATE;
    const byVolume = bracket.mid * volumeCc * amdPerEur;
    const minWins = byVolume > byValue;
    return {
      amd: Math.max(byValue, byVolume),
      band: `${AGE_NEW_BELOW}–${AGE_OLD_FROM - 1} лет`,
      note:
        `${MID_DUTY_RATE * 100}% от стоимости, но не менее ${bracket.mid} €/см³ — ` +
        (minWins
          ? `минимум по объёму выше (${formatAmount(byVolume)} ֏ против ${formatAmount(byValue)} ֏)`
          : `процент выше минимума (${formatAmount(byValue)} ֏ против ${formatAmount(byVolume)} ֏)`),
    };
  }

  return {
    amd: bracket.old * volumeCc * amdPerEur,
    band: `${AGE_OLD_FROM} лет и старше`,
    note: `${bracket.old} €/см³ × ${volumeCc} см³ — заградительная ставка, от стоимости не зависит`,
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
  flags.push({
    level: "info",
    text:
      "Физлицо в Армении платит не единый совокупный платёж по Решению ЕЭК №107, " +
      "а пошлину по ЕТТ ЕАЭС, НДС 20% отдельной строкой и экологический налог. " +
      "Ставки 48–54% и 1,5–5,7 €/см³, которые часто приводят для «физлиц», — это " +
      "таблицы №107, и к легковым в Армении они не применяются.",
  });

  if (fuel === "electric") {
    flags.push({
      level: "warn",
      text:
        "Электромобиль идёт по беспошлинной квоте ЕАЭС на 2026 год, расширенной " +
        "дополнительными 5 000 машин. Квота распределяется по мере ввоза: когда она " +
        "заканчивается, включается обычная ставка 15%, и платёж вырастает сразу по двум " +
        "статьям — по пошлине и по НДС с неё. С датой ввоза лучше не тянуть.",
    });
    flags.push({
      level: "warn",
      text:
        `Освобождение от НДС действует до 31 декабря ${ELECTRIC_VAT_FREE_UNTIL_YEAR} года ` +
        "и рассчитано на новые машины. В расчёте оно учтено; для электромобиля 2023 года " +
        "выпуска и старше подтвердите льготу при оформлении.",
    });
  }

  if (isLargePetrol(fuel, volumeCc) && age < AGE_NEW_BELOW) {
    flags.push({
      level: "info",
      text:
        `Бензиновый двигатель крупнее ${LARGE_PETROL_CC_ABOVE} см³ и возраст до ${AGE_NEW_BELOW} лет — ` +
        `пошлина ${NEW_DUTY_RATE_LARGE_PETROL * 100}% вместо ${NEW_DUTY_RATE * 100}%. ` +
        "Верхней границы у этой ставки нет: коды ТН ВЭД 8703 23 198 8 и 8703 24 109 8 " +
        "несут одну и ту же ставку. На дизель и на гибрид снижение не распространяется.",
    });
  }

  if (fuel === "hybrid" && age < AGE_NEW_BELOW && volumeCc > LARGE_PETROL_CC_ABOVE) {
    flags.push({
      level: "warn",
      text:
        `Гибрид крупнее ${LARGE_PETROL_CC_ABOVE} см³ моложе ${AGE_NEW_BELOW} лет платит полные ` +
        `${NEW_DUTY_RATE * 100}%, хотя такой же бензиновый платил бы ${NEW_DUTY_RATE_LARGE_PETROL * 100}%. ` +
        "Во всех остальных бракетах гибрид считается ровно как бензин. На такой машине " +
        "имеет смысл заранее уточнить код ТН ВЭД.",
    });
  }

  flags.push({
    level: "info",
    text:
      "Экологический налог берётся один раз, при ввозе: 0 до 5 лет включительно, 2% на " +
      "6–10 лет, 10% на 11–15, 20% на 16 и старше; электромобили и гибриды освобождены. " +
      "Не путайте его с ежегодным налогом на выбросы, который платит владелец машины уже " +
      "на армянском учёте — там ставки другие и заметно ниже.",
  });

  if (ecoAmd > 0) {
    flags.push({
      level: "info",
      text:
        `Возраст ${age} лет — экологический налог ${ecoRate(age) * 100}% от таможенной стоимости. ` +
        `Следующий порог — ${nextEcoThreshold(age)}.`,
    });
  }

  flags.push({
    level: "info",
    text:
      "Акциз при ввозе легковых (категория М1, ТН ВЭД 8703) не взимается: статья 84 " +
      "Налогового кодекса РА облагает им только грузовые и мотоциклы свыше 500 см³. " +
      "Строка оставлена нулевой, чтобы было видно, что её учли.",
  });

  flags.push({
    level: "warn",
    text:
      `Расчёт берёт возраст как разницу календарных годов, а таможня отсчитывает его от ` +
      `даты производства. Переломы ставки приходятся на ${AGE_NEW_BELOW} и ${AGE_OLD_FROM} лет: ` +
      "если машине вот-вот исполнится столько, платёж может попасть в соседний бракет — " +
      "такие лоты выгоднее оформлять заранее.",
  });

  flags.push({
    level: "warn",
    text:
      "Доставка до Армении, стоянка и терминальные сборы, услуги таможенного представителя " +
      "и постановка на учёт в расчёт не входят.",
  });

  return flags;
}

/** Подсказка «когда станет дороже» — по границам экологического налога. */
function nextEcoThreshold(age: number): string {
  for (const bracket of ECO_BRACKETS) {
    if (age <= bracket.maxAge && Number.isFinite(bracket.maxAge)) {
      return `${bracket.maxAge + 1} лет`;
    }
  }
  return "выше нет";
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

  const vatNote = vatFree
    ? `электромобиль — освобождение до 31 декабря ${ELECTRIC_VAT_FREE_UNTIL_YEAR} года`
    : `${VAT_RATE * 100}% от таможенной стоимости вместе с пошлиной: ` +
      `${formatAmount(customsValueAmd)} ֏ + ${formatAmount(dutyAmd)} ֏`;

  const ecoNote = ecoFree
    ? input.fuel === "electric"
      ? "электромобили освобождены полностью"
      : "гибриды освобождены полностью"
    : ecoAmd === 0
      ? `возраст до ${ECO_BRACKETS[0].maxAge} лет включительно — налог не начисляется`
      : `${ecoRate(age) * 100}% от таможенной стоимости, возраст ${age} лет`;

  const lines: Line[] = [
    {
      id: "duty",
      label: "Таможенная пошлина",
      note: duty.note,
      amount: dutyAmd,
      currency: "AMD",
      muted: dutyAmd === 0,
    },
    {
      id: "excise",
      label: "Акциз",
      note: "при ввозе легковых автомобилей в РА не взимается",
      amount: EXCISE_AMD,
      currency: "AMD",
      muted: true,
    },
    {
      id: "vat",
      label: "НДС",
      note: vatNote,
      amount: vatAmd,
      currency: "AMD",
      muted: vatAmd === 0,
    },
    {
      id: "eco",
      label: "Экологический налог",
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

  const subtitleParts: string[] = [
    String(input.year),
    ...(input.fuel === "electric" ? [] : [`${volumeCc} см³`]),
    FUEL_LABELS[input.fuel],
  ];

  return {
    lines,
    total: { amount: totalAmd, currency: "AMD" },
    alt,
    flags: calcFlags({ fuel: input.fuel, age, volumeCc, ecoAmd }),
    meta: {
      fuel: input.fuel,
      age: String(age),
      ageBand: duty.band,
      volumeCc: String(volumeCc),
      customsValueAmd: String(customsValueAmd),
      dutyAmd: String(dutyAmd),
      vatAmd: String(vatAmd),
      ecoAmd: String(ecoAmd),
      totalAmd: String(totalAmd),
      subtitle: subtitleParts.join(" · "),
      stampLabel: "ЕТТ ЕАЭС",
    },
  };
}

export const armeniaCalculator: CountryCalculator<ArmeniaInput> = {
  id: "armenia",
  title: "Растаможка авто в Армению",
  fields: armeniaFields,
  defaults: armeniaDefaults,
  calculate: calculateArmenia,
};
