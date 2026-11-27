// Проверка живости: связка «окно сайтмапа → проверка → запись в cars_seen».
// Решение «продана» принимает carsLiveness.ts; здесь только данные туда и результат обратно.
//
// Ротация проверок обходится БЕЗ новой колонки: роль «когда проверяли» играет
// last_seen_at — его двигают проход листинга, рендер карточки и эта проверка (ответ 200
// = «подтвердили живой»). Самые давно не подтверждённые идут первыми. Отдельная колонка
// checked_at была бы точнее (проверка и «видели в листинге» развелись бы), но не нужна:
// и то и другое — доказательство, что машина жива. Готовый SQL — в docs/core-cars-data.md.

import { createServerClient } from "@/lib/supabase";
import { getSitemapWindow } from "@/lib/catalogSitemapDb";
import {
  LIVENESS_DEFAULT_LIMIT,
  LIVENESS_MAX_LIMIT,
  pickStaleCandidates,
  probeVehicle,
  runLivenessProbe,
  type AbortReason,
  type LivenessOutcome,
  type ProbeMode,
} from "@/lib/carsLiveness";

/** Сколько id в одном UPDATE ... IN (...): длина URL PostgREST ограничена. */
const WRITE_CHUNK = 100;
/** В пробном (?dry=1) запуске проверяем не больше стольких — запросы к Encar настоящие. */
const DRY_LIMIT = 30;

export interface LivenessReport {
  /** false — аномалия проверки (в лог раннера попадёт "ok":false). */
  ok: boolean;
  skipped?: "disabled" | "no_candidates" | "no_window";
  aborted?: AbortReason | "db";
  mode?: ProbeMode | null;
  /** Машин в окне сайтмапа и сколько из них ждут проверки. */
  windowSize?: number;
  candidates?: number;
  probed?: number;
  alive?: number;
  sold?: number;
  unknown?: number;
  soldUnconfirmed?: number;
  stoppedByBudget?: boolean;
  dry?: boolean;
}

/** Параметр ?check= → число проверок. Не число и отрицательное — по умолчанию; 0 — выключено. */
export function parseCheckLimit(raw: string | null): number {
  if (raw === null || raw.trim() === "") return LIVENESS_DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return LIVENESS_DEFAULT_LIMIT;
  return Math.min(Math.trunc(n), LIVENESS_MAX_LIMIT);
}

async function updateInChunks(
  ids: string[],
  patch: Record<string, string>,
  label: string
): Promise<number> {
  let done = 0;
  for (let i = 0; i < ids.length; i += WRITE_CHUNK) {
    const chunk = ids.slice(i, i + WRITE_CHUNK);
    // .is("sold_at", null): проверка не должна воскрешать/перезаписывать уже
    // помеченное, а отметка «продана» — повторно менять дату.
    const { error } = await createServerClient()
      .from("cars_seen")
      .update(patch)
      .in("encar_id", chunk)
      .is("sold_at", null);
    if (error) {
      console.error(`[carsLiveness] ${label}: запись не прошла:`, error.message);
      continue;
    }
    done += chunk.length;
  }
  return done;
}

/**
 * Записать решение. Вызывается ТОЛЬКО когда запуск не прерван: у прерванного
 * outcome.alive и outcome.sold пусты, так что случайно записать нечего.
 */
export async function applyLivenessOutcome(
  outcome: LivenessOutcome,
  nowIso = new Date().toISOString()
): Promise<{ alive: number; sold: number }> {
  if (outcome.aborted) return { alive: 0, sold: 0 };
  const sold = await updateInChunks(outcome.sold, { sold_at: nowIso }, "продана");
  const alive = await updateInChunks(outcome.alive, { last_seen_at: nowIso }, "жива");
  return { alive, sold };
}

/**
 * Суточная проверка живости окна сайтмапа. Не бросает.
 * `canaryIds` — машины из свежего листинга этого же запуска (заведомо живые).
 */
export async function checkLiveCars({
  limit,
  dry,
  canaryIds,
}: {
  limit: number;
  dry: boolean;
  canaryIds: string[];
}): Promise<LivenessReport> {
  if (limit <= 0) return { ok: true, skipped: "disabled" };
  const effective = dry ? Math.min(limit, DRY_LIMIT) : limit;

  try {
    const now = Date.now();
    const win = await getSitemapWindow(now);
    if (!win) return { ok: false, skipped: "no_window", aborted: "db" };

    const candidates = pickStaleCandidates(win.cars, { limit: effective, now });
    const base = { windowSize: win.cars.length, candidates: candidates.length, dry };
    if (candidates.length === 0) return { ok: true, skipped: "no_candidates", ...base };

    // Канарейки: свежий листинг; нет его (листинг упал) — самая недавно подтверждённая
    // машина окна. Её мы только что не проверяли, но подтверждение свежее двух суток.
    const fallbackCanary = [...win.cars]
      .filter((c) => c.last_seen_at)
      .sort((a, b) => Date.parse(String(b.last_seen_at)) - Date.parse(String(a.last_seen_at)))
      .slice(0, 2)
      .map((c) => c.encar_id);
    const canaries = [...canaryIds, ...fallbackCanary].filter(
      (id, i, arr) => !candidates.includes(id) && arr.indexOf(id) === i
    );

    const outcome = await runLivenessProbe(
      { probe: probeVehicle, sleep: (ms) => new Promise((r) => setTimeout(r, ms)), now: Date.now },
      { candidates, canaryIds: canaries }
    );

    let written = { alive: 0, sold: 0 };
    if (!dry) written = await applyLivenessOutcome(outcome);

    return {
      ok: outcome.ok,
      ...(outcome.aborted ? { aborted: outcome.aborted } : {}),
      ...base,
      mode: outcome.mode,
      probed: outcome.probed,
      // В dry — сколько БЫЛО БЫ записано, в бою — сколько реально записано.
      alive: dry ? outcome.alive.length : written.alive,
      sold: dry ? outcome.sold.length : written.sold,
      unknown: outcome.unknown,
      soldUnconfirmed: outcome.soldUnconfirmed,
      stoppedByBudget: outcome.stoppedByBudget,
    };
  } catch (e) {
    console.error("[carsLiveness] проверка упала:", (e as Error)?.message);
    return { ok: false, aborted: "db", dry };
  }
}
