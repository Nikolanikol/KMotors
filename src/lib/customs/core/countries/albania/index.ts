import { formatAmount } from "@/lib/customs/core/format";
import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
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
      text: txt("albania.flags.minimumApplied", {
        declared: formatAmount(args.customsValueAll),
        minimum: formatAmount(args.minimumAll),
      }),
    });
  }

  if (args.byVolume || args.byValue) {
    const reasonKey =
      args.byVolume && args.byValue
        ? "albania.luxuryReason.both"
        : args.byVolume
          ? "albania.luxuryReason.volume"
          : "albania.luxuryReason.value";
    flags.push({
      level: "info",
      text: txt("albania.flags.luxury", {
        reason: txt(reasonKey, {
          volume: formatAmount(LUXURY_VOLUME_THRESHOLD_CC),
          value: formatAmount(LUXURY_VALUE_THRESHOLD_ALL),
        }),
        once: formatAmount(LUXURY_ONCE_ALL),
        annual: formatAmount(LUXURY_ANNUAL_ALL),
      }),
    });
  } else if (
    !args.byValue &&
    args.vatBaseAll >= LUXURY_VALUE_THRESHOLD_ALL * 0.9
  ) {
    flags.push({
      level: "warn",
      text: txt("albania.flags.nearLuxury", {
        threshold: formatAmount(LUXURY_VALUE_THRESHOLD_ALL),
      }),
    });
  }

  if (args.isElectric) {
    flags.push({ level: "info", text: txt("albania.flags.electric") });
  }

  flags.push({ level: "info", text: txt("albania.flags.officialRate") });
  flags.push({ level: "warn", text: txt("albania.flags.portCosts") });

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

  const luxuryNote: I18nText = isLuxury
    ? txt(
        byVolume && byValue
          ? "albania.luxuryReason.both"
          : byVolume
            ? "albania.luxuryReason.volume"
            : "albania.luxuryReason.value",
        {
          volume: LUXURY_VOLUME_THRESHOLD_CC,
          value: formatAmount(LUXURY_VALUE_THRESHOLD_ALL),
        },
      )
    : txt("albania.notes.luxuryNotApplied", {
        volume: LUXURY_VOLUME_THRESHOLD_CC,
        value: formatAmount(LUXURY_VALUE_THRESHOLD_ALL),
      });

  const lines: Line[] = [
    {
      id: "duty",
      label: txt("albania.lines.duty"),
      note: txt("albania.notes.duty"),
      amount: DUTY_RATE,
      currency: "ALL",
      muted: true,
    },
    {
      id: "excise",
      label: txt("albania.lines.excise"),
      note: txt("albania.notes.excise"),
      amount: EXCISE_ALL,
      currency: "ALL",
      muted: true,
    },
    {
      id: "vat",
      label: txt("albania.lines.vat"),
      note: txt(
        minimumApplied ? "albania.notes.vatMinimum" : "albania.notes.vat",
        {
          rate: Math.round(VAT_RATE * 100),
          base: formatAmount(vatBaseAll),
        },
      ),
      amount: vatAll,
      currency: "ALL",
    },
    {
      id: "registration",
      label: txt("albania.lines.registration"),
      note: txt("albania.notes.registration"),
      amount: REGISTRATION_FEE_ALL,
      currency: "ALL",
    },
    {
      id: "luxuryOnce",
      label: txt("albania.lines.luxuryOnce"),
      note: luxuryNote,
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
          label: txt("albania.lines.luxuryAnnual"),
          note: txt("albania.notes.luxuryAnnual"),
          amount: LUXURY_ANNUAL_ALL,
          currency: "ALL",
        },
      ]
    : [];

  const alt =
    rate > 0
      ? [{ amount: totalAll / rate, currency: input.priceCurrency }]
      : [];

  const subtitle: I18nText[] = [];
  if (!isElectric) subtitle.push(txt("albania.subtitle.volume", { volumeCc }));
  subtitle.push(txt(`albania.fuelShort.${input.fuel}`));
  subtitle.push(
    txt("albania.subtitle.customsValue", {
      value: formatAmount(customsValueAll),
    }),
  );

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
    subtitle,
    stampLabel: txt(isLuxury ? "albania.stamp.luxury" : "albania.stamp.vat", {
      rate: Math.round(VAT_RATE * 100),
    }),
    meta: {
      customsValueAll: String(customsValueAll),
      minimumAll: String(minimumAll),
      vatBaseAll: String(vatBaseAll),
      volumeCc: String(volumeCc),
      fuel: input.fuel,
      // Машинное значение: подпись «ЛЮКС» живёт в stampLabel и переводится.
      luxury: String(isLuxury),
    },
  };
}

export const albaniaCalculator: CountryCalculator<AlbaniaInput> = {
  id: "albania",
  title: txt("albania.title"),
  fields: albaniaFields,
  defaults: albaniaDefaults,
  calculate: calculateAlbania,
};
