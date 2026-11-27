// app/sitemap-catalog/[page]/route.ts
//
// Источник — наша таблица cars_seen, а НЕ живая выдача Encar. Почему так и что это
// починило — docs/core-seo.md, «Сайтмап каталога идёт из cars_seen». Какие машины и в
// каком порядке — шапка src/lib/catalogSitemapDb.ts, сборка XML — catalogSitemap.ts.
//
// Файл — до 1 000 машин, по две записи <url> на каждую: /en/catalog/<id>, затем
// /ru/catalog/<id>, у обеих полный набор hreflang и x-default = английский.

import { NextResponse } from "next/server";
import { buildCatalogSitemapXml } from "@/lib/catalogSitemap";
import { getSitemapCars } from "@/lib/catalogSitemapDb";

export const revalidate = 3600;

const XML_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;
  const page = Math.max(1, Number(pageParam) || 1);

  const cars = await getSitemapCars(page);
  // Пустой файл (за концом набора или Supabase молчит) кеш не получает: иначе сбой
  // базы на час закрепился бы в CDN как «карта пуста».
  if (cars.length === 0) {
    return new NextResponse(buildCatalogSitemapXml([]), {
      headers: { "Content-Type": "application/xml" },
    });
  }

  return new NextResponse(buildCatalogSitemapXml(cars), { headers: XML_HEADERS });
}
