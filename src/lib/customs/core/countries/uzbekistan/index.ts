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
  BRV_UZS,
  NEW_PREFERENTIAL_UP_TO_MONTHS,
  RECYCLING_OLD_ABOVE_MONTHS,
  REGISTRATION_BRV,
  USED_DUTY,
  VAT_RATE,
  customsFeeBrv,
  dutyRate,
  recyclingBrv,
  registrationBrv,
  type DutyBand,
  type UzbekistanFuel,
} from "./tables";

export type { UzbekistanFuel } from "./tables";

/**
 * Юридический статус машины, а не её возраст.
 *
 * ⚠️ Отдельное поле, а НЕ вывод из года выпуска. Тариф делит машины на «новые»
 * и «бывшие в эксплуатации» по факту регистрации: машина с корейского аукциона
 * зарегистрирована в Корее, значит она `used` даже если ей полгода. Вывод
 * статуса из возраста дал бы ей 15% вместо 40% — вдвое заниженную растаможку
 * на самом частом для нас сценарии.
 */
export type UzbekistanCondition = "used" | "new";

export interface UzbekistanInput {
  price: number;
  priceCurrency: string;
  /**
   * Доставка до границы, в ДОЛЛАРАХ и всегда в них — фрахт из Кореи котируется
   * в долларах независимо от того, в чём куплена машина.
   *
   * ⚠️ Это не строка чека, а часть БАЗЫ. Таможенная стоимость = цена + доставка,
   * и от неё считаются все три адвалорных платежа: ступень таможенного сбора,
   * процентная часть пошлины и НДС. Решение владельца 11.08.2026.
   */
  freightUsd: number;
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
  condition: UzbekistanCondition;
}

export const uzbekistanDefaults: UzbekistanInput = {
  price: 25_000,
  priceCurrency: "USD",
  // Типовой фрахт Корея → Узбекистан. Поле остаётся редактируемым.
  freightUsd: 2_250,
  // Снимки на 10.08.2026; в форме заменяются живыми курсами из слоя fx.
  usdPerUnit: 1,
  uzsPerUsd: 11_851.454593,
  volumeCc: 1998,
  year: 2021,
  month: 1,
  currentYear: 2026,
  currentMonth: 1,
  fuel: "petrol",
  // По умолчанию — б/у: везём с корейских аукционов, там всё зарегистрировано.
  condition: "used",
};

/** Возраст в полных месяцах. Ядро дату не берёт — она приходит во входе. */
function ageMonths(input: UzbekistanInput): number {
  return Math.max(
    0,
    (input.currentYear - input.year) * 12 + (input.currentMonth - input.month),
  );
}

function dutyBand(input: UzbekistanInput, months: number): DutyBand {
  if (input.condition === "used") return "used";
  return months <= NEW_PREFERENTIAL_UP_TO_MONTHS ? "newUnder1" : "newOver1";
}

