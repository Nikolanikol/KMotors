// Карточка авто одним куском — для генератора каруселей (AXIS Video).
//
// Зачем отдельный слой: Encar отдаёт данные двумя разными запросами, в 만원 и по-корейски,
// а генератору слайдов нужны готовые English-поля, числа и абсолютные адреса фото.
// Собирать это на стороне генератора значит дублировать словари и правила цены, которые
// уже живут здесь. Меняется формат Encar — чиним в одном месте.
//
// Почему через нас, а не напрямую: Encar режет адреса дата-центров. Сайт ходит через
// fetchVehicleData, у которого есть запасной прокси, и этот обход достаётся карточке даром.
import { fetchVehicleData, VehicleUpstreamError } from "@/lib/vehicle";
import { fetchVehicleRecord } from "@/lib/vehicleRecord";
import { getCarRates } from "@/lib/kbFx";
import { carPriceKrw, carPriceUsd } from "@/lib/carPricing";
import { normalizeBrand } from "@/lib/carLabels";
import { OPTION_EN } from "@/components/Catalog/CarDetail/OptionsRow/data";
import enCars from "@/locales/en/cars.json";

export { VehicleUpstreamError };

const PHOTO_HOST = "https://ci.encar.com";
/**
 * Без параметра Encar отдаёт 640×360 — для слайда 1080×1920 это троекратное растяжение
 * и каша вместо кузова. С impolicy приходит оригинал 2200×1238.
 * Водяные знаки впечатаны в сам снимок и никакими параметрами не снимаются.
 */
const PHOTO_SIZE = "?impolicy=heightRate&rh=1080";

/**
 * Ракурсы Encar по коду снимка. Порядок выдачи у него случайный, а код — постоянный,
 * и по нему видно, что на кадре. Выяснено просмотром: 005 это крупный план колеса, а
 * помечен он как экстерьер — без разбора по кодам такой кадр попадал на обложку.
 *
 *   001 перед 3/4   002 зад 3/4   003 перед   004 зад   005 колесо   006 моторный отсек
 *   007 салон       008 приборка  009 консоль 010 салон от двери
 *
 * Для каждого места свой список предпочтений: берём первый найденный.
 */
const PICK = {
  hero: ["001", "003", "002", "004"],
  rear: ["002", "004", "003", "001"],
  interior: ["007", "010", "009"],
  dashboard: ["008", "009", "007"],
} as const;

/**
 * Опции по убыванию значимости для объявления.
 *
 * Коды у Encar идут примерно по возрасту опции, поэтому «первые по списку» — это
 * стеклоподъёмники и CD-проигрыватель, а вентиляция сидений и камера кругового обзора
 * остаются за кадром. На слайд идут первые несколько, и они обязаны быть лучшими.
 *
 * Порядок редакторский, не технический: сначала то, что редко и дорого, потом привычный
 * комфорт, в конце то, что есть у всех. Правится здесь, а не в вёрстке слайдов.
 */
const RANK = [
  // редкое и дорогое — им и продают
  "091", "095", "087", "079", "086", "088", "010", "090", "077", "034",
  "089", "092", "093", "080", "051", "078", "063", "082", "059", "014",
  // привычный комфорт
  "023", "022", "021", "035", "057", "058", "085", "032", "005", "096",
  "075", "029", "068", "094", "097", "081", "083", "084", "030", "024",
  "033", "055", "062", "017", "074",
  // есть почти у всех — в хвост
  "020", "056", "026", "027", "001", "019", "002", "031", "015", "006",
  "007", "008", "054", "004", "003", "071", "072",
];
const rankOf = (code: string) => {
  const i = RANK.indexOf(code);
  return i === -1 ? RANK.length : i;
};

/**
 * Разделение опций по слайдам карусели: комфорт (салон) и техника с безопасностью.
 * Всё, что не попало ни в один список, уходит в other — на слайды оно не идёт,
 * но остаётся в ответе, чтобы не терять данные.
 *
 * Деление сделано вручную и намеренно: Encar отдаёт один плоский список кодов.
 */
