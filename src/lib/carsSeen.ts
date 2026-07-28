// Снимки машин Encar в собственной таблице cars_seen (sql/035_cars_seen.sql).
//
// Encar держит объявление только пока машина продаётся: после продажи
// /v1/readside/vehicle/{id} отдаёт 404, и карточка остаётся без единого поля.
// Снимок — единственный способ показать посетителю, что за машина тут была,
// и собрать из её параметров запрос «покажи такие же».
//
// Железное правило этого модуля: он НИКОГДА не бросает исключение и никогда не
// задерживает рендер. Карточка авто важнее снимка — если Supabase лежит,
// страница обязана отрисоваться как ни в чём не бывало.

import { createServerClient } from "@/lib/supabase";

/** Снимок в том виде, в каком он ложится в cars_seen. */
export interface CarSnapshot {
  encar_id: string;
  manufacturer_ko?: string | null;
  model_group_ko?: string | null;
  model_ko?: string | null;
  grade_ko?: string | null;
  manufacturer_en?: string | null;
  model_group_en?: string | null;
  grade_en?: string | null;
  year?: number | null;
  year_month?: number | null;
  price_manwon?: number | null;
  mileage?: number | null;
  fuel_ko?: string | null;
  transmission_ko?: string | null;
  photo_path?: string | null;
}

// Карточка рендерится на каждый запрос, а снимок машины меняется медленно —
// без этого мы бы делали по upsert на просмотр. Троттлинг в памяти инстанса:
// точности не даёт (инстансов несколько), но на порядок срезает запись.
const WRITE_TTL_MS = 60 * 60 * 1000;
const MAX_TRACKED = 5_000;
const lastWrite = new Map<string, number>();

function shouldWrite(id: string): boolean {
  const prev = lastWrite.get(id);
  if (prev && Date.now() - prev < WRITE_TTL_MS) return false;
  // Инстанс живёт долго, а машин в обороте много — Map без потолка это утечка.
  // Дешевле сбросить целиком, чем городить LRU: потеряем лишь право пропустить
  // запись, а не сами данные.
  if (lastWrite.size >= MAX_TRACKED) lastWrite.clear();
  lastWrite.set(id, Date.now());
  return true;
}

const int = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

/**
 * Снимок из ответа /v1/readside/vehicle/{id} — то, что уже есть на руках у
 * карточки. Самый полный источник: только здесь встречаются modelGroup и
 * английские имена.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function snapshotFromVehicle(id: string, data: any): CarSnapshot {
  const category = data?.category ?? {};
  const spec = data?.spec ?? {};
  return {
    encar_id: String(id),
    manufacturer_ko: str(category.manufacturerName),
    model_group_ko: str(category.modelGroupName),
    model_ko: str(category.modelName),
    grade_ko: str(category.gradeName),
    manufacturer_en: str(category.manufacturerEnglishName),
    model_group_en: str(category.modelGroupEnglishName),
    grade_en: str(category.gradeEnglishName),
    year: int(category.formYear),
    year_month: int(category.yearMonth),
    price_manwon: int(data?.advertisement?.price),
    mileage: int(spec.mileage),
    fuel_ko: str(spec.fuelName),
    transmission_ko: str(spec.transmissionName),
    photo_path: str(data?.photos?.[0]?.path),
  };
}

/**
 * Снимок из строки листинга /search/car/list/premium. Беднее: Encar не отдаёт
 * тут ни modelGroup, ни английских имён, а Model приходит с поколением
 * («더 뉴 팰리세이드»), поэтому для запроса «такие же» он не годится и кладётся
 * в model_ko, а не в model_group_ko.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function snapshotFromListing(row: any): CarSnapshot | null {
  const id = str(row?.Id);
  if (!id) return null;
  return {
    encar_id: id,
    manufacturer_ko: str(row.Manufacturer),
    model_ko: str(row.Model),
    grade_ko: str(row.Badge),
    year: int(row.FormYear),
    year_month: int(row.Year),
    price_manwon: int(row.Price),
    mileage: int(row.Mileage),
    fuel_ko: str(row.FuelType),
    transmission_ko: str(row.Transmission),
    // В листинге Photo — префикс без номера кадра, в отличие от полного пути
    // в карточке. Достраиваем первым кадром, он есть всегда.
    photo_path: row.Photos?.[0]?.location
      ? str(row.Photos[0].location)
      : str(row.Photo) && `${str(row.Photo)}001.jpg`,
  };
}

/** Пишет пачку снимков. Возвращает число записанных строк, ошибку не бросает. */
export async function saveCarSnapshots(rows: CarSnapshot[]): Promise<number> {
  if (rows.length === 0) return 0;
  try {
    // first_seen_at сознательно НЕ передаём: на вставке сработает DEFAULT, а на
    // конфликте колонка не попадёт в UPDATE и переживёт перезапись. Это она
    // даёт честный lastmod для сайтмапа.
    const payload = rows.map((r) => ({
      ...r,
      last_seen_at: new Date().toISOString(),
      // Машина снова в выдаче — снимаем метку «продана». Encar периодически
      // возвращает объявления, и залипший sold_at показывал бы живую машину
      // как проданную.
      sold_at: null,
    }));
    const { error } = await createServerClient()
      .from("cars_seen")
      .upsert(payload, { onConflict: "encar_id" });
    if (error) {
      console.error("[carsSeen] upsert не прошёл:", error.message);
      return 0;
    }
    return rows.length;
  } catch (e) {
    console.error("[carsSeen] upsert упал:", (e as Error)?.message);
    return 0;
  }
}

/**
 * Фоновая запись снимка при рендере карточки. Вызывать через after() из
 * next/server, чтобы ответ ушёл посетителю до похода в базу.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordCarSeen(id: string, data: any): Promise<void> {
  if (!shouldWrite(id)) return;
  await saveCarSnapshots([snapshotFromVehicle(id, data)]);
}

/**
 * Ленивая отметка «продана»: Encar ответил 404 на карточке. Отдельной фоновой
 * задачи под это нет — посетители и краулеры находят проданные машины сами.
 * Строки может не быть вовсе (машина продалась раньше, чем мы начали писать
 * снимки) — это нормально, upsert не создаём, просто обновляем что есть.
 */
export async function markCarSold(id: string): Promise<void> {
  try {
    const { error } = await createServerClient()
      .from("cars_seen")
      .update({ sold_at: new Date().toISOString() })
      .eq("encar_id", String(id))
      .is("sold_at", null);
    if (error) console.error("[carsSeen] отметка продажи не прошла:", error.message);
  } catch (e) {
    console.error("[carsSeen] отметка продажи упала:", (e as Error)?.message);
  }
}

/** Снимок проданной машины для карточки. null — снимка нет, это штатно. */
export async function getCarSnapshot(id: string): Promise<CarSnapshot | null> {
  try {
    const { data, error } = await createServerClient()
      .from("cars_seen")
      .select("*")
      .eq("encar_id", String(id))
      .maybeSingle();
    if (error) {
      console.error("[carsSeen] чтение снимка не прошло:", error.message);
      return null;
    }
    return (data as CarSnapshot | null) ?? null;
  } catch (e) {
    console.error("[carsSeen] чтение снимка упало:", (e as Error)?.message);
    return null;
  }
}
