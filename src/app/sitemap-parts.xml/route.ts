// sitemap-parts.xml — sitemap index pointing to paginated parts sitemaps
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 86400; // refresh daily

const BASE      = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kmotors.shop";
const PAGE_SIZE = 1_000; // Supabase limit is 1000 rows per request

export async function GET() {
  try {
    const supabase = createServerClient();
    const { count } = await supabase
      .from("parts_products")
      .select("*", { count: "exact", head: true });

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

    const sitemaps = Array.from(
      { length: totalPages },
      (_, i) => `  <sitemap>
    <loc>${BASE}/sitemap-parts/${i + 1}</loc>
  </sitemap>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
