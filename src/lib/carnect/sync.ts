// Синхронизация carnect → таблица carnect_lots (sql/042_carnect_lots.sql).
//
// Одна «лента» = один полный обход одного списка carnect:
//   auctions      — пять аукционов подряд (~170 страниц, ~9 минут);
//   hey-self      — HeyDealer Self      (~165 страниц по 20, ~8 минут);
//   hey-zero      — HeyDealer Zero      (~195 страниц, ~10 минут);
//   hey-instant   — HeyDealer Instant   (~65 страниц, ~4 минуты).
// Ленты — отдельные задания крона (scripts/cron/run.mjs), а не одно общее:
// всё вместе — ~30 минут, ровно предел раннера, после которого задание
// считается упавшим. Плюс так меньше пиковая нагрузка на carnect.
//
// ⚠️ ОТМЕТКА «УШЁЛ» — только по ПОЛНОМУ обходу и только после двух подряд.
// Пока мы листаем, у carnect появляются и исчезают машины, страницы
// сдвигаются, и живой лот можно пропустить. Поэтому:
//   • прерванный обход (ошибка, потолок страниц) счётчики пропусков не трогает;
//   • обход, собравший меньше 90% обещанного total, — тоже: что-то не так;
//   • лот, которого не было в полном обходе, получает miss_count + 1, и
//     только на втором пропуске подряд — gone_at. Снова появился — сброс.
//
// ⚠️ Пишем ТОЛЬКО колонки, которые знаем из списка. first_seen_at в payload
// нет — upsert его не перезаписывает, дата первого появления не сдвигается.

import { createServerClient } from "@/lib/supabase";

import { fetchHeyPage, type HeyAuctionType, type HeyListCar, type HeySort } from "./heydealer";
import { ALL_HOUSES, type CarnectHouse } from "./houses";
import { crawlPages, fetchListPage, type ListError } from "./list";
import {
  canonicalMake,
  canonicalModelGroup,
  heyModelGroup,
  normalizeFuel,
  normalizeTrans,
  positive,
} from "./normalize";
import type { CarnectListLot } from "./types";

export type FeedId = "auctions" | "hey-self" | "hey-zero" | "hey-instant";

export const FEEDS: Record<FeedId, { about: string }> = {
  auctions: { about: "Autobell, K Car, Lotte, SK, Autohub" },
  "hey-self": { about: "HeyDealer Self" },
  "hey-zero": { about: "HeyDealer Zero" },
  "hey-instant": { about: "HeyDealer Instant" },
};

const HEY_FEED: Partial<Record<FeedId, HeyAuctionType>> = {
  "hey-self": "self",
  "hey-zero": "customer_zero",
  "hey-instant": "fixed_price_zero",
};

/**
 * Проходы HeyDealer. ⚠️ Явные сортировки (mileageAsc, priceAsc) воспроизводимы,
 * но у carnect ОБРЕЗАНЫ: отдают ~13 страниц (~260 машин) из 65 — пробный обход
 * 02.10.2026 собрал ими 20% Instant. Порядок по умолчанию (newest) не обрезан,
 * но нестабилен от запроса к запросу, поэтому два его прохода объединяются:
 * что «перескочило» мимо в первом, ловится вторым.
 * ⚠️ Полнота этой схемы ещё НЕ ЗАМЕРЕНА — задания carnect-hey-* в кроне не
 * включать, пока пробный обход (?dry=1) не покажет coverage ≥ 95%.
 */
const HEY_SORTS: HeySort[] = ["newest", "newest"];

export function isFeed(v: string | null | undefined): v is FeedId {
  return !!v && v in FEEDS;
}

