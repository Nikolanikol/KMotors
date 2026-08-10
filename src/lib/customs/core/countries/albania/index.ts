import { formatAmount } from "@/lib/customs/core/format";
import type { CalcResult, CountryCalculator, Flag, Line } from "@/lib/customs/core/types";
import { albaniaFields } from "./fields";
import {
  DUTY_RATE,
  EXCISE_ALL,
  LUXURY_ANNUAL_ALL,
  LUXURY_ONCE_ALL,
  LUXURY_VALUE_THRESHOLD_ALL,
  LUXURY_VOLUME_THRESHOLD_CC,
  REGISTRATION_FEE_ALL,
  VAT_RATE,
  minimumCustomsValueAll,
  roundAll,
} from "./tables";

export type AlbaniaFuel = "petrol" | "hybrid" | "electric";

export interface AlbaniaInput {
  /** Стоимость авто в валюте сделки. */
  price: number;
  /** Фрахт и страховка в той же валюте. */
  freight: number;
  /**
   * Сколько леков за единицу валюты сделки.
   *
   * Ядро не знает, что это за валюта: доллар, вона или евро — для расчёта
   * безразлично. Благодаря этому эталон, снятый в евро, подаётся в то же
   * ядро, что и форма с долларом.
   */
  allPerUnit: number;
  /** Код валюты сделки. Нужен только для подписи справочной строки. */
  priceCurrency: string;
  /** Объём двигателя, см³. Для электромобилей не используется. */
  volumeCc: number;
  fuel: AlbaniaFuel;
}

export const albaniaDefaults: AlbaniaInput = {
  price: 9000,
  freight: 1100,
  // Снимок open.er-api.com на 09.08.2026; будет приходить из слоя fx.
  allPerUnit: 80.7859,
  priceCurrency: "USD",
  volumeCc: 1998,
  fuel: "petrol",
};

function calcFlags(args: {
  isElectric: boolean;
  minimumApplied: boolean;
  minimumAll: number;
  customsValueAll: number;
  vatBaseAll: number;
  byVolume: boolean;
  byValue: boolean;
}): Flag[] {
  const flags: Flag[] = [];

  if (args.minimumApplied) {
    flags.push({
      level: "warn",
      text:
        `Заявленная стоимость ${formatAmount(args.customsValueAll)} ALL ниже минимальной ` +
        `${formatAmount(args.minimumAll)} ALL для этого объёма — НДС считается от минимума. ` +
        `Калькулятор-эталон этот барьер не применяет, поэтому здесь наш расчёт выше.`,
    });
  }

  if (args.byVolume || args.byValue) {
    const reason = args.byVolume && args.byValue
      ? `объём от ${formatAmount(LUXURY_VOLUME_THRESHOLD_CC)} см³ и стоимость от ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL`
      : args.byVolume
        ? `объём от ${formatAmount(LUXURY_VOLUME_THRESHOLD_CC)} см³`
        : `стоимость от ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL`;
    flags.push({
      level: "info",
      text:
        `Авто признано роскошным: ${reason}. Кроме единовременных ` +
        `${formatAmount(LUXURY_ONCE_ALL)} ALL придётся платить ${formatAmount(LUXURY_ANNUAL_ALL)} ALL ежегодно, ` +
        `пока машина стоит на учёте.`,
    });
  } else if (
    !args.byValue &&
    args.vatBaseAll >= LUXURY_VALUE_THRESHOLD_ALL * 0.9
  ) {
    flags.push({
      level: "warn",
      text:
        `Стоимость близка к порогу роскоши ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL. ` +
        `Таможня оценивает авто по своим каталогам на момент регистрации, а не по договору, ` +
        `поэтому налог может сработать даже при меньшей цене в договоре.`,
    });
  }

  if (args.isElectric) {
    flags.push({
      level: "info",
      text:
        "Электромобиль: объёма двигателя нет, минимальная стоимость по см³ не применяется. " +
        "Льготы по НДС эталон не показывает — расчёт идёт по общей ставке 20%.",
    });
  }

  flags.push({
    level: "info",
    text:
      "Расчёт по рыночному курсу лека. Таможня применяет собственный официальный курс — " +
      "итог может отличаться на его разницу.",
  });

  flags.push({
    level: "warn",
    text:
      "Портовые расходы в Дурресе, услуги брокера и доставка до Албании в расчёт не входят.",
  });

  return flags;
}

