// app/sitemap-catalog/[page]/route.ts
//
// Источник — наша таблица cars_seen, а НЕ живая выдача Encar. Почему так и что
// это починило — в шапке раздела «Сайтмап каталога» в src/lib/carsSeen.ts.
// Коротко: offset по выдаче, отсортированной по ModifiedDate, ничего не
// адресовал (объявления переподнимают постоянно), набор URL ротировался целиком
// каждый час, и Google не обходил карточки авто вообще.

import { NextResponse } from "next/server";
import {
  CATALOG_SITEMAP_PAGE_SIZE,
  getSitemapCars,
} from "@/lib/carsSeen";

const BASE = "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ka", "ar"];

export const revalidate = 3600;

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

const empty = () =>
  new NextResponse(EMPTY_XML, {
    headers: { "Content-Type": "application/xml" },
  });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * CATALOG_SITEMAP_PAGE_SIZE;

  const cars = await getSitemapCars(offset, CATALOG_SITEMAP_PAGE_SIZE);
  if (cars.length === 0) return empty();

  const urlBlocks = cars.map((car) => {
    // <lastmod> — дата, когда машину впервые увидели МЫ, и она у машины больше
    // не меняется: upsert не перезаписывает first_seen_at. Поэтому тег не просит
    // переобход на ровном месте. Раньше здесь не было ни lastmod, ни changefreq —
    // именно потому, что единственной доступной датой был ModifiedDate Encar,
    // дата переподнятия объявления, и отдавать её значило каждый час объявлять
    // изменённым весь каталог. С собственной датой этой проблемы нет.
    const lastmod = String(car.first_seen_at).slice(0, 10);
    // priority ниже запчастей (0.7) осознанно: машина живёт недели, карточка
    // детали — годы. changefreq по-прежнему нет, он Google'ом игнорируется.
    return `  <url>
    <loc>${BASE}/ru/catalog/${car.encar_id}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.5</priority>
${alternates(car.encar_id)}
  </url>`;
  });

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
}
