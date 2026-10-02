// Наполнение cars_seen из листинга Encar — тот обход, которого раньше не было.
//
// Снимки копились двумя путями: пассивно при рендере карточки (carsSeen.ts) и
// разовым скриптом бэкфилла. Странице проданной машины этого хватало, но с
// 10.2026 cars_seen стала ИСТОЧНИКОМ САЙТМАПА каталога, и пассивного пути стало
// мало: новая машина попадала в таблицу только после того, как кто-то открыл её
// карточку, а открыть её Google не мог, пока адреса нет в сайтмапе. Замкнутый
// круг — он и держал каталог невидимым (замер 02.10.2026: 8 из 8 машин, взятых
// из живого sitemap-catalog/1, «URL неизвестен Google, обход НИ РАЗУ»).
//
// ⚠️ Отсутствие машины в листинге продажей НЕ считается и sold_at здесь НЕ
// ставится. Листинг — скользящее окно по верхушке 155-тысячного пула,
// отсортированной по ModifiedDate: объявление уходит из окна просто потому, что
// его не переподнимали. Проданные отмечает рендер карточки по 404 от Encar
// (markCarSold) — Google обходит адрес из сайтмапа, получает 404, машина
// помечается и выпадает из следующей сборки. Петля замыкается сама.
//
// Модуль НЕ бросает исключений — общее правило для всех обращений к Encar.

import {
  saveCarSnapshots,
  snapshotFromListing,
  type CarSnapshot,
} from "@/lib/carsSeen";

/** Тот же запрос, что у сайтмапа: синхронизируем ровно то, что индексируем. */
const QUERY = "(And.Hidden.N._.CarType.Y.)";
// Encar отдаёт до 200 записей за запрос (замер 29.07.2026, curl с сервера).
// Прокси на Render режет выдачу до 20 независимо от запрошенного — отсюда
// 10 запросов напрямую против 100 через прокси на том же объёме.
const PAGE = 200;
const PROXY_PAGE = 20;
// ⚠️ Шаг offset'а равен числу РЕАЛЬНО полученных строк, а не PAGE. Замер на проде
// 02.10.2026: `api.encar.com` напрямую с нашего сервера не отвечает (локально
// отвечает), обход молча уходит на прокси Render, а тот режет выдачу до 20
// независимо от запрошенного. С фиксированным шагом 200 мы брали по 20 строк из
// каждой двухсотой позиции: при limit=500 это 60 машин вместо 500, причём
// `failedPages` оставался нулевым и в истории крона всё выглядело исправным.
// Шаг по факту сам подстраивается и под 200 напрямую, и под 20 через прокси.
const MAX_REQUESTS = 40;
// PostgREST на bulk-upsert'е требует одинакового набора ключей внутри запроса.
// Строки здесь все из листинга, то есть набор уже однородный; чанк нужен лишь
// чтобы не отправлять двухтысячный массив одним телом.
const UPSERT_CHUNK = 500;
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CarsSyncResult {
  ok: boolean;
  /** Сколько запросов к Encar сделали. */
  pages: number;
  /** Сколько запросов не отдали ничего ни напрямую, ни через прокси. */
  failedPages: number;
  /** Строк получено всего, с дублями между страницами. */
  fetched: number;
  /** Уникальных машин после дедупа по Id. */
  unique: number;
  /** Строк записано в cars_seen. */
  written: number;
  dry: boolean;
}

/**
 * Одна страница листинга. Сначала напрямую, при сбое — через прокси на Render
 * (он холодно стартует, отсюда 40 секунд против 15). Пустой массив означает
 * «эта страница не отдалась»; обход от этого не прекращается.
 */
async function fetchPage(
  offset: number,
  size: number
): Promise<{ rows: unknown[]; failed: boolean }> {
  const sr = `%7CModifiedDate%7C${offset}%7C${size}`;
  const q = encodeURIComponent(QUERY);
  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/premium?count=true&q=${q}&sr=${sr}`,
      { headers: { "user-agent": ENCAR_UA }, signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) throw new Error(`encar ${res.status}`);
    const json = await res.json();
    return { rows: json?.SearchResults ?? [], failed: false };
  } catch (e) {
    console.warn(
      `[carsSync] offset ${offset}: Encar не ответил (${(e as Error)?.message}), пробую прокси`
    );
    // try/catch ВОКРУГ ФОЛБЭКА ТОЖЕ — правило обращений к Encar.
    try {
      const res = await fetch(
        `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${q}&sr=%7CModifiedDate%7C${offset}%7C${PROXY_PAGE}`,
        { signal: AbortSignal.timeout(40_000) }
      );
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      const json = await res.json();
      return { rows: json?.SearchResults ?? [], failed: false };
    } catch (e2) {
      console.error(
        `[carsSync] offset ${offset}: и прокси тоже (${(e2 as Error)?.message}) — пропускаю`
      );
      return { rows: [], failed: true };
    }
  }
}

/**
 * Обойти верхушку листинга и записать снимки в cars_seen. Идемпотентно: upsert
 * по encar_id, first_seen_at на конфликте не перезаписывается и остаётся честным
 * lastmod'ом сайтмапа.
 */
export async function syncCarsFromListing({
  limit,
  delayMs = 300,
  dry = false,
}: {
  limit: number;
  delayMs?: number;
  dry?: boolean;
}): Promise<CarsSyncResult> {
  // Порядок выдачи Encar нестабилен — сортировка по ModifiedDate пересобирается
  // при каждом переподнятии объявления, поэтому страницы частично
  // перекрываются. Дедуп по Id обязателен, иначе часть upsert'ов холостая.
  const byId = new Map<string, CarSnapshot>();
  let fetched = 0;
  let pages = 0;
  let failedPages = 0;

  let offset = 0;
  while (offset < limit && pages < MAX_REQUESTS) {
    const { rows, failed } = await fetchPage(offset, Math.min(PAGE, limit - offset));
    pages += 1;
    if (failed) failedPages += 1;
    fetched += rows.length;
    for (const row of rows) {
      const snap = snapshotFromListing(row);
      if (snap) byId.set(snap.encar_id, snap);
    }
    // Пустая страница при живом апстриме — конец выдачи, дальше идти незачем.
    // Упавшую страницу за конец НЕ принимаем: это сбой, а не край пула, но и
    // продвинуться по ней нельзя — шагаем на PAGE, чтобы не топтаться на месте.
    if (rows.length === 0) {
      if (!failed) break;
      offset += PAGE;
    } else {
      offset += rows.length;
    }
    if (offset < limit) await sleep(delayMs);
  }

  const snapshots = [...byId.values()];
  if (dry) {
    return {
      ok: failedPages < pages,
      pages,
      failedPages,
      fetched,
      unique: snapshots.length,
      written: 0,
      dry: true,
    };
  }

  let written = 0;
  for (let i = 0; i < snapshots.length; i += UPSERT_CHUNK) {
    written += await saveCarSnapshots(snapshots.slice(i, i + UPSERT_CHUNK));
  }

  // ok: false, когда не отдалась НИ ОДНА страница либо запись не прошла целиком.
  // Раннер крона разводит это кодом возврата 2 — иначе в истории прогонов был бы
  // ровный ряд зелёных галочек над пустеющей таблицей.
  return {
    ok: snapshots.length > 0 && written > 0,
    pages,
    failedPages,
    fetched,
    unique: snapshots.length,
    written,
    dry: false,
  };
}
