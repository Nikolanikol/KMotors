// Проверка живости машин из сайтмапа: сеть и решение «жива / продана». Запись в базу —
// carsLivenessDb.ts, здесь её нет, поэтому решение проверяется vitest'ом на заготовленных
// ответах Encar (tests/catalog/carsLiveness.spec.ts).
//
// ─── Зачем ────────────────────────────────────────────────────────────────────
// Раньше машину помечал проданной только тот, кто открыл её карточку (markCarSold).
// Карта выросла с 5 000 до 20 000 машин, обходит её Google медленно — и без проверки
// она копила бы проданные. Часть суточного запуска `cars` берёт самые давно не
// подтверждённые машины ИЗ ОКНА САЙТМАПА и спрашивает Encar напрямую.
//
// ─── Что считается «продана» — и больше ничего ───────────────────────────────
// ТОЛЬКО строгий подтверждённый 404 от /v1/readside/vehicle/{id}:
//   • статус 404; тело пустое (так отвечает api.encar.com — замер 27.11.2026) либо
//     JSON «vehicle not found» (так отвечает наш прокси на Render);
//   • это не страница блокировки (isEncarBlockPage: HTML или has_been_cr_blocked —
//     13.11 такая блокировка сутки метила живые машины проданными, docs/postmortems.md);
//   • тот же ответ пришёл ВТОРОЙ раз, отдельным запросом, в том же запуске;
//   • канарейка (машина, заведомо живая по свежему листингу) в начале И в конце
//     запуска ответила 200 с тем же способом доступа. Не ответила — Encar или наш IP
//     в этот момент нездоровы, и ни один 404 из запуска верить нельзя.
// Отсутствие машины в листинге продажей НЕ считается (carsSync.ts, шапка).
//
// ─── Консервативность ────────────────────────────────────────────────────────
// Блокировка, 403/429, серия сбоев подряд, доля сбоев > 20% — запуск ПРЕКРАЩАЕТСЯ и
// не помечает ничего: ни проданных, ни живых. Сбой одиночной машины (5xx, таймаут,
// странное тело) — это «неизвестно»: её не трогаем, проверим в следующий раз.
//
// Модуль не бросает исключений наружу из probe/классификации; оркестратор их тоже
// не бросает (ошибка в зависимости = прекращение запуска).

import { isEncarBlockPage } from "@/lib/vehicle";
import { RATE_LIMIT_RETRIES, backoffMs } from "@/lib/encarBackoff";

/** Проверок живости за суточный запуск по умолчанию. */
export const LIVENESS_DEFAULT_LIMIT = 1_000;
/** Жёсткий потолок параметра ?check=. */
export const LIVENESS_MAX_LIMIT = 3_000;
/**
 * Бюджет времени на ПЕРВЫЙ проход, мс. Задача `cars` в Coolify по умолчанию живёт 300 с,
 * а листинг берёт до 90 с: 90 + загрузка окна ~10 + 110 + подтверждение до 40 + запись
 * ≈ 260 с. Упёрлись во время — просто проверили меньше, остаток в следующий раз.
 */
export const LIVENESS_BUDGET_MS = 110_000;
/** Дополнительное время на повторное подтверждение 404, мс. */
export const LIVENESS_CONFIRM_GRACE_MS = 40_000;
/** Параллельных запросов к Encar и пауза каждого воркера между запросами. */
export const LIVENESS_CONCURRENCY = 2;
export const LIVENESS_PAUSE_MS = 200;
/**
 * Через прокси Render темп ниже: он ограничивает частоту (запуск 27.11.2026 получил 429 на
 * второй же проверке). Один воркер и ~1,2 с между запросами — за бюджет это ~90 проверок
 * вместо 1 000 напрямую, зато без 429. Напрямую значения прежние.
 */
export const LIVENESS_PROXY_CONCURRENCY = 1;
export const LIVENESS_PROXY_PAUSE_MS = 1_200;
/** После первого 429 пауза между запросами умножается на это (адаптивное замедление). */
const SLOWDOWN_FACTOR = 3;
/** Машину, подтверждённую свежее этого срока, снова не проверяем. */
export const LIVENESS_MIN_AGE_MS = 2 * 86_400_000;

