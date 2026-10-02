// Кеш поверх походов на carnect — для всего, что дёргается со страниц.
//
// Зачем. Страница просмотрщика (а потом и публичная витрина лота) рендерится
// на каждый заход. Без кеша каждое обновление вкладки — новый запрос к
// чужому серверу; десять человек, открывших один лот, — десять запросов.
// С кешем на один лот уходит один запрос в час, сколько бы его ни смотрели.
//
// ⚠️ Кешируются только устойчивые исходы. Сбой (сайт не ответил, парсер не
// разобрал) БРОСАЕТ исключение внутри unstable_cache — тогда в кеш ничего не
// попадает, и следующий заход пробует заново. Иначе минутный сбой у carnect
// превратился бы в час «деталей нет» при живом лоте. Снаружи исключение
// ловится и превращается обратно в типизированный исход: страницы не падают.
//
// ⚠️ Версия формы в ключе (…-v1). Поменяли состав того, что возвращаем, —
// поднять, иначе кеш до истечения TTL отдаёт объекты прежней формы.

import { unstable_cache } from "next/cache";

import { fetchLotDetail, type LotDetailResult } from "./detail";
import { fetchHeyCar, fetchHeyPage, type HeyAuctionType, type HeyCarResult, type HeyListCar } from "./heydealer";
import type { CarnectHouse } from "./houses";
import { fetchListPage, fetchVenueFacets, readIngest, type DataPage, type ListError, type VenueFacet } from "./list";
import type { CarnectIngest, CarnectListLot } from "./types";

/** Список меняется партией к дню торгов, внутри дня — статусами лотов. */
const LIST_TTL_S = 15 * 60;
/** Деталь лота стабильна; ушедший лот (gone) тоже факт надолго. */
const DETAIL_TTL_S = 60 * 60;

class Unstable extends Error {}

/** Страница списка из кеша — общая форма для аукционов и HeyDealer. */
export type CachedPage<T> =
  | { ok: true; page: DataPage<T>; ingest: CarnectIngest; fetchedAt: string }
  | { ok: false; error: ListError };

/** Превращает исключение из unstable_cache обратно в типизированный исход. */
function asListError(e: unknown): ListError {
  return e instanceof Unstable ? (e.message as ListError) : "unavailable";
}

const listPage = unstable_cache(
  // venue — пустая строка, а не undefined: аргументы входят в ключ кеша, и
  // undefined с пустой строкой дали бы два ключа на один и тот же запрос.
  async (house: CarnectHouse, page: number, venue: string) => {
    const res = await fetchListPage(house, page, { venue: venue || undefined });
    if ("error" in res) throw new Unstable(res.error);
    return {
      page: res.page,
      ingest: readIngest(res.flight),
      // Момент реального похода, а не рендера: по нему на странице видно,
      // свежие данные или из кеша.
      fetchedAt: new Date().toISOString(),
    };
  },
  ["carnect-list-page-v2"],
  { revalidate: LIST_TTL_S },
);

export async function getListPage(
  house: CarnectHouse,
  page: number,
  venue = "",
): Promise<CachedPage<CarnectListLot>> {
  try {
    return { ok: true, ...(await listPage(house, page, venue)) };
  } catch (e) {
    return { ok: false, error: asListError(e) };
  }
}

const venueFacets = unstable_cache(
  async (house: CarnectHouse) => {
    const res = await fetchVenueFacets(house);
    // null не кешируем: «у площадки один дом» и «API не ответил» снаружи
    // неотличимы, а второе временное.
    if (!res) throw new Unstable("unavailable");
    return res;
  },
  ["carnect-venue-facets-v1"],
  { revalidate: LIST_TTL_S },
);

/** Аукционные дома площадки с числом лотов. null — фасета нет или сбой. */
export async function getVenueFacets(house: CarnectHouse): Promise<VenueFacet[] | null> {
  try {
    return await venueFacets(house);
  } catch {
    return null;
  }
}

export type CachedLotDetail = LotDetailResult & { fetchedAt?: string };

const lotDetail = unstable_cache(
  async (house: CarnectHouse, lotId: string) => {
    const res = await fetchLotDetail(house, lotId);
    if (res.status === "failed") throw new Unstable(res.parser ? "parser" : "unavailable");
    return { ...res, fetchedAt: new Date().toISOString() };
  },
  ["carnect-lot-detail-v1"],
  { revalidate: DETAIL_TTL_S },
);

export async function getLotDetail(house: CarnectHouse, lotId: string): Promise<CachedLotDetail> {
  try {
    return await lotDetail(house, lotId);
  } catch (e) {
    return { status: "failed", parser: e instanceof Unstable && e.message === "parser" };
  }
}

const heyPage = unstable_cache(
  async (type: HeyAuctionType, page: number) => {
    const res = await fetchHeyPage(type, page);
    if ("error" in res) throw new Unstable(res.error);
    return { page: res.page, ingest: readIngest(res.flight), fetchedAt: new Date().toISOString() };
  },
  ["carnect-hey-page-v1"],
  { revalidate: LIST_TTL_S },
);

export async function getHeyPage(type: HeyAuctionType, page: number): Promise<CachedPage<HeyListCar>> {
  try {
    return { ok: true, ...(await heyPage(type, page)) };
  } catch (e) {
    return { ok: false, error: asListError(e) };
  }
}

export type CachedHeyCar = HeyCarResult & { fetchedAt?: string };

const heyCar = unstable_cache(
  async (id: string) => {
    const res = await fetchHeyCar(id);
    if (res.status === "failed") throw new Unstable(res.parser ? "parser" : "unavailable");
    return { ...res, fetchedAt: new Date().toISOString() };
  },
  ["carnect-hey-car-v1"],
  { revalidate: DETAIL_TTL_S },
);

export async function getHeyCar(id: string): Promise<CachedHeyCar> {
  try {
    return await heyCar(id);
  } catch (e) {
    return { status: "failed", parser: e instanceof Unstable && e.message === "parser" };
  }
}