function calcFlags(args: {
  fuel: UzbekistanFuel;
  band: DutyBand;
  isOld: boolean;
  dutyRatePct: number;
  dutyPerCc: number;
  totalUzs: number;
  priceUzs: number;
}): Flag[] {
  const flags: Flag[] = [];

  const share =
    args.priceUzs > 0 ? Math.round((args.totalUzs / args.priceUzs) * 100) : 0;

  // Главный вывод по стране: на б/у машине с ДВС платежи сопоставимы с ценой
  // самой машины, а то и больше. Это не предупреждение «на всякий случай» —
  // это ответ на вопрос, ради которого калькулятор открывают.
  //
  // ⚠️ У гибрида с пробегом ставка ВОЗРАСТНАЯ (30% до трёх лет, 40% после), у
  // бензина и дизеля — одна на любой возраст. Флаги поэтому разные: общий
  // называл бы гибриду чужую формулу.
  if (args.band === "used" && (args.fuel === "petrol" || args.fuel === "diesel")) {
    flags.push({
      level: "critical",
      text: txt("uzbekistan.flags.usedProhibitive", {
        rate: USED_DUTY.rate * 100,
        perCc: USED_DUTY.usdPerCc,
        share,
      }),
    });
  }

  if (args.band === "used" && args.fuel === "hybrid") {
    flags.push({
      level: "warn",
      // Ставка приходит из расчёта, а не зашита в текст: у гибрида с пробегом
      // она возрастная (30% до трёх лет, 40% после).
      text: txt("uzbekistan.flags.usedHybrid", {
        rate: args.dutyRatePct,
        perCc: args.dutyPerCc,
        share,
      }),
    });
  }

  if (args.fuel === "electric") {
    flags.push({ level: "info", text: txt("uzbekistan.flags.electric") });
    flags.push({ level: "warn", text: txt("uzbekistan.flags.electricRecycling") });
  }

  // Доплаты за объём у гибрида нет только пока он НОВЫЙ — это и есть его
  // единственное настоящее преимущество перед бензином.
  if (args.fuel === "hybrid" && args.band !== "used") {
    flags.push({ level: "info", text: txt("uzbekistan.flags.hybridNoPerCc") });
  }

  if (args.band === "newUnder1") {
    flags.push({ level: "info", text: txt("uzbekistan.flags.smallEngineLost") });
  }

  if (args.isOld) {
    flags.push({
      level: "warn",
      text: txt("uzbekistan.flags.recyclingOld", {
        years: RECYCLING_OLD_ABOVE_MONTHS / 12,
      }),
    });
  }

  flags.push({ level: "info", text: txt("uzbekistan.flags.noExcise") });
  flags.push({ level: "warn", text: txt("uzbekistan.flags.notIncluded") });

  return flags;
}

export function calculateUzbekistan(input: UzbekistanInput): CalcResult {
  const months = ageMonths(input);
  const isElectric = input.fuel === "electric";
  const isOld = months > RECYCLING_OLD_ABOVE_MONTHS;
  const band = dutyBand(input, months);

  const volumeCc = isElectric ? 0 : Math.max(0, input.volumeCc);
  const usdPerUnit = Math.max(0, input.usdPerUnit);
  const uzsPerUsd = Math.max(0, input.uzsPerUsd);

  const priceUsd = Math.max(0, input.price) * usdPerUnit;
  const priceUzs = priceUsd * uzsPerUsd;

  // ⚠️ Таможенная стоимость = цена сделки ПЛЮС доставка до границы. От неё
  // считаются все три адвалорных платежа, а не от одной цены машины.
  const customsValueUsd = priceUsd + Math.max(0, input.freightUsd);
  const customsValueUzs = customsValueUsd * uzsPerUsd;

  // Ступень сбора берётся по стоимости В ДОЛЛАРАХ — так задана шкала ПКМ № 55.
  const feeBrv = customsFeeBrv(customsValueUsd);
  const feeUzs = feeBrv * BRV_UZS;

  const duty = dutyRate(input.fuel, band, volumeCc, isOld);
  const dutyUsd = customsValueUsd * duty.rate + volumeCc * duty.usdPerCc;
  const dutyUzs = dutyUsd * uzsPerUsd;

  // База НДС — таможенная стоимость плюс пошлина. Акциза на легковые нет с
  // 01.08.2020, утилизационный сбор и сбор за оформление в базу не входят.
  const vatUzs = Math.round((customsValueUzs + dutyUzs) * VAT_RATE);

  const recBrv = recyclingBrv(input.fuel, volumeCc, isOld);
  const recyclingUzs = recBrv * BRV_UZS;

  // Госпошлины СБДД — уже не таможня, но для клиента платёж такой же
  // обязательный, поэтому строка входит в итог.
  const regBrv = registrationBrv(input.fuel);
  const registrationUzs = Math.round(regBrv * BRV_UZS);

  const lines: Line[] = [
    {
      id: "customsFee",
      label: txt("uzbekistan.lines.customsFee"),
      note: txt("uzbekistan.notes.customsFee", {
        brv: feeBrv,
        value: formatAmount(customsValueUsd),
      }),
      amount: feeUzs,
      currency: "UZS",
    },
    {
      id: "duty",
      label: txt("uzbekistan.lines.duty"),
      note: dutyNote(input.fuel, band, duty, volumeCc, dutyUsd),
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
        { coeff: recBrv, years: RECYCLING_OLD_ABOVE_MONTHS / 12 },
      ),
      amount: recyclingUzs,
      currency: "UZS",
    },
    {
      id: "registration",
      label: txt("uzbekistan.lines.registration"),
      note: txt(
        input.fuel === "electric"
          ? "uzbekistan.notes.registrationElectric"
          : "uzbekistan.notes.registration",
        {
          brv: regBrv,
          registration: REGISTRATION_BRV.registration,
          certificate: REGISTRATION_BRV.certificate,
          plates: REGISTRATION_BRV.plates,
        },
      ),
      amount: registrationUzs,
      currency: "UZS",
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
    txt(`uzbekistan.conditionShort.${input.condition}`),
  ];

  return {
    lines,
    total: { amount: totalUzs, currency: "UZS" },
    alt,
    flags: calcFlags({
      fuel: input.fuel,
      band,
      isOld,
      dutyRatePct: duty.rate * 100,
      dutyPerCc: duty.usdPerCc,
      totalUzs,
      priceUzs,
    }),
    subtitle,
    stampLabel: txt(`uzbekistan.stamp.${band}`),
    meta: {
      fuel: input.fuel,
      condition: input.condition,
      dutyBand: band,
      ageMonths: String(months),
      ageBand: isOld ? "over3" : "under3",
      volumeCc: String(volumeCc),
      priceUsd: String(Math.round(priceUsd)),
      priceUzs: String(Math.round(priceUzs)),
      freightUsd: String(Math.round(input.freightUsd)),
      customsValueUsd: String(Math.round(customsValueUsd)),
      customsValueUzs: String(Math.round(customsValueUzs)),
      customsFeeBrv: String(feeBrv),
      dutyRate: String(duty.rate),
      dutyUsdPerCc: String(duty.usdPerCc),
      dutyUsd: String(Math.round(dutyUsd)),
      dutyUzs: String(Math.round(dutyUzs)),
      vatUzs: String(vatUzs),
      recyclingBrv: String(recBrv),
      recyclingUzs: String(recyclingUzs),
      registrationBrv: String(regBrv),
      registrationUzs: String(registrationUzs),
      totalUzs: String(totalUzs),
    },
  };
}

