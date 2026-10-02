// Обход списка лотов одной площадки: /auctions/<house>?page=N.
//
// Устройство ответа (замер 02.10.2026): страница отдаёт проп
//   {"data":{"items":[…24 лота…],"total":1445,"page":1,"pageSize":24},"filters":{…}}
// и рядом — состояние их синхронизации с площадкой (lastIngestAt и т.д.).
//
// ⚠️ Размер страницы фиксирован — 24. Параметр ?pageSize=… игнорируется
// (проверено: с pageSize=100 приходят те же 24). Отсюда число запросов:
// Autobell 1 445 лотов = 61 страница, Lotte 56, SK 30, K Car 15, Autohub 1.
//
// ⚠️ За последней страницей carnect отдаёт ПУСТОЙ items при живом total, а не
// 404 и не повтор последней (у dokanmazad было наоборот). Останавливаемся по
// числу страниц из total, а пустая страница — страховка на случай, если
// total уменьшился посреди обхода (их синхронизация может пройти прямо во время
// нашей).
//
// ⚠️ Три исхода «лотов нет» обязаны различаться в ответе — снаружи они все
// выглядят как пустой список:
//   • total = 0          — у площадки сейчас нет торгов. Норма (четверговый
//                          Autobell 02.10.2026 был пуст).
//   • error "parser"     — страница пришла, но объекта data в ней нет: carnect
//                          сменил форму пропсов. Чинить парсер.
//   • error "unavailable"/"rate-limited" — сайт не отдал страницу.
// Прогон, который вернул ноль лотов с ok:true при сломанном парсере, — ровно
// та ошибка, что у добора K Car стоила 53 минуты «успешного» пустого обхода.

import { getPage } from "./client";
import type { CarnectHouse } from "./houses";
import { decodeFlight, isObject, pick } from "./rsc";
import type { CarnectIngest, CarnectListLot, CarnectListPage } from "./types";

/**
 * Потолок страниц на одну площадку — предохранитель, а не ожидаемый объём.
 * Самая крупная (Autobell) даёт ~61; 120 — запас вдвое. Упрёмся — значит,
 * total врёт или обход зациклился, и дальше идти незачем.
 */
const MAX_PAGES = 120;

/**
 * Почему список не получен. "blocked" отдельно от "rate-limited": 403 от их
 * Cloudflare — это правило доступа (например, закрыты корейские адреса,
 * проверено 02.10.2026 с машины владельца), и ожидание его не снимет, а 429/503 —
 * просьба притормозить, которая проходит сама.
 */
export type ListError = "parser" | "unavailable" | "rate-limited" | "blocked" | "unknown-house";

export interface HouseListResult {
  house: CarnectHouse;
  lots: CarnectListLot[];
  /** Сколько лотов carnect обещал в total на первой странице. */
  total: number;
  /** Сколько страниц реально запросили — это и есть наша нагрузка на них. */
  requests: number;
  ingest: CarnectIngest;
  /**
   * true — lastIngestAt совпал с переданным sinceIngestAt: у carnect те же
   * данные, что при прошлом прогоне, обход остановлен после первой страницы.
   * lots в этом случае — только первая страница, писать их как полный
   * снимок площадки НЕЛЬЗЯ.
   */
  unchanged: boolean;
  /** Обход прерван. lots — то, что успели собрать до этого. */
  error?: ListError;
}

/** Страница списка в общем виде: аукционы и HeyDealer отличаются только формой элемента. */
export interface DataPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Проверка формы data — защищает от чужого объекта с тем же ключом. Пустой
 * список валиден (у площадки нет торгов). Непустой — элементы обязаны пройти
 * проверку вызывающего, иначе это какой-то другой "data" на странице.
 */
function isDataPage<T>(itemGuard: (x: Record<string, unknown>) => boolean) {
  return (v: unknown): v is DataPage<T> =>
    isObject(v) &&
    Array.isArray(v.items) &&
    typeof v.total === "number" &&
    v.items.every((x) => isObject(x) && itemGuard(x));
}

const isAuctionLot = (x: Record<string, unknown>) => typeof x.lotId === "string";

/**
 * Состояние их синхронизации. Лежит скалярами в пропсах отдельного
 * компонента без ключа-обёртки, поэтому берём регуляркой по потоку, а не
 * через pick. Не нашлось — null: это необязательная оптимизация, а не данные.
 */
export function readIngest(flight: string): CarnectIngest {
  const str = (k: string) => new RegExp(`"${k}":"([^"]*)"`).exec(flight)?.[1] ?? null;
  const num = (k: string) => {
    const m = new RegExp(`"${k}":(\\d+)`).exec(flight)?.[1];
    return m ? Number(m) : null;
  };
  return {
    lastIngestAt: str("lastIngestAt"),
    lastStatus: str("lastStatus"),
    lastIngestCount: num("lastIngestCount"),
    lastIngestExpected: num("lastIngestExpected"),
  };
}

/**
 * Любая страница списка carnect по пути: разобранный data, либо причина,
 * почему нет. Общая для аукционов и HeyDealer (heydealer.ts) — устройство
 * ответа у них одно, различаются адрес и форма элемента.
 */
