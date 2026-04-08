import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";
import topics from "@/data/blog-topics.json";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const LANGS = ["ru", "en", "ko", "ka", "ar"] as const;

const PROMPT_TEMPLATE = (topic: string) => `
Ты — эксперт по корейскому автопрому и SEO-копирайтер. Напиши подробную статью для автомобильного блога.

Тема статьи: "${topic}"

Требования к статье:
- Объём: 600–900 слов на русском
- Стиль: экспертный, информативный, без воды
- Структура: введение → 3–4 раздела с подзаголовками H2 → вывод
- Формат контента: Markdown (используй ## для H2, **жирный**, списки)
- Фокус: практическая польза для покупателя авто из Кореи

Верни ТОЛЬКО валидный JSON без markdown-обёртки, без комментариев. Структура:
{
  "title_ru": "...",
  "title_en": "...",
  "title_ko": "...",
  "title_ka": "...",
  "title_ar": "...",
  "excerpt_ru": "краткое описание 1–2 предложения на русском",
  "excerpt_en": "краткое описание на английском",
  "excerpt_ko": "краткое описание на корейском",
  "excerpt_ka": "краткое описание на грузинском",
  "excerpt_ar": "краткое описание на арабском",
  "content_ru": "полный текст статьи в Markdown на русском",
  "content_en": "полный перевод статьи на английский",
  "content_ko": "полный перевод статьи на корейский",
  "content_ka": "полный перевод статьи на грузинский",
  "content_ar": "полный перевод статьи на арабский"
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

  // Find next unused topic
  const { data: existingRows } = await supabase
    .from("blog_posts")
    .select("slug");

  const usedSlugs = new Set((existingRows || []).map((r: { slug: string }) => r.slug));

  // Allow manual topic override via POST body
  let chosenTopic: typeof topics[number] | undefined;
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.slug) {
        chosenTopic = topics.find((t) => t.slug === body.slug);
      }
    } catch {}
  }

  if (!chosenTopic) {
    chosenTopic = topics.find((t) => !usedSlugs.has(t.slug));
  }

  if (!chosenTopic) {
    return NextResponse.json({ ok: true, message: "All topics already generated" });
  }

  // Generate article with Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  let articleData: Record<string, string>;
  try {
    const result = await model.generateContent(PROMPT_TEMPLATE(chosenTopic.topic));
    const text = result.response.text();
    articleData = JSON.parse(text);
  } catch (err) {
    console.error("Gemini generation error:", err);
    return NextResponse.json({ error: "Failed to generate article", details: String(err) }, { status: 500 });
  }

  // Validate required fields
  const requiredFields = LANGS.flatMap((l) => [`title_${l}`, `excerpt_${l}`, `content_${l}`]);
  const missing = requiredFields.filter((f) => !articleData[f]);
  if (missing.length > 0) {
    return NextResponse.json({ error: "Gemini returned incomplete data", missing }, { status: 500 });
  }

  // Save to Supabase as draft
  const { data: inserted, error: insertError } = await supabase
    .from("blog_posts")
    .insert({
      slug: chosenTopic.slug,
      category: chosenTopic.category,
      source: "ai-generated",
      published: false,
      published_at: new Date().toISOString(),
      tags: chosenTopic.tags,
      title_ru: articleData.title_ru,
      title_en: articleData.title_en,
      title_ko: articleData.title_ko,
      title_ka: articleData.title_ka,
      title_ar: articleData.title_ar,
      excerpt_ru: articleData.excerpt_ru,
      excerpt_en: articleData.excerpt_en,
      excerpt_ko: articleData.excerpt_ko,
      excerpt_ka: articleData.excerpt_ka,
      excerpt_ar: articleData.excerpt_ar,
      content_ru: articleData.content_ru,
      content_en: articleData.content_en,
      content_ko: articleData.content_ko,
      content_ka: articleData.content_ka,
      content_ar: articleData.content_ar,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to save article", details: insertError.message }, { status: 500 });
  }

  const postId = inserted?.id;

  // Send Telegram notification
  if (CHAT_ID && postId) {
    const caption =
      `🤖 <b>AI-статья готова к публикации</b>\n\n` +
      `📝 <b>${escapeHtml(articleData.title_ru)}</b>\n\n` +
      `${escapeHtml(articleData.excerpt_ru)}\n\n` +
      `🌐 Языки: RU · EN · KO · KA · AR\n` +
      `🏷 ${chosenTopic.tags.join(", ")}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Опубликовать", callback_data: `publish:${postId}` },
          { text: "❌ Удалить", callback_data: `delete:${postId}` },
        ],
      ],
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
    title: articleData.title_ru,
  });
}
