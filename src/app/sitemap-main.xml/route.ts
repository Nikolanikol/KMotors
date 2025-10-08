// app/sitemap-main.xml/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const urls = [
    { loc: "https://kmotors.shop/", lastmod: new Date().toISOString(), priority: 1.0 },
    { loc: "https://kmotors.shop/contact", lastmod: new Date().toISOString(), priority: 0.7 },
    { loc: "https://kmotors.shop/catalog", lastmod: new Date().toISOString(), priority: 0.9 },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `<url>
      <loc>${u.loc}</loc>
      <lastmod>${u.lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${u.priority}</priority>
    </url>`).join("")}
  </urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
