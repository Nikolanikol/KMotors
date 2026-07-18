// Дедуп/лимит/ротация через таблицу posted_vehicles (Supabase).
import { createServerClient } from '@/lib/supabase';
import type { Listing } from './encar';

/** Начало текущих суток по KST, в ISO (UTC). */
function kstDayStartIso(): string {
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  const y = nowKst.getUTCFullYear();
  const m = nowKst.getUTCMonth();
  const d = nowKst.getUTCDate();
  // 00:00 KST = 15:00 UTC предыдущего дня
  return new Date(Date.UTC(y, m, d) - 9 * 3600 * 1000).toISOString();
}

/** Множество уже запощенных id из переданного списка (один запрос). */
export async function filterUnposted(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const supabase = createServerClient();
  const { data } = await supabase
    .from('posted_vehicles')
    .select('vehicle_id')
    .in('vehicle_id', ids);
  return new Set((data ?? []).map((r) => r.vehicle_id as string));
}

/** Сколько постов сделано за сегодня (KST). */
export async function todayCount(): Promise<number> {
  const supabase = createServerClient();
  const { count } = await supabase
    .from('posted_vehicles')
    .select('vehicle_id', { count: 'exact', head: true })
    .gte('posted_at', kstDayStartIso());
  return count ?? 0;
}

/** Всего постов (для ротации пресетов). */
export async function totalCount(): Promise<number> {
  const supabase = createServerClient();
  const { count } = await supabase
    .from('posted_vehicles')
    .select('vehicle_id', { count: 'exact', head: true });
  return count ?? 0;
}

/** Отмечает авто как запощенное. */
export async function markPosted(l: Listing, preset: string): Promise<void> {
  const supabase = createServerClient();
  await supabase.from('posted_vehicles').insert({
    vehicle_id: l.id,
    preset,
    maker: l.manufacturerKo,
    model: l.modelKo,
    price_man: l.priceMan,
  });
}
