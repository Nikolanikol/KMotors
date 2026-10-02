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
// числу страниц из total, а пустая страница — страховка на случай, если total
// уменьшился посреди обхода (их синхронизация может пройти прямо во время
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

/** Проверка формы data — защищает от чужого объекта с тем же ключом. */
function isListPage(v: unknown): v is CarnectListPage {
  if (!isObject(v) || !Array.isArray(v.items) || typeof v.total !== "number") return false;
  // Пустой список валиден (у площадки нет торгов). Непустой — элементы
  // обязаны быть лотами, иначе это какой-то другой "data" на странице.
  return v.items.every((x) => isObject(x) && typeof x.lotId === "string");
}

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
 * Одна страница списка: разобранная, либо причина, почему нет.
 * Экспортирована для просмотрщика (/admin/carnect), которому нужна ровно одна
 * страница, а не обход всей площадки.
 */
export async function fetchListPage(
  house: CarnectHouse,
  page: number,
  signal?: AbortSignal,
): Promise<{ page: CarnectListPage; flight: string } | { error: ListError }> {
  const path = page === 1 ? `/auctions/${house}` : `/auctions/${house}?page=${page}`;
  const res = await getPage(path, "bulk", signal);
  // На СПИСКЕ soft-404 означает, что carnect не знает такой площадки —
  // переименовали адрес. Это не «торгов нет», а повод сверить HOUSES.
  if (res.kind === "gone") return { error: "unknown-house" };
  if (res.kind === "failed") {
    if (res.status === 403) return { error: "blocked" };
    return { error: res.rateLimited ? "rate-limited" : "unavailable" };
  }

  const flight = decodeFlight(res.html);
  const data = pick(flight, "data", isListPage);
  if (!data) {
    console.error(`[carnect] ${house} стр. ${page}: объект data не найден — сменилась разметка?`);
    return { error: "parser" };
  }
  return { page: data, flight };
}

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
  opts: { sinceIngestAt?: string | null; maxPages?: number; signal?: AbortSignal } = {},
): Promise<HouseListResult> {
  const empty: CarnectIngest = { lastIngestAt: null, lastStatus: null, lastIngestCount: null, lastIngestExpected: null };
  const result: HouseListResult = { house, lots: [], total: 0, requests: 0, ingest: empty, unchanged: false };

  const first = await fetchListPage(house, 1, opts.signal);
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
    const next = await fetchListPage(house, page, opts.signal);
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