export async function fetchDataPage<T>(
  path: string,
  itemGuard: (x: Record<string, unknown>) => boolean,
  signal?: AbortSignal,
): Promise<{ page: DataPage<T>; flight: string } | { error: ListError }> {
  const res = await getPage(path, "bulk", signal);
  // На СПИСКЕ soft-404 означает, что carnect не знает такого адреса —
  // переименовали площадку или раздел. Это не «торгов нет», а повод сверить
  // HOUSES / адреса HeyDealer.
  if (res.kind === "gone") return { error: "unknown-house" };
  if (res.kind === "failed") {
    if (res.status === 403) return { error: "blocked" };
    return { error: res.rateLimited ? "rate-limited" : "unavailable" };
  }

  const flight = decodeFlight(res.html);
  const data = pick(flight, "data", isDataPage<T>(itemGuard));
  if (!data) {
    console.error(`[carnect] ${path}: объект data не найден — сменилась разметка?`);
    return { error: "parser" };
  }
  return { page: data, flight };
}

export interface VenueFacet {
  /** Код аукционного дома — его и ждёт фильтр ?venue=. */
  code: string;
  /** Название, как его пишет carnect: "Bundang", "Sihwa". */
  name: string;
  /** Лотов на этой площадке сейчас. */
  count: number;
}

/**
 * Аукционные дома площадки с числом лотов — из фасета venue их фильтрового
 * API (/api/auctions/<house>/filters, открытый JSON).
 *
 * Зачем живой фасет, а не только HOUSES[house].venues: у Autobell три дня
 * торгов, а коды мы видели лишь у двух. Появится лот четверговой площадки —
 * её вкладка возникнет сама, без правки кода. null — фасета нет (у площадки
 * один дом) или API не ответил; вызывающий тогда показывает площадку целиком.
 */
export async function fetchVenueFacets(house: CarnectHouse, signal?: AbortSignal): Promise<VenueFacet[] | null> {
  const res = await getPage(`/api/auctions/${house}/filters`, "bulk", signal);
  if (res.kind !== "html") return null;
  try {
    const body = JSON.parse(res.html) as { groups?: { key?: string; facets?: { value?: unknown; label?: unknown; count?: unknown }[] }[] };
    const venue = body.groups?.find((g) => g.key === "venue");
    if (!venue?.facets?.length) return null;
    return venue.facets
      .filter((f) => typeof f.value === "string" && typeof f.count === "number")
      .map((f) => ({ code: f.value as string, name: String(f.label ?? f.value), count: f.count as number }));
  } catch {
    console.error(`[carnect] фасет venue ${house} не разобрался`);
    return null;
  }
}

/** Адрес страницы списка площадки. Параметры только непустые — ?page=1 не пишем. */
function auctionPath(house: CarnectHouse, page: number, venue?: string): string {
  const q = new URLSearchParams();
  if (venue) q.set("venue", venue);
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return `/auctions/${house}${qs ? `?${qs}` : ""}`;
}

/**
 * Одна страница списка площадки. Экспортирована для просмотрщика
 * (/admin/carnect), которому нужна ровно одна страница, а не обход всей
 * площадки.
 *
 * @param venue код аукционного дома (HOUSES[house].venues) — фильтрует
 *   carnect на своём сервере. Без него — вся площадка целиком.
 */
export async function fetchListPage(
  house: CarnectHouse,
  page: number,
  opts: { venue?: string; signal?: AbortSignal } = {},
): Promise<{ page: CarnectListPage; flight: string } | { error: ListError }> {
  return fetchDataPage<CarnectListLot>(auctionPath(house, page, opts.venue), isAuctionLot, opts.signal);
}

export interface CrawlResult<T> {
  items: T[];
  total: number;
  requests: number;
  ingest: CarnectIngest;
  /**
   * Обход дошёл до конца списка без ошибок и без потолка страниц. ТОЛЬКО по
   * полному обходу можно судить, что лот пропал: прерванный или урезанный
   * обход «не видел» лоты просто потому, что не дошёл до них (sync.ts).
   */
  complete: boolean;
  error?: ListError;
}

/**
 * Постраничный обход любого списка carnect — общий для аукционов и
 * HeyDealer. Страницы идут по одной через очередь client.ts.
 *
 * Останов: страниц больше, чем обещал total; пустая страница; ошибка — сразу,
 * без пропуска страницы (идти дальше после отказа значит долбить сайт).
 *
 * ⚠️ Страница целиком из уже виденных лотов — НЕ конец списка. Так думал
 * первый вариант обхода, и пробный прогон 02.10.2026 остановился на 45 машинах
 * HeyDealer Instant из 1 301, посчитав себя полным: у carnect соседние
 * страницы НАХЛЁСТЫВАЮТСЯ (замер: 4–13 повторов на 60–80 машин), и подряд
 * может прийти страница одних повторов. Идём до последней страницы по total.
 */