/**
 * У пошлины четыре разных объяснения, потому что за ними стоят разные строки
 * тарифа: нулевая ставка электромобилей, голый процент гибридов, единая ставка
 * б/у и льготная сетка новых машин с доплатой за объём.
 */
function dutyNote(
  fuel: UzbekistanFuel,
  band: DutyBand,
  duty: { rate: number; usdPerCc: number },
  volumeCc: number,
  dutyUsd: number,
): I18nText {
  if (fuel === "electric") return txt("uzbekistan.notes.dutyElectric");
  // У гибрида доплата за см³ есть только с пробегом; у нового её нет, и тогда
  // формулу надо показывать без множителя, иначе она читается как «× 0».
  if (fuel === "hybrid" && duty.usdPerCc === 0) {
    return txt("uzbekistan.notes.dutyHybrid", {
      rate: duty.rate * 100,
      usd: formatAmount(dutyUsd, 2),
    });
  }
  // «Единая ставка» — только про бензин и дизель: у гибрида с пробегом она
  // возрастная, и переиспользовать ту же формулировку нельзя.
  const key =
    band !== "used"
      ? "uzbekistan.notes.duty"
      : fuel === "hybrid"
        ? "uzbekistan.notes.dutyHybridUsed"
        : "uzbekistan.notes.dutyUsed";
  return txt(key, {
    rate: duty.rate * 100,
    perCc: duty.usdPerCc,
    volumeCc,
    usd: formatAmount(dutyUsd, 2),
  });
}

export const uzbekistanCalculator: CountryCalculator<UzbekistanInput> = {
  id: "uzbekistan",
  title: txt("uzbekistan.title"),
  fields: uzbekistanFields,
  defaults: uzbekistanDefaults,
  calculate: calculateUzbekistan,
};
