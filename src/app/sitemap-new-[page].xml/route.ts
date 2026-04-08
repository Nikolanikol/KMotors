// app/sitemap-new-[page].xml/route.ts
import { NextResponse } from "next/server";
import { getCars } from "@/components/Catalog/Row/utils/service";

const BASE = "https://kmotors.shop";
const LANGS = ["ru", "en", "ko", "ka", "ar"];
const PAGE_SIZE = 20;

function alternates(id: string) {
  return LANGS.map(
    (lang) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}/catalog/${id}"/>`
  ).join("\n") +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru/catalog/${id}"/>`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = ((page - 1) * PAGE_SIZE).toString();

  try {
    const { data } = await getCars("", offset);

    if (!data || data.length === 0) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    const now = new Date().toISOString();

    // One <url> block per lang per car (Google's recommended approach)
    const urlBlocks: string[] = [];

    for (const car of data) {
      const id = String(car.Id);
      const lastmod = car.LastModified || now;

      for (const lang of LANGS) {
        urlBlocks.push(
          `  <url>
    <loc>${BASE}/${lang}/catalog/${id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates(id)}
  </url>`
        );
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
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
