// Лёгкая проверка «жива ли машина» для middleware: один GET к Encar, вердикт в памяти.
// Нужна ради HTTP-статуса проданной карточки (подробно — vehicleStatus.ts).
//
// ⚠️ Правила те же, что у всех обращений к Encar: НИКОГДА не бросает, любая авария —
// вердикт `unknown` (страница отдаст свой статус, как раньше), страница блокировки
// Encar (404 + HTML) — тоже `unknown`, а не «продана».
//
// ⚠️ Кеш — только память процесса: в middleware нет кеша данных Next, а ходить за
// ним по сети к самим себе дороже, чем сходить в Encar. Поэтому TTL ограничивает
// лишнюю нагрузку на Encar: одна машина — не чаще одного пробного запроса за TTL.
// `unknown` кешируется коротко, чтобы авария Encar не превращала каждый заход в
// ожидание таймаута.

import { classifyVehicleResponse, type VehicleVerdict } from "@/lib/vehicleStatus";

/** Без мобильного UA Encar отвечает 404 с HTML-блокировкой (см. vehicleRecord.ts). */
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

/** Дольше не ждём: страница сама подождёт до 8 с, а пробе это не нужно. */
export const PROBE_TIMEOUT_MS = 1500;
export const VERDICT_TTL_MS = 30 * 60 * 1000;
export const UNKNOWN_TTL_MS = 30 * 1000;
export const CACHE_MAX = 3000;

type Entry = { verdict: VehicleVerdict; expires: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<VehicleVerdict>>();

/** Только для тестов. */
export function resetVehicleProbe(): void {
  cache.clear();
  inflight.clear();
}

type FetchLike = (url: string, init: { headers: Record<string, string>; signal: AbortSignal; cache: "no-store" }) => Promise<{
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

async function probeOnce(id: string, fetchImpl: FetchLike): Promise<VehicleVerdict> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      headers: { "user-agent": ENCAR_UA },
      signal: ctrl.signal,
      cache: "no-store",
    });
    const body = await res.text();
    return classifyVehicleResponse({ status: res.status, contentType: res.headers.get("content-type"), body });
  } catch (e) {
    console.warn(`[vehicleProbe] ${id}: ${(e as Error)?.name ?? "error"} — вердикт unknown`);
    return "unknown";
  } finally {
    clearTimeout(timer);
  }
}

export async function probeVehicle(
  id: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  now: () => number = Date.now,
): Promise<VehicleVerdict> {
  const hit = cache.get(id);
  if (hit && hit.expires > now()) return hit.verdict;

  // Несколько одновременных заходов на одну машину (краулер + человек) — один запрос.
  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = probeOnce(id, fetchImpl)
    .then((verdict) => {
      if (cache.size >= CACHE_MAX) {
        // Map помнит порядок вставки: выкидываем самую старую десятую часть.
        let drop = Math.ceil(CACHE_MAX / 10);
        for (const key of cache.keys()) {
          if (drop-- <= 0) break;
          cache.delete(key);
        }
      }
      cache.set(id, { verdict, expires: now() + (verdict === "unknown" ? UNKNOWN_TTL_MS : VERDICT_TTL_MS) });
      return verdict;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, promise);
  return promise;
}