const SAFETY_CODES = new Set([
  "001", "002", "019", "020", "026", "027", "029", "032", "033", "055", "056",
  "058", "068", "075", "079", "081", "085", "086", "087", "088", "094", "095", "097",
  // мультимедиа и электроника салона — на слайд «Technology»
  "003", "004", "005", "031", "054", "071", "072", "074", "084", "096",
]);
const COMFORT_CODES = new Set([
  "006", "007", "010", "014", "015", "021", "022", "023", "024", "030", "034",
  "035", "051", "057", "059", "063", "077", "078", "080", "082", "083", "089",
  "090", "091", "092", "093",
]);

const dict = enCars as Record<string, string>;
/** Корейское слово → английское. Не нашлось — отдаём пусто, корейщине на слайде не место. */
const en = (ko: string | null | undefined): string => (ko && dict[ko]) || "";

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export interface VehicleCard {
  id: string;
  source: string;
  brand: string;
  model: string;
  grade: string;
  trim: string;
  year: number | null;
  firstRegistered: string | null;
  mileageKm: number | null;
  displacementCc: number | null;
  transmission: string;
  fuel: string;
  body: string;
  color: string;
  seats: number | null;
  vin: string | null;
  plate: string | null;
  price: {
    krw: number;
    usd: number | null;
    krwToUsd: number;
    /** Отметка котировки: без неё цифры в постах расходятся между днями и объяснить нечем */
    quotedAt: string;
    rateSource: string;
  } | null;
  /** null — история недоступна (Encar отдал пусто). Это не то же самое, что «происшествий нет». */
  history: {
    accidentsOwn: number;
    accidentsOther: number;
    accidentsTotal: number;
    /** Годы происшествий и наибольшая выплата — для сноски на слайде истории */
    accidentYears: number[];
    maxPayoutKrw: number | null;
    /**
     * Каждый случай отдельно: дата, выплата и на что она ушла. Покраска здесь важнее
     * прочего — по ней видно, что кузов трогали.
     *
     * own: у Encar это поле type без расшифровки. Вывод по совпадению счётчиков:
     * у машины с «своих 1, чужих 3» один случай с type 2 и три с type 3.
     */
    claims: {
      date: string;
      payoutKrw: number;
      partsKrw: number;
      laborKrw: number;
      paintKrw: number;
      own: boolean;
    }[];
    ownerChanges: number;
    theft: number;
    flood: number;
    totalLoss: number;
  } | null;
  options: {
    comfort: string[];
    safety: string[];
    other: string[];
    total: number;
  };
  photos: {
    /** Подобранные ракурсы: null — такого кадра у машины нет */
    hero: string | null;
    rear: string | null;
    interiorShot: string | null;
    dashboard: string | null;
    exterior: string[];
    interior: string[];
    other: string[];
  };
}

