// Оркестрация синхронизации: тянем аукцион → нормализуем → пишем в Supabase.
//
// Две независимые задачи с разным расписанием:
//   syncLots  — лоты ближайших торгов. Меняются каждый день, гонять ежедневно.
//   syncSales — результаты прошедшей сессии. Появляются раз в неделю после
//               торгов; гонять раз в неделю или добивать пробелы вручную.
//
// ⚠️ Порядок upsert'а важен. Пишем ПОСЛЕ того, как собрали весь список, а не
// по мере обхода: частичная запись при обрыве сети оставила бы витрину со
// смесью новых и позавчерашних лотов без признака, что данные неполные.
//
// ⚠️ Старые лоты не удаляем. Прошедший лот остаётся в auction_lots как
// история того, что выставлялось; фильтровать по auction_date — задача
// витрины. Удаление здесь означало бы, что упавший парсер молча стирает
// каталог. Чистить рабочий набор по дате можно отдельной операцией — итоги
// сделок к тому времени уже лежат в auction_results и не пострадают.

import { createServerClient } from "@/lib/supabase";
import { fetchWeekly } from "./api";
import { fetchDetails } from "./detail";
import { toLot, toResult } from "./normalize";
import type { AuctionLot, AuctionResult, LotDetail, SyncResult } from "./types";

/** Supabase не любит гигантские запросы — пишем пачками. */
const CHUNK = 200;

// Имя таблицы передаём не строкой, а готовым вызовом: с литеральным именем
// supabase-js выводит типы, с переменной — нет, и upsert перестаёт
// проверяться вовсе.
//
// PromiseLike, а не Promise: билдер PostgREST — thenable, у него нет ни
// catch, ни finally, и под Promise он не подходит по типам.
async function upsertChunked<T>(
  label: string,
  rows: T[],
  write: (slice: T[]) => PromiseLike<{ error: { message: string } | null }>,
): Promise<number> {
  if (!rows.length) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await write(slice);
    if (error) throw new Error(`${label}: ${error.message}`);
    written += slice.length;
  }
  return written;
}

async function logRun(kind: "lots" | "sales", result: SyncResult, startedAt: string) {
  try {
    await createServerClient().from("auction_sync_runs").insert({
      kind,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      ok: result.ok,
      fetched: result.fetched,
      upserted: result.upserted,
      enriched: result.enriched,
      error: result.error ?? null,
      notes: result.notes ?? null,
    });
  } catch (e) {
    // Журнал не должен ронять синхронизацию — но и молчать о себе не должен.
    console.error("[kcar] не удалось записать auction_sync_runs:", e);
  }
}

/**
 * Лоты ближайших торгов.
 * `enrich` включает добор VIN / листа осмотра / галереи со сторонней витрины —
 * он медленный (обход ~1700 страниц с паузой), поэтому по умолчанию выключен
 * и запускается отдельным, более редким прогоном.
 */
export async function syncLots(
  opts: { enrich?: boolean; signal?: AbortSignal } = {},
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const result: SyncResult = { ok: false, kind: "lots", fetched: 0, upserted: 0, enriched: 0 };

  try {
    const { lots: raw, errors } = await fetchWeekly("wCfm", undefined, opts.signal);
    result.fetched = raw.length;
    if (errors.length) result.notes = { ...result.notes, fetchErrors: errors };

    if (!raw.length) {
      // Пустой ответ — это не обязательно поломка: между торгами лотов нет.
      // Но и затирать каталог пустотой мы не станем.
      result.ok = errors.length === 0;
      result.notes = { ...result.notes, reason: "лотов в торгах нет" };
      await logRun("lots", result, startedAt);
      return result;
    }

    let details = new Map<string, LotDetail>();
    if (opts.enrich) {
      const wanted = new Set(raw.map((r) => String(r.CAR_ID ?? "")).filter(Boolean));
      try {
        const got = await fetchDetails(wanted, opts.signal);
        details = got.details;
        result.enriched = details.size;
        result.notes = { ...result.notes, scanned: got.scanned, failed: got.failed };
      } catch (e) {
        // Витрина недоступна — пишем лоты без VIN и осмотра, это лучше, чем ничего.
        console.error("[kcar] добор деталей не удался:", e);
        result.notes = { ...result.notes, enrichError: String(e) };
      }
    }

    const rows: AuctionLot[] = [];
    for (const r of raw) {
      const row = toLot(r, null, details.get(String(r.CAR_ID ?? "")));
      if (row) rows.push(row);
    }

    result.upserted = await upsertChunked("auction_lots", rows, (slice) =>
      createServerClient()
        .from("auction_lots")
        .upsert(slice, { onConflict: "source,external_id" }));
    result.ok = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    console.error("[kcar] syncLots упал:", result.error);
  }

  await logRun("lots", result, startedAt);
  return result;
}

/**
 * Результаты прошедших торгов — база для прогноза цены молотка.
 * Сессии задаются явно: у площадки они нумеруются подряд (995, 996, …),
 * и «догнать историю» — это прогнать диапазон.
 */
export async function syncSales(
  sessions: number[],
  opts: { signal?: AbortSignal } = {},
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const result: SyncResult = { ok: false, kind: "sales", fetched: 0, upserted: 0, enriched: 0 };
  const perSession: Record<number, number> = {};

  try {
    const rows: AuctionResult[] = [];
    for (const session of sessions) {
      const { lots: raw, errors } = await fetchWeekly("wRst", session, opts.signal);
      perSession[session] = raw.length;
      result.fetched += raw.length;
      if (errors.length) {
        result.notes = { ...result.notes, [`errors_${session}`]: errors };
      }
      for (const r of raw) {
        const row = toResult(r, session);
        if (row) rows.push(row);
      }
    }

    result.upserted = await upsertChunked("auction_results", rows, (slice) =>
      createServerClient()
        .from("auction_results")
        .upsert(slice, { onConflict: "source,external_id" }));
    result.notes = { ...result.notes, perSession };
    result.ok = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    console.error("[kcar] syncSales упал:", result.error);
  }

  await logRun("sales", result, startedAt);
  return result;
}

/** Диапазон «995-999» или одиночное «995» → [995, …]. Пустой ввод → []. */
export function parseSessions(input: string | null): number[] {
  if (!input) return [];
  const out = new Set<number>();
  for (const part of input.split(",")) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part.trim());
    if (range) {
      const [a, b] = [Number(range[1]), Number(range[2])];
      // Потолок в 60 сессий за прогон: это ~40 тысяч строк и десятки минут.
      for (let s = Math.min(a, b); s <= Math.max(a, b) && out.size < 60; s++) out.add(s);
    } else {
      const n = Number(part.trim());
      if (Number.isInteger(n) && n > 0) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
}
