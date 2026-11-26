import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";

/**
 * Экспертный текст карточки запчасти из таблицы kmotors_part_content
 * (sql/045_kmotors_part_content.sql). Зачем он нужен и откуда берётся — в шапке миграции
 * и в docs/seo-indexing/.
 *
 * Инварианты:
 *  - Читаются ТОЛЬКО строки status = 'published'. draft/approved/rejected на сайт не идут.
 *  - Решение владельца 27.11.2026: показываем и карточки без источника (confidence low) — там
 *    общее объяснение типа детали. Риск известен: при общем названии («Pressure Regulator»)
 *    модель могла угадать не тот тип детали; поэтому в блоке без источника нет строки
 *    «based on catalog data». Закрыть такую карточку — перевести строку в rejected.
 *  - Модуль НЕ бросает исключений: сбой чтения = карточка без блока, а не 500 на странице товара.
 *  - Содержимое jsonb не доверяем: форма проверяется, лишнее отбрасывается.
 */

export interface PartContent {
  identity: string | null;
  pairedPartNumbers: { pn: string; relation: string }[];
  notToConfuseWith: string | null;
  soldAs: string | null;
  sources: string[]; // только домены, без ссылок: см. PartExpertContent
  howItWorks: string | null;
  whatHappensWhenItFails: string | null;
  failureSigns: string[];
  usuallyReplacedWith: string[];
  replacementNotes: string[];
  faq: { question: string; answer: string }[];
}

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter((s): s is string => !!s) : [];

function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^(www|m)\./, "");
  } catch {
    return null;
  }
}

function normalize(raw: unknown, sources: unknown): PartContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const cf = (r.catalog_facts ?? {}) as Record<string, unknown>;
  const ex = (r.explanation ?? {}) as Record<string, unknown>;

  const paired = Array.isArray(cf.paired_part_numbers)
    ? cf.paired_part_numbers
        .map((p) => {
          const o = (p ?? {}) as Record<string, unknown>;
          const pn = str(o.pn);
          const relation = str(o.relation);
          return pn && relation ? { pn, relation } : null;
        })
        .filter((p): p is { pn: string; relation: string } => !!p)
    : [];

  const faq = Array.isArray(r.faq)
    ? r.faq
        .map((q) => {
          const o = (q ?? {}) as Record<string, unknown>;
          const question = str(o.question);
          const answer = str(o.answer);
          return question && answer ? { question, answer } : null;
        })
        .filter((q): q is { question: string; answer: string } => !!q)
    : [];

  const srcDomains = Array.from(
    new Set(strList(sources).map(domainOf).filter((d): d is string => !!d))
  );

  const out: PartContent = {
    identity: str(cf.identity),
    pairedPartNumbers: paired,
    notToConfuseWith: str(cf.not_to_confuse_with),
    soldAs: str(cf.sold_as),
    sources: srcDomains,
    howItWorks: str(ex.how_it_works),
    whatHappensWhenItFails: str(ex.what_happens_when_it_fails),
    failureSigns: strList(ex.failure_signs),
    usuallyReplacedWith: strList(ex.usually_replaced_with),
    replacementNotes: strList(ex.replacement_notes),
    faq,
  };

  // Совсем пустой блок на странице хуже его отсутствия.
  const hasBody = out.howItWorks || out.failureSigns.length > 0 || out.faq.length > 0;
  return hasBody ? out : null;
}

async function fetchPartContent(partNumber: string): Promise<PartContent | null> {
  const { data, error } = await createServerClient()
    .from("kmotors_part_content")
    .select("content, sources")
    .eq("part_number", partNumber)
    .eq("lang", "en")
    .eq("status", "published")
    .maybeSingle();
  // Бросаем, чтобы unstable_cache не запомнил сбой: кеш хранит только возвращённое значение.
  if (error) throw new Error(`kmotors_part_content: ${error.message}`);
  if (!data) return null;
  return normalize(data.content, data.sources);
}

// Ключ с версией формы: поменяли PartContent — поднять, иначе кеш отдаст прежнюю форму.
const getCached = unstable_cache(fetchPartContent, ["kmotors-part-content-v1"], {
  revalidate: 86400,
});

export async function getPartContent(partNumber: string | null): Promise<PartContent | null> {
  if (!partNumber) return null;
  try {
    return await getCached(partNumber);
  } catch (e) {
    console.error("[partContent] read failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Даты обновления опубликованных блоков: part_number → YYYY-MM-DD. Нужны сайтмапу запчастей:
 * её `lastmod` брался только из parts_products.scraped_at, и Google не узнавал, что у карточки
 * появился текст. Берём позднюю из двух дат — у остальных страниц lastmod не меняется.
 *
 * Не бросает: сбой = пустая карта, сайтмап уходит на прежний lastmod. Читает постранично:
 * PostgREST отдаёт не больше 1000 строк за запрос, а блоков будет около тысячи.
 */
async function fetchContentDates(): Promise<Record<string, string>> {
  const supabase = createServerClient();
  const out: Record<string, string> = {};
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await supabase
      .from("kmotors_part_content")
      .select("part_number, updated_at")
      .eq("lang", "en")
      .eq("status", "published")
      .order("part_number", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`kmotors_part_content dates: ${error.message}`);
    for (const r of data ?? []) {
      if (r.part_number && r.updated_at) out[r.part_number] = String(r.updated_at).slice(0, 10);
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

const getCachedDates = unstable_cache(fetchContentDates, ["kmotors-part-content-dates-v1"], {
  revalidate: 3600,
});

export async function getPartContentDates(): Promise<Record<string, string>> {
  try {
    return await getCachedDates();
  } catch (e) {
    console.error("[partContent] dates read failed:", e instanceof Error ? e.message : e);
    return {};
  }
}
