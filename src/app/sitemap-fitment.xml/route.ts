// /sitemap-fitment.xml — generation (fitment) pages
// One URL per vehicle generation with >=10 parts; RU primary + hreflang alternates.
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 86400;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ka", "ar"];
const MIN_PARTS = 10;

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`;

function alternates(path: string) {
  return [
    ...LANGS.map(
      (lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}${path}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru${path}"/>`,
  ].join("\n");
}

export async function GET() {
  try {
    const supabase = createServerClient();
    const vehicles: { brand: string; slug: string }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from("vehicles")
        .select("brand, slug")
        .gte("parts_count", MIN_PARTS)
        .order("parts_count", { ascending: false })
        .range(offset, offset + 999);
      if (error) break;
      if (!data || data.length === 0) break;
      vehicles.push(...data);
      if (data.length < 1000) break;
    }

    if (!vehicles.length) {
      return new NextResponse(EMPTY_XML, { headers: { "Content-Type": "application/xml" } });
    }

    const urlBlocks = vehicles.map((v) => {
      const path = `/fitment/${v.brand}/${v.slug}`;
      return `  <url>
    <loc>${BASE}/ru${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${alternates(path)}
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
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(EMPTY_XML, { headers: { "Content-Type": "application/xml" } });
  }
}
