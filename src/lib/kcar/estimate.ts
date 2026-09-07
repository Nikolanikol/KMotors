// Прогноз цены молотка.
//
// Зачем. Стартовая цена лота систематически ниже той, за которую он уходит:
// по 8 750 состоявшимся сделкам медиана превышения +13.8%. Показать клиенту
// старт — значит назвать цену, по которой машину купить нельзя. Считаем
// медианную премию по истории и применяем её к старту.
//
// ⚠️ Считаем ТОЛЬКО по sold. Наличие цены молотка признаком продажи не
// является: непроданному лоту площадка подставляет туда стартовую цену, и
// такие строки дают премию 0%. Если их не отсечь, медиана падает до 8.2% —
// на лоте в 10 млн вон это 560 000 ₩ мимо, то есть ставка ниже рынка.
// Разметку делает база (auction_results_refresh_sold), см. sql/038.
//
// ⚠️ Медиана, а не среднее. Распределение с длинным хвостом: попадаются лоты,
// уходящие в 10 раз выше старта (2010 GLK со старта 200 000 ₩ ушёл за
// 2 450 000 ₩). Среднее такие случаи задирают, медиана — нет.
//
// Три уровня опоры, от точного к грубому:
//   1. та же марка+модель — если сделок хотя бы 5
//   2. тот же класс кузова A–F — если сделок хотя бы 20
//   3. вся выборка
// Уровень возвращается наружу: «по 47 сделкам этой модели» и «по рынку в
// целом» — это разная уверенность, и витрина обязана их различать.

import { createServerClient } from "@/lib/supabase";

export type EstimateBasis = "model" | "grade" | "market";

export interface Estimate {
  /** Прогноз цены молотка в вонах. */
  hammerKrw: number;
  /** Медианная премия к старту, %. */
  premiumPct: number;
  basis: EstimateBasis;
  /** На скольких сделках построен прогноз. */
  sampleSize: number;
}

const MIN_MODEL_SAMPLE = 5;
const MIN_GRADE_SAMPLE = 20;

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

interface SaleRow {
  maker: string | null;
  model: string | null;
  grade_int: string | null;
  start_price_krw: number | null;
  hammer_price_krw: number | null;
}

function push(map: Map<string, number[]>, key: string, value: number) {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

/** Премия в % для одной сделки; null, если цены непригодны. */
function premium(r: SaleRow): number | null {
  if (!r.start_price_krw || !r.hammer_price_krw || r.start_price_krw <= 0) return null;
  return (r.hammer_price_krw / r.start_price_krw - 1) * 100;
}

/**
 * Считает таблицы премий один раз на весь набор лотов.
 * Вызывать на страницу каталога, а не на каждую карточку: это один
 * запрос вместо N.
 */
export async function buildPremiumIndex(): Promise<{
  byModel: Map<string, number[]>;
  byGrade: Map<string, number[]>;
  overall: number[];
}> {
  const byModel = new Map<string, number[]>();
  const byGrade = new Map<string, number[]>();
  const overall: number[] = [];

  const db = createServerClient();
  // ⚠️ Сортировка идёт по ВСЕМ ТРЁМ колонкам первичного ключа. Ни одна по
  // отдельности не уникальна: external_id повторяется между сессиями (тот же
  // лот выставляют снова), а внутри сессии он уникален только для своей
  // площадки. На неуникальном ключе .range() теряет строки между страницами —
  // постмортем из CLAUDE.md.
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("auction_results")
      .select("maker, model, grade_int, start_price_krw, hammer_price_krw")
      .eq("sold", true)
      .order("source")
      .order("external_id")
      .order("session")
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("[kcar] не удалось прочитать auction_results:", error.message);
      break;
    }
    const rows = (data ?? []) as SaleRow[];
    for (const r of rows) {
      const p = premium(r);
      if (p == null) continue;
      overall.push(p);
      if (r.maker && r.model) push(byModel, `${r.maker}|${r.model}`, p);
      if (r.grade_int) push(byGrade, r.grade_int, p);
    }
    if (rows.length < PAGE) break;
  }

  return { byModel, byGrade, overall };
}

/** Прогноз для одного лота по заранее собранному индексу. */
export function estimateHammer(
  lot: { maker: string | null; model: string | null; grade_int: string | null; start_price_krw: number | null },
  index: Awaited<ReturnType<typeof buildPremiumIndex>>,
): Estimate | null {
  if (!lot.start_price_krw) return null;

  const modelPool = lot.maker && lot.model ? index.byModel.get(`${lot.maker}|${lot.model}`) : undefined;
  const gradePool = lot.grade_int ? index.byGrade.get(lot.grade_int) : undefined;

  let pool = index.overall;
  let basis: EstimateBasis = "market";
  if (modelPool && modelPool.length >= MIN_MODEL_SAMPLE) {
    pool = modelPool;
    basis = "model";
  } else if (gradePool && gradePool.length >= MIN_GRADE_SAMPLE) {
    pool = gradePool;
    basis = "grade";
  }
  if (!pool.length) return null;

  const premiumPct = median(pool);
  return {
    hammerKrw: Math.round(lot.start_price_krw * (1 + premiumPct / 100)),
    premiumPct: Math.round(premiumPct * 10) / 10,
    basis,
    sampleSize: pool.length,
  };
}