/** Подряд столько «неизвестно» — прекращаем. */
const MAX_UNKNOWN_STREAK = 6;
/** Доля «неизвестно» выше этого при выборке от MIN_SAMPLE — прекращаем. */
const MAX_UNKNOWN_RATIO = 0.2;
const RATIO_MIN_SAMPLE = 50;
const MAX_CANARIES = 3;

const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const PRIMARY_TIMEOUT_MS = 8_000;
const PROXY_TIMEOUT_MS = 20_000;

export type ProbeMode = "direct" | "proxy";
export type Verdict = "alive" | "sold" | "blocked" | "limited" | "unknown";
export type AbortReason =
  | "no_canary"
  | "blocked"
  | "rate_limited"
  | "unstable"
  | "canary_lost"
  | "error";

/** Сырой ответ Encar: либо HTTP-ответ, либо сетевой сбой. */
export type ProbeResult =
  | { kind: "response"; status: number; contentType: string; body: string; retryAfter?: string | null }
  | { kind: "network"; error: string };

/**
 * Что значит один ответ Encar. Единственное место, где решается «продана».
 * `blocked` останавливает запуск целиком, `unknown` оставляет машину как есть.
 */
export function classifyProbe(p: ProbeResult): Verdict {
  if (p.kind === "network") return "unknown";
  const { status, contentType, body } = p;

  // Явная страница блокировки Encar — блокировка при ЛЮБОМ статусе, в том числе 429.
  if (body.includes("has_been_cr_blocked")) return "blocked";
  // ⚠️ 429 без метки блокировки — «слишком часто», а не «вас заблокировали»: прокси на
  // Render ограничивает частоту. Раньше 429 шёл в «blocked» и запуск прекращался на второй
  // машине (боевой запуск 27.11.2026). Теперь это отдельный вердикт: оркестратор ждёт и
  // повторяет, и прекращает запуск, только если ограничение не отпускает. 503 сюда НЕ
  // входит: это «неизвестно» (серия 503 прекращает запуск как нестабильность).
  if (status === 429) return "limited";
  // Страница блокировки — HTML с любым статусом (чаще всего 404, и именно поэтому
  // она опаснее всего).
  const asResponse = new Response(body.length > 0 ? body : null, {
    headers: { "content-type": contentType },
  });
  if (isEncarBlockPage(asResponse, body)) return "blocked";
  // 403 — нас режут: это про нас, а не про машину.
  if (status === 403) return "blocked";

  if (status === 200) {
    try {
      const json = JSON.parse(body);
      // `category` есть у каждой настоящей карточки (марка/модель/год); пустой или
      // странный JSON живой машиной не считаем.
      if (json && typeof json === "object" && "category" in json) return "alive";
    } catch {
      // не JSON — не доказательство
    }
    return "unknown";
  }

  if (status === 404) {
    if (body.trim() === "") return "sold";
    if (contentType.includes("json") && /vehicle not found/i.test(body)) return "sold";
    return "unknown";
  }

  return "unknown";
}

/** Один запрос к Encar. Не бросает: сбой возвращается значением. */
export async function probeVehicle(mode: ProbeMode, id: string): Promise<ProbeResult> {
  const url =
    mode === "direct"
      ? `https://api.encar.com/v1/readside/vehicle/${id}`
      : `https://encar-proxy-main.onrender.com/api/vehicle/${id}`;
  try {
    const res = await fetch(url, {
      headers: mode === "direct" ? { "user-agent": ENCAR_UA } : undefined,
      signal: AbortSignal.timeout(mode === "direct" ? PRIMARY_TIMEOUT_MS : PROXY_TIMEOUT_MS),
      cache: "no-store",
    });
    return {
      kind: "response",
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      body: await res.text(),
      retryAfter: res.headers.get("retry-after"),
    };
  } catch (e) {
    return { kind: "network", error: (e as Error)?.message ?? String(e) };
  }
}

/** Строка окна сайтмапа в том виде, в каком её отдаёт catalogSitemapDb. */
export interface StaleRow {
  encar_id: string;
  last_seen_at?: string | null;
}

/**
 * Самые давно не подтверждённые из окна. Подтверждённые менее `minAgeMs` назад не
 * берём — проверять там нечего. Строка без даты — самая старая (её никто не подтверждал).
 */
