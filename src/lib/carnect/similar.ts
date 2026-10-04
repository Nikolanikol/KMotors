// «Похожие машины» внизу страницы машины carnect.
//
// Только из НАШЕЙ базы (carnect_lots), ни одного запроса к carnect: блок не
// замедляет страницу и не нагружает источник.
//
// Правило подбора (согласовано с владельцем 05.10.2026):
//   • та же марка и модельная группа, год ±1;
//   • только лоты, торги которых ещё впереди: прошедший лот в «похожих» — клик
//     в «ушла с торгов» (живой случай прежней витрины, getSimilarLots);
//   • ближайшие торги первыми, площадки по очереди (interleave); аукционы и
//     HeyDealer вперемешку — клиенту важна машина, площадка видна на плитке;
//   • меньше MIN_GOOD — добираем той же моделью любого года;
//   • БЕЗ близости по цене: у Lotte и HeyDealer Self/Zero цены нет, и фильтр
//     по ней выкинул бы их из похожих целиком.
// Нет модели (часть HeyDealer её не распознаёт) — блока нет: случайные
// машины под заголовком «похожие» хуже пустого места.
//
// Не бросает: Supabase не ответил — пустой список, страница важнее блока.

import { createServerClient } from "@/lib/supabase";

import type { CatalogRow } from "./query";
import { kstToday } from "./time";

export const SIMILAR_MAX = 8;
const MIN_GOOD = 4;
/**
 * На каждую из двух выборок. С запасом над SIMILAR_MAX: иначе ближайшие
 * торги одной площадки съедают выборку, и чередовать нечего.
 */
const PER_QUERY = 24;

const COLUMNS =
  "house, external_id, venue_code, venue, hey_type, make, model_group, year, km, fuel, price_krw, price_kind, " +
  "title, grade, trans, photo_url, auction_date, end_at, status, insp_grade, lot_no, first_seen_at";

/** Момент торгов для сортировки: точное время или корейская полночь дня торгов. */
function when(r: CatalogRow): number {
  if (r.end_at) return Date.parse(r.end_at);
  if (r.auction_date) return Date.parse(`${r.auction_date}T00:00:00+09:00`);
  return Number.POSITIVE_INFINITY;
}

/**
 * Площадки по очереди, внутри каждой — ближайшие первыми. Без этого блок
 * целиком занимал один день одной площадки: у Lotte в день торгов десяток
 * одинаковых Grandeur, и все они «ближайшие» (замер 05.10.2026).
 */
function interleave(rows: CatalogRow[]): CatalogRow[] {
  const byHouse = new Map<string, CatalogRow[]>();
  for (const r of rows) byHouse.set(r.house, [...(byHouse.get(r.house) ?? []), r]);
  const queues = [...byHouse.values()];
  const out: CatalogRow[] = [];
  for (let i = 0; out.length < rows.length; i++) {
    for (const q of queues) if (q[i]) out.push(q[i]);
  }
  return out;
}

export async function getSimilar(car: {
  house: string;
  externalId: string;
  make: string | null;
  modelGroup: string | null;
  year: number | null;
}): Promise<CatalogRow[]> {
  if (!car.make || !car.modelGroup) return [];
  try {
    const db = createServerClient();
    // ⚠️ Ближайшие торги ищутся ДВУМЯ запросами — по точному времени (end_at) и
    // по дню (auction_date, у лотов без часа), — и сводятся в коде. Одним
    // запросом не выходит: PostgREST не сортирует по coalesce, а выборка «40
    // самых свежих» отдавала одни машины HeyDealer — их синк идёт чаще всех,
    // и аукционы в неё просто не попадали (замер 05.10.2026).
    const query = async (withYear: boolean) => {
      const base = () => {
        let q = db
          .from("carnect_lots")
          .select(COLUMNS)
          .is("gone_at", null)
          .eq("make", car.make!)
          .eq("model_group", car.modelGroup!);
        if (withYear && car.year) q = q.gte("year", car.year - 1).lte("year", car.year + 1);
        return q;
      };
      // Второй ключ обязателен (CLAUDE.md, «.limit() по неуникальному ключу»).
      const [exact, byDay] = await Promise.all([
        base()
          .gte("end_at", new Date().toISOString())
          .order("end_at")
          .order("house")
          .order("external_id")
          .limit(PER_QUERY),
        base()
          .is("end_at", null)
          .gte("auction_date", kstToday())
          .order("auction_date")
          .order("house")
          .order("external_id")
          .limit(PER_QUERY),
      ]);
      const error = exact.error ?? byDay.error;
      return { error, data: [...(exact.data ?? []), ...(byDay.data ?? [])] };
    };

    const seen = new Set([`${car.house}/${car.externalId}`]);
    const out: CatalogRow[] = [];
    // Каждая порция сортируется по времени торгов отдельно: машины года ±1
    // остаются впереди добранных «любого года».
    const take = (rows: unknown[] | null) => {
      const fresh: CatalogRow[] = [];
      for (const r of (rows ?? []) as CatalogRow[]) {
        const key = `${r.house}/${r.external_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        fresh.push({ ...r, src_key: "" });
      }
      out.push(...interleave(fresh.sort((a, b) => when(a) - when(b))));
    };

    const first = await query(true);
    if (first.error) throw new Error(first.error.message);
    take(first.data);
    if (out.length < MIN_GOOD && car.year) {
      const wide = await query(false);
      if (wide.error) throw new Error(wide.error.message);
      take(wide.data);
    }
    return out.slice(0, SIMILAR_MAX);
  } catch (e) {
    console.error("[carnect] похожие машины:", e instanceof Error ? e.message : e);
    return [];
  }
}
