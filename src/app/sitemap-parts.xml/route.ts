// app/sitemap-parts.xml/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const BASE = "https://kmotors.shop";
const LANGS = ["ru", "en", "ko", "ka", "ar"];

// Пересобирается только при деплое — данные статичны
export const revalidate = false;

function alternates(id: number) {
  return [
    ...LANGS.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}/parts/${id}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru/parts/${id}"/>`,
  ].join("\n");
}

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: products } = await supabase
      .from("parts_products")
      .select("id, scraped_at")
      .order("id");

    if (!products || products.length === 0) {
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

      for (const lang of LANGS) {
        urlBlocks.push(`  <url>
    <loc>${BASE}/${lang}/parts/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${alternates(product.id)}
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
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
