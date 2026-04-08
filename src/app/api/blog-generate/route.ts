import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface BlogTopic {
  id: string;
  slug: string;
  topic: string;
  category: string;
  type: string;
  models: string[];
  tags: string[];
  priority: number;
  status: string;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  comparison: "сравнение двух или более моделей",
  review: "обзор модели с плюсами и минусами",
  guide: "практический гайд с пошаговыми инструкциями",
  education: "образовательный материал об автомобилях, технологиях или рынке",
};

function buildGeneratePrompt(topic: BlogTopic): string {
  const typeLabel = TYPE_LABELS[topic.type] || topic.type;
  const modelsLine = topic.models.length
    ? `Модели в статье: ${topic.models.join(", ")}.`
    : "";
  const notesLine = topic.notes ? `Дополнительные инструкции: ${topic.notes}` : "";

  return `Ты — эксперт по корейскому автопрому и SEO-копирайтер. Напиши статью для автомобильного блога.

Тема: "${topic.topic}"
Тип контента: ${typeLabel}
${modelsLine}
${notesLine}

Требования:
- Объём: 400–500 слов
- Стиль: экспертный, информативный, без воды
- Структура: введение → 3 раздела с ## заголовками → вывод
- Формат: Markdown (## заголовки, **жирный**, списки)
- Фокус: практическая польза для покупателя авто из Кореи в СНГ

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "title_ru": "заголовок статьи",
  "excerpt_ru": "краткое описание 1–2 предложения",
  "content_ru": "полный текст в Markdown"
}`;
}

function buildTranslatePrompt(title: string, excerpt: string, content: string): string {
  return `Переведи этот автомобильный контент на 4 языка: английский, корейский, грузинский, арабский.
Сохрани Markdown-форматирование в content.

Заголовок: ${title}
Краткое описание: ${excerpt}
Текст: ${content}

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "title_en": "...", "title_ko": "...", "title_ka": "...", "title_ar": "...",
  "excerpt_en": "...", "excerpt_ko": "...", "excerpt_ka": "...", "excerpt_ar": "...",
  "content_en": "...", "content_ko": "...", "content_ka": "...", "content_ar": "..."
}`;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  // Выбрать тему: вручную через POST body { "id": "..." } или автоматически по приоритету
  let topic: BlogTopic | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.id) {
        const { data } = await supabase
          .from("blog_topics")
          .select("*")
          .eq("id", body.id)
          .single();
        topic = data;
      }
    } catch {}
  }

  if (!topic) {
    // Автоматически: первая pending-тема с максимальным приоритетом
    const { data } = await supabase
      .from("blog_topics")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(1)
      .single();
    topic = data;
  }

  if (!topic) {
    return NextResponse.json({ ok: true, message: "No pending topics available" });
  }

  // Проверить что slug ещё не использован
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", topic.slug)
    .single();

  if (existing) {
    // Пометить как generated и вернуть
    await supabase.from("blog_topics").update({ status: "generated" }).eq("id", topic.id);
    return NextResponse.json({ ok: true, message: "Topic already generated", slug: topic.slug });
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
    const result = await model.generateContent(buildGeneratePrompt(topic));
    ruData = JSON.parse(result.response.text());
    if (!ruData.title_ru || !ruData.content_ru) throw new Error("Missing RU fields");
  } catch (err) {
    console.error("Gemini generate error:", err);
    return NextResponse.json({ error: "Failed to generate article", details: String(err) }, { status: 500 });
  }

  // Запрос 2: перевод на 4 языка
  let translData: Record<string, string>;
  try {
    const result = await model.generateContent(
      buildTranslatePrompt(ruData.title_ru, ruData.excerpt_ru, ruData.content_ru)
    );
    translData = JSON.parse(result.response.text());
  } catch (err) {
    console.error("Gemini translate error:", err);
    return NextResponse.json({ error: "Failed to translate article", details: String(err) }, { status: 500 });
  }

  // Сохранить в blog_posts как черновик
  const { data: inserted, error: insertError } = await supabase
    .from("blog_posts")
    .insert({
      slug: topic.slug,
      category: topic.category,
      source: "ai-generated",
      published: false,
      published_at: new Date().toISOString(),
      tags: topic.tags,
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

  // Обновить статус темы → generated
  await supabase.from("blog_topics").update({ status: "generated" }).eq("id", topic.id);

  const postId = inserted?.id;

  // Уведомление в Telegram
  if (CHAT_ID && postId) {
    const typeEmoji: Record<string, string> = {
      comparison: "⚖️",
      review: "🔍",
      guide: "📋",
      education: "🎓",
    };

    const caption =
      `🤖 <b>AI-статья готова к публикации</b>\n\n` +
      `${typeEmoji[topic.type] || "📝"} <b>${escapeHtml(ruData.title_ru)}</b>\n\n` +
      `${escapeHtml(ruData.excerpt_ru)}\n\n` +
      `📂 Тип: ${topic.type} · Приоритет: ${topic.priority}/10\n` +
      `🌐 Языки: RU · EN · KO · KA · AR\n` +
      `🏷 ${topic.tags.join(", ")}`;

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
    slug: topic.slug,
    postId,
    title: ruData.title_ru,
    type: topic.type,
    priority: topic.priority,
  });
}
