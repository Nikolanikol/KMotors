// HeyDealer через carnect.biz: список машин по типу аукциона и карточка машины.
//
// HeyDealer — не аукционный дом с торгами по дням, а онлайн-площадка, где
// машины выставляются непрерывно, каждая со своим окончанием (endAt). carnect
// держит их в разделе /catalog (вкладка по умолчанию) и умеет фильтровать по
// типу аукциона на своём сервере: /catalog?auctionType=<тип>&page=N.
//
// ⚠️ ТИП АУКЦИОНА РЕШАЕТ ВСЁ, и смешивать типы в одной выдаче нельзя:
//
//   self              «Self»    — фото и описание делает сам продавец, осмотра
//                                 нет. Цены нет, идут ставки дилеров. В списке
//                                 нет и сводки состояния (heyCondition = null).
//   customer_zero     «Zero»    — машину осмотрел инспектор HeyDealer: класс ДТП,
//                                 ремонт по панелям, страховые выплаты, шины.
//                                 Цены тоже нет, ставки.
//   fixed_price_zero  «Instant» — выкуп по ФИКСИРОВАННОЙ цене: krw заполнен.
//                                 Сводка состояния есть.
//
// Замер 02.10.2026: Self 3 304, Zero 3 902, Instant 1 305 — 8 511 из 8 550 в
// разделе (остаток — машины без типа). Размер страницы 20, а не 24, как у
// аукционов.
//
// ⚠️ Подписи типов взяты у carnect («Self-bid», «Zero», «Instant buyback»), а
// значения — это значения самого HeyDealer. Значение и есть контракт: подпись
// мы рисуем свою.

import { getPage } from "./client";
import { fetchDataPage, type DataPage, type ListError } from "./list";
import { decodeFlight, isObject, pick } from "./rsc";

export type HeyAuctionType = "self" | "customer_zero" | "fixed_price_zero";

export interface HeyTypeInfo {
  type: HeyAuctionType;
  /** Короткое имя для вкладки. */
  label: string;
  /** Что это значит для покупателя — одной строкой. */
  hint: string;
  /** То же по-английски — для витрины (lang.ts). */
  hintEn: string;
  /** Есть ли у машин этого типа цена (иначе только ставки). */
  hasPrice: boolean;
}

export const HEY_TYPES: HeyTypeInfo[] = [
  {
    type: "self",
    label: "Self",
    hint: "Фото и описание от продавца, без осмотра. Цена — ставками.",
    hintEn: "Photos and description by the seller, no inspection. Price by bidding.",
    hasPrice: false,
  },
  {
    type: "customer_zero",
    label: "Zero",
    hint: "Осмотр инспектором HeyDealer. Цена — ставками.",
    hintEn: "Inspected by a HeyDealer inspector. Price by bidding.",
    hasPrice: false,
  },
  {
    type: "fixed_price_zero",
    label: "Instant",
    hint: "Выкуп по фиксированной цене, с осмотром.",
    hintEn: "Fixed buy-now price, inspected.",
    hasPrice: true,
  },
];

export function isHeyType(v: string | null | undefined): v is HeyAuctionType {
  return HEY_TYPES.some((t) => t.type === v);
}

/**
 * Сводка состояния из списка. Есть у Zero и Instant, у Self — null.
 * grade: "complete_no_accident" | "accident" | … — шкала HeyDealer.
 */
export interface HeyCondition {
  grade?: string;
  repairs?: { partKey?: string; repair?: string }[];
  myAccidents?: number;
  otherAccidents?: number;
  myAccidentCostKrw?: number;
  otherAccidentCostKrw?: number;
  totalLoss?: number;
  floodLoss?: number;
  stolen?: number;
}

/** Машина в списке /catalog. Набор полей снят 02.10.2026 по всем трём типам. */
export interface HeyListCar {
  /** Ключ HeyDealer, он же хвост адреса /car/heydealer/<id>. */
  id: string;
  /** "HeyDealer" — проверяем, чтобы не принять за машину что-то из блока рядом. */
  source?: string;
  auctionType?: HeyAuctionType | string;
  /** ⚠️ make бывает пустой строкой (видели у KG Mobility) — марка тогда в model. */
  make?: string;
  model?: string;
  year?: number;
  regYear?: number;
  regMonth?: number;
  km?: number;
  cc?: number;
  fuel?: string;
  trans?: string;
  color?: string;
  /**
   * Цена в вонах. ⚠️ 0 у Self и Zero — там priceOnRequest: true и идут ставки;
   * 0 значит «цены нет», а не «бесплатно». Настоящая цена только у Instant.
   */
  krw?: number;
  /** Пересчёт carnect по их курсу — не используем, правило проекта про чужую валюту. */
  usd?: number;
  priceOnRequest?: boolean;
  /** Окончание торгов, со смещением +09:00. */
  endAt?: string;
  bidCount?: number;
  status?: string;
  heyCondition?: HeyCondition | null;
  photo?: string;
  [extra: string]: unknown;
}

