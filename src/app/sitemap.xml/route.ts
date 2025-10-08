// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const sitemaps = [
    "https://kmotors.shop/sitemap-main.xml",
    "https://kmotors.shop/sitemap-new-1.xml",
    "https://kmotors.shop/sitemap-archive-1.xml",
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemaps.map(loc => `<sitemap><loc>${loc}</loc></sitemap>`).join("")}
  </sitemapindex>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