export function calculateAlbania(input: AlbaniaInput): CalcResult {
  const isElectric = input.fuel === "electric";

  // Объём у электромобиля обнуляем в ядре, а не полагаемся на форму: поле
  // прячется, но прежнее значение остаётся в состоянии и иначе подтянуло бы
  // и минимальную стоимость, и порог роскоши по объёму.
  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);

  const priceUnits = Math.max(0, input.price) + Math.max(0, input.freight);
  const rate = Math.max(0, input.allPerUnit);

  // Округление до целого лека — часть расчёта: источник и декларация оперируют
  // целой таможенной стоимостью, и НДС считается уже от неё.
  const customsValueAll = roundAll(priceUnits * rate);

  const minimumAll = isElectric ? 0 : minimumCustomsValueAll(volumeCc);
  const vatBaseAll = Math.max(customsValueAll, minimumAll);
  const minimumApplied = minimumAll > customsValueAll;

  const vatAll = roundAll(vatBaseAll * VAT_RATE);

  const byVolume = !isElectric && volumeCc >= LUXURY_VOLUME_THRESHOLD_CC;
  const byValue = vatBaseAll >= LUXURY_VALUE_THRESHOLD_ALL;
  const isLuxury = byVolume || byValue;
  // Налог не удваивается, когда сработали оба условия — кейс al-13.
  const luxuryOnceAll = isLuxury ? LUXURY_ONCE_ALL : 0;

  const lines: Line[] = [
    {
      id: "duty",
      label: "Таможенная пошлина",
      note: "для физлиц не взимается — ставка 0 независимо от страны происхождения",
      amount: DUTY_RATE,
      currency: "ALL",
      muted: true,
    },
    {
      id: "excise",
      label: "Акциз",
      note: "на легковые автомобили в Албании не применяется",
      amount: EXCISE_ALL,
      currency: "ALL",
      muted: true,
    },
    {
      id: "vat",
      label: "НДС (TVSH)",
      note: minimumApplied
        ? `20% от минимальной стоимости ${formatAmount(vatBaseAll)} ALL — она выше заявленной`
        : `20% от таможенной стоимости ${formatAmount(vatBaseAll)} ALL`,
      amount: vatAll,
      currency: "ALL",
    },
    {
      id: "registration",
      label: "Регистрация DPSHTRR",
      note: "физический контроль, разрешение на движение и номерные знаки — оценка",
      amount: REGISTRATION_FEE_ALL,
      currency: "ALL",
    },
    {
      id: "luxuryOnce",
      label: "Налог на роскошь при регистрации (TRML)",
      note: isLuxury
        ? byVolume && byValue
          ? `объём от ${LUXURY_VOLUME_THRESHOLD_CC} см³ и стоимость от ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL`
          : byVolume
            ? `объём от ${LUXURY_VOLUME_THRESHOLD_CC} см³`
            : `стоимость от ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL`
        : `не применяется: объём меньше ${LUXURY_VOLUME_THRESHOLD_CC} см³ и стоимость меньше ${formatAmount(LUXURY_VALUE_THRESHOLD_ALL)} ALL`,
      amount: luxuryOnceAll,
      currency: "ALL",
      muted: !isLuxury,
    },
  ];

  const totalAll = lines.reduce((sum, line) => sum + line.amount, 0);

  // Ежегодный налог — расход владения, а не ввоза. В итог не входит.
  const extra: Line[] = isLuxury
    ? [
        {
          id: "luxuryAnnual",
          label: "Ежегодный налог на роскошь (TVML)",
          note: "платится каждый год, пока авто на учёте в Албании",
          amount: LUXURY_ANNUAL_ALL,
          currency: "ALL",
        },
      ]
    : [];

  const alt =
    rate > 0
      ? [{ amount: totalAll / rate, currency: input.priceCurrency }]
      : [];

  const subtitleParts: string[] = [];
  if (!isElectric) subtitleParts.push(`${volumeCc} см³`);
  subtitleParts.push(
    input.fuel === "electric"
      ? "электро"
      : input.fuel === "hybrid"
        ? "гибрид"
        : "бензин / дизель",
  );
  subtitleParts.push(`${formatAmount(customsValueAll)} ALL таможенной стоимости`);

  return {
    lines,
    extra,
    total: { amount: totalAll, currency: "ALL" },
    alt,
    flags: calcFlags({
      isElectric,
      minimumApplied,
      minimumAll,
      customsValueAll,
      vatBaseAll,
      byVolume,
      byValue,
    }),
    meta: {
      customsValueAll: String(customsValueAll),
      minimumAll: String(minimumAll),
      vatBaseAll: String(vatBaseAll),
      volumeCc: String(volumeCc),
      fuel: input.fuel,
      luxury: isLuxury ? "да" : "нет",
      subtitle: subtitleParts.join(" · "),
      stampLabel: isLuxury ? "ЛЮКС" : "НДС 20%",
    },
  };
}

export const albaniaCalculator: CountryCalculator<AlbaniaInput> = {
  id: "albania",
  title: "Растаможка авто в Албании",
  fields: albaniaFields,
  defaults: albaniaDefaults,
  calculate: calculateAlbania,
};
