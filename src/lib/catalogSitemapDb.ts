// Сайтмап каталога: запросы к cars_seen. Чистая часть (окно, XML) — catalogSitemap.ts.
//
// ─── Какие машины и в каком порядке (27.11.2026) ─────────────────────────────
//
// До этого окно было «5 000 самых новых по first_seen_at»: каждая добавленная машина
// вытесняла самую старую, и живое объявление выпадало из карты через дни, ничего не
// сделав, — Google не успевал дойти (8 из 8 URL «ни разу не сканировались»).
//
// Теперь:
//   отбор    sold_at IS NULL И last_seen_at ≥ now − 21 дней
//            (last_seen_at = «подтвердили живой»: листинг, рендер, суточная проверка);
//   порядок  first_seen_at ASC, encar_id ASC — самые РАННИЕ из подтверждённо живых;
//   потолок  20 000.
//
// Ключ first_seen_at у машины не меняется никогда, поэтому её место в очереди только
// улучшается: выпасть из карты живая машина может лишь одним путём — не быть
// подтверждённой 21 день (проверка живости обходит окно за ~20 дней, carsLiveness.ts).
// Новая машина встаёт в хвост и попадает в карту, когда освобождается место, то есть
// когда продали более раннюю. Свежесть набора здесь не цель: набор должен быть живым и
// СТАБИЛЬНЫМ, чтобы Google успел его обойти.
//
// ⚠️ Вторым ключом сортировки стоит encar_id, и это не украшение: батч-upsert
// проставляет ОДИН И ТОТ ЖЕ first_seen_at сотням строк разом, ключ неуникален, и без
// второго машины пропадали бы между страницами (правило .range() из CLAUDE.md).
//
// Деградация: свежих строк меньше CATALOG_SITEMAP_FLOOR (крон встал на недели) — берём
// всех непроданных, новые сверху, как до 27.11.2026. Лучше нечистая карта, чем пустая.

import { createServerClient } from "@/lib/supabase";
import {
  CATALOG_SITEMAP_FLOOR,
  CATALOG_SITEMAP_MAX,
  CATALOG_SITEMAP_PAGE_SIZE,
  freshCutoffIso,
  sitemapPageWindow,
  type SitemapCar,
} from "@/lib/catalogSitemap";

export type SitemapMode = "fresh" | "all";

interface Scope {
  mode: SitemapMode;
  /** Сколько машин в окне (до потолка). */
  count: number;
}

// PostgREST может отдать меньше запрошенного (max-rows на стороне Supabase), поэтому
// одна страница сайтмапа собирается чанками, пока не наберётся или пока не кончится.
const CHUNK = 1_000;

async function countWhere(mode: SitemapMode, cutoff: string): Promise<number | null> {
  let q = createServerClient()
    .from("cars_seen")
    .select("encar_id", { count: "exact", head: true })
    .is("sold_at", null);
  if (mode === "fresh") q = q.gte("last_seen_at", cutoff);
  const { count, error } = await q;
  if (error) {
    console.error("[sitemap-catalog] счётчик не прошёл:", error.message);
    return null;
  }
  return count ?? 0;
}

/**
 * Режим и размер окна. null — Supabase не ответил; вызывающий обязан деградировать,
 * а не падать (индекс без каталога Google читает как «URL больше нет»).
 */
export async function resolveSitemapScope(now = Date.now()): Promise<Scope | null> {
  try {
    const cutoff = freshCutoffIso(now);
    const fresh = await countWhere("fresh", cutoff);
    if (fresh === null) return null;
    if (fresh >= CATALOG_SITEMAP_FLOOR) {
      return { mode: "fresh", count: Math.min(fresh, CATALOG_SITEMAP_MAX) };
    }
    const all = await countWhere("all", cutoff);
    if (all === null) return null;
    console.warn(
      `[sitemap-catalog] свежих (${fresh}) меньше порога ${CATALOG_SITEMAP_FLOOR} — карта идёт в режиме «все непроданные» (${all}). Крон cars не работает?`
    );
    return { mode: "all", count: Math.min(all, CATALOG_SITEMAP_MAX) };
  } catch (e) {
    console.error("[sitemap-catalog] счётчик упал:", (e as Error)?.message);
    return null;
  }
}

/** Сколько машин в карте. null — Supabase не ответил. */
export async function countSitemapCars(): Promise<number | null> {
  return (await resolveSitemapScope())?.count ?? null;
}

/**
 * Позиции [offset, offset+take) окна. Бросает исключение при сбое БД: вызывающие сами
 * решают, что с ним делать (сайтмап отдаёт пустой файл, проверка живости — прекращается).
 */
async function fetchWindow(
  mode: SitemapMode,
  cutoff: string,
  offset: number,
  take: number
): Promise<SitemapCar[]> {
  const out: SitemapCar[] = [];
  while (out.length < take) {
    const from = offset + out.length;
    const n = Math.min(CHUNK, take - out.length);
    let q = createServerClient()
      .from("cars_seen")
      .select("encar_id, first_seen_at, last_seen_at")
      .is("sold_at", null);
    if (mode === "fresh") q = q.gte("last_seen_at", cutoff);
    const asc = mode === "fresh";
    const { data, error } = await q
      .order("first_seen_at", { ascending: asc })
      .order("encar_id", { ascending: asc })
      .range(from, from + n - 1);
    if (error) throw new Error(error.message);
    const rows = (data as SitemapCar[] | null) ?? [];
    if (rows.length === 0) break;
    out.push(...rows);
  }
  return out;
}

/**
 * Файл сайтмапа №page (с единицы). Пустой массив — страница за концом набора либо
 * Supabase не ответил; и то и другое отдаётся пустым файлом.
 */
export async function getSitemapCars(page: number): Promise<SitemapCar[]> {
  const win = sitemapPageWindow(page);
  if (!win) return [];
  try {
    const scope = await resolveSitemapScope();
    if (!scope || win.offset >= scope.count) return [];
    const take = Math.min(win.take, scope.count - win.offset);
    return await fetchWindow(scope.mode, freshCutoffIso(Date.now()), win.offset, take);
  } catch (e) {
    console.error("[sitemap-catalog] страница не прошла:", (e as Error)?.message);
    return [];
  }
}

/**
 * Окно целиком (id + даты) — для проверки живости: ей нужны ровно те машины, что стоят
 * в карте. Файл за файлом, как отдаёт сайтмап. Бросает при сбое БД.
 */
export async function getSitemapWindow(now = Date.now()): Promise<{
  mode: SitemapMode;
  cars: SitemapCar[];
} | null> {
  const scope = await resolveSitemapScope(now);
  if (!scope) return null;
  const cutoff = freshCutoffIso(now);
  const cars: SitemapCar[] = [];
  for (let offset = 0; offset < scope.count; offset += CATALOG_SITEMAP_PAGE_SIZE) {
    const take = Math.min(CATALOG_SITEMAP_PAGE_SIZE, scope.count - offset);
    const rows = await fetchWindow(scope.mode, cutoff, offset, take);
    cars.push(...rows);
    if (rows.length < take) break;
  }
  return { mode: scope.mode, cars };
}
