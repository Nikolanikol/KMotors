// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const BASE = "https://www.kmotors.shop";
// Должно совпадать с sitemap-catalog/[page]: 200 URL на файл,
// глубже ~10 000 машин Encar выдачу не отдаёт
const CATALOG_PAGE_SIZE = 200;
const CATALOG_MAX_CARS = 10_000;
const PARTS_PAGE_SIZE = 1_000;
const PROXY = "https://encar-proxy-main.onrender.com/api/catalog";
const QUERY = "(And.Hidden.N._.CarType.Y.)";

export const revalidate = 3600;

async function fetchCatalogCount(): Promise<number> {
  try {
    const url = `${PROXY}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C0%7C1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const json = await res.json();
    return Number(json.Count) || 0;
  } catch {
    return 0;
  }
}

async function fetchPartsCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count } = await supabase
      .from("parts_products")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 49_000; // fallback
  }
}

export async function GET() {
  const [catalogCount, partsCount] = await Promise.all([
    fetchCatalogCount(),
    fetchPartsCount(),
  ]);

  const catalogPages = catalogCount > 0
    ? Math.ceil(Math.min(catalogCount, CATALOG_MAX_CARS) / CATALOG_PAGE_SIZE)
    : 50;

  const partsPages = Math.ceil(partsCount / PARTS_PAGE_SIZE) || 49;

  const staticSitemaps = [
    `${BASE}/sitemap-main.xml`,
    `${BASE}/sitemap-blog.xml`,
  ];

  const partsSitemaps = Array.from(
    { length: partsPages },
    (_, i) => `${BASE}/sitemap-parts/${i + 1}`
  );

  const catalogSitemaps = Array.from(
    { length: catalogPages },
    (_, i) => `${BASE}/sitemap-catalog/${i + 1}`
  );

  const all = [...staticSitemaps, ...partsSitemaps, ...catalogSitemaps];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
