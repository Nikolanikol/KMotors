// Паузы и повторы при ограничении частоты (429/503) — общее для обхода листинга
// (carsSync.ts) и проверки живости (carsLiveness.ts).
//
// ⚠️ Зачем. Первый боевой запуск задачи `cars` 27.11.2026 дал `proxy 429` на всех
// страницах начиная со 160-й записи: Render-прокси ограничивает частоту (его же дёргает
// и сам сайт), а обход шёл без пауз и без повторов и просто «пропускал» каждую упавшую
// страницу. Проверка живости при том же 429 объявляла «блокировку» и прекращала работу
// на второй машине из 1 000. 429 — это «подождите», а не «вас заблокировали».
//
// Модуль без сети и без часов: время и сон передаются снаружи, поэтому ведёт себя
// одинаково в тесте и на проде.

/** Сколько раз повторяем запрос, который уткнулся в ограничение частоты. */
export const RATE_LIMIT_RETRIES = 3;
/** Первая пауза и потолок паузы, мс (2 → 4 → 8 с, не дольше 15 с). */
export const BACKOFF_BASE_MS = 2_000;
export const BACKOFF_CAP_MS = 15_000;
/** Меньше этого не ждём, даже если сервер написал `Retry-After: 0`. */
const BACKOFF_FLOOR_MS = 500;

/** Статусы, после которых имеет смысл подождать и повторить. */
export function isRateLimited(status: number): boolean {
  return status === 429 || status === 503;
}

/**
 * Пауза перед повтором. Если сервер прислал `Retry-After` (секунды или HTTP-дата) —
 * слушаем его, но не дольше потолка; иначе экспоненциально от BACKOFF_BASE_MS.
 */
export function backoffMs(attempt: number, retryAfter?: string | null, now: number = Date.now()): number {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempt));
  if (retryAfter) {
    const raw = retryAfter.trim();
    const seconds = /^\d+$/.test(raw) ? Number(raw) * 1000 : Date.parse(raw) - now;
    if (Number.isFinite(seconds)) {
      return Math.min(BACKOFF_CAP_MS, Math.max(BACKOFF_FLOOR_MS, seconds));
    }
  }
  return exp;
}

export interface BackoffDeps {
  sleep: (ms: number) => Promise<void>;
  /** Вызывается перед каждой паузой — для лога. */
  onRetry?: (info: { attempt: number; status: number; waitMs: number }) => void;
}

/**
 * Выполнить запрос; на 429/503 подождать и повторить (до `retries` раз). Возвращает
 * последний ответ — даже если он по-прежнему 429, решать вызывающему. Сетевой сбой
 * (исключение fetch) НЕ повторяется: он означает «источник недоступен», а не «подождите».
 */
export async function fetchWithBackoff(
  doFetch: () => Promise<Response>,
  { sleep, onRetry }: BackoffDeps,
  retries: number = RATE_LIMIT_RETRIES
): Promise<{ res: Response; retries: number }> {
  let used = 0;
  for (let attempt = 0; ; attempt++) {
    const res = await doFetch();
    if (!isRateLimited(res.status) || attempt >= retries) return { res, retries: used };
    const waitMs = backoffMs(attempt, res.headers.get("retry-after"));
    onRetry?.({ attempt: attempt + 1, status: res.status, waitMs });
    used += 1;
    await sleep(waitMs);
  }
}
