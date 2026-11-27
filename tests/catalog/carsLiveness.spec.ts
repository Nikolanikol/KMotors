import { describe, expect, it } from "vitest";
import {
  classifyProbe,
  pickStaleCandidates,
  runLivenessProbe,
  type LivenessDeps,
  type ProbeMode,
  type ProbeResult,
} from "@/lib/carsLiveness";

const json = (status: number, body: unknown): ProbeResult => ({
  kind: "response",
  status,
  contentType: "application/json;charset=UTF-8",
  body: JSON.stringify(body),
});
const ALIVE = json(200, { category: { manufacturerName: "현대" }, manage: {} });
const SOLD_DIRECT: ProbeResult = { kind: "response", status: 404, contentType: "", body: "" };
const SOLD_PROXY = json(404, { error: "vehicle not found" });
const BLOCK_PAGE: ProbeResult = {
  kind: "response",
  status: 404,
  contentType: "text/html",
  body: '<html><meta http-equiv="refresh" content="0;url=/has_been_cr_blocked_AWS.html"></html>',
};
const SERVER_ERROR: ProbeResult = { kind: "response", status: 503, contentType: "text/plain", body: "oops" };
const TIMEOUT: ProbeResult = { kind: "network", error: "The operation was aborted due to timeout" };

describe("classifyProbe: решение «продана» только по строгому 404", () => {
  it("200 с карточкой — жива", () => {
    expect(classifyProbe(ALIVE)).toBe("alive");
  });
  it("404 с пустым телом (так отвечает api.encar.com) — продана", () => {
    expect(classifyProbe(SOLD_DIRECT)).toBe("sold");
  });
  it("404 «vehicle not found» от нашего прокси — продана", () => {
    expect(classifyProbe(SOLD_PROXY)).toBe("sold");
  });
  it("404-HTML со страницей блокировки — НЕ продана, а блокировка", () => {
    expect(classifyProbe(BLOCK_PAGE)).toBe("blocked");
  });
  it("404 с HTML без упоминания блокировки — тоже блокировка (любой text/html)", () => {
    expect(classifyProbe({ kind: "response", status: 404, contentType: "text/html", body: "<h1>Not Found</h1>" })).toBe("blocked");
  });
  it("200 с HTML-страницей блокировки — блокировка, а не «жива»", () => {
    expect(classifyProbe({ kind: "response", status: 200, contentType: "text/html", body: "has_been_cr_blocked" })).toBe("blocked");
  });
  it("403 и 429 — нас режут, это про нас, а не про машину", () => {
    expect(classifyProbe({ kind: "response", status: 403, contentType: "", body: "" })).toBe("blocked");
    expect(classifyProbe({ kind: "response", status: 429, contentType: "", body: "" })).toBe("blocked");
  });
  it("5xx и таймаут — «неизвестно», не продана", () => {
    expect(classifyProbe(SERVER_ERROR)).toBe("unknown");
    expect(classifyProbe(TIMEOUT)).toBe("unknown");
  });
  it("404 с чужим телом, 200 с кривым JSON — «неизвестно»", () => {
    expect(classifyProbe({ kind: "response", status: 404, contentType: "application/json", body: '{"error":"route missing"}' })).toBe("unknown");
    expect(classifyProbe({ kind: "response", status: 200, contentType: "application/json", body: "{}" })).toBe("unknown");
    expect(classifyProbe({ kind: "response", status: 200, contentType: "application/json", body: "not json" })).toBe("unknown");
  });
});

describe("pickStaleCandidates: ротация по давности подтверждения", () => {
  const now = Date.parse("2026-11-27T00:00:00Z");
  const row = (id: string, at: string | null) => ({ encar_id: id, last_seen_at: at });
  it("самые давно не подтверждённые первыми; свежее двух суток не берём; предел limit", () => {
    const rows = [
      row("40000003", "2026-11-26T12:00:00Z"), // вчера — пропуск
      row("40000002", "2026-11-10T00:00:00Z"),
      row("40000001", "2026-11-01T00:00:00Z"),
      row("40000004", null), // никто не подтверждал — самая старая
      row("40000005", "2026-11-20T00:00:00Z"),
    ];
    expect(pickStaleCandidates(rows, { limit: 3, now })).toEqual(["40000004", "40000001", "40000002"]);
    expect(pickStaleCandidates(rows, { limit: 99, now })).not.toContain("40000003");
    expect(pickStaleCandidates(rows, { limit: 0, now })).toEqual([]);
  });
});

// ─── оркестратор на заготовленных ответах ───────────────────────────────────────

function makeDeps(
  respond: (mode: ProbeMode, id: string, n: number) => ProbeResult,
  tick = 1
): { deps: LivenessDeps; calls: { mode: ProbeMode; id: string }[] } {
  const calls: { mode: ProbeMode; id: string }[] = [];
  const counts = new Map<string, number>();
  let clock = 0;
  return {
    calls,
    deps: {
      probe: async (mode, id) => {
        calls.push({ mode, id });
        const n = (counts.get(id) ?? 0) + 1;
        counts.set(id, n);
        clock += tick;
        return respond(mode, id, n);
      },
      sleep: async () => {},
      now: () => clock,
    },
  };
}

