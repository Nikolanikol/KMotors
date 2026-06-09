// app/sitemap-blog.xml/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const BASE = "https://www.kmotors.shop";

export const revalidate = 3600;

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at, tags")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (!posts || posts.length === 0) {
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const urlBlocks: string[] = [];

    // Блог только на русском — переводов нет
    for (const post of posts) {
      const lastmod = post.published_at || new Date().toISOString();
      urlBlocks.push(`  <url>
    <loc>${BASE}/ru/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // Теги не включаем — они noindex

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
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
