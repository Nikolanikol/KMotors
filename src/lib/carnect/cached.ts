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
import type { CarnectHouse } from "./houses";
import { fetchListPage, readIngest, type ListError } from "./list";
import type { CarnectIngest, CarnectListPage } from "./types";

/** Список меняется партией к дню торгов, внутри дня — статусами лотов. */
const LIST_TTL_S = 15 * 60;
/** Деталь лота стабильна; ушедший лот (gone) тоже факт надолго. */
const DETAIL_TTL_S = 60 * 60;

class Unstable extends Error {}

export type CachedListPage =
  | { ok: true; page: CarnectListPage; ingest: CarnectIngest; fetchedAt: string }
  | { ok: false; error: ListError };

const listPage = unstable_cache(
  async (house: CarnectHouse, page: number) => {
    const res = await fetchListPage(house, page);
    if ("error" in res) throw new Unstable(res.error);
    return {
      page: res.page,
      ingest: readIngest(res.flight),
      // Момент реального похода, а не рендера: по нему на странице видно,
      // свежие данные или из кеша.
      fetchedAt: new Date().toISOString(),
    };
  },
  ["carnect-list-page-v1"],
  { revalidate: LIST_TTL_S },
);

export async function getListPage(house: CarnectHouse, page: number): Promise<CachedListPage> {
  try {
    return { ok: true, ...(await listPage(house, page)) };
  } catch (e) {
    return { ok: false, error: e instanceof Unstable ? (e.message as ListError) : "unavailable" };
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