/** Карточка машины: всё из списка плюс подробности HeyDealer. */
export interface HeyCarDetail extends HeyListCar {
  gradeEn?: string;
  photos?: { url: string; code?: string }[];
  options?: unknown[];
  region?: string;
  listedAt?: string;
  /** Цена новой машины в вонах. */
  originPriceKrw?: number;
  /**
   * Всё, что HeyDealer знает о машине: VIN (частично скрыт), история ДТП и
   * владельцев, схема ремонта кузова, лист состояния, группы фото.
   * Форма снята по живым ответам; поля необязательные.
   */
  heydealer?: {
    auctionType?: string;
    status?: string;
    endAt?: string;
    approvedAt?: string;
    bidCount?: number;
    maxBids?: number;
    msrpKrw?: number;
    priceOnRequest?: boolean;
    accidentGrade?: string;
    accidentSummary?: string;
    accidentDiagram?: { repairs?: { part?: string; partKey?: string; repair?: string }[] };
    history?: Record<string, number>;
    conditionRows?: { key?: string; label?: string; kind?: string; ok?: boolean; [k: string]: unknown }[];
    conditionItems?: string[];
    conditionNotes?: string[];
    inspectorNotes?: string[];
    sellerNotes?: string[];
    imageGroups?: { type?: string; label?: string; urls?: string[] }[];
    vehicleInfo?: Record<string, unknown>;
    interior?: string;
    paint?: unknown;
    payment?: string;
    carNumber?: string;
    [k: string]: unknown;
  };
}

const isHeyCar = (x: Record<string, unknown>) => typeof x.id === "string" && x.source === "HeyDealer";

/**
 * Срез списка HeyDealer: фильтры carnect по году выпуска и пробегу. Границы
 * включительные с обеих сторон (проверено 02.10.2026: Zero 2020 = 30 машин
 * до 50 000 км + 238 от 50 001 км = 268, ровно весь год).
 *
 * ⚠️ ЗАЧЕМ РЕЗАТЬ, а не листать весь список. Разведка 02.10.2026:
 *   • у carnect ЛОМАЮТСЯ ОТДЕЛЬНЫЕ СТРАНИЦЫ: приходят пустыми и с total 0,
 *     хотя соседние целые (2018 год Zero: страницы 5, 12, 15, 16 из 17).
 *     Сломанная страница стабильна — три повтора с паузой дают то же самое,
 *     то есть повторять бесполезно. Скорее всего, на ней лежит машина, на
 *     которой падает их сервер;
 *   • на маленьком срезе сломанных страниц мало или нет вовсе (2015 год,
 *     247 машин — 100% дважды подряд), на большом их много (2016–2017,
 *     629 машин — три подряд, 90%);
 *   • явные сортировки (mileageAsc, priceAsc) НЕ помогают: на тех же
 *     срезах ломаются ещё раньше, поэтому синк их не использует.
 * Марку для нарезки не берём: у ~10% машин HeyDealer она пустая, и такие
 * машины не попали бы ни в один срез. Год и пробег есть у всех.
 */
export interface HeySlice {
  yearMin?: number;
  yearMax?: number;
  kmMin?: number;
  kmMax?: number;
}

/** Адрес страницы списка одного типа. ?page=1 не пишем; срез — только заданные границы. */
function heyPath(type: HeyAuctionType, page: number, slice: HeySlice = {}): string {
  const q = new URLSearchParams({ auctionType: type });
  for (const [k, v] of Object.entries(slice)) if (v != null) q.set(k, String(v));
  if (page > 1) q.set("page", String(page));
  return `/catalog?${q.toString()}`;
}

/** Одна страница списка HeyDealer одного типа (весь тип или срез). Не бросает. */
export async function fetchHeyPage(
  type: HeyAuctionType,
  page: number,
  signal?: AbortSignal,
  slice?: HeySlice,
): Promise<{ page: DataPage<HeyListCar>; flight: string } | { error: ListError }> {
  return fetchDataPage<HeyListCar>(heyPath(type, page, slice), isHeyCar, signal);
}

export type HeyCarResult =
  | { status: "ok"; car: HeyCarDetail }
  /** Машина ушла: продана или снята. */
  | { status: "gone" }
  | { status: "failed"; parser: boolean };

/**
 * Карточка одной машины — по требованию, как и лоты аукционов (detail.ts):
 * массовый обход 8 500 карточек — ровно тот трафик, за который закрывают.
 */
export async function fetchHeyCar(id: string, signal?: AbortSignal): Promise<HeyCarResult> {
  const res = await getPage(`/car/heydealer/${encodeURIComponent(id)}`, "interactive", signal);
  if (res.kind === "gone") return { status: "gone" };
  if (res.kind === "failed") return { status: "failed", parser: false };

  const car = pick(
    decodeFlight(res.html),
    "car",
    (v): v is HeyCarDetail => isObject(v) && v.id === id,
  );
  if (!car) {
    console.error(`[carnect] heydealer/${id}: объект car не найден — сменилась разметка?`);
    return { status: "failed", parser: true };
  }
  return { status: "ok", car };
}
