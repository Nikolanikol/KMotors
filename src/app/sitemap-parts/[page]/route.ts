// /sitemap-parts/[page] — paginated parts sitemap
// 1 000 products per file, canonical URL = part number (no name slug)
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSlug } from "@/utils/partSlug";
import { SITE_URL } from "@/lib/site";
import { LANGS } from "@/lib/lang";
import { getPartContentDates } from "@/lib/partContent";

export const revalidate = 86400; // refresh daily

const PAGE_SIZE = 1_000; // Supabase limit is 1000 rows per request

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`;

/** Экранирование текста для XML: амперсанд, угловые скобки и кавычки в <loc>/<href> ломают весь файл. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Slug канонический (только артикул) — одинаковый для всех языков.
// Сегмент уже закодирован (encodeURIComponent) и экранирован под XML снаружи.
function alternates(slug: string) {
  return [
    ...LANGS.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}/${lang}/parts/${slug}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/ru/parts/${slug}"/>`,
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
      .select("id, part_number, name_ru, name_en, name_ko, scraped_at")
      // ⚠️ .order("id") — не украшение, а условие корректности пагинации.
      // price_krw НЕ уникальна: почти половина товаров делит цену с кем-то ещё
      // (замер: на 1000 строк 691 различная цена, до 15 товаров на одну цену).
      // ORDER BY без уникального тайбрейкера не задаёт полного порядка, и
      // Postgres честно возвращал строки по-разному от запроса к запросу —
      // два одинаковых запроса за страницей 2 разошлись на 608 позиций из 1000.
      // А так как каждый файл сайтмапа генерируется отдельно и кешируется на
      // сутки, товар со «стыковой» ценой попадал либо сразу в два файла, либо
      // ни в один: ~150–250 товаров на 48 стыках, и состав их менялся при
      // каждой перегенерации. Для Google мигающий URL хуже, чем стабильно
      // отсутствующий.
      .order("price_krw", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    console.log(`[sitemap-parts] DB Response: error=${!!error}, products=${products?.length || 0}`);
    if (products && products.length > 0) {
      const withNames = products.filter(p => p.name_ru && p.name_en).length;
      console.log(`[sitemap-parts] Products with names (ru+en): ${withNames}/${products.length}`);
    }

    if (error) {
      // 503, а не пустой файл с 200: пустой ответ запомнился бы на сутки (revalidate)
      // и для Google выглядел бы как «этих URL больше нет».
      console.error('[sitemap-parts] DB Error:', error);
      return new NextResponse(EMPTY_XML, {
        status: 503,
        headers: { "Content-Type": "application/xml", "Retry-After": "300" },
      });
    }

    if (!products?.length) {
      console.warn(`[sitemap-parts] Page ${page}: no products found`);
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const fallbackDate = new Date().toISOString().slice(0, 10);
    // Дата появления экспертного блока (kmotors_part_content): без неё Google не узнает, что
    // карточка изменилась, потому что scraped_at у неё остался прежним. Только у артикулов с блоком.
    const contentDates = await getPartContentDates();
    const urlBlocks: string[] = [];

    console.log(`[sitemap-parts] Starting to generate URLs for ${products.length} products...`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        // Skip products without any name
        if (!product.name_ru && !product.name_en && !product.name_ko) {
          continue;
        }

        const scrapedDate = product.scraped_at
          ? new Date(product.scraped_at).toISOString().slice(0, 10)
          : fallbackDate;
        const contentDate = product.part_number ? contentDates[product.part_number] : undefined;
        // ISO-даты YYYY-MM-DD сравниваются как строки
        const lastmod = contentDate && contentDate > scrapedDate ? contentDate : scrapedDate;

        const slug = xmlEscape(encodeURIComponent(generatePartSlug(product.part_number, null, "ru", product.id)));

        // Only add RU as primary (one per product, with alternates)
        urlBlocks.push(`  <url>
    <loc>${SITE_URL}/ru/parts/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${alternates(slug)}
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
      status: 503,
      headers: { "Content-Type": "application/xml", "Retry-After": "300" },
    });
  }
}
