// app/sitemap-main.xml/route.ts
import { NextResponse } from "next/server";

const BASE = "https://kmotors.shop";
const LANGS = ["ru", "en", "ko", "ka", "ar"];

interface PageConfig {
  path: string; // e.g. "" for home, "catalog", "blog", etc.
  priority: number;
  changefreq: string;
}

const PAGES: PageConfig[] = [
  { path: "",        priority: 1.0, changefreq: "weekly"  },
  { path: "catalog", priority: 0.9, changefreq: "weekly"  },
  { path: "blog",    priority: 0.8, changefreq: "daily"   },
  { path: "parts",   priority: 0.8, changefreq: "weekly"  },
  { path: "buy",     priority: 0.7, changefreq: "monthly" },
  { path: "contact", priority: 0.6, changefreq: "monthly" },
];

function buildUrl(lang: string, path: string) {
  return path ? `${BASE}/${lang}/${path}` : `${BASE}/${lang}/`;
}

function alternates(path: string) {
  const links = LANGS.map(
    (lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${buildUrl(lang, path)}"/>`
  );
  // x-default points to Russian
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${buildUrl("ru", path)}"/>`
  );
  return links.join("\n");
}

export async function GET() {
  const now = new Date().toISOString();

  // Generate one <url> block per page × language
  const urlBlocks: string[] = [];

  for (const page of PAGES) {
    for (const lang of LANGS) {
      const loc = buildUrl(lang, page.path);
      urlBlocks.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n${alternates(page.path)}\n  </url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
