import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CATALOG_SITEMAP_FLOOR,
  CATALOG_SITEMAP_MAX,
  CATALOG_SITEMAP_PAGE_SIZE,
  EMPTY_CATALOG_SITEMAP_XML,
  buildCatalogSitemapXml,
  freshCutoffIso,
  sitemapFileCount,
  sitemapPageWindow,
} from "@/lib/catalogSitemap";
import { SITE_URL } from "@/lib/site";

const urlBlocks = (xml: string) => xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("buildCatalogSitemapXml: английские адреса и hreflang", () => {
  const xml = buildCatalogSitemapXml([
    { encar_id: "41234567", first_seen_at: "2026-11-01T10:00:00+00:00", last_seen_at: "2026-11-27T01:00:00Z" },
    { encar_id: "41234568", first_seen_at: "2026-11-02T10:00:00+00:00" },
  ]);

  it("две записи на машину: сначала /en/, потом /ru/, ka и ar в <loc> нет", () => {
    expect(locs(xml)).toEqual([
      `${SITE_URL}/en/catalog/41234567`,
      `${SITE_URL}/ru/catalog/41234567`,
      `${SITE_URL}/en/catalog/41234568`,
      `${SITE_URL}/ru/catalog/41234568`,
    ]);
    expect(xml).not.toMatch(/<loc>[^<]*\/(ka|ar)\//);
  });

  it("в каждой записи полный набор alternate и x-default = английский адрес", () => {
    const blocks = urlBlocks(xml);
    expect(blocks).toHaveLength(4);
    for (const b of blocks) {
      const id = /catalog\/(\d+)/.exec(b)![1];
      const links = [...b.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
      expect(links).toEqual([
        ["en", `${SITE_URL}/en/catalog/${id}`],
        ["ru", `${SITE_URL}/ru/catalog/${id}`],
        ["ka", `${SITE_URL}/ka/catalog/${id}`],
        ["ar", `${SITE_URL}/ar/catalog/${id}`],
        ["x-default", `${SITE_URL}/en/catalog/${id}`],
      ]);
    }
  });

  it("адреса абсолютные, без хвостового слэша; объявлен namespace xhtml", () => {
    for (const l of locs(xml)) {
      expect(l.startsWith("https://")).toBe(true);
      expect(l.endsWith("/")).toBe(false);
    }
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it("lastmod = first_seen_at (дата), а не last_seen_at: подтверждение живости не «изменение»", () => {
    const first = urlBlocks(xml)[0];
    expect(first).toContain("<lastmod>2026-11-01</lastmod>");
    expect(xml).not.toContain("2026-11-27");
  });

  it("мусорный id пропускается, дубль id схлопывается, пустой набор — пустой urlset", () => {
    const out = buildCatalogSitemapXml([
      { encar_id: "abc<script>", first_seen_at: "2026-11-01" },
      { encar_id: "41234567", first_seen_at: "2026-11-01" },
      { encar_id: "41234567", first_seen_at: "2026-11-01" },
    ]);
    expect(urlBlocks(out)).toHaveLength(2);
    expect(out).not.toContain("script");
    expect(buildCatalogSitemapXml([])).toBe(EMPTY_CATALOG_SITEMAP_XML);
  });
});

describe("лимиты и страничность", () => {
  it("потолок не меньше 20 000 живых машин, в файле ≤ 1 000 машин = ≤ 2 000 <url>", () => {
    expect(CATALOG_SITEMAP_MAX).toBeGreaterThanOrEqual(20_000);
    expect(CATALOG_SITEMAP_PAGE_SIZE).toBeLessThanOrEqual(1_000);
    expect(CATALOG_SITEMAP_PAGE_SIZE * 2).toBeLessThanOrEqual(2_000);
    // лимиты Google: 50 000 URL на файл
    expect(CATALOG_SITEMAP_PAGE_SIZE * 2).toBeLessThanOrEqual(50_000);
  });

  it("полный файл весит на порядки меньше 50 МБ", () => {
    const cars = Array.from({ length: CATALOG_SITEMAP_PAGE_SIZE }, (_, i) => ({
      encar_id: String(40_000_000 + i),
      first_seen_at: "2026-11-01T10:00:00Z",
    }));
    const xml = buildCatalogSitemapXml(cars);
    expect(urlBlocks(xml)).toHaveLength(CATALOG_SITEMAP_PAGE_SIZE * 2);
    expect(Buffer.byteLength(xml)).toBeLessThan(5 * 1024 * 1024);
  });

  it("число файлов считается от количества и не превышает потолок", () => {
    expect(sitemapFileCount(0)).toBe(0);
    expect(sitemapFileCount(1)).toBe(1);
    expect(sitemapFileCount(1_000)).toBe(1);
    expect(sitemapFileCount(1_001)).toBe(2);
    expect(sitemapFileCount(CATALOG_SITEMAP_MAX)).toBe(CATALOG_SITEMAP_MAX / CATALOG_SITEMAP_PAGE_SIZE);
    expect(sitemapFileCount(10 * CATALOG_SITEMAP_MAX)).toBe(CATALOG_SITEMAP_MAX / CATALOG_SITEMAP_PAGE_SIZE);
  });

  it("окна файлов стыкуются без щелей и перекрытий и заканчиваются ровно на потолке", () => {
    let expected = 0;
    for (let page = 1; page <= sitemapFileCount(CATALOG_SITEMAP_MAX); page++) {
      const w = sitemapPageWindow(page)!;
      expect(w.offset).toBe(expected);
      expected += w.take;
    }
    expect(expected).toBe(CATALOG_SITEMAP_MAX);
    expect(sitemapPageWindow(sitemapFileCount(CATALOG_SITEMAP_MAX) + 1)).toBeNull();
    expect(sitemapPageWindow(0)).toBeNull();
    expect(sitemapPageWindow(Number.NaN)).toBeNull();
    expect(sitemapPageWindow(1.5)).toBeNull();
  });

  it("граница свежести — N суток назад", () => {
    const now = Date.parse("2026-11-27T00:00:00Z");
    expect(freshCutoffIso(now, 21)).toBe("2026-11-06T00:00:00.000Z");
  });
});

// ─── отбор и порядок: запросы к «Supabase» на фейке ─────────────────────────────

interface Row {
  encar_id: string;
  first_seen_at: string;
  last_seen_at: string;
  sold_at: string | null;
}

let table: Row[] = [];
const MAX_ROWS = 1_000; // как max-rows у PostgREST: больше не отдаём, сколько бы ни просили

function fakeBuilder() {
  const st = {
    head: false,
    soldNull: false,
    gte: null as [string, string] | null,
    order: [] as { col: keyof Row; asc: boolean }[],
    range: null as [number, number] | null,
  };
  const b: Record<string, unknown> = {
    select: (_c: string, opts?: { head?: boolean }) => ((st.head = !!opts?.head), b),
    is: (col: string, v: null) => (col === "sold_at" && v === null ? ((st.soldNull = true), b) : b),
    gte: (col: string, v: string) => ((st.gte = [col, v]), b),
    order: (col: keyof Row, o: { ascending: boolean }) => (st.order.push({ col, asc: o.ascending }), b),
    range: (a: number, z: number) => ((st.range = [a, z]), b),
    then: (resolve: (v: unknown) => void) => {
      let rows = table.filter((r) => (!st.soldNull || r.sold_at === null) && (!st.gte || r.last_seen_at >= st.gte[1]));
      if (st.head) return resolve({ count: rows.length, error: null });
      rows = [...rows].sort((x, y) => {
        for (const o of st.order) {
          const a = String(x[o.col]);
          const c = String(y[o.col]);
          if (a !== c) return (a < c ? -1 : 1) * (o.asc ? 1 : -1);
        }
        return 0;
      });
      if (st.range) rows = rows.slice(st.range[0], Math.min(st.range[1] + 1, st.range[0] + MAX_ROWS));
      resolve({ data: rows, error: null });
    },
  };
  return b;
}

vi.mock("@/lib/supabase", () => ({
  createServerClient: () => ({ from: () => fakeBuilder() }),
}));

describe("getSitemapCars: отбор, порядок, страницы", () => {
  const NOW = Date.now();
  const iso = (daysAgo: number) => new Date(NOW - daysAgo * 86_400_000).toISOString();

  beforeEach(() => {
    // 2 600 свежих (first_seen_at пачками по 500 — ровно как батч-upsert), 40 проданных,
    // 100 протухших. Id возрастают, так что порядок сортировки отличим от порядка вставки.
    table = [];
    for (let i = 0; i < 2_600; i++) {
      table.push({
        encar_id: String(41_000_000 + (i * 7) % 2_600),
        first_seen_at: iso(60 - Math.floor(i / 500)),
        last_seen_at: iso(1),
        sold_at: null,
      });
    }
    for (let i = 0; i < 40; i++) {
      table.push({ encar_id: String(42_000_000 + i), first_seen_at: iso(70), last_seen_at: iso(1), sold_at: iso(1) });
    }
    for (let i = 0; i < 100; i++) {
      table.push({ encar_id: String(43_000_000 + i), first_seen_at: iso(80), last_seen_at: iso(40), sold_at: null });
    }
  });

  it("берёт только непроданных и подтверждённых за 21 день; порядок — самые ранние первыми", async () => {
    const { getSitemapCars, countSitemapCars } = await import("@/lib/catalogSitemapDb");
    expect(await countSitemapCars()).toBe(2_600);

    const p1 = await getSitemapCars(1);
    expect(p1).toHaveLength(1_000);
    const dates = p1.map((c) => c.first_seen_at);
    expect([...dates].sort()).toEqual(dates); // first_seen_at по возрастанию
    // внутри одинаковой даты — encar_id по возрастанию (второй ключ)
    for (let i = 1; i < p1.length; i++) {
      if (p1[i].first_seen_at === p1[i - 1].first_seen_at) {
        expect(p1[i].encar_id > p1[i - 1].encar_id).toBe(true);
      }
    }
  });

  it("страницы не теряют и не дублируют машины на неуникальном first_seen_at", async () => {
    const { getSitemapCars } = await import("@/lib/catalogSitemapDb");
    const ids: string[] = [];
    for (let page = 1; page <= 3; page++) ids.push(...(await getSitemapCars(page)).map((c) => c.encar_id));
    expect(ids).toHaveLength(2_600);
    expect(new Set(ids).size).toBe(2_600);
    expect(ids.some((id) => id.startsWith("42") || id.startsWith("43"))).toBe(false);
    expect(await getSitemapCars(4)).toEqual([]);
  });

  it("свежих меньше порога — деградация: все непроданные, новые сверху", async () => {
    table = table.filter((r) => r.last_seen_at === iso(40) || r.encar_id < "41000300");
    const { resolveSitemapScope, getSitemapCars } = await import("@/lib/catalogSitemapDb");
    const fresh = table.filter((r) => r.last_seen_at !== iso(40)).length;
    expect(fresh).toBeLessThan(CATALOG_SITEMAP_FLOOR);
    const scope = await resolveSitemapScope();
    expect(scope?.mode).toBe("all");
    const p1 = await getSitemapCars(1);
    expect(p1.length).toBeGreaterThan(fresh); // вошли и протухшие
    const dates = p1.map((c) => c.first_seen_at);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
