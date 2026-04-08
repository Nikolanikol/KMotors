// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

const BASE = "https://kmotors.shop";
const PAGE_SIZE = 20;
const PROXY = "https://encar-proxy-main.onrender.com/api/catalog";
const QUERY = "(And.Hidden.N._.CarType.Y.)";

export const revalidate = 3600;

async function fetchCount(): Promise<number> {
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
    (_, i) => `${BASE}/sitemap-catalog/${i + 1}`
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
