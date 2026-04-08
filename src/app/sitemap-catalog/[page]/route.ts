// app/sitemap-catalog/[page]/route.ts
import { NextResponse } from "next/server";

const BASE = "https://kmotors.shop";
const LANGS = ["ru", "en", "ko", "ka", "ar"];
const PAGE_SIZE = 20;
const ENCAR_API = "https://api.encar.com/search/car/list/premium";
const ENCAR_PROXY = "https://encar-proxy-main.onrender.com/api/catalog";
const QUERY = "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A.))";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

async function fetchCars(offset: number) {
  const url = `${ENCAR_API}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C${offset}%7C${PAGE_SIZE}`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`encar status ${res.status}`);
    const json = await res.json();
    return json.SearchResults as { Id: number; LastModified?: string }[];
  } catch {
    const proxyUrl = `${ENCAR_PROXY}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C${offset}%7C${PAGE_SIZE}`;
    const res = await fetch(proxyUrl, { next: { revalidate: 3600 } });
    const json = await res.json();
    return json.SearchResults as { Id: number; LastModified?: string }[];
  }
}

function alternates(id: string) {
  return [
    ...LANGS.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}/catalog/${id}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru/catalog/${id}"/>`,
  ].join("\n");
}

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const cars = await fetchCars(offset);

    if (!cars || cars.length === 0) {
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const now = new Date().toISOString();
    const urlBlocks: string[] = [];

    for (const car of cars) {
      const id = String(car.Id);
      const lastmod = car.LastModified || now;

      for (const lang of LANGS) {
        urlBlocks.push(`  <url>
    <loc>${BASE}/${lang}/catalog/${id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates(id)}
  </url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