export function pickStaleCandidates(
  rows: StaleRow[],
  { limit, now, minAgeMs = LIVENESS_MIN_AGE_MS }: { limit: number; now: number; minAgeMs?: number }
): string[] {
  const edge = now - minAgeMs;
  const ts = (r: StaleRow) => {
    const t = r.last_seen_at ? Date.parse(r.last_seen_at) : 0;
    return Number.isFinite(t) ? t : 0;
  };
  return rows
    .filter((r) => ts(r) <= edge)
    .sort((a, b) => ts(a) - ts(b) || (a.encar_id < b.encar_id ? -1 : a.encar_id > b.encar_id ? 1 : 0))
    .slice(0, Math.max(0, limit))
    .map((r) => r.encar_id);
}

export interface LivenessDeps {
  probe: (mode: ProbeMode, id: string) => Promise<ProbeResult>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

export interface LivenessInput {
  /** id для проверки, самые давно не подтверждённые первыми. */
  candidates: string[];
  /** Заведомо живые (из свежего листинга) — по ним проверяется, что способ доступа исправен. */
  canaryIds: string[];
  budgetMs?: number;
  graceMs?: number;
  concurrency?: number;
  pauseMs?: number;
}

export interface LivenessOutcome {
  /** false — аномалия (нет канарейки, блокировка, нестабильность): в логе красное. */
  ok: boolean;
  aborted: AbortReason | null;
  mode: ProbeMode | null;
  /** Сколько запросов сделано на первом проходе. */
  probed: number;
  /** id, подтверждённые живыми. При aborted пусто. */
  alive: string[];
  /** id, подтверждённые проданными (строгий 404 дважды). При aborted пусто. */
  sold: string[];
  /** Сбои и странные ответы — машина не тронута. */
  unknown: number;
  /** Сколько раз подождали и повторили запрос после 429/503. */
  rateLimited: number;
  /** Первый 404 был, второй не подтвердил (или не хватило времени). */
  soldUnconfirmed: number;
  stoppedByBudget: boolean;
}

function emptyOutcome(over: Partial<LivenessOutcome>): LivenessOutcome {
  return {
    ok: true,
    aborted: null,
    mode: null,
    probed: 0,
    alive: [],
    sold: [],
    unknown: 0,
    rateLimited: 0,
    soldUnconfirmed: 0,
    stoppedByBudget: false,
    ...over,
  };
}

/** Пул воркеров: fn вернул false — воркер останавливается. */
async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<boolean>
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      if (!(await fn(items[i]))) return;
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
}

/**
 * Проверка живости. Ничего не пишет и не бросает: возвращает решение, а запись —
 * дело вызывающего (applyLivenessOutcome), и только если `aborted === null`.
 */
