import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function fetchCoverImage(models: string[], tags: string[], type: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  // Строим очередь запросов от конкретного к общему
  const brand = models[0]?.split(" ")[0]; // "Hyundai", "Kia", "Genesis"
  const model = models[0]; // "Hyundai Tucson"

  const queries: string[] = [];

  if (model) queries.push(`${model}`);
  if (brand) queries.push(`${brand} car interior`);
  if (brand) queries.push(`${brand} automobile`);

  // Fallback по типу контента
  const typeFallbacks: Record<string, string> = {
    comparison: "car comparison luxury sedan",
    review: "modern car showroom",
    guide: "car dealership",
    education: "car engine mechanics",
  };
  queries.push(typeFallbacks[type] || "luxury korean car");
  queries.push("modern automobile");

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      );
      const data = await res.json();
      if (data.photos?.length > 0) {
        // Берём случайное фото из первых 5 для разнообразия
        const pick = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
        return pick.src.large2x;
      }
    } catch {}
  }
  return null;
}

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

  const tagHints = [
    ...topic.models,
    ...topic.tags,
    topic.type,
  ].filter(Boolean).join(", ");

  return `Ты — опытный автомобилист и знаток корейского авторынка. Ты помогаешь людям из СНГ выбирать и покупать автомобили из Кореи. Пишешь как умный друг — без занудства и маркетинговых штампов, но с реальными знаниями.

Тема статьи: "${topic.topic}"
Тип: ${typeLabel}
${modelsLine}
${notesLine}

СТИЛЬ И ПОДАЧА:
- Говори как человек, который сам ездил на этих машинах и знает их изнутри
- Вместо сухих цифр — живые сравнения: не "123 л.с.", а "хватает для города, но на трассе с полным салоном чувствуешь нехватку"
- Приводи конкретные сценарии владения: "если едешь раз в неделю на дачу — подойдёт, если по горному серпантину — уже нет"
- Честно говори о слабых местах — это строит доверие, а не отпугивает
- Никакого корпоративного языка, никаких "данный автомобиль обладает превосходными характеристиками"
- Читатель должен дочитать до конца, потому что интересно — а не потому что надо

СТРУКТУРА (строго):
1. Вступление (2–3 предложения) — сразу суть, без воды. Читатель должен понять о чём статья с первых слов
2. Три раздела с ## заголовками — каждый раскрывает один аспект темы
3. Финальный раздел "## Итог" — обязательно заканчивай конкретным выводом в формате:
   **Брать если:** [конкретная ситуация]
   **Не брать если:** [конкретная ситуация]

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Объём: 450–550 слов
- Формат: Markdown (## заголовки, **жирный** для важного, - списки где уместно)
- Фокус: покупатель корейского авто из Кореи в СНГ — реальные цены, реальный рынок, реальные проблемы

ТЕГИ (важно):
Сгенерируй 5–8 точных тегов на основе: ${tagHints}
Теги должны включать: названия моделей (и корейские названия если есть, например Avante = Elantra), названия двигателей, бренд, тип контента.
Пример хороших тегов: ["Hyundai Elantra", "Avante", "Nu 1.6", "Hyundai", "сравнение двигателей", "обзор"]

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{
  "title_ru": "заголовок статьи — конкретный и цепляющий, без воды",
  "excerpt_ru": "1–2 предложения: о чём статья и почему стоит читать",
  "content_ru": "полный текст в Markdown",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"]
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
  let ruData: { title_ru: string; excerpt_ru: string; content_ru: string; tags?: string[] };
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

  // Теги: берём из ответа Gemini, fallback на теги из темы
  const finalTags = (ruData.tags && ruData.tags.length > 0) ? ruData.tags : topic.tags;

  // Получить обложку с Pexels
  const coverUrl = await fetchCoverImage(topic.models, finalTags, topic.type);

  // Сохранить в blog_posts как черновик
  const { data: inserted, error: insertError } = await supabase
    .from("blog_posts")
    .insert({
      slug: topic.slug,
      category: topic.category,
      source: "ai-generated",
      cover_url: coverUrl,
      published: false,
      published_at: new Date().toISOString(),
      tags: finalTags,
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
      `🏷 ${finalTags.join(", ")}`;

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
