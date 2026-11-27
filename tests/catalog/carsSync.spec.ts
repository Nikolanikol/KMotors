import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Запись в БД не нужна: подменяем только saveCarSnapshots, остальное — настоящее.
vi.mock("@/lib/carsSeen", async () => {
  const actual = await vi.importActual<typeof import("@/lib/carsSeen")>("@/lib/carsSeen");
  return { ...actual, saveCarSnapshots: vi.fn(async (rows: unknown[]) => rows.length) };
});

import { LISTING_SLICES, sliceQuery, syncCarsFromListing } from "@/lib/carsSync";

interface Req {
  slice: number;
  offset: number;
}

/** Подмена fetch: прямой Encar отвечает страницами по `pageRows` строк, у каждого куска свой пул. */
function mockEncar({ pageRows = 20, sliceSize = () => Infinity }: { pageRows?: number; sliceSize?: (slice: number) => number }) {
  const log: Req[] = [];
  const queries = LISTING_SLICES.map((s) => sliceQuery(s));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const q = url.searchParams.get("q") ?? "";
      const slice = queries.indexOf(q);
      const offset = Number(url.searchParams.get("sr")?.split("|")[2]);
      log.push({ slice, offset });
      const total = sliceSize(slice);
      const n = Math.max(0, Math.min(pageRows, total - offset));
      const rows = Array.from({ length: n }, (_, i) => ({ Id: `${slice}-${offset + i}`, Price: 1000 }));
      return new Response(JSON.stringify({ SearchResults: rows }), { status: 200 });
    })
  );
  return log;
}

beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LISTING_SLICES", () => {
  it("куски не пересекаются и подряд покрывают все годы без дыр", () => {
    const ranges = LISTING_SLICES.map((s) => {
      const m = s.match(/^Year\.range\((\d*)\.\.(\d*)\)$/)!;
      return { from: m[1] ? Number(m[1]) : 0, to: m[2] ? Number(m[2]) : Infinity };
    }).sort((a, b) => a.from - b.from);
    expect(ranges[0].from).toBe(0);
    expect(ranges[ranges.length - 1].to).toBe(Infinity);
    for (let i = 1; i < ranges.length; i++) {
      // следующий кусок начинается ровно с начала года после конца предыдущего
      expect(ranges[i].from).toBe(Math.floor(ranges[i - 1].to / 100) * 100 + 100);
    }
  });

  it("sliceQuery без куска — вся выборка сайтмапа", () => {
    expect(sliceQuery()).toBe("(And.Hidden.N._.CarType.Y.)");
    expect(sliceQuery("Year.range(202500..202599)")).toBe("(And.Hidden.N._.CarType.Y._.Year.range(202500..202599).)");
  });
});

describe("syncCarsFromListing: обход по кругу", () => {
  it("раунд = по странице из каждого куска, свежие годы первыми", async () => {
    const log = mockEncar({});
    const n = LISTING_SLICES.length;
    const r = await syncCarsFromListing({ limit: n * 20 * 2, delayMs: 0, dry: true });
    expect(log.slice(0, n).map((x) => x.slice)).toEqual(LISTING_SLICES.map((_, i) => i));
    expect(log.slice(0, n).every((x) => x.offset === 0)).toBe(true);
    expect(log.slice(n, 2 * n).every((x) => x.offset === 20)).toBe(true);
    expect(r.pages).toBe(2 * n);
    expect(r.unique).toBe(r.fetched);
    expect(r.failedPages).toBe(0);
  });

  it("кончившийся кусок больше не опрашивается, остальные идут дальше", async () => {
    const log = mockEncar({ sliceSize: (s) => (s === 0 ? 20 : Infinity) });
    await syncCarsFromListing({ limit: 600, delayMs: 0, dry: true });
    // кусок 0: страница с 20 строками, затем пустая — и всё
    expect(log.filter((x) => x.slice === 0).map((x) => x.offset)).toEqual([0, 20]);
    expect(log.filter((x) => x.slice === 1).length).toBeGreaterThan(2);
  });

  it("лимит по строкам останавливает обход, пустой пул — конец без ошибки", async () => {
    mockEncar({});
    const r = await syncCarsFromListing({ limit: 100, delayMs: 0, dry: true });
    expect(r.fetched).toBe(100);
    mockEncar({ sliceSize: () => 0 });
    const empty = await syncCarsFromListing({ limit: 100, delayMs: 0, dry: true });
    expect(empty.fetched).toBe(0);
    expect(empty.pages).toBe(LISTING_SLICES.length);
  });

  it("исчерпанный бюджет времени: ни одного запроса, stoppedByBudget", async () => {
    const log = mockEncar({});
    const r = await syncCarsFromListing({ limit: 3000, delayMs: 0, dry: true, budgetMs: -1 });
    expect(r.stoppedByBudget).toBe(true);
    expect(log.length).toBe(0);
  });
});
