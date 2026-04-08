import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";
import topics from "@/data/blog-topics.json";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Запрос 1: генерация статьи на русском
const PROMPT_GENERATE = (topic: string) => `
Ты — эксперт по корейскому автопрому и SEO-копирайтер. Напиши статью для автомобильного блога.

Тема: "${topic}"

Требования:
- Объём: 400–500 слов
- Стиль: экспертный, информативный
- Структура: введение → 3 раздела с ## заголовками → вывод
- Формат: Markdown (## заголовки, **жирный**, списки)
- Фокус: польза для покупателя авто из Кореи

Верни ТОЛЬКО валидный JSON (без markdown-обёртки):
{
  "title_ru": "заголовок статьи",
  "excerpt_ru": "краткое описание 1–2 предложения",
  "content_ru": "полный текст в Markdown"
}
`;

// Запрос 2: перевод на 4 языка
const PROMPT_TRANSLATE = (title: string, excerpt: string, content: string) => `
Переведи этот автомобильный контент на 4 языка: английский, корейский, грузинский, арабский.

Заголовок: ${title}
Краткое описание: ${excerpt}
Текст статьи: ${content}

Верни ТОЛЬКО валидный JSON (без markdown-обёртки):
{
  "title_en": "...", "title_ko": "...", "title_ka": "...", "title_ar": "...",
  "excerpt_en": "...", "excerpt_ko": "...", "excerpt_ka": "...", "excerpt_ar": "...",
  "content_en": "...", "content_ko": "...", "content_ka": "...", "content_ar": "..."
}
`;

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  return handleGenerate(req);
}

export async function POST(req: NextRequest) {
  return handleGenerate(req);
}

async function handleGenerate(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createServerClient();

  // Найти следующую неиспользованную тему
  const { data: existingRows } = await supabase.from("blog_posts").select("slug");
  const usedSlugs = new Set((existingRows || []).map((r: { slug: string }) => r.slug));

  // Ручной выбор темы через POST body: { "slug": "..." }
  let chosenTopic: typeof topics[number] | undefined;
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.slug) chosenTopic = topics.find((t) => t.slug === body.slug);
    } catch {}
  }

  if (!chosenTopic) {
    chosenTopic = topics.find((t) => !usedSlugs.has(t.slug));
  }

  if (!chosenTopic) {
    return NextResponse.json({ ok: true, message: "All topics already generated" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  // Запрос 1: генерация на русском
  let ruData: { title_ru: string; excerpt_ru: string; content_ru: string };
  try {
    const result = await model.generateContent(PROMPT_GENERATE(chosenTopic.topic));
    ruData = JSON.parse(result.response.text());
    if (!ruData.title_ru || !ruData.content_ru) throw new Error("Missing RU fields");
  } catch (err) {
    console.error("Gemini generate error:", err);
    return NextResponse.json({ error: "Failed to generate article in Russian", details: String(err) }, { status: 500 });
  }

  // Запрос 2: перевод на 4 языка
  let translData: Record<string, string>;
  try {
    const result = await model.generateContent(
      PROMPT_TRANSLATE(ruData.title_ru, ruData.excerpt_ru, ruData.content_ru)
    );
    translData = JSON.parse(result.response.text());
  } catch (err) {
    console.error("Gemini translate error:", err);
    return NextResponse.json({ error: "Failed to translate article", details: String(err) }, { status: 500 });
  }

  // Сохранить в Supabase как черновик
  const { data: inserted, error: insertError } = await supabase
    .from("blog_posts")
    .insert({
      slug: chosenTopic.slug,
      category: chosenTopic.category,
      source: "ai-generated",
      published: false,
      published_at: new Date().toISOString(),
      tags: chosenTopic.tags,
      title_ru: ruData.title_ru,
      excerpt_ru: ruData.excerpt_ru,
      content_ru: ruData.content_ru,
      title_en: translData.title_en,
      title_ko: translData.title_ko,
      title_ka: translData.title_ka,
      title_ar: translData.title_ar,
      excerpt_en: translData.excerpt_en,
      excerpt_ko: translData.excerpt_ko,
      excerpt_ka: translData.excerpt_ka,
      excerpt_ar: translData.excerpt_ar,
      content_en: translData.content_en,
      content_ko: translData.content_ko,
      content_ka: translData.content_ka,
      content_ar: translData.content_ar,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to save article", details: insertError.message }, { status: 500 });
  }

  const postId = inserted?.id;

  // Уведомление в Telegram
  if (CHAT_ID && postId) {
    const caption =
      `🤖 <b>AI-статья готова к публикации</b>\n\n` +
      `📝 <b>${escapeHtml(ruData.title_ru)}</b>\n\n` +
      `${escapeHtml(ruData.excerpt_ru)}\n\n` +
      `🌐 Языки: RU · EN · KO · KA · AR\n` +
      `🏷 ${chosenTopic.tags.join(", ")}`;

    const keyboard = {
      inline_keyboard: [[
        { text: "✅ Опубликовать", callback_data: `publish:${postId}` },
        { text: "❌ Удалить", callback_data: `delete:${postId}` },
      ]],
    };

    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    slug: chosenTopic.slug,
    postId,
    title: ruData.title_ru,
  });
}
