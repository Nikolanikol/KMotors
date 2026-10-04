// Поиск по carnect_lots для каталога (/admin/carnect/catalog, потом витрина).
//
// Вся логика фильтра — в SQL-функции carnect_search (sql/042_carnect_lots.sql):
// выдача, total, разбивка по источникам и списки марок/моделей считаются там
// ОДНИМИ условиями. Здесь только разбор адреса в параметры и типы ответа.
//
// ⚠️ Числа из адреса ПРОВЕРЯЮТСЯ, а не приводятся (тот же урок, что у фильтра
// аукционов, CLAUDE.md): Number("abc") — NaN, он ушёл бы в SQL строкой "NaN",
// и каст ::int уронил бы запрос. Мусорный параметр просто не попадает в фильтр.
//
// Не бросает: Supabase не ответил или функции ещё нет (миграция не
// выполнена) — вернётся { ok: false } с причиной, страница покажет её.

import { unstable_cache } from "next/cache";

import { createServerClient } from "@/lib/supabase";

import type { Fuel } from "./normalize";

export const FUELS: { v: Fuel; label: string; en: string }[] = [
  { v: "gasoline", label: "Бензин", en: "Gasoline" },
  { v: "diesel", label: "Дизель", en: "Diesel" },
  { v: "hybrid", label: "Гибрид", en: "Hybrid" },
  { v: "electric", label: "Электро", en: "Electric" },
  { v: "lpg", label: "Газ (LPG)", en: "LPG" },
  { v: "hydrogen", label: "Водород", en: "Hydrogen" },
];

export type SortKey = "new" | "price" | "year" | "km";

export interface CatalogFilter {
  make?: string;
  model_group?: string;
  year_min?: number;
  year_max?: number;
  km_max?: number;
  fuel?: Fuel[];
  price_max?: number;
  /** По умолчанию true: фильтр цены НЕ выкидывает лоты без цены (Lotte, HeyDealer Self/Zero). */
  include_no_price?: boolean;
  /** Ключи источников: 'lotte', 'glovis:1100', 'heydealer:customer_zero'. */
  src?: string[];
  sort?: SortKey;
}

/** Строка выдачи — колонки carnect_lots без raw, плюс src_key. */
export interface CatalogRow {
  house: string;
  external_id: string;
  src_key: string;
  venue_code: string | null;
  venue: string | null;
  hey_type: string | null;
  make: string | null;
  model_group: string | null;
  year: number | null;
  km: number | null;
  fuel: Fuel | null;
  price_krw: number | null;
  price_kind: "start" | "fixed" | "none";
  title: string | null;
  grade: string | null;
  trans: string | null;
  photo_url: string | null;
  auction_date: string | null;
  end_at: string | null;
  status: string | null;
  insp_grade: string | null;
  lot_no: string | null;
  first_seen_at: string;
}

export interface SourceCount {
  house: string;
  venue_code: string | null;
  venue: string | null;
  hey_type: string | null;
  n: number;
}

export type CatalogResult =
  | {
      ok: true;
      total: number;
      rows: CatalogRow[];
      bySource: SourceCount[];
      makes: { v: string; n: number }[];
      models: { v: string; n: number }[];
    }
  | { ok: false; error: string };

export const PAGE_SIZE = 24;

