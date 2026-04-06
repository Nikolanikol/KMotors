// app/sitemap-main.xml/route.ts
import { NextResponse } from "next/server";

const LANGS = ["ru", "en", "ko", "ka", "ar", "x-default"];

function alternates(loc: string) {
  return LANGS.map(
    (lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>`
  ).join("\n");
}

export async function GET() {
  const urls = [
    { loc: "https://kmotors.shop/",        lastmod: new Date().toISOString(), priority: 1.0, changefreq: "weekly"  },
    { loc: "https://kmotors.shop/catalog",  lastmod: new Date().toISOString(), priority: 0.9, changefreq: "weekly"  },
    { loc: "https://kmotors.shop/blog",     lastmod: new Date().toISOString(), priority: 0.8, changefreq: "daily"   },
    { loc: "https://kmotors.shop/parts",    lastmod: new Date().toISOString(), priority: 0.8, changefreq: "weekly"  },
    { loc: "https://kmotors.shop/buy",      lastmod: new Date().toISOString(), priority: 0.7, changefreq: "monthly" },
    { loc: "https://kmotors.shop/contact",  lastmod: new Date().toISOString(), priority: 0.6, changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
${alternates(u.loc)}
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
