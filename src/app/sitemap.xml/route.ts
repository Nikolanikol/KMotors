// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  CATALOG_SITEMAP_PAGE_SIZE,
  CATALOG_SITEMAP_MAX,
  countSitemapCars,
} from "@/lib/carsSeen";

const BASE = "https://www.kmotors.shop";
// Размер файла и потолок каталога живут В ОДНОМ месте — src/lib/carsSeen.ts, —
// и оттуда же их берёт sitemap-catalog/[page]. Раньше это были две копии чисел
// в двух файлах с предупреждением «меняешь здесь — меняй и там»; теперь
// рассинхронить их нечем.
const PARTS_PAGE_SIZE = 1_000;

export const revalidate = 3600;

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
    countSitemapCars(),
    fetchPartsCount(),
  ]);

  // Число файлов каталога считается по РЕАЛЬНОМУ содержимому cars_seen, а не по
  // потолку: сослаться на двадцать пять файлов, когда машин в таблице на три, —
  // это двадцать два пустых ответа, которые Google будет исправно скачивать.
  // Supabase не ответил (null) — тогда уж лучше потолок, чем ноль файлов: индекс
  // без каталога значит «этих URL у нас больше нет».
  const catalogPages =
    catalogCount === null
      ? CATALOG_SITEMAP_MAX / CATALOG_SITEMAP_PAGE_SIZE
      : Math.ceil(catalogCount / CATALOG_SITEMAP_PAGE_SIZE);

  const partsPages = Math.ceil(partsCount / PARTS_PAGE_SIZE) || 49;

  const staticSitemaps = [
    `${BASE}/sitemap-main.xml`,
    `${BASE}/sitemap-blog.xml`,
    `${BASE}/sitemap-fitment.xml`,
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