/** Целое в разумных пределах или undefined. «2019abc», «-5», «1e9» — мимо. */
function int(v: string | undefined, min: number, max: number): number | undefined {
  if (!v || !/^\d{1,10}$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const many = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

/**
 * Параметры адреса → фильтр. Единственное место разбора: и каталог в админке,
 * и будущая витрина берут его отсюда — заводить фильтр дважды значит однажды
 * забыть (урок служебной и публичной витрин аукциона).
 */
export function readFilter(sp: Record<string, string | string[] | undefined>): CatalogFilter {
  const fuelSet = new Set<string>(FUELS.map((f) => f.v));
  const sort = one(sp.sort);
  return {
    make: one(sp.make),
    // Модель без марки бессмысленна (список моделей строится по марке) —
    // и опасна: осталась бы от прежней марки после её смены.
    model_group: one(sp.make) ? one(sp.model) : undefined,
    year_min: int(one(sp.year_min), 1980, 2100),
    year_max: int(one(sp.year_max), 1980, 2100),
    km_max: int(one(sp.km_max), 1, 2_000_000),
    // Цена в адресе — в миллионах вон («до 15» = ₩15 000 000): короче и
    // нагляднее в адресе, чем восемь нулей.
    price_max: (() => {
      const m = int(one(sp.price_max), 1, 10_000);
      return m ? m * 1_000_000 : undefined;
    })(),
    include_no_price: one(sp.no_price) !== "0",
    fuel: many(sp.fuel).filter((f): f is Fuel => fuelSet.has(f)),
    // Ключ источника — только безопасные символы: он уходит в SQL параметром,
    // но мусору в фильтре всё равно делать нечего.
    src: many(sp.src).filter((s) => /^[a-z]+(:[a-z0-9_]+)?$/.test(s)),
    sort: sort === "price" || sort === "year" || sort === "km" ? sort : "new",
  };
}

export async function searchCatalog(filter: CatalogFilter, page: number): Promise<CatalogResult> {
  // В функцию уходят только заданные поля: пустые массивы и undefined она
  // трактует как «без условия» сама, но чистый объект проще читать в логах.
  const p: Record<string, unknown> = { limit: PAGE_SIZE, offset: (Math.max(1, page) - 1) * PAGE_SIZE };
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || (Array.isArray(v) && !v.length)) continue;
    p[k] = v;
  }

  try {
    const { data, error } = await createServerClient().rpc("carnect_search", { p });
    if (error) {
      console.error("[carnect] carnect_search:", error.message);
      return { ok: false, error: error.message };
    }
    const d = data as { total: number; rows: CatalogRow[]; by_source: SourceCount[]; makes: { v: string; n: number }[]; models: { v: string; n: number }[] };
    return { ok: true, total: d.total, rows: d.rows, bySource: d.by_source, makes: d.makes, models: d.models };
  } catch (e) {
    // createServerClient бросает синхронно при пустых переменных окружения —
    // страница должна показать причину, а не упасть (урок getPremiumIndex).
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[carnect] searchCatalog:", msg);
    return { ok: false, error: msg };
  }
}

// ─── Кеш для витрины ─────────────────────────────────────────────────────
//
// Публичный каталог читает searchParams, поэтому страница целиком динамическая
// и ISR ей недоступен (тот же случай, что у категорий запчастей, CLAUDE.md).
// Кешируется выборка: база меняется кроном дважды в сутки, а один и тот же
// фильтр открывают многие — 10 минут на ключ «фильтр + страница» снимают почти
// все походы в Supabase и не дают заметно устаревших данных.
//
// ⚠️ Сбой НЕ кешируется: бросок внутри unstable_cache в кеш не попадает, иначе
// минутный сбой базы десять минут показывал бы «каталог недоступен».
// Служебный каталог в /admin зовёт searchCatalog напрямую — ему нужна свежесть
// сразу после прогона синка.

const CATALOG_TTL_S = 10 * 60;

const cachedSearch = unstable_cache(
  // Фильтр строкой: аргументы входят в ключ кеша, а readFilter собирает
  // объект всегда в одном порядке полей — один фильтр, один ключ.
  async (filterKey: string, page: number) => {
    const res = await searchCatalog(JSON.parse(filterKey) as CatalogFilter, page);
    if (!res.ok) throw new Error(res.error);
    return res;
  },
  ["carnect-catalog-v1"],
  { revalidate: CATALOG_TTL_S },
);

export async function searchCatalogCached(filter: CatalogFilter, page: number): Promise<CatalogResult> {
  try {
    return await cachedSearch(JSON.stringify(filter), page);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
