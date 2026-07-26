"use server";

const isCarNoQuery = (query: string) => query.includes("Simple.keyword");

const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

// Без таймаута зависший апстрим держит рендер страницы до упора.
const PRIMARY_TIMEOUT_MS = 8000;
// Прокси на free-tier Render: холодный старт занимает десятки секунд.
const FALLBACK_TIMEOUT_MS = 20000;

export interface CarsResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  count: number;
  /** true — ни один источник не ответил. Отличает сбой от «ничего не найдено». */
  failed: boolean;
}

const EMPTY: CarsResult = { data: [], count: 0, failed: false };
const FAILED: CarsResult = { data: [], count: 0, failed: true };

function normalize(payload: unknown): CarsResult {
  const body = (payload ?? {}) as { SearchResults?: unknown; Count?: unknown };
  return {
    data: Array.isArray(body.SearchResults) ? body.SearchResults : [],
    count: typeof body.Count === "number" ? body.Count : 0,
    failed: false,
  };
}

async function fetchJson(
  url: string,
  init: { cache: RequestCache; timeoutMs: number; headers?: Record<string, string> }
) {
  const res = await fetch(url, {
    cache: init.cache,
    headers: init.headers,
    signal: AbortSignal.timeout(init.timeoutMs),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Список авто с Encar. Никогда не бросает исключение: при недоступности обоих
 * источников возвращает пустой результат с failed=true, чтобы страница каталога
 * оставалась живой и рендерила понятное сообщение вместо error boundary.
 */
export async function getCars(
  query: string,
  offset: string = "0",
  limit: number = 20
): Promise<CarsResult> {
  const cache: RequestCache = isCarNoQuery(query) ? "no-store" : "force-cache";
  const sr = `%7CModifiedDate%7C${offset}%7C${limit}`;

  try {
    return normalize(
      await fetchJson(
        `https://api.encar.com/search/car/list/premium?count=true&q=${query}&sr=${sr}`,
        { cache, timeoutMs: PRIMARY_TIMEOUT_MS, headers: { "user-agent": ENCAR_UA } }
      )
    );
  } catch (primaryError) {
    // 404 от Encar = невалидный query (например, мусор в ?action=), а не сбой сети.
    // Прокси на таком запросе тоже вернёт ошибку — не тратим второй раунд-трип.
    if ((primaryError as { status?: number }).status === 404) return EMPTY;

    try {
      return normalize(
        await fetchJson(
          `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${query}&sr=${sr}`,
          { cache, timeoutMs: FALLBACK_TIMEOUT_MS }
        )
      );
    } catch (fallbackError) {
      console.error("[getCars] оба источника недоступны", {
        query,
        offset,
        limit,
        primary: (primaryError as Error)?.message,
        fallback: (fallbackError as Error)?.message,
      });
      return FAILED;
    }
  }
}