/** null — машина продана или снята (Encar отдал 404). Бросает при недоступности источника. */
export async function buildVehicleCard(id: string): Promise<VehicleCard | null> {
  const v = await fetchVehicleData(id);
  if (!v) return null;

  const category = v.category ?? {};
  const spec = v.spec ?? {};
  const record = await fetchVehicleRecord(id, v.vehicleNo);
  const rates = await getCarRates().catch(() => null);

  const codes: string[] = v.options?.standard ?? [];
  // Сортируем по значимости сразу: слайды берут первые несколько, и решать, что важнее,
  // должно одно место — здесь, а не в каждой вёрстке
  const named = codes
    .map((c) => ({ code: c, name: OPTION_EN[c] }))
    .filter((o) => o.name)
    .sort((a, b) => rankOf(a.code) - rankOf(b.code));

  const photos = (v.photos ?? []) as { path?: string; type?: string; code?: string }[];
  const url = (p: { path?: string }) => `${PHOTO_HOST}${p.path}${PHOTO_SIZE}`;
  const byCode = new Map(photos.filter((p) => p.path && p.code).map((p) => [p.code as string, url(p)]));
  /** Первый доступный ракурс из списка предпочтений */
  const pick = (codes: readonly string[]) => codes.map((c) => byCode.get(c)).find(Boolean) ?? null;
  // Внутри типа сортируем по коду: у Encar порядок выдачи случайный, а код постоянный
  const byType = (t: string) =>
    photos.filter((p) => p.type === t && p.path)
      .sort((a, b) => String(a.code).localeCompare(String(b.code)))
      .map(url);

  const krw = carPriceKrw(v.advertisement?.price);
  const accidents = (record?.accidents ?? []) as {
    type?: string; date?: string; insuranceBenefit?: number;
    partCost?: number; laborCost?: number; paintingCost?: number;
  }[];
  const payouts = accidents.map((a) => Number(a.insuranceBenefit) || 0).filter((n) => n > 0);
  // Свежие сверху: недавний ремонт волнует покупателя больше, чем давний
  const claims = accidents
    .map((a) => ({
      date: a.date ?? "",
      payoutKrw: Number(a.insuranceBenefit) || 0,
      partsKrw: Number(a.partCost) || 0,
      laborKrw: Number(a.laborCost) || 0,
      paintKrw: Number(a.paintingCost) || 0,
      own: a.type === "2",
    }))
    .sort((x, y) => y.date.localeCompare(x.date));

  return {
    id: String(v.vehicleId ?? id),
    source: `https://www.kmotors.shop/en/catalog/${id}`,
    // Encar склеивает марку с историческим названием (ChevroletGMDaewoo) — чиним общим словарём
    brand: normalizeBrand(category.manufacturerEnglishName) || category.manufacturerEnglishName || "",
    model: category.modelGroupEnglishName || category.modelEnglishName || "",
    grade: category.gradeEnglishName || "",
    trim: category.gradeDetailEnglishName || "",
    year: num(category.formYear),
    firstRegistered: record?.firstDate ?? null,
    mileageKm: num(spec.mileage),
    displacementCc: num(spec.displacement),
    // Коробка лежит именно здесь. В истории поле transmission приходит пустым — на этом
    // прежняя версия генератора печатала на слайде «not specified».
    transmission: en(spec.transmissionName),
    fuel: en(spec.fuelName),
    body: en(spec.bodyName),
    color: en(spec.colorName),
    seats: num(spec.seatCount),
    vin: v.vin ?? null,
    plate: v.vehicleNo ?? null,
    price:
      krw > 0 && rates
        ? {
            krw,
            usd: carPriceUsd(v.advertisement?.price, rates.krwToUsd),
            krwToUsd: rates.krwToUsd,
            quotedAt: rates.updatedAt,
            rateSource: rates.source,
          }
        : null,
    history: record
      ? {
          accidentsOwn: record.myAccidentCnt ?? 0,
          accidentsOther: record.otherAccidentCnt ?? 0,
          accidentsTotal: (record.myAccidentCnt ?? 0) + (record.otherAccidentCnt ?? 0),
          accidentYears: [
            ...new Set(accidents.map((a) => Number(String(a.date).slice(0, 4))).filter(Boolean)),
          ].sort(),
          maxPayoutKrw: payouts.length ? Math.max(...payouts) : null,
          claims,
          // Поля «сколько было владельцев» у Encar нет — есть только число смен.
          // Подписывать это как «1 owner» нельзя, цифры разойдутся между слайдами.
          ownerChanges: record.ownerChangeCnt ?? 0,
          theft: record.robberCnt ?? 0,
          flood: (record.floodTotalLossCnt ?? 0) + (record.floodPartLossCnt ?? 0),
          totalLoss: record.totalLossCnt ?? 0,
        }
      : null,
    options: {
      comfort: named.filter((o) => COMFORT_CODES.has(o.code)).map((o) => o.name),
      safety: named.filter((o) => SAFETY_CODES.has(o.code)).map((o) => o.name),
      other: named
        .filter((o) => !COMFORT_CODES.has(o.code) && !SAFETY_CODES.has(o.code))
        .map((o) => o.name),
      total: named.length,
    },
    photos: {
      // Готовые ракурсы под места на слайдах — вёрстке не нужно знать про коды Encar
      hero: pick(PICK.hero),
      rear: pick(PICK.rear),
      interiorShot: pick(PICK.interior),
      dashboard: pick(PICK.dashboard),
      exterior: byType("OUTER"),
      interior: byType("INNER"),
      other: byType("OPTION"),
    },
  };
}