export async function crawlPages<T>(
  fetchPage: (page: number) => Promise<{ page: DataPage<T>; flight: string } | { error: ListError }>,
  idOf: (item: T) => string,
  opts: { maxPages?: number; signal?: AbortSignal } = {},
): Promise<CrawlResult<T>> {
  const empty: CarnectIngest = { lastIngestAt: null, lastStatus: null, lastIngestCount: null, lastIngestExpected: null };
  const result: CrawlResult<T> = { items: [], total: 0, requests: 0, ingest: empty, complete: false };
  const seen = new Set<string>();
  const add = (items: T[]) => {
    let fresh = 0;
    for (const it of items) {
      const id = idOf(it);
      if (seen.has(id)) continue;
      seen.add(id);
      result.items.push(it);
      fresh++;
    }
    return fresh;
  };

  const first = await fetchPage(1);
  result.requests++;
  if ("error" in first) return { ...result, error: first.error };
  result.total = first.page.total;
  result.ingest = readIngest(first.flight);
  add(first.page.items);

  const pages = Math.ceil(first.page.total / (first.page.pageSize || 24));
  const cap = Math.min(opts.maxPages ?? MAX_PAGES_HARD, MAX_PAGES_HARD);
  const lastPage = Math.min(pages, cap);

  let stoppedAt = lastPage;
  for (let page = 2; page <= lastPage; page++) {
    if (opts.signal?.aborted) return result;
    const next = await fetchPage(page);
    result.requests++;
    if ("error" in next) return { ...result, error: next.error };
    if (!next.page.items.length) {
      stoppedAt = page - 1;
      break;
    }
    add(next.page.items);
  }
  // Полный — если не упёрлись в потолок и дошли до конца списка. Пустая
  // страница в самом хвосте — норма (total чуть уменьшился посреди обхода).
  // ⚠️ Пустая страница ЗАДОЛГО до конца — обрезка у источника, а не конец:
  // с явной сортировкой carnect отдаёт HeyDealer только ~13 страниц из 65
  // (замер 02.10.2026), и такой обход полным не считается. Насколько полно
  // собрано по существу, вызывающий дополнительно сверяет с total (sync.ts).
  result.complete = pages <= cap && stoppedAt >= lastPage - 1 && !opts.signal?.aborted;
  return result;
}

/**
 * Потолок для любого обхода. HeyDealer Zero ~195 страниц по 20 — самый
 * длинный список; 300 — запас. Упрёмся — total врёт или обход зациклился.
 * Отдельно от MAX_PAGES аукционов, у которых страниц втрое меньше.
 */
const MAX_PAGES_HARD = 300;

/**
 * Все лоты площадки. Не бросает: при сбое вернёт собранное и причину.
 *
 * @param sinceIngestAt lastIngestAt из нашего прошлого прогона. Совпал —
 *   обход заканчивается на первой странице (см. HouseListResult.unchanged).
 * @param maxPages ограничить обход сверху — для пробного прогона, чтобы
 *   проверить парсер парой запросов, а не шестьюдесятью.
 */
export async function fetchHouseLots(
  house: CarnectHouse,
  opts: { sinceIngestAt?: string | null; maxPages?: number; venue?: string; signal?: AbortSignal } = {},
): Promise<HouseListResult> {
  const empty: CarnectIngest = { lastIngestAt: null, lastStatus: null, lastIngestCount: null, lastIngestExpected: null };
  const result: HouseListResult = { house, lots: [], total: 0, requests: 0, ingest: empty, unchanged: false };
  const pageOpts = { venue: opts.venue, signal: opts.signal };

  const first = await fetchListPage(house, 1, pageOpts);
  result.requests++;
  if ("error" in first) return { ...result, error: first.error };

  result.total = first.page.total;
  result.ingest = readIngest(first.flight);

  const seen = new Set<string>();
  const add = (items: CarnectListLot[]) => {
    let fresh = 0;
    for (const lot of items) {
      if (seen.has(lot.lotId)) continue;
      seen.add(lot.lotId);
      result.lots.push(lot);
      fresh++;
    }
    return fresh;
  };
  add(first.page.items);

  if (opts.sinceIngestAt && result.ingest.lastIngestAt === opts.sinceIngestAt) {
    return { ...result, unchanged: true };
  }

  const pageSize = first.page.pageSize || 24;
  const lastPage = Math.min(Math.ceil(first.page.total / pageSize), opts.maxPages ?? MAX_PAGES, MAX_PAGES);

  for (let page = 2; page <= lastPage; page++) {
    if (opts.signal?.aborted) break;
    const next = await fetchListPage(house, page, pageOpts);
    result.requests++;
    // ⚠️ Любая ошибка страницы ОСТАНАВЛИВАЕТ обход, а не пропускает
    // страницу. getPage уже сделал свои повторы; раз не вышло, сайту плохо
    // или он нас притормаживает, и идти дальше значит долбить его. Частичный
    // результат вызывающий обязан писать как частичный (см. error).
    if ("error" in next) return { ...result, error: next.error };
    // Пустая страница или страница целиком из дублей — список сдвинулся
    // посреди обхода (их синхронизация). Дальше ловить нечего.
    if (!next.page.items.length || !add(next.page.items)) break;
  }

  return result;
}
