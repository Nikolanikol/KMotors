// app/sitemap-blog.xml/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    const urls = (posts || []).map((post) => ({
      loc: `https://kmotors.shop/blog/${post.slug}`,
      lastmod: post.published_at || new Date().toISOString(),
    }));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>`;

    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
  } catch {
    // Return minimal valid sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
  }
}
