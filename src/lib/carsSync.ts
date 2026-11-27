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
import { fetchWithBackoff } from "@/lib/encarBackoff";

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
// Запросов хватает на limit через прокси (20 строк за раз) с запасом на сбои; потолок
// запросов считается от limit, а не зашит: при 3 000 машин и прокси нужно 150 запросов,
// а старые 40 молча обрезали бы обход на 800 строках.
const requestCap = (limit: number) => Math.ceil(limit / PROXY_PAGE) + 10;
/**
 * Бюджет времени на листинг, мс. Задача `cars` в Coolify живёт по умолчанию 300 с, и ей
 * ещё делить время с проверкой живости (carsLiveness.ts). Через прокси (~2 с на 20 строк)
 * за бюджет набирается ~900 машин, напрямую (200 строк за ~0,2 с) — весь limit за секунды.
 * Не уложились — запишем, что успели; остаток возьмёт следующий запуск.
 */
export const LISTING_BUDGET_MS = 150_000;
/**
 * Пауза между страницами, когда обход идёт через прокси, мс. Прокси на Render ограничивает
 * частоту (его же дёргает сайт): при 300 мс запуск 27.11.2026 получил `proxy 429` на всех
 * страницах со 160-й записи. ~1 с между страницами по 20 строк — с запасом в рамках лимита.
 */
export const PROXY_DELAY_MS = 1_000;
/** Прямой Encar «мёртв» — но раз в столько запросов пробуем его снова: вдруг ожил. */
const DIRECT_RETRY_EVERY = 25;
/** Прямой Encar не ответил столько раз подряд — до конца запуска идём только через прокси. */
const DIRECT_DEAD_AFTER = 2;
// PostgREST на bulk-upsert'е требует одинакового набора ключей внутри запроса.
// Строки здесь все из листинга, то есть набор уже однородный; чанк нужен лишь
// чтобы не отправлять двухтысячный массив одним телом.
const UPSERT_CHUNK = 500;
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface CarsSyncResult {
  ok: boolean;
  /** Сколько запросов к Encar сделали. */
  pages: number;
  /** Сколько запросов не отдали ничего ни напрямую, ни через прокси. */
  failedPages: number;
  /** Сколько раз подождали и повторили запрос после 429/503 (ограничение частоты прокси). */
  retries: number;
  /** Строк получено всего, с дублями между страницами. */
  fetched: number;
  /** Уникальных машин после дедупа по Id. */
  unique: number;
  /** Строк записано в cars_seen. */
  written: number;
  dry: boolean;
  /** Не дошли до limit из-за бюджета времени. */
  stoppedByBudget: boolean;
  /**
   * Несколько id из САМОГО НАЧАЛА свежей выдачи — заведомо живые прямо сейчас.
   * Проверка живости использует их как канарейку (carsLiveness.ts).
   */
  sampleIds: string[];
}

/**
 * Одна страница листинга. Сначала напрямую, при сбое — через прокси на Render
 * (он холодно стартует, отсюда 40 секунд против 15). Пустой массив означает
 * «эта страница не отдалась»; обход от этого не прекращается.
 *
 * ⚠️ 429/503 от прокси — «подождите», а не «страницы нет»: ждём по Retry-After (или
 * 2→4→8 с) и повторяем ТУ ЖЕ страницу, прежде чем объявить её упавшей.
 */
