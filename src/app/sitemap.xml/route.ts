// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

const BASE = "https://kmotors.shop";
const PAGE_SIZE = 20;
const ENCAR_API = "https://api.encar.com/search/car/list/premium";
const ENCAR_PROXY = "https://encar-proxy-main.onrender.com/api/catalog";
const QUERY = "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A.))";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

export const revalidate = 3600;

async function fetchCount(): Promise<number> {
  const url = `${ENCAR_API}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C0%7C1`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error();
    const json = await res.json();
    return Number(json.Count) || 0;
  } catch {
    try {
      const proxyUrl = `${ENCAR_PROXY}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C0%7C1`;
      const res = await fetch(proxyUrl);
      const json = await res.json();
      return Number(json.Count) || 0;
    } catch {
      return 0;
    }
  }
}

export async function GET() {
  let totalPages = 50; // fallback: 50 pages × 20 cars = 1000 slots
  try {
    const count = await fetchCount();
    if (count > 0) {
      totalPages = Math.min(Math.ceil(count / PAGE_SIZE), 200);
    }
  } catch {
    totalPages = 50;
  }

  const staticSitemaps = [
    `${BASE}/sitemap-main.xml`,
    `${BASE}/sitemap-blog.xml`,
  ];

  const catalogSitemaps = Array.from(
    { length: totalPages },
    (_, i) => `${BASE}/sitemap-new-${i + 1}.xml`
  );

  const all = [...staticSitemaps, ...catalogSitemaps];

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
