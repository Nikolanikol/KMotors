// /sitemap-parts/[page] — paginated parts sitemap
// 5 000 products × 5 langs = 25 000 URLs per file (well under Google's 50k limit)
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSlug } from "@/utils/partSlug";

export const revalidate = 86400; // refresh daily

const BASE      = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";
const LANGS     = ["ru", "en", "ko", "ka", "ar"];
const PAGE_SIZE = 1_000; // Supabase limit is 1000 rows per request

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`;

function alternates(
  partNumber: string | null,
  name_ru: string,
  name_en: string,
  name_ko: string | null,
  id: number
) {
  const ru = generatePartSlug(partNumber, name_ru, "ru", id);
  const en = generatePartSlug(partNumber, name_en, "en", id);
  const ko = generatePartSlug(partNumber, name_ko || name_en || name_ru, "ko", id);

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
  console.log(`[sitemap-parts] Generating page ${page}, from=${from}, to=${from + PAGE_SIZE}`);

  try {
    const supabase = createServerClient();
    const { data: products, error } = await supabase
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, name_ko, scraped_at", { count: "exact" })
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    console.log(`[sitemap-parts] DB Response: error=${!!error}, products=${products?.length || 0}`);
    if (products && products.length > 0) {
      const withNames = products.filter(p => p.name_ru && p.name_en).length;
      console.log(`[sitemap-parts] Products with names (ru+en): ${withNames}/${products.length}`);
    }

    if (error) {
      console.error('[sitemap-parts] DB Error:', error);
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    if (!products?.length) {
      console.warn(`[sitemap-parts] Page ${page}: no products found`);
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const fallbackDate = new Date().toISOString().slice(0, 10);
    const urlBlocks: string[] = [];

    console.log(`[sitemap-parts] Starting to generate URLs for ${products.length} products...`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // Skip products without any name
        if (!product.name_ru && !product.name_en && !product.name_ko) {
          continue;
        }

        // Use fallbacks if names missing
        const name_ru = product.name_ru || product.name_en || product.name_ko || 'part';
        const name_en = product.name_en || product.name_ru || product.name_ko || 'part';
        const name_ko = product.name_ko || product.name_en || product.name_ru || 'part';

        const lastmod = product.scraped_at
          ? new Date(product.scraped_at).toISOString().slice(0, 10)
          : fallbackDate;

        const slugRu = generatePartSlug(product.part_number, name_ru, "ru", product.id);
        const slugEn = generatePartSlug(product.part_number, name_en, "en", product.id);
        const slugKo = generatePartSlug(product.part_number, name_ko, "ko", product.id);

        const alts = alternates(product.part_number, name_ru, name_en, name_ko, product.id);

        // Only add RU as primary (one per product, with alternates)
        urlBlocks.push(`  <url>
    <loc>${BASE}/ru/parts/${slugRu}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${alts}
  </url>`);
      } catch (err) {
        console.error(`[sitemap-parts] Error at index ${i}:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.log(`[sitemap-parts] Generated ${urlBlocks.length} URL blocks`);

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
  } catch (err) {
    console.error('[sitemap-parts] Fatal error:', err instanceof Error ? err.message : String(err));
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
