/**
 * Генерирует список URL для отправки в Bing Webmaster → URL Submission
 * Запуск: npx ts-node --project tsconfig.scripts.json scripts/bing-urls.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const BASE = "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ko", "ka", "ar"];

const STATIC_PAGES = [
  "",           // главная
  "/catalog",
  "/parts",
  "/blog",
  "/buy",
  "/calculator",
  "/contact",
  "/privacy",
];

const MODEL_SLUGS = [
  "kia-sorento",
  "hyundai-tucson",
  "kia-carnival",
  "hyundai-palisade",
  "hyundai-santa-fe",
  "genesis-gv80",
  "kia-k5",
  "hyundai-sonata",
  "kia-sportage",
];

async function main() {
  const urls: string[] = [];

  // 1. Основные страницы × все языки
  for (const lang of LANGS) {
    for (const page of STATIC_PAGES) {
      urls.push(`${BASE}/${lang}${page}`);
    }
  }

  // 2. Страницы моделей × ru + en
  for (const slug of MODEL_SLUGS) {
    urls.push(`${BASE}/ru/models/${slug}`);
    urls.push(`${BASE}/en/models/${slug}`);
  }

  // 3. Статьи блога из Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(40);

    if (posts) {
      for (const post of posts) {
        urls.push(`${BASE}/ru/blog/${post.slug}`);
        urls.push(`${BASE}/en/blog/${post.slug}`);
      }
    }
  } catch (e) {
    console.error("Supabase error:", e);
  }

  // Вывод
  console.log(`\n✅ Итого URL: ${urls.length}\n`);
  console.log("=".repeat(50));
  urls.forEach(url => console.log(url));
  console.log("=".repeat(50));
  console.log(`\nСкопируй список выше и вставь в Bing Webmaster → URL Submission`);
}

main();
