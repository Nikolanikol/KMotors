// Черновик ответа клиенту от Claude. Решение владельца 28.11.2026: Claude
// ПИШЕТ черновик, отправляет человек — кнопкой «Отправить» в теме клиента.
// Сам Claude клиенту не пишет никогда.
//
// Откуда факты: снимок машины (cars_seen) с ценой по KB — тот же расчёт, что на
// сайте; деталь из parts_products с ценой из pricing.ts; ответы клиента на
// вопросы бота; FAQ и этапы покупки из словаря /buy. Всё, чего в фактах нет
// (растаможка в рублях, сроки доставки, наличие), черновик обещает уточнить, а
// не придумывает. Менеджер видит пометку «проверьте цифры» над каждым черновиком.
//
// Нет ANTHROPIC_API_KEY — черновиков нет, бот работает как раньше.

import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { getCarSnapshot } from "@/lib/carsSeen";
import { normalizeBrand } from "@/lib/carLabels";
import { carPriceKrw } from "@/lib/carPricing";
import { getFx } from "@/lib/fx";
import { formatUsd } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { recentMessages, type BotClient, type BotMessage } from "./store";
import { faqItems, stepsText, labelOf, COUNTRIES, BUDGETS, TIMEFRAMES } from "./texts";

const MODEL = "claude-opus-5-5";

// Стабильная часть — в начале и под cache_control: меняется только с кодом.
const SYSTEM = `Ты помогаешь менеджеру компании K-Axis (kmotors.shop) отвечать клиентам в Telegram. K-Axis продаёт подержанные автомобили из Южной Кореи (с площадки Encar и автоаукционов) и оригинальные запчасти Hyundai, Kia, Genesis с доставкой из Кореи.

Ты пишешь ЧЕРНОВИК ответа на последнее сообщение клиента. Менеджер прочитает его и отправит сам или поправит.

Правила:
- Пиши на языке клиента (поле «Язык клиента»): ru — по-русски, en — по-английски.
- Коротко: 2–5 предложений, как живой менеджер в мессенджере. Без markdown, без списков со звёздочками, без подписи. Не здоровайся повторно, если переписка уже идёт.
- Называй ТОЛЬКО те цифры, что есть в блоке «Факты»: цены, пробег, год, номер детали. Никогда не придумывай стоимость доставки, растаможки, утильсбора, сроки доставки, наличие на складе, скидки и гарантии.
- Если клиент спрашивает то, чего нет в фактах (цена под ключ, растаможка, сроки, другие машины), ответь, что менеджер посчитает или уточнит, и, где уместно, задай один уточняющий вопрос (страна и город доставки, бюджет, год, комплектация).
- Цена машины в фактах — это цена автомобиля в Корее со стояночным сбором, без доставки и растаможки. Так и говори.
- Растаможку в стране назначения оформляет покупатель; компания готовит документы и может порекомендовать брокера.
- Не обещай того, чего нет в фактах про процесс покупки. Не спорь с клиентом и не дави.
- Если сообщение клиента не требует ответа (спасибо, ок, стикер), напиши короткую вежливую реплику в одну строку.
- Выведи только текст ответа клиенту — без пояснений для менеджера.`;

function carTitle(s: NonNullable<Awaited<ReturnType<typeof getCarSnapshot>>>): string {
  return [normalizeBrand(s.manufacturer_en), s.model_group_en, s.grade_en, s.year ? String(s.year) : null]
    .filter(Boolean)
    .join(" ");
}

async function carFacts(c: BotClient): Promise<string[]> {
  if (!c.car_id) return [];
  const snap = await getCarSnapshot(c.car_id);
  if (!snap) return [`Клиент смотрел машину №${c.car_id}; данных о ней в базе нет — менеджер проверит, продаётся ли она.`];
  const out = [`Машина, которую смотрел клиент: ${carTitle(snap)}, объявление №${c.car_id}, ${SITE_URL}/${c.lang}/catalog/${c.car_id}`];
  if (snap.mileage) out.push(`Пробег: ${snap.mileage} км`);
  if (snap.price_manwon) {
    const krw = carPriceKrw(snap.price_manwon);
    if (krw > 0) {
      const { krwToRub, krwToUsd } = await getFx("car");
      out.push(
        `Цена в Корее со стояночным сбором: ${krw.toLocaleString("ru-RU")} вон ≈ ${Math.round(krw * krwToRub).toLocaleString("ru-RU")} ₽ ≈ $${Math.round(krw * krwToUsd).toLocaleString("en-US")} (без доставки и растаможки)`,
      );
    }
  }
  return out;
}

