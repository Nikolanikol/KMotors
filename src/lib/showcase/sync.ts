// Синхронизация каталога аукционов в auction_lots.
//
// Один обход витрины-агрегатора приносит лоты ВСЕХ трёх площадок сразу —
// K Car, Lotte и SK лежат там вперемешку, — поэтому площадка берётся из самой
// карточки, а не задаётся снаружи. Колонка source их и различает.
//
// ⚠️ Лоты без распознанной площадки НЕ пишутся. Хост снимка — единственное,
// по чему её видно в списке; появится четвёртый аукцион с незнакомым хостом —
// его лоты осядут в счётчике `unknownSource`, а не лягут в базу безымянными.
//
// ⚠️ Пишем ТОЛЬКО те колонки, что реально собрали. Поля детальной страницы
// (фото, диаграмма кузова, год) добираются по требованию при открытии лота и
// в списочном прогоне отсутствуют — присылать туда null значит затирать уже
// собранное. Ровно на этом обжёгся kcar/sync.ts.

import { createServerClient } from "@/lib/supabase";
import { fetchList } from "./scrape";

/**
 * Журнал прогона.
 *
 * ⚠️ Пишем СЮДА, а не только в ответ: расписание крона строится на том, когда
 * у площадки перевернулась партия лотов, и увидеть это можно лишь в истории.
 * По полю notes.dates видно, к каким торгам относился каждый прогон, — то
 * есть календарь торгов собирается сам, без расписания от площадок.
 *
 * Журнал не должен ронять синхронизацию, но и молчать о себе не должен.
 */
async function logRun(result: ShowcaseSyncResult, startedAt: string) {
  try {
    await createServerClient().from("auction_sync_runs").insert({
      source: "showcase",
      kind: "lots",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      ok: result.ok,
      fetched: result.fetched,
      upserted: result.upserted,
      enriched: 0,
      error: result.error ?? null,
      notes: result.notes ?? null,
    });
  } catch (e) {
    console.error("[showcase] не удалось записать auction_sync_runs:", e);
  }
}

const CHUNK = 200;

export interface ShowcaseSyncResult {
  ok: boolean;
  fetched: number;
  upserted: number;
  pages: number;
  error?: string;
  notes?: Record<string, unknown>;
}

interface ShowcaseRow {
  source: string;
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

export async function syncShowcase(
  opts: { dry?: boolean; signal?: AbortSignal } = {},
): Promise<ShowcaseSyncResult> {
  const startedAt = new Date().toISOString();
  const result: ShowcaseSyncResult = { ok: false, fetched: 0, upserted: 0, pages: 0 };

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
      await logRun(result, startedAt);
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
      // Разбивка по площадкам — главный индикатор здоровья обхода: пропадёт
      // одна из трёх, и это будет видно сразу, а не через неделю.
      bySource: cards.reduce<Record<string, number>>((acc, c) => {
        const key = c.source ?? "неизвестно";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
      unknownSource: cards.filter((c) => !c.source).length,
      // ⚠️ Даты торгов по площадкам — главный сигнал для расписания. Раздел
      // держит по ОДНОЙ ближайшей дате на площадку (замер 21.09.2026), и её
      // смена означает, что выложена новая партия лотов.
      dates: cards.reduce<Record<string, string[]>>((acc, c) => {
        if (!c.source || !c.auctionDate) return acc;
        const seen = (acc[c.source] ??= []);
        if (!seen.includes(c.auctionDate)) seen.push(c.auctionDate);
        return acc;
      }, {}),
    };

    const now = new Date().toISOString();
    const rows: ShowcaseRow[] = cards
      .filter((c) => c.source)
      .map((c) => ({
      source: c.source as string,
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
      // Пробный обход в журнал НЕ пишем: он ничего не менял, а в истории
      // выглядел бы как настоящий прогон и сбивал бы отсчёт свежести данных.
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
    console.error("[lotte] syncShowcase упал:", result.error);
  }

  return result;
}