const CANARY = "40999999";
const opts = { canaryIds: [CANARY], concurrency: 1, pauseMs: 0, budgetMs: 1_000, graceMs: 1_000 };

describe("runLivenessProbe", () => {
  it("живые подтверждаются, проданные — только двумя одинаковыми 404", async () => {
    const { deps } = makeDeps((_m, id) => (id === "40000002" ? SOLD_DIRECT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002", "40000003"] });
    expect(r.aborted).toBeNull();
    expect(r.ok).toBe(true);
    expect(r.mode).toBe("direct");
    expect(r.alive).toEqual(["40000001", "40000003"]);
    expect(r.sold).toEqual(["40000002"]);
  });

  it("первый 404 не подтвердился вторым запросом — машина НЕ помечается", async () => {
    const { deps } = makeDeps((_m, id, n) => (id === "40000002" && n === 1 ? SOLD_DIRECT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002"] });
    expect(r.sold).toEqual([]);
    expect(r.soldUnconfirmed).toBe(1);
  });

  it("канарейка не отвечает 200 ни напрямую, ни через прокси — запуск не начинается, ничего не помечено", async () => {
    const { deps, calls } = makeDeps((_m, id) => (id === CANARY ? SOLD_DIRECT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002"] });
    expect(r.aborted).toBe("no_canary");
    expect(r.ok).toBe(false);
    expect(r.alive).toEqual([]);
    expect(r.sold).toEqual([]);
    expect(calls.every((c) => c.id === CANARY)).toBe(true);
  });

  it("прямой Encar недоступен — канарейка ведёт через прокси, и весь запуск идёт им", async () => {
    const { deps, calls } = makeDeps((m, id) => (m === "direct" ? TIMEOUT : id === "40000002" ? SOLD_PROXY : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002"] });
    expect(r.mode).toBe("proxy");
    expect(r.sold).toEqual(["40000002"]);
    expect(calls.filter((c) => c.id !== CANARY).every((c) => c.mode === "proxy")).toBe(true);
  });

  it("блокировка посреди запуска — прекращаем и не помечаем НИЧЕГО, даже уже найденное", async () => {
    const { deps } = makeDeps((_m, id) => (id === "40000003" ? BLOCK_PAGE : id === "40000001" ? SOLD_DIRECT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002", "40000003", "40000004"] });
    expect(r.aborted).toBe("blocked");
    expect(r.ok).toBe(false);
    expect(r.sold).toEqual([]);
    expect(r.alive).toEqual([]);
  });

  it("404-страница блокировки на этапе подтверждения тоже прекращает запуск", async () => {
    const { deps } = makeDeps((_m, id, n) => (id === "40000002" ? (n === 1 ? SOLD_DIRECT : BLOCK_PAGE) : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002"] });
    expect(r.aborted).toBe("blocked");
    expect(r.sold).toEqual([]);
  });

  it("серия сбоев подряд (5xx, таймауты) — прекращаем, помечать нечего", async () => {
    const { deps } = makeDeps((_m, id) => (id === CANARY ? ALIVE : id < "40000100" ? ALIVE : SERVER_ERROR));
    const ids = ["40000001", ...Array.from({ length: 10 }, (_, i) => String(40000100 + i))];
    const r = await runLivenessProbe(deps, { ...opts, candidates: ids });
    expect(r.aborted).toBe("unstable");
    expect(r.alive).toEqual([]);
    expect(r.sold).toEqual([]);
  });

  it("одиночные сбои не мешают: машина остаётся «неизвестной», остальные проверены", async () => {
    const { deps } = makeDeps((_m, id) => (id === "40000002" ? TIMEOUT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002", "40000003"] });
    expect(r.aborted).toBeNull();
    expect(r.unknown).toBe(1);
    expect(r.alive).toEqual(["40000001", "40000003"]);
    expect(r.sold).toEqual([]);
  });

  it("канарейка в конце не жива — способ доступа сломался по ходу запуска, ничего не помечаем", async () => {
    const { deps } = makeDeps((_m, id, n) => (id === CANARY && n > 1 ? SOLD_DIRECT : id === "40000002" ? SOLD_DIRECT : ALIVE));
    const r = await runLivenessProbe(deps, { ...opts, candidates: ["40000001", "40000002"] });
    expect(r.aborted).toBe("canary_lost");
    expect(r.sold).toEqual([]);
    expect(r.alive).toEqual([]);
  });

  it("бюджет времени исчерпан — проверено сколько успели, это не сбой", async () => {
    const { deps } = makeDeps(() => ALIVE, 100);
    const ids = Array.from({ length: 50 }, (_, i) => String(40000100 + i));
    const r = await runLivenessProbe(deps, { ...opts, budgetMs: 500, candidates: ids });
    expect(r.stoppedByBudget).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.alive.length).toBeGreaterThan(0);
    expect(r.alive.length).toBeLessThan(50);
  });

  it("кандидатов нет — Encar не трогаем вовсе", async () => {
    const { deps, calls } = makeDeps(() => ALIVE);
    const r = await runLivenessProbe(deps, { ...opts, candidates: [] });
    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(0);
  });
});