/** Строка carnect_lots — ровно те колонки, что пишет синк. */
interface LotRow {
  house: string;
  external_id: string;
  venue_code: string | null;
  venue: string | null;
  hey_type: string | null;
  make: string | null;
  model_group: string | null;
  year: number | null;
  km: number | null;
  fuel: string | null;
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
  raw: unknown;
  last_seen_at: string;
  miss_count: 0;
  gone_at: null;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Время из источника → ISO с зоной. K Car отдаёт startAt без зоны, время
 * корейское — без явного +09:00 Date.parse счёл бы его UTC и сдвинул на 9
 * часов (тот же класс ошибки, что у дат Encar в CLAUDE.md).
 */
function kstIso(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}+09:00`;
  const t = Date.parse(withZone);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Лот аукциона → строка. Цена — стартовая; её нет у Lotte (carnect отдаёт 0). */
export function auctionRow(house: CarnectHouse, lot: CarnectListLot, now: string): LotRow {
  const modelGroup = canonicalModelGroup(lot.modelGroup);
  const price = positive(lot.startKrw);
  return {
    house,
    external_id: lot.lotId,
    venue_code: str(lot.venueCode),
    venue: str(lot.venue) ?? str(lot.location),
    hey_type: null,
    make: canonicalMake(lot.make, modelGroup, lot.titleEn),
    model_group: modelGroup,
    year: positive(lot.year),
    km: positive(lot.km),
    fuel: normalizeFuel(lot.fuel),
    price_krw: price,
    price_kind: price ? "start" : "none",
    title: str(lot.titleEn) ?? str(lot.model),
    grade: str(lot.grade),
    trans: normalizeTrans(lot.trans),
    photo_url: str(lot.photo),
    auction_date: str(lot.auctionDate),
    end_at: kstIso(lot.startAt),
    status: str(lot.status),
    insp_grade: str(lot.inspGrade),
    lot_no: str(lot.lotNo),
    raw: lot,
    last_seen_at: now,
    miss_count: 0,
    gone_at: null,
  };
}

/**
 * Машина HeyDealer → строка. Модельной группы у источника нет — ищем её в
 * строке модели (heyModelGroup); пустую марку восстанавливаем по ней.
 * Цена есть только у Instant (priceOnRequest = false), у Self и Zero — ставки.
 */
export function heyRow(car: HeyListCar, type: HeyAuctionType, now: string): LotRow {
  const declared = canonicalMake(car.make, null, car.model);
  const modelGroup = heyModelGroup(declared, car.model);
  const price = car.priceOnRequest ? null : positive(car.krw);
  return {
    house: "heydealer",
    external_id: car.id,
    venue_code: null,
    venue: null,
    hey_type: type,
    make: declared ?? canonicalMake(undefined, modelGroup, car.model),
    model_group: modelGroup,
    year: positive(car.year),
    km: positive(car.km),
    fuel: normalizeFuel(car.fuel),
    price_krw: price,
    price_kind: price ? "fixed" : "none",
    title: str(car.model),
    grade: null,
    trans: normalizeTrans(car.trans),
    photo_url: str(car.photo),
    auction_date: null,
    end_at: kstIso(car.endAt),
    status: str(car.status),
    insp_grade: str(car.heyCondition?.grade),
    lot_no: null,
    raw: car,
    last_seen_at: now,
    miss_count: 0,
    gone_at: null,
  };
}

export interface FeedSyncResult {
  ok: boolean;
  feed: FeedId;
  /** Строк собрано обходом. */
  fetched: number;
  upserted: number;
  /** Скольким лотам поставили gone_at (второй пропуск подряд). */
  gone: number;
  requests: number;
  seconds: number;
  error?: string;
  notes: Record<string, unknown>;
}

/** Один полный обход одного списка: строки и признак полноты. */
interface Crawl {
  scope: { house: string; heyType?: string };
  rows: LotRow[];
  total: number;
  requests: number;
  complete: boolean;
  error?: ListError;
  /** HeyDealer: сколько машин дал каждый проход — видно, что добавил второй. */
  perSort?: Record<string, number>;
}

/**
 * Обходит ленту. Для auctions — пять обходов, по одному на площадку: у
 * каждой свой total и своя полнота, и отметка ушедших ведётся по площадке.
 */
async function crawlFeed(feed: FeedId, now: string, signal?: AbortSignal): Promise<Crawl[]> {
  const heyType = HEY_FEED[feed];
  if (heyType) {
    // ⚠️ Проходы по HEY_SORTS и объединение по id: у carnect соседние
    // страницы нахлёстываются, и машины на стыках в одном проходе не
    // показываются вовсе (подробно — HeySort в heydealer.ts). Цена — вдвое
    // больше запросов; зато полнота, без которой нельзя честно помечать
    // машины ушедшими.
    const byId = new Map<string, HeyListCar>();
    let requests = 0;
    let total = 0;
    let complete = true;
    let error: ListError | undefined;
    const perSort: Record<string, number> = {};
    for (const [i, sort] of HEY_SORTS.entries()) {
      const r = await crawlPages<HeyListCar>((p) => fetchHeyPage(heyType, p, signal, sort), (c) => c.id, { signal });
      requests += r.requests;
      total = Math.max(total, r.total);
      complete &&= r.complete;
      // Ключ с номером прохода: сортировки повторяются (два newest), и по
      // одному имени второй проход затёр бы первый. Рядом — сколько машин
      // накоплено после прохода: прирост и есть вклад второго прохода.
      for (const c of r.items) byId.set(c.id, c);
      perSort[`${i + 1}:${sort}`] = r.items.length;
      perSort[`${i + 1}:union`] = byId.size;
      if (r.error) {
        error = r.error;
        complete = false;
        break; // второй проход по тому же сайту после отказа не делаем
      }
    }
    return [{
      scope: { house: "heydealer", heyType },
      rows: [...byId.values()].map((c) => heyRow(c, heyType, now)),
      total, requests, complete, error, perSort,
    }];
  }
  const out: Crawl[] = [];
  for (const house of ALL_HOUSES) {
    const r = await crawlPages<CarnectListLot>((p) => fetchListPage(house, p, { signal }), (l) => l.lotId, { signal });
    out.push({
      scope: { house },
      rows: r.items.map((l) => auctionRow(house, l, now)),
      total: r.total, requests: r.requests, complete: r.complete, error: r.error,
    });
    // Отказ по доступу или «притормозите» — на следующие площадки не идём:
    // это один и тот же сайт, и он только что попросил отстать.
    if (r.error === "blocked" || r.error === "rate-limited") break;
  }
  return out;
}

const CHUNK = 200;

/**
 * Отметка пропавших в пределах scope после ПОЛНОГО обхода. Два шага, и
 * порядок важен: сперва «второй пропуск → ушёл», потом «первый пропуск».
 * Наоборот — только что поставленная единица тут же превратилась бы в двойку.
 */
async function markMissing(scope: Crawl["scope"], runStartedAt: string): Promise<number> {
  const db = createServerClient();
  let goneQ = db
    .from("carnect_lots")
    .update({ miss_count: 2, gone_at: new Date().toISOString() })
    .eq("house", scope.house)
    .is("gone_at", null)
    .lt("last_seen_at", runStartedAt)
    .gte("miss_count", 1);
  if (scope.heyType) goneQ = goneQ.eq("hey_type", scope.heyType);
  const gone = await goneQ.select("external_id");
  if (gone.error) throw new Error(gone.error.message);

  let missQ = db
    .from("carnect_lots")
    .update({ miss_count: 1 })
    .eq("house", scope.house)
    .is("gone_at", null)
    .lt("last_seen_at", runStartedAt)
    .eq("miss_count", 0);
  if (scope.heyType) missQ = missQ.eq("hey_type", scope.heyType);
  const missed = await missQ;
  if (missed.error) throw new Error(missed.error.message);

  return gone.data?.length ?? 0;
}

/** Журнал прогона — в общую auction_sync_runs, source = carnect:<лента>. */
async function logRun(r: FeedSyncResult, startedAt: string) {
  try {
    await createServerClient().from("auction_sync_runs").insert({
      source: `carnect:${r.feed}`,
      kind: "lots",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      ok: r.ok,
      fetched: r.fetched,
      upserted: r.upserted,
      enriched: 0,
      error: r.error ?? null,
      notes: { ...r.notes, gone: r.gone, requests: r.requests, seconds: r.seconds },
    });
  } catch (e) {
    console.error("[carnect] не удалось записать auction_sync_runs:", e);
  }
}

/** Доля строк с распознанным значением — главный индикатор здоровья нормализации. */
function share(rows: LotRow[], pick: (r: LotRow) => unknown): string {
  if (!rows.length) return "—";
  const n = rows.filter((r) => pick(r) !== null && pick(r) !== undefined).length;
  return `${n}/${rows.length} (${Math.round((100 * n) / rows.length)}%)`;
}

/**
 * Синхронизирует одну ленту. Не бросает: всё в результате и в журнале.
 *
 * @param dry обойти и нормализовать, но НЕ писать в базу — проверить парсер и
 *   долю распознанных моделей, не трогая прод. Пробный прогон в журнал не
 *   пишется: в истории он выглядел бы как настоящий и сбивал отсчёт свежести.
 */
export async function syncFeed(feed: FeedId, opts: { dry?: boolean; signal?: AbortSignal } = {}): Promise<FeedSyncResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const result: FeedSyncResult = { ok: false, feed, fetched: 0, upserted: 0, gone: 0, requests: 0, seconds: 0, notes: {} };

  try {
    const crawls = await crawlFeed(feed, startedAt, opts.signal);
    const rows = crawls.flatMap((c) => c.rows);
    result.fetched = rows.length;
    result.requests = crawls.reduce((n, c) => n + c.requests, 0);

    result.notes = {
      // По площадке: сколько обещано, собрано, полный ли обход, ошибка.
      scopes: crawls.map((c) => ({
        ...c.scope, total: c.total, collected: c.rows.length, complete: c.complete, error: c.error ?? null,
        coverage: c.total ? `${Math.round((100 * c.rows.length) / c.total)}%` : "—",
        ...(c.perSort ? { perSort: c.perSort } : {}),
      })),
      recognized: {
        make: share(rows, (r) => r.make),
        modelGroup: share(rows, (r) => r.model_group),
        year: share(rows, (r) => r.year),
        fuel: share(rows, (r) => r.fuel),
        price: share(rows, (r) => r.price_krw),
      },
      // Что не распознаётся — образцы, по ним дописывают normalize.ts.
      unrecognizedModels: rows.filter((r) => !r.model_group).slice(0, 30).map((r) => `${r.make ?? "?"} | ${r.title ?? "?"}`),
    };

    if (!rows.length) {
      // Пустой результат — не повод что-либо помечать ушедшим. Источник
      // чужой и может отдать пусто по своей причине.
      result.error = crawls.find((c) => c.error)?.error ?? "источник не отдал ни одного лота";
      return await finish();
    }

    if (opts.dry) {
      result.ok = !crawls.some((c) => c.error);
      result.notes = { ...result.notes, dry: true, sample: rows.slice(0, 2).map((r) => ({ ...r, raw: undefined })) };
      return await finish();
    }

    const db = createServerClient();
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await db.from("carnect_lots").upsert(rows.slice(i, i + CHUNK), { onConflict: "house,external_id" });
      if (error) throw new Error(error.message);
      result.upserted += Math.min(CHUNK, rows.length - i);
    }

    // Отметка пропавших — только по полным обходам, собравшим >= 90% total.
    for (const c of crawls) {
      if (!c.complete || c.error || c.rows.length < c.total * 0.9) continue;
      result.gone += await markMissing(c.scope, startedAt);
    }

    result.ok = !crawls.some((c) => c.error);
    if (!result.ok) result.error = crawls.map((c) => c.error).filter(Boolean).join(", ");
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    console.error(`[carnect] syncFeed ${feed} упал:`, result.error);
  }
  return await finish();

  async function finish(): Promise<FeedSyncResult> {
    result.seconds = Math.round((Date.now() - t0) / 1000);
    if (!opts.dry) await logRun(result, startedAt);
    return result;
  }
}
