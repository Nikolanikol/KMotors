import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";
import { buildEncarGrounding } from "@/lib/encarModelPrices";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function fetchCoverImage(imageQuery: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !imageQuery) return null;

  // Основной запрос от Gemini + fallback на корейское авто
  const queries = [imageQuery, "korean car road landscape"];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      );
      const data = await res.json();
      if (data.photos?.length > 0) {
        const pick = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
        return pick.src.large2x;
      }
    } catch {}
  }
  return null;
}

// Курс KRW за 1 USD (для конвертации encar-цен в USD). Тот же бесплатный CDN,
// что использует /api/exchange-rate. Фолбэк ~1350, если источник недоступен.
async function fetchKrwPerUsd(): Promise<number> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { cache: "no-store" }
    );
    const data = await res.json();
    const krw = Number(data?.usd?.krw);
    return krw > 0 ? krw : 1350;
  } catch {
    return 1350;
  }
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

function buildGeneratePrompt(topic: BlogTopic, grounding = ""): string {
  const typeLabel = TYPE_LABELS[topic.type] || topic.type;
  const modelsLine = topic.models.length ? `Модели: ${topic.models.join(", ")}.` : "";
  const notesLine = topic.notes ? `Уточнение: ${topic.notes}` : "";
  const tagHints = [...topic.models, ...topic.tags, topic.type].filter(Boolean).join(", ");

  // Вариативность структуры — анти-footprint при потоковой генерации.
  const STRUCTURES = [
    `- Вступление: 2–3 предложения, сразу суть
- 4–5 разделов с ## заголовками, каждый раскрывает отдельный аспект
- Финал "## Итог": **Брать если:** / **Не брать если:**`,
    `- Зацепка: реальная ситуация покупателя (2–3 предложения)
- 4–5 разделов ## по логике «проблема → разбор → что делать»
- Финал "## Коротко": 3–4 пункта-вывода`,
    `- Вступление с ключевым выводом статьи сразу
- 4–6 разделов ## : обзор → детали → подводные камни → альтернативы
- Финал "## Стоит ли": честный вывод «да/нет и почему»`,
  ];
  const structure = STRUCTURES[Math.floor(Math.random() * STRUCTURES.length)];

  return `Ты ведёшь блог для людей, которые покупают корейские авто из Кореи в СНГ. Пишешь как человек, который сам через это прошёл — знаешь реальные цены, знаешь что скрывают дилеры, знаешь какие машины гниют через три года а какие ходят без проблем.

Тема: "${topic.topic}"
Тип материала: ${typeLabel}
${modelsLine}
${notesLine}
${grounding}
Вот пример правильного тона (первый абзац реальной статьи из блога):
"Kia Sportage четвёртого поколения на корейском рынке стоит от 18 до 26 тысяч долларов в зависимости от года и комплектации. Звучит неплохо, пока не начинаешь считать таможню. С учётом пошлин машина 2021 года с двигателем 2.0 выходит примерно в 2,4 миллиона рублей во Владивостоке — и это без доставки до вашего города."

Пиши так же: конкретно, с цифрами, без восхвалений и «воды».

ФАКТЫ — критично, не выдумывай:
- Правильно указывай марку модели. Hyundai: Staria, Palisade, Tucson, Santa Fe, Avante (Elantra), Sonata, Grandeur, Kona, Casper, Creta, Starex, Ioniq. Kia: Carnival, Sorento, Sportage, Telluride, Seltos, Stinger, K5, K7, K8, EV6, Mohave, Soul. Genesis — отдельный бренд (G70/G80/G90, GV70/GV80).
- Если в теме марка модели указана неверно (например «Kia Staria» — на деле это Hyundai) — используй ПРАВИЛЬНУЮ марку, не повторяй ошибку из темы.
- Не выдумывай несуществующие модели, комплектации, коды двигателей. Если не уверен в конкретной цифре — дай диапазон или напиши «уточняйте у продавца», но не подавай выдуманное точное значение как факт.

Структура:
${structure}

Обязательно: минимум одна таблица в Markdown с конкретными числами (сравнение по поколениям / комплектациям / ценам / платежам — что уместно теме).

Объём: 900–1200 слов. Markdown-форматирование. Каждый раздел — по существу, без повторов ради объёма.

Сгенерируй 5–8 тегов из: ${tagHints}
Включи корейские названия моделей если применимо (Avante = Elantra, Tucson = ix35 и т.д.)

Верни ТОЛЬКО валидный JSON:
{
  "title_ru": "конкретный заголовок без воды",
  "excerpt_ru": "1–2 предложения о чём статья",
  "content_ru": "полный текст в Markdown",
  "tags": ["тег1", "тег2"],
  "image_query": "точный запрос для поиска фото на Pexels на английском — 4-6 слов, описывает что должно быть на обложке. Для статьи о машине: модель + цвет + сцена. Для гайда: предмет или действие из статьи"
}`;
}