async function fetchPage(
  offset: number,
  size: number,
  skipDirect = false
): Promise<{ rows: unknown[]; failed: boolean; directFailed: boolean; retries: number }> {
  const sr = `%7CModifiedDate%7C${offset}%7C${size}`;
  const q = encodeURIComponent(QUERY);
  let directFailed = false;
  let retries = 0;
  try {
    if (skipDirect) throw new Error("прямой Encar пропущен: не отвечал в этом запуске");
    const res = await fetch(
      `https://api.encar.com/search/car/list/premium?count=true&q=${q}&sr=${sr}`,
      { headers: { "user-agent": ENCAR_UA }, signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) throw new Error(`encar ${res.status}`);
    const json = await res.json();
    return { rows: json?.SearchResults ?? [], failed: false, directFailed, retries };
  } catch (e) {
    directFailed = !skipDirect;
    if (!skipDirect) {
      console.warn(
        `[carsSync] offset ${offset}: Encar не ответил (${(e as Error)?.message}), пробую прокси`
      );
    }
    // try/catch ВОКРУГ ФОЛБЭКА ТОЖЕ — правило обращений к Encar.
    try {
      const out = await fetchWithBackoff(
        () =>
          fetch(
            `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${q}&sr=%7CModifiedDate%7C${offset}%7C${PROXY_PAGE}`,
            { signal: AbortSignal.timeout(40_000) }
          ),
        {
          sleep,
          onRetry: ({ attempt, status, waitMs }) =>
            console.warn(
              `[carsSync] offset ${offset}: прокси ${status}, повтор ${attempt} через ${Math.round(waitMs / 100) / 10} с`
            ),
        }
      );
      retries = out.retries;
      if (!out.res.ok) throw new Error(`proxy ${out.res.status}`);
      const json = await out.res.json();
      return { rows: json?.SearchResults ?? [], failed: false, directFailed, retries };
    } catch (e2) {
      console.error(
        `[carsSync] offset ${offset}: и прокси тоже (${(e2 as Error)?.message}) — пропускаю`
      );
      return { rows: [], failed: true, directFailed, retries };
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
  budgetMs = LISTING_BUDGET_MS,
}: {
  limit: number;
  delayMs?: number;
  dry?: boolean;
  budgetMs?: number;
}): Promise<CarsSyncResult> {
  // Порядок выдачи Encar нестабилен — сортировка по ModifiedDate пересобирается
  // при каждом переподнятии объявления, поэтому страницы частично
  // перекрываются. Дедуп по Id обязателен, иначе часть upsert'ов холостая.
  const byId = new Map<string, CarSnapshot>();
  let fetched = 0;
  let pages = 0;
  let failedPages = 0;
  let retries = 0;

  const started = Date.now();
  const maxRequests = requestCap(limit);
  let stoppedByBudget = false;
  let directFails = 0;
  let sampleIds: string[] = [];

  let offset = 0;
  while (offset < limit && pages < maxRequests) {
    if (Date.now() - started >= budgetMs) {
      stoppedByBudget = true;
      break;
    }
    // Прямой путь признан мёртвым — идём прокси, но раз в DIRECT_RETRY_EVERY запросов
    // пробуем прямой снова (одна неудача не должна отключать его до конца запуска).
    const directDead = directFails >= DIRECT_DEAD_AFTER && pages % DIRECT_RETRY_EVERY !== 0;
    const { rows, failed, directFailed, retries: pageRetries } = await fetchPage(
      offset,
      Math.min(PAGE, limit - offset),
      directDead
    );
    retries += pageRetries;
    if (directFailed) directFails += 1;
    else if (!failed && !directDead) directFails = 0;
    pages += 1;
    if (failed) failedPages += 1;
    fetched += rows.length;
    for (const row of rows) {
      const snap = snapshotFromListing(row);
      if (snap) byId.set(snap.encar_id, snap);
    }
    if (sampleIds.length === 0 && byId.size > 0) sampleIds = [...byId.keys()].slice(0, 3);
    // Пустая страница при живом апстриме — конец выдачи, дальше идти незачем.
    // Упавшую страницу за конец НЕ принимаем: это сбой, а не край пула, но и
    // продвинуться по ней нельзя — шагаем на PAGE, чтобы не топтаться на месте.
    // Шаг при сбое — размер страницы ТОГО пути, которым шли: через прокси это 20, а не 200.
    // Прежний `+= PAGE` терял 180 записей на каждой упавшей прокси-странице.
    if (rows.length === 0) {
      if (!failed) break;
      offset += directDead || directFailed ? PROXY_PAGE : PAGE;
    } else {
      offset += rows.length;
    }
    // Через прокси темп ниже: он ограничивает частоту (PROXY_DELAY_MS).
    if (offset < limit) await sleep(directDead || directFailed ? Math.max(delayMs, PROXY_DELAY_MS) : delayMs);
  }

  const snapshots = [...byId.values()];
  if (dry) {
    return {
      ok: failedPages < pages,
      pages,
      failedPages,
      retries,
      fetched,
      unique: snapshots.length,
      written: 0,
      dry: true,
      stoppedByBudget,
      sampleIds,
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
    retries,
    fetched,
    unique: snapshots.length,
    written,
    dry: false,
    stoppedByBudget,
    sampleIds,
  };
}
