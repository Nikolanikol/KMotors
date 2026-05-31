// /sitemap-parts/[page] — paginated parts sitemap
// 5 000 products × 5 langs = 25 000 URLs per file (well under Google's 50k limit)
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSlug } from "@/utils/partSlug";

export const revalidate = 86400; // refresh daily

const BASE      = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kmotors.shop";
const LANGS     = ["ru", "en", "ko", "ka", "ar"];
const PAGE_SIZE = 5_000;

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`;

function alternates(
  partNumber: string,
  name_ru: string,
  name_en: string,
  name_ko: string | null
) {
  const ru = generatePartSlug(partNumber, name_ru, "ru");
  const en = generatePartSlug(partNumber, name_en, "en");
  const ko = generatePartSlug(partNumber, name_ko || name_en || name_ru, "ko");

  return [
    ...LANGS.map((lang) => {
      const slug =
        lang === "ru"
          ? ru
          : lang === "en"
          ? en
          : lang === "ko"
          ? ko
          : ru; // fallback для ka, ar
      return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}/parts/${slug}"/>`;
    }),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru/parts/${ru}"/>`,
  ].join("\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageStr } = await params;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const from = (page - 1) * PAGE_SIZE;

  try {
    const supabase = createServerClient();
    const { data: products } = await supabase
      .from("parts_products")
      .select("part_number, name_ru, name_en, name_ko, scraped_at")
      .order("part_number")
      .range(from, from + PAGE_SIZE - 1);

    if (!products?.length) {
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const fallbackDate = new Date().toISOString().slice(0, 10);
    const urlBlocks: string[] = [];

    for (const product of products) {
      const lastmod = product.scraped_at
        ? new Date(product.scraped_at).toISOString().slice(0, 10)
        : fallbackDate;

      const slugRu = generatePartSlug(product.part_number, product.name_ru, "ru");
      const slugEn = generatePartSlug(product.part_number, product.name_en, "en");
      const slugKo = generatePartSlug(
        product.part_number,
        product.name_ko || product.name_en || product.name_ru,
        "ko"
      );

      // Only add RU as primary (one per product, with alternates)
      urlBlocks.push(`  <url>
    <loc>${BASE}/ru/parts/${slugRu}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${alternates(product.part_number, product.name_ru, product.name_en, product.name_ko)}
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