// Языки перевода. Нужны только ru + en → переводим лишь на английский
// (одним вызовом на язык, чтобы длинные статьи не переполняли maxOutputTokens).
// ko/ka/ar не генерируем — их страницы noindex.
const TRANSLATE_LANGS: { code: string; name: string }[] = [
  { code: "en", name: "английский" },
];

// Gemini иногда вставляет сырые control-символы (перевод строки и т.п.) ВНУТРЬ
// строковых значений JSON — тогда JSON.parse падает («Bad control character» /
// «Unterminated string»). Пытаемся распарсить как есть; при ошибке экранируем
// control-символы только внутри строк (структурные пробелы/переводы строк не трогаем).
function safeJsonParse<T = unknown>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    let out = "";
    let inStr = false;
    let esc = false;
    for (const ch of text) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && ch.charCodeAt(0) <= 0x1f) {
        out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t" : "";
        continue;
      }
      out += ch;
    }
    return JSON.parse(out) as T;
  }
}

function buildTranslatePrompt(langName: string, title: string, excerpt: string, content: string): string {
  return `Переведи этот автомобильный контент на ${langName} язык.
Сохрани Markdown-форматирование (включая таблицы) в поле content.

Заголовок: ${title}
Краткое описание: ${excerpt}
Текст: ${content}

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{ "title": "...", "excerpt": "...", "content": "..." }`;
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
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  // Retry-обёртка: 3 попытки с паузой 2 сек
  async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        console.error(`${label} — попытка ${attempt}/3:`, err);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    throw lastError;
  }

  // Грунтинг реальными ценами с encar по моделям темы (не блокирует генерацию:
  // если моделей нет или encar недоступен — grounding пустой).
  const krwPerUsd = await fetchKrwPerUsd();
  const grounding = await buildEncarGrounding(topic.models, krwPerUsd);

  // Запрос 1: генерация на русском
  let ruData: { title_ru: string; excerpt_ru: string; content_ru: string; tags?: string[]; image_query?: string };
  try {
    ruData = await withRetry(async () => {
      const result = await model.generateContent(buildGeneratePrompt(topic, grounding));
      const parsed = safeJsonParse(result.response.text()) as { title_ru: string; excerpt_ru: string; content_ru: string; tags?: string[]; image_query?: string };
      if (!parsed.title_ru || !parsed.content_ru) throw new Error("Missing RU fields");
      // Квалити-гейт: не пускаем тонкий контент (цель 900–1200 слов, порог 700).
      const wordCount = (parsed.content_ru.match(/\S+/g) || []).length;
      if (wordCount < 700) throw new Error(`Too short: ${wordCount} words (min 700)`);
      // Требуем хотя бы одну Markdown-таблицу.
      if (!/\|.*\|/.test(parsed.content_ru)) throw new Error("No markdown table in content");
      return parsed;
    }, "Gemini generate");
  } catch (err) {
    console.error("Gemini generate failed after 3 attempts:", err);
    await supabase.from("blog_topics").update({ status: "failed" }).eq("id", topic.id);
    return NextResponse.json({ error: "Failed to generate article after retries", details: String(err) }, { status: 500 });
  }

  // Запрос 2: перевод — по одному языку за вызов (иначе на длинных статьях
  // JSON обрывается по maxOutputTokens). Сбой одного языка не рушит остальные;
  // русский всегда сохраняется.
  const translData: Record<string, string> = {};
  for (const { code, name } of TRANSLATE_LANGS) {
    try {
      const parsed = await withRetry(async () => {
        const result = await model.generateContent(
          buildTranslatePrompt(name, ruData.title_ru, ruData.excerpt_ru, ruData.content_ru)
        );
        const p = safeJsonParse(result.response.text()) as { title?: string; excerpt?: string; content?: string };
        if (!p.title || !p.content) throw new Error("Missing translated fields");
        return p;
      }, `Gemini translate ${code}`);
      translData[`title_${code}`] = parsed.title ?? "";
      translData[`excerpt_${code}`] = parsed.excerpt ?? "";
      translData[`content_${code}`] = parsed.content ?? "";
    } catch (err) {
      console.error(`Gemini translate ${code} failed after retries:`, err);
      // Пропускаем только этот язык — не теряем остальные и русский оригинал
    }
  }

  // Теги: берём из ответа Gemini, fallback на теги из темы
  const finalTags = (ruData.tags && ruData.tags.length > 0) ? ruData.tags : topic.tags;

  // Получить обложку с Pexels — используем запрос от Gemini
  const coverUrl = await fetchCoverImage(ruData.image_query || "");

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kmotors.shop";
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Опубликовать", callback_data: `publish:${postId}` },
          { text: "✏️ Редактировать", url: `${siteUrl}/admin/blog/${postId}` },
        ],
        [
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
    slug: topic.slug,
    postId,
    title: ruData.title_ru,
    type: topic.type,
    priority: topic.priority,
  });
}
