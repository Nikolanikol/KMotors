// Фаза 3 SEO-автоматики: генерация SEO-контента для карточек запчастей.
//
// Источник кандидатов (пилот): карточки, которые УЖЕ показываются в поиске
// (seo_page_stats, section=parts, impressions>=1) и ещё не улучшались.
// Для каждой Gemini пишет title/description/описание (ru+en) и — осторожно —
// кросс-номера. Результат кладётся в seo_suggestions как draft (на Telegram-гейт).
// В прод/на карточку ничего не попадает до апрува.

import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLlm, QuotaError, type LlmClient } from "@/lib/llm";

const RECENT_DAYS = 30;      // не предлагать повторно то, что уже предлагали недавно
const THROTTLE_MS = 1200;    // пауза между вызовами LLM (щадим rate limit)

export type Candidate = {
  product_id: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type Generated = {
  title_ru: string;
  title_en: string;
  desc_ru: string;
  desc_en: string;
  body_ru: string;
  body_en: string;
  cross_refs: string[];
};

// ── Выбор кандидатов ────────────────────────────────────────────────────────
export async function selectPartCandidates(
  supabase: SupabaseClient,
  limit: number
): Promise<Candidate[]> {
  // Берём свежие снапшоты карточек запчастей с показами
  const { data: stats } = await supabase
    .from("seo_page_stats")
    .select("product_id, impressions, ctr, position")
    .eq("section", "parts")
    .not("product_id", "is", null)
    .gte("impressions", 1);

  // Агрегируем по товару (суммарные показы, взвешенная позиция)
  const byProduct = new Map<number, { impr: number; clicksPos: number; ctrSum: number; n: number }>();
  for (const r of stats ?? []) {
    const cur = byProduct.get(r.product_id) ?? { impr: 0, clicksPos: 0, ctrSum: 0, n: 0 };
    cur.impr += r.impressions;
    cur.clicksPos += (r.position ?? 0) * r.impressions;
    cur.ctrSum += r.ctr ?? 0;
    cur.n += 1;
    byProduct.set(r.product_id, cur);
  }

  // Исключаем товары со свежим предложением (draft/approved/applied за RECENT_DAYS)
  const since = new Date(Date.now() - RECENT_DAYS * 864e5).toISOString();
  const { data: recent } = await supabase
    .from("seo_suggestions")
    .select("product_id")
    .gte("created_at", since)
    .neq("status", "rejected")
    .not("product_id", "is", null);
  const skip = new Set((recent ?? []).map((r) => r.product_id));

  const candidates: Candidate[] = [];
  for (const [product_id, v] of byProduct) {
    if (skip.has(product_id)) continue;
    candidates.push({
      product_id,
      impressions: v.impr,
      ctr: v.ctrSum / v.n,
      position: v.impr ? v.clicksPos / v.impr : 0,
    });
  }

  // Приоритет: больше показов — раньше в очереди
  candidates.sort((a, b) => b.impressions - a.impressions);
  return candidates.slice(0, limit);
}

// ── Контекст товара для промпта ─────────────────────────────────────────────
async function fetchContext(supabase: SupabaseClient, productId: number) {
  const { data: p } = await supabase
    .from("parts_products")
    .select("id, part_number, name_ru, name_en, manufacturer, category_id, subcategory_id")
    .eq("id", productId)
    .limit(1)
    .maybeSingle();
  if (!p) return null;

  const { data: pv } = await supabase
    .from("part_vehicles")
    .select("vehicles(name_en, brand, year_from, year_to)")
    .eq("part_id", productId)
    .limit(30);
  const vehicles = (pv ?? [])
    .map((r) => r.vehicles as unknown as { name_en: string; brand: string; year_from: string | null; year_to: string | null } | null)
    .filter((v): v is NonNullable<typeof v> => !!v);

  const catIds = [p.category_id, p.subcategory_id].filter((x): x is number => !!x);
  let cats: { name_ru: string | null; name_en: string | null }[] = [];
  if (catIds.length) {
    const { data } = await supabase.from("parts_categories").select("name_ru, name_en").in("id", catIds);
    cats = data ?? [];
  }

  return { p, vehicles, cats };
}

// ── Промпт ──────────────────────────────────────────────────────────────────
function buildPrompt(ctx: NonNullable<Awaited<ReturnType<typeof fetchContext>>>): string {
  const { p, vehicles, cats } = ctx;
  const compat = vehicles
    .map((v) => `${v.brand} ${v.name_en}${v.year_from ? ` (${v.year_from}${v.year_to ? `–${v.year_to}` : "+"})` : ""}`)
    .join("; ");
  const category = cats.map((c) => c.name_ru || c.name_en).filter(Boolean).join(" / ");

  return `Ты — SEO-редактор магазина автозапчастей Hyundai/Kia/Genesis из Кореи (kmotors.shop).
Составь SEO-контент для карточки запчасти. Отвечай СТРОГО валидным JSON без markdown.

ДАННЫЕ О ДЕТАЛИ (используй только их, ничего не выдумывай про характеристики):
- Название (RU): ${p.name_ru || "—"}
- Название (EN): ${p.name_en || "—"}
- Каталожный номер (OEM): ${p.part_number || "—"}
- Производитель: ${p.manufacturer || "—"}
- Категория: ${category || "—"}
- Совместимость (модели/годы): ${compat || "нет данных"}

ТРЕБОВАНИЯ:
- title_ru / title_en: до 60 символов, включи каталожный номер и слово купить/buy. Естественно, без спама.
- desc_ru / desc_en: meta description до 155 символов, польза + номер + доставка из Кореи.
- body_ru / body_en: 2–4 предложения живого текста: что за деталь, к каким моделям подходит (по данным выше). НЕ придумывай размеры/материалы, которых нет в данных.
- cross_refs: массив кросс-номеров (OEM-аналогов) ТОЛЬКО если ты уверен, что это реальные общеизвестные аналоги именно этого номера. Если не уверен — верни []. НИКОГДА не выдумывай номера.

Формат ответа (JSON):
{"title_ru":"","title_en":"","desc_ru":"","desc_en":"","body_ru":"","body_en":"","cross_refs":[]}`;
}

// ── Генерация одной карточки ────────────────────────────────────────────────
async function generateOne(
  llm: LlmClient,
  ctx: NonNullable<Awaited<ReturnType<typeof fetchContext>>>
): Promise<Generated> {
  const parsed = await llm.generateJSON<Record<string, unknown>>(buildPrompt(ctx));
  if (!parsed.title_ru || !parsed.title_en) throw new Error("Missing title fields");
  return {
    title_ru: String(parsed.title_ru).slice(0, 70),
    title_en: String(parsed.title_en).slice(0, 70),
    desc_ru: String(parsed.desc_ru ?? "").slice(0, 170),
    desc_en: String(parsed.desc_en ?? "").slice(0, 170),
    body_ru: String(parsed.body_ru ?? ""),
    body_en: String(parsed.body_en ?? ""),
    cross_refs: Array.isArray(parsed.cross_refs)
      ? parsed.cross_refs.map((x: unknown) => String(x)).slice(0, 10)
      : [],
  };
}

function hashContent(g: Generated): string {
  return createHash("sha1")
    .update(JSON.stringify([g.title_ru, g.title_en, g.desc_ru, g.desc_en, g.body_ru, g.body_en, g.cross_refs]))
    .digest("hex");
}

// ── Главная: сгенерить батч и сложить черновики ─────────────────────────────
export async function generatePartSuggestions(
  supabase: SupabaseClient,
  limit: number
): Promise<{ batch_id: string; created: number; failed: number; skipped: number; quotaHit: boolean }> {
  const llm = getLlm();

  const candidates = await selectPartCandidates(supabase, limit);
  if (candidates.length === 0) {
    return { batch_id: "", created: 0, failed: 0, skipped: 0, quotaHit: false };
  }

  const batch_id = randomUUID();
  let created = 0,
    failed = 0,
    skipped = 0,
    quotaHit = false;

  for (const c of candidates) {
    const ctx = await fetchContext(supabase, c.product_id);
    if (!ctx) {
      skipped++;
      continue;
    }

    let gen: Generated;
    try {
      gen = await generateOne(llm, ctx);
    } catch (err) {
      if (err instanceof QuotaError) {
        // Дневной лимит/квота исчерпаны — останавливаем батч, остальное добьём в след. прогон
        console.warn(`[seo-generate] квота LLM исчерпана, стоп на товаре ${c.product_id}`);
        quotaHit = true;
        break;
      }
      console.error(`[seo-generate] товар ${c.product_id} — ошибка LLM:`, err);
      failed++;
      continue;
    }

    const { error } = await supabase.from("seo_suggestions").insert({
      batch_id,
      product_id: c.product_id,
      part_number: ctx.p.part_number,
      url: ctx.p.part_number ? `/ru/parts/${ctx.p.part_number}` : null,
      type: "content",
      source: "proactive_parts",
      snap_impressions: Math.round(c.impressions),
      snap_ctr: c.ctr,
      snap_position: c.position,
      proposed_title_ru: gen.title_ru,
      proposed_title_en: gen.title_en,
      proposed_desc_ru: gen.desc_ru,
      proposed_desc_en: gen.desc_en,
      proposed_body_ru: gen.body_ru,
      proposed_body_en: gen.body_en,
      proposed_cross_refs: gen.cross_refs,
      content_hash: hashContent(gen),
      status: "draft",
    });
    if (error) {
      console.error(`[seo-generate] insert ${c.product_id}:`, error.message);
      failed++;
      continue;
    }
    created++;
    await new Promise((r) => setTimeout(r, THROTTLE_MS)); // щадим rate limit
  }

  return { batch_id, created, failed, skipped, quotaHit };
}
