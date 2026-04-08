// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { getCars } from "@/components/Catalog/Row/utils/service";

const PAGE_SIZE = 20;
const BASE = "https://kmotors.shop";

export const revalidate = 3600; // обновляем каждый час

export async function GET() {
  // Получаем общее количество машин чтобы знать сколько страниц sitemap нужно
  let totalPages = 1;
  try {
    const { count } = await getCars("", "0");
    if (count && count > 0) {
      totalPages = Math.ceil(count / PAGE_SIZE);
    }
  } catch {
    totalPages = 5; // fallback — хотя бы первые 5 страниц
  }

  // Ограничиваем до 200 страниц (4000 машин) — разумный предел
  totalPages = Math.min(totalPages, 200);

  const staticSitemaps = [
    `${BASE}/sitemap-main.xml`,
    `${BASE}/sitemap-blog.xml`,
  ];

  // Динамические страницы каталога
  const catalogSitemaps = Array.from({ length: totalPages }, (_, i) =>
    `${BASE}/sitemap-new-${i + 1}.xml`
  );

  const allSitemaps = [...staticSitemaps, ...catalogSitemaps];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
