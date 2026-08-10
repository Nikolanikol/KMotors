// app/sitemap-main.xml/route.ts
import { NextResponse } from "next/server";
import { MODEL_PAGES } from "@/data/model-pages";
import { getIndexableCategorySlugs } from "@/lib/partsCategories";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/customs/core/registry";
import { hasCustomsDictionary } from "@/lib/customs/serverDict";

const BASE = "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ka", "ar"];

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
  { path: "calculator", priority: 0.85, changefreq: "monthly" },
  { path: "buy",     priority: 0.7, changefreq: "monthly" },
  { path: "contact", priority: 0.6, changefreq: "monthly" },
];

function buildUrl(lang: string, path: string) {
  // Без хвостового слэша: trailingSlash=false, /ru/ отдаёт 308 → /ru
  return path ? `${BASE}/${lang}/${path}` : `${BASE}/${lang}`;
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

  // Калькуляторы растаможки по странам.
  //
  // Языки фильтруются по наличию словаря: без перевода страница отдаётся с
  // noindex, а подавать в сайтмапе то, что закрыто от индексации, — прямой
  // конфликт сигналов. Список расширится сам, когда переводы появятся.
  const customsLangs = LANGS.filter(hasCustomsDictionary);
  for (const country of COUNTRIES) {
    // Страна по умолчанию живёт на /calculator, который уже есть в PAGES;
    // её сегмент 301-редиректится туда же и в сайтмапе не нужен.
    if (country.id === DEFAULT_COUNTRY) continue;
    const countryPath = `calculator/${country.id}`;
    const links = customsLangs.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${buildUrl(lang, countryPath)}"/>`
    );
    if (customsLangs.includes("ru")) {
      links.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${buildUrl("ru", countryPath)}"/>`
      );
    }
    for (const lang of customsLangs) {
      const loc = buildUrl(lang, countryPath);
      urlBlocks.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n${links.join("\n")}\n  </url>`
      );
    }
  }

  // Model pages
  for (const model of MODEL_PAGES) {
    const modelPath = `models/${model.slug}`;
    for (const lang of LANGS) {
      const loc = buildUrl(lang, modelPath);
      urlBlocks.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n${alternates(modelPath)}\n  </url>`
      );
    }
  }

  // Категории запчастей. Только те, что проходят порог по числу товаров —
  // остальные отдают noindex, и класть их сюда было бы противоречиво.
  // Список никогда не роняет сайтмап: при сбое БД он просто пустой.
  let categorySlugs: string[] = [];
  try {
    categorySlugs = await getIndexableCategorySlugs();
  } catch {
    categorySlugs = [];
  }
  for (const slug of categorySlugs) {
    const catPath = `parts/category/${slug}`;
    for (const lang of LANGS) {
      const loc = buildUrl(lang, catPath);
      urlBlocks.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n${alternates(catPath)}\n  </url>`
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
