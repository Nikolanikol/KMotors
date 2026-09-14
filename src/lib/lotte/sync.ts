// Синхронизация лотов Lotte в auction_lots.
//
// Отдельный модуль, а не ветка в kcar/sync.ts, потому что у площадок нет
// ничего общего, кроме таблицы: у KCar свой публичный API и цены в вонах,
// у Lotte — витрина-посредник и цены в долларах. Общий код здесь был бы
// связанностью, а не экономией; таблица одна благодаря колонке source.
//
// ⚠️ Пишем ТОЛЬКО те колонки, что реально собрали. Поля детальной страницы
// (фото, диаграмма кузова, год) добираются по требованию при открытии лота и
// в списочном прогоне отсутствуют — присылать туда null значит затирать уже
// собранное. Ровно на этом обжёгся kcar/sync.ts.

import { createServerClient } from "@/lib/supabase";
import { fetchList } from "./scrape";

const CHUNK = 200;

export interface LotteSyncResult {
  ok: boolean;
  fetched: number;
  upserted: number;
  pages: number;
  error?: string;
  notes?: Record<string, unknown>;
}

interface LotteRow {
  source: "lotte";
  external_id: string;
  maker: string | null;
  model: string | null;
  trim: string | null;
  year: number | null;
  fuel: string | null;
  transmission: string | null;
  mileage_km: number | null;
  auction_date: string | null;
  start_price_krw: number | null;
  thumb_url: string | null;
  source_url: string;
  updated_at: string;
}

export async function syncLotte(
  opts: { dry?: boolean; signal?: AbortSignal } = {},
): Promise<LotteSyncResult> {
  const result: LotteSyncResult = { ok: false, fetched: 0, upserted: 0, pages: 0 };

  try {
    const { cards, pages, error } = await fetchList(opts.signal);
    result.fetched = cards.length;
    result.pages = pages;
    if (error) result.notes = { ...result.notes, fetchError: error };

    if (!cards.length) {
      // Пустой ответ — не повод затирать каталог. Витрина чужая: она уже
      // убирала отсюда KCar, и молчаливая замена лотов пустотой была бы
      // худшим из исходов.
      result.ok = false;
      result.notes = { ...result.notes, reason: "витрина не отдала ни одной карточки" };
      return result;
    }

    // Сколько карточек разобралось полностью — это и есть здоровье парсера.
    // Разметка RSC хрупкая: сменят вёрстку, и поля начнут молча пропадать.
    const complete = cards.filter((c) => c.maker && c.mileageKm && c.startPriceKrw && c.thumbUrl).length;
    result.notes = {
      ...result.notes,
      complete,
      incomplete: cards.length - complete,
      withPrice: cards.filter((c) => c.startPriceKrw).length,
      withPhoto: cards.filter((c) => c.thumbUrl).length,
      withYear: cards.filter((c) => c.year).length,
      withFuel: cards.filter((c) => c.fuel).length,
      withGearbox: cards.filter((c) => c.transmission).length,
      withTrim: cards.filter((c) => c.trim).length,
      withDate: cards.filter((c) => c.auctionDate).length,
    };

    const now = new Date().toISOString();
    const rows: LotteRow[] = cards.map((c) => ({
      source: "lotte",
      external_id: c.externalId,
      maker: c.maker,
      model: c.model,
      trim: c.trim,
      year: c.year,
      fuel: c.fuel,
      transmission: c.transmission,
      mileage_km: c.mileageKm,
      auction_date: c.auctionDate,
      start_price_krw: c.startPriceKrw,
      thumb_url: c.thumbUrl,
      source_url: c.sourceUrl,
      updated_at: now,
    }));

    if (opts.dry) {
      result.ok = true;
      result.notes = { ...result.notes, dry: true, sample: rows.slice(0, 3) };
      return result;
    }

    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: writeError } = await createServerClient()
        .from("auction_lots")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "source,external_id" });
      if (writeError) throw new Error(writeError.message);
      result.upserted += Math.min(CHUNK, rows.length - i);
    }
    result.ok = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    console.error("[lotte] syncLotte упал:", result.error);
  }

  return result;
}
