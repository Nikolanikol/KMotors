// Факты и история для черновика ответа клиенту. Решение владельца 28.11.2026:
// черновики пишет Claude в сессии Claude Code (без API-ключа в проде) — читает
// /api/bot/drafts (кто ждёт ответа + факты + переписка) и кладёт черновик в тему
// клиента через POST туда же. Клиенту отправляет человек кнопкой «Отправить».
//
// Откуда факты: снимок машины (cars_seen) с ценой по KB — тот же расчёт, что на
// сайте; деталь из parts_products с ценой из pricing.ts; ответы клиента на
// вопросы бота; FAQ и этапы покупки из словаря /buy. Чего в фактах нет
// (растаможка в рублях, сроки доставки, наличие), черновик обещает уточнить.

import { createServerClient } from "@/lib/supabase";
import { getCarSnapshot } from "@/lib/carsSeen";
import { normalizeBrand } from "@/lib/carLabels";
import { carPriceKrw } from "@/lib/carPricing";
import { getFx } from "@/lib/fx";
import { formatUsd } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import type { BotClient, BotMessage } from "./store";
import { faqItems, stepsText, labelOf, COUNTRIES, BUDGETS, TIMEFRAMES } from "./texts";

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