export async function runLivenessProbe(
  deps: LivenessDeps,
  input: LivenessInput
): Promise<LivenessOutcome> {
  const {
    candidates,
    canaryIds,
    budgetMs = LIVENESS_BUDGET_MS,
    graceMs = LIVENESS_CONFIRM_GRACE_MS,
  } = input;
  if (candidates.length === 0) return emptyOutcome({});

  // Счётчик повторов после 429/503 и признак «нас просят не частить» — общие на запуск.
  let rateLimited = 0;
  let slow = false;

  /**
   * Один запрос с ожиданием при 429/503: ждём по Retry-After (или 2→4→8 с) и повторяем ту же
   * машину. Вердикт `limited` возвращается, только если ограничение не отпустило за все повторы.
   */
  const probeBacked = async (
    m: ProbeMode,
    id: string
  ): Promise<{ r: ProbeResult; v: Verdict }> => {
    for (let attempt = 0; ; attempt++) {
      const r = await deps.probe(m, id);
      const v = classifyProbe(r);
      if (v !== "limited" || attempt >= RATE_LIMIT_RETRIES) return { r, v };
      rateLimited += 1;
      slow = true;
      await deps.sleep(backoffMs(attempt, r.kind === "response" ? r.retryAfter : null, deps.now()));
    }
  };

  try {
    // 1. Канарейка: выбираем способ доступа, которому можно верить.
    let mode: ProbeMode | null = null;
    let canary: string | null = null;
    let directDead = false;
    for (const id of canaryIds.slice(0, MAX_CANARIES)) {
      for (const m of ["direct", "proxy"] as const) {
        if (m === "direct" && directDead) continue;
        const { r, v } = await probeBacked(m, id);
        if (r.kind === "network" && m === "direct") directDead = true;
        if (v === "alive") {
          mode = m;
          canary = id;
          break;
        }
        await deps.sleep(input.pauseMs ?? LIVENESS_PAUSE_MS);
      }
      if (mode) break;
    }
    if (!mode || !canary) return emptyOutcome({ ok: false, aborted: "no_canary", rateLimited });
    const useMode: ProbeMode = mode;
    const useCanary: string = canary;

    // Темп зависит от способа доступа: прокси ограничивает частоту — один воркер и длиннее
    // пауза (если вызывающий не задал своё). После первого 429 пауза растёт ещё втрое.
    const concurrency =
      input.concurrency ?? (useMode === "proxy" ? LIVENESS_PROXY_CONCURRENCY : LIVENESS_CONCURRENCY);
    const basePause =
      input.pauseMs ?? (useMode === "proxy" ? LIVENESS_PROXY_PAUSE_MS : LIVENESS_PAUSE_MS);
    const pause = () => deps.sleep(Math.min(5_000, basePause * (slow ? SLOWDOWN_FACTOR : 1)));

    // 2. Первый проход.
    const started = deps.now();
    const verdicts = new Map<string, Verdict>();
    const state = { abort: null as AbortReason | null, probed: 0, unknown: 0, streak: 0, budget: false };
    await pool(candidates, concurrency, async (id) => {
      if (state.abort) return false;
      if (deps.now() - started >= budgetMs) {
        state.budget = true;
        return false;
      }
      const { v } = await probeBacked(useMode, id);
      state.probed += 1;
      if (v === "blocked") {
        state.abort = "blocked";
        return false;
      }
      // Ограничение не отпустило даже после повторов — это не про машину и не блокировка:
      // останавливаемся, ничего не помечая, и в следующий запуск начнём заново.
      if (v === "limited") {
        state.abort = "rate_limited";
        return false;
      }
      if (v === "unknown") {
        state.unknown += 1;
        state.streak += 1;
        if (
          state.streak >= MAX_UNKNOWN_STREAK ||
          (state.probed >= RATIO_MIN_SAMPLE && state.unknown / state.probed > MAX_UNKNOWN_RATIO)
        ) {
          state.abort = "unstable";
          return false;
        }
      } else {
        state.streak = 0;
        verdicts.set(id, v);
      }
      await pause();
      return true;
    });

    const base = {
      mode: useMode,
      probed: state.probed,
      unknown: state.unknown,
      rateLimited,
      stoppedByBudget: state.budget,
    };
    if (state.abort) return emptyOutcome({ ...base, ok: false, aborted: state.abort });

    // 3. Строгое подтверждение: каждому «404» — второй отдельный запрос.
    const firstSold = [...verdicts].filter(([, v]) => v === "sold").map(([id]) => id);
    const confirmed = new Set<string>();
    const confirmDeadline = started + budgetMs + graceMs;
    await pool(firstSold, concurrency, async (id) => {
      if (state.abort) return false;
      if (deps.now() >= confirmDeadline) return false;
      await pause();
      const { v } = await probeBacked(useMode, id);
      if (v === "blocked") {
        state.abort = "blocked";
        return false;
      }
      if (v === "limited") {
        state.abort = "rate_limited";
        return false;
      }
      if (v === "sold") confirmed.add(id);
      return true;
    });
    if (state.abort) return emptyOutcome({ ...base, rateLimited, ok: false, aborted: state.abort });

    // 4. Канарейка в конце: пока шёл запуск, способ доступа не сломался.
    if ((await probeBacked(useMode, useCanary)).v !== "alive") {
      return emptyOutcome({ ...base, rateLimited, ok: false, aborted: "canary_lost" });
    }

    return emptyOutcome({
      ...base,
      rateLimited,
      alive: [...verdicts].filter(([, v]) => v === "alive").map(([id]) => id),
      sold: firstSold.filter((id) => confirmed.has(id)),
      soldUnconfirmed: firstSold.length - confirmed.size,
    });
  } catch (e) {
    console.error("[carsLiveness] упало:", (e as Error)?.message);
    return emptyOutcome({ ok: false, aborted: "error", rateLimited });
  }
}