async function partFacts(c: BotClient): Promise<string[]> {
  if (!c.part_number) return [];
  try {
    const flat = c.part_number.replace(/[-\s]/g, "");
    const { data } = await createServerClient()
      .from("parts_products")
      .select("part_number, name_ru, name_en, price_krw")
      .in("part_number", [c.part_number, flat, `${flat.slice(0, 5)}-${flat.slice(5)}`])
      .gt("price_krw", 0)
      .order("id")
      .limit(1);
    const p = data?.[0] as { part_number: string; name_ru: string | null; name_en: string | null; price_krw: number } | undefined;
    if (!p) return [`Клиент спрашивал деталь ${c.part_number}; в каталоге сайта её нет — менеджер уточнит цену и возможность заказа.`];
    const { krwToUsd } = await getFx("market");
    return [`Деталь, которую смотрел клиент: ${p.name_ru ?? p.name_en ?? ""}, номер ${p.part_number}, цена ${formatUsd(p.price_krw, krwToUsd)} без доставки`];
  } catch {
    return [`Клиент спрашивал деталь ${c.part_number}.`];
  }
}

/** Блок «Факты» — всё, на что черновик имеет право опираться. */
export async function buildFacts(c: BotClient): Promise<string> {
  const lines = [
    `Язык клиента: ${c.lang}`,
    `Имя клиента: ${[c.first_name, c.last_name].filter(Boolean).join(" ") || "неизвестно"}`,
    ...(await carFacts(c)),
    ...(await partFacts(c)),
  ];
  if (c.country) lines.push(`Страна доставки (ответ на вопрос бота): ${labelOf(COUNTRIES, c.country, "ru")}`);
  if (c.budget) lines.push(`Бюджет (ответ на вопрос бота): ${labelOf(BUDGETS, c.budget, "ru")}`);
  if (c.timeframe) lines.push(`Сроки покупки (ответ на вопрос бота): ${labelOf(TIMEFRAMES, c.timeframe, "ru")}`);

  const faq = faqItems("ru").map((f) => `— ${f.q}\n${f.a}`).join("\n");
  const steps = stepsText("ru").replace(/<[^>]+>/g, "");
  return `${lines.join("\n")}\n\nЧастые вопросы (официальные ответы компании):\n${faq}\n\n${steps}`;
}

export function historyText(history: BotMessage[]): string {
  return history.map((m) => `${m.role === "client" ? "Клиент" : "Менеджер"}: ${m.text}`).join("\n");
}

let client: Anthropic | null = null;
function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

export function draftsEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Черновик ответа на последнее сообщение клиента или null (нет ключа, отказ, сбой). */
export async function generateDraft(c: BotClient): Promise<string | null> {
  const api = anthropic();
  if (!api) return null;
  const history = await recentMessages(c.chat_id, 20);
  if (!history.length || history[history.length - 1].role !== "client") return null;

  try {
    const res = await api.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Факты:\n${await buildFacts(c)}\n\nПереписка (последнее сообщение — от клиента):\n${historyText(history)}\n\nНапиши черновик ответа клиенту.`,
        },
      ],
    });
    if (res.stop_reason === "refusal") {
      console.warn("[tgbot] черновик: отказ модели", res.stop_details?.category);
      return null;
    }
    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error("[tgbot] черновик: неверный ANTHROPIC_API_KEY");
    else if (e instanceof Anthropic.RateLimitError) console.error("[tgbot] черновик: лимит запросов");
    else if (e instanceof Anthropic.APIError) console.error(`[tgbot] черновик: API ${e.status}:`, e.message);
    else console.error("[tgbot] черновик упал:", (e as Error)?.message);
    return null;
  }
}
