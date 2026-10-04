// Синхронизация carnect → таблица carnect_lots (sql/042_carnect_lots.sql).
//
// Одна «лента» = один обход одного списка carnect:
//   lotte, sk, glovis, kcar, autohub — по площадке (1–3 минуты каждая);
//   auctions      — все пять подряд (~7 минут) — ЛЕГАСИ, см. ниже;
//   hey-self      — HeyDealer Self      (~3 300 машин, срезами, ~20 минут);
//   hey-zero      — HeyDealer Zero      (~3 900 машин, срезами, ~23 минуты);
//   hey-instant   — HeyDealer Instant   (~1 300 машин, срезами, ~7.5 минуты).
// Ленты — отдельные задания крона (scripts/cron/run.mjs), а не одно общее.
//
// ⚠️ ПЛОЩАДКИ — ОТДЕЛЬНЫЕ ЛЕНТЫ (решение владельца 02.10.2026): у каждой
// площадки свой день торгов, и партия выкладывается за ~2 дня до него (у
// Autohub — сильно заранее). Обходить все пять разом каждый раз значит
// гонять ~140 страниц ради одной площадки, у которой что-то поменялось.
// Лента `auctions` осталась, чтобы прежнее задание крона не упало до того,
// как его заменят пятью новыми; запускать её параллельно с ними нельзя —
// те же площадки обойдутся дважды.
//
// ⚠️ «НИЧЕГО НЕ ИЗМЕНИЛОСЬ» — ОДИН ЗАПРОС ВМЕСТО ОБХОДА. Лента площадки
// сначала берёт первую страницу и сравнивает её отпечаток с прошлым полным
// прогоном (fingerprintOf, previousRun). Совпал — обход не нужен, прогон пишется в
// журнал как skipped. Поэтому расписание задаётся «с запасом» (дважды в
// сутки), а не угадывается по календарю: когда площадка реально выложит
// партию, первый же прогон после этого это увидит и обойдёт её целиком.
//
// ⚠️ ОТМЕТКА «УШЁЛ» У ПЛОЩАДОК — только по ПОЛНОМУ обходу и после двух подряд.
// У HeyDealer — по окончанию торгов (expireHey): его обход неполный по
// природе (сломанные страницы carnect), и по отсутствию судить нельзя.
// Пока мы листаем, у carnect появляются и исчезают машины, страницы
// сдвигаются, и живой лот можно пропустить. Поэтому:
//   • прерванный обход (ошибка, потолок страниц) счётчики пропусков не трогает;
//   • обход, собравший меньше 90% обещанного total, — тоже: что-то не так;
//   • лот, которого не было в полном обходе, получает miss_count + 1, и
//     только на втором пропуске подряд — gone_at. Снова появился — сброс.
//
// ⚠️ Пишем ТОЛЬКО колонки, которые знаем из списка. first_seen_at в payload
// нет — upsert его не перезаписывает, дата первого появления не сдвигается.

import { createHash } from "node:crypto";

import { createServerClient } from "@/lib/supabase";

import { fetchHeyPage, type HeyAuctionType, type HeyListCar, type HeySlice } from "./heydealer";
import { ALL_HOUSES, isHouse, type CarnectHouse } from "./houses";
import { crawlPages, fetchListPage, type ListError } from "./list";
import {
  canonicalMake,
  canonicalModelGroup,
  heyModelGroup,
  normalizeFuel,
  normalizeTrans,
  positive,
} from "./normalize";
import { notifyWorkChat } from "./notify";
import { kstIso } from "./time";
import type { CarnectListLot } from "./types";

export type FeedId = CarnectHouse | "auctions" | "hey-self" | "hey-zero" | "hey-instant";

/**
 * Ленты и их лимит времени. ⚠️ Лимит держать МЕНЬШЕ таймаута задачи в
 * Coolify (площадки — 10 минут, HeyDealer — 30 минут): обрыв должен
 * происходить по нашим правилам, с записью в журнал, а не снаружи.
 * Лимит площадки — вдвое с запасом от самой крупной (Lotte, ~3 минуты).
 * HeyDealer — 25 минут: запрос со срезом отвечает медленнее (~5.5 с вместе
 * с паузой против ~3 с, замер 02.10.2026), Zero это ~250 запросов, ~23 минуты.
 */
export const FEEDS: Record<FeedId, { about: string; budgetMs: number }> = {
  lotte: { about: "Lotte", budgetMs: 8 * 60_000 },
  sk: { about: "SK", budgetMs: 8 * 60_000 },
  glovis: { about: "Autobell (Glovis)", budgetMs: 8 * 60_000 },
  kcar: { about: "K Car", budgetMs: 8 * 60_000 },
  autohub: { about: "Autohub", budgetMs: 8 * 60_000 },
  auctions: { about: "все пять площадок (легаси)", budgetMs: 15 * 60_000 },
  "hey-self": { about: "HeyDealer Self", budgetMs: 25 * 60_000 },
  "hey-zero": { about: "HeyDealer Zero", budgetMs: 25 * 60_000 },
  "hey-instant": { about: "HeyDealer Instant", budgetMs: 25 * 60_000 },
};

const HEY_FEED: Partial<Record<FeedId, HeyAuctionType>> = {
  "hey-self": "self",
  "hey-zero": "customer_zero",
  "hey-instant": "fixed_price_zero",
};

/**
 * HeyDealer обходится СРЕЗАМИ по году выпуска, а не одним списком (разведка
 * 02.10.2026, подробно — HeySlice в heydealer.ts): у carnect ломаются
 * отдельные страницы, и на маленьком срезе их почти нет. Схема простая и
 * фиксированная, без рекурсии (решение владельца 02.10.2026: «пусть качает
 * часть машин, но всегда и стабильно»):
 *   • всё до 2009 года — один срез (там машин мало), дальше — по году;
 *   • год, где машин больше HEY_SLICE_MAX, делится на четыре постоянных
 *     диапазона пробега;
 *   • сломанные страницы перешагиваются, машины с них в этот раз теряются.
 * Ожидаемая полнота 85–95%. Это не авария: машина HeyDealer пропадает из
 * каталога по окончанию своих торгов (expireHey), а не по отсутствию в обходе,
 * поэтому неполный обход ничего живого не прячет.
 */
const HEY_SLICE_MAX = 240;
const HEY_KM_BUCKETS: HeySlice[] = [
  { kmMax: 50_000 },
  { kmMin: 50_001, kmMax: 100_000 },
  { kmMin: 100_001, kmMax: 150_000 },
  { kmMin: 150_001 },
];

/** Срезы по году: до 2009 одним куском, дальше по году до следующего (модельный год). */
function heyYearSlices(): HeySlice[] {
  const last = new Date().getUTCFullYear() + 1;
  const out: HeySlice[] = [{ yearMax: 2009 }];
  for (let y = 2010; y <= last; y++) out.push({ yearMin: y, yearMax: y });
  return out;
}

const sliceLabel = (s: HeySlice) =>
  [s.yearMin === s.yearMax && s.yearMin ? `${s.yearMin}` : `${s.yearMin ?? "…"}–${s.yearMax ?? "…"}`,
    s.kmMin != null || s.kmMax != null ? `км ${s.kmMin ?? 0}–${s.kmMax ?? "∞"}` : ""]
    .filter(Boolean).join(" ");

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
  /** HeyDealer: сколько срезов обойдено и где были сломанные страницы. */
  detail?: Record<string, unknown>;
  /** Отпечаток первой страницы площадки — для проверки «ничего не изменилось». */
  fingerprint?: string;
  /** Обход не делался: отпечаток совпал с прошлым полным прогоном. */
  skipped?: boolean;
}

/** Последний известный отпечаток ленты и время её последнего ПОЛНОГО прогона. */
interface PrevRun {
  fingerprint: string | null;
  fullAt: number | null;
}

/**
 * Не пропускаем обход дольше этого, даже если отпечаток тот же. Страховка от
 * случая, который отпечаток не видит: лоты сняли из середины списка, а первая
 * страница и total те же. Раз в сутки полный обход — и такие лоты уйдут.
 *
 * ⚠️ 20 часов, а НЕ 24: интервал обязан быть МЕНЬШЕ суточного периода крона.
 * Прошлый полный прогон стартует в то же время суток, что и текущий, и при 24
 * часах полный обход держался на паре секунд запроса первой страницы —
 * запустись Coolify на секунду раньше, и обход уехал бы на следующий запуск
 * (та же ловушка, что у SEND_COOLDOWN_MS, docs/postmortems.md).
 */
const FORCE_FULL_MS = 20 * 60 * 60 * 1000;

/**
 * Отпечаток площадки по первой странице: total плюс набор лотов на ней. Новая
 * партия меняет оба, снятие проданных после торгов — total. Хеш — чтобы в
 * журнале лежала короткая строка, а не 24 id.
 *
 * ⚠️ lastIngestAt (время синхронизации carnect с площадкой) сюда НЕ входит,
 * хотя выглядит идеальным признаком: он меняется при каждой их синхронизации,
 * даже если лоты те же, и с ним отпечаток Autobell и Autohub менялся бы
 * каждый прогон — обход шёл бы всегда и экономии не было бы.
 */
function fingerprintOf(page: { total: number; items: CarnectListLot[] }): string {
  const basis = `${page.total}:${page.items.map((l) => l.lotId).sort().join(",")}`;
  return createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

/**
 * Прошлые прогоны ленты из журнала: отпечаток последнего удачного (полного или
 * пропущенного — у пропущенного он тот же) и время последнего ПОЛНОГО. Не
 * получилось прочитать — null, и обход просто пойдёт целиком: лишний обход
 * безопаснее пропущенной новой партии.
 */
async function previousRun(feed: FeedId): Promise<PrevRun> {
  try {
    const { data, error } = await createServerClient()
      .from("auction_sync_runs")
      .select("started_at, notes")
      .eq("source", sourceOf(feed))
      .eq("ok", true)
      .order("started_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { started_at: string; notes: { fingerprint?: string; skipped?: boolean } | null }[];
    const fingerprint = rows.find((r) => r.notes?.fingerprint)?.notes?.fingerprint ?? null;
    const full = rows.find((r) => !r.notes?.skipped);
    return { fingerprint, fullAt: full ? Date.parse(full.started_at) : null };
  } catch (e) {
    console.error("[carnect] не удалось прочитать прошлый прогон:", e instanceof Error ? e.message : e);
    return { fingerprint: null, fullAt: null };
  }
}

/**
 * Обход одной площадки. С `prev` — сначала проверка «ничего не изменилось»:
 * первая страница берётся один раз и, если обход нужен, переиспользуется в
 * нём (crawlPages получает её готовой, второго запроса за ней нет).
 */
async function crawlHouse(house: CarnectHouse, now: string, signal: AbortSignal | undefined, prev: PrevRun | null): Promise<Crawl> {
  const scope = { house };
  const first = await fetchListPage(house, 1, { signal });
  if ("error" in first) {
    return { scope, rows: [], total: 0, requests: 1, complete: false, error: first.error };
  }
  const fingerprint = fingerprintOf(first.page);
  const fresh = prev?.fullAt != null && Date.now() - prev.fullAt < FORCE_FULL_MS;
  if (prev && fresh && prev.fingerprint === fingerprint) {
    return { scope, rows: [], total: first.page.total, requests: 1, complete: false, fingerprint, skipped: true };
  }
  const r = await crawlPages<CarnectListLot>(
    (p) => (p === 1 ? Promise.resolve(first) : fetchListPage(house, p, { signal })),
    (l) => l.lotId,
    { signal },
  );
  return {
    scope,
    rows: r.items.map((l) => auctionRow(house, l, now)),
    // requests у crawlPages считает и первую страницу, которую мы уже взяли
    // сами, — её второй раз не запрашивали, поэтому не прибавляем.
    total: r.total, requests: r.requests, complete: r.complete, error: r.error, fingerprint,
  };
}

/**
 * Обход одного типа HeyDealer срезами (HEY_SLICE_MAX, heyYearSlices). Не
 * делит рекурсивно и не повторяет: план обхода известен заранее, а значит,
 * известны и число запросов, и время. Отказ сайта (403, 429, недоступен)
 * останавливает обход целиком — собранное до него сохраняется.
 */
async function crawlHey(type: HeyAuctionType, now: string, signal: AbortSignal | undefined): Promise<Crawl> {
  const scope = { house: "heydealer", heyType: type };
  const byId = new Map<string, HeyListCar>();
  const broken: string[] = [];
  let requests = 0;
  let slices = 0;
  let error: ListError | undefined;

  // Общий total типа — только для отчёта о полноте: сколько обещано всего.
  const head = await fetchHeyPage(type, 1, signal);
  requests++;
  if ("error" in head) return { scope, rows: [], total: 0, requests, complete: false, error: head.error };
  const total = head.page.total;

  /** Обходит один срез; первую страницу можно передать готовой, чтобы не брать её дважды. */
  const crawlSlice = async (slice: HeySlice, firstPage?: Awaited<ReturnType<typeof fetchHeyPage>>) => {
    slices++;
    const r = await crawlPages<HeyListCar>(
      (p) => (p === 1 && firstPage ? Promise.resolve(firstPage) : fetchHeyPage(type, p, signal, slice)),
      (c) => c.id,
      { signal },
    );
    // Первую страницу, взятую заранее, crawlPages посчитал как свой запрос.
    requests += r.requests - (firstPage ? 1 : 0);
    for (const c of r.items) byId.set(c.id, c);
    if (r.brokenPages.length) broken.push(`${sliceLabel(slice)}: стр. ${r.brokenPages.join(",")}`);
    return r;
  };

  for (const year of heyYearSlices()) {
    if (signal?.aborted || error) break;
    const first = await fetchHeyPage(type, 1, signal, year);
    requests++;
    if ("error" in first) {
      error = first.error;
      break;
    }
    // Пустая первая страница с total 0 — это или правда пустой год, или
    // сломанная страница. Различить нельзя, поэтому такой год, как и
    // крупный, обходится по диапазонам пробега: пустой год стоит четыре
    // лишних запроса, а сломанный не теряется целиком.
    const split = first.page.total > HEY_SLICE_MAX || (first.page.total === 0 && !first.page.items.length);
    if (!split) {
      const r = await crawlSlice(year, first);
      if (r.error) error = r.error;
      continue;
    }
    for (const km of HEY_KM_BUCKETS) {
      if (signal?.aborted) break;
      const r = await crawlSlice({ ...year, ...km });
      if (r.error) {
        error = r.error;
        break;
      }
    }
  }

  return {
    scope,
    rows: [...byId.values()].map((c) => heyRow(c, type, now)),
    total,
    requests,
    // Полнота HeyDealer на отметку ушедших не влияет (expireHey), поэтому
    // «полным» обход не объявляется никогда — markMissing его не тронет.
    complete: false,
    error,
    detail: { slices, brokenPages: broken },
  };
}

/**
 * Обходит ленту. Для auctions — пять обходов, по одному на площадку: у
 * каждой свой total и своя полнота, и отметка ушедших ведётся по площадке.
 */
async function crawlFeed(feed: FeedId, now: string, signal?: AbortSignal, prev: PrevRun | null = null): Promise<Crawl[]> {
  if (isHouse(feed)) return [await crawlHouse(feed, now, signal, prev)];
  const heyType = HEY_FEED[feed];
  if (heyType) return [await crawlHey(heyType, now, signal)];
  const out: Crawl[] = [];
  for (const house of ALL_HOUSES) {
    // Лимит времени вышел — следующую площадку не начинаем. Её строки в
    // отчёте не появятся, и это видно: площадки нет в scopes.
    if (signal?.aborted) break;
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

/**
 * Машины HeyDealer, которые ушли: торги закончились (end_at в прошлом с
 * запасом), а у машин без end_at — не видели HEY_STALE_MS. Не зависит от
 * полноты обхода: машина со сломанной страницы, которую мы в этот раз не
 * увидели, остаётся в каталоге до своего окончания торгов. Появится снова в
 * обходе (перевыставили) — upsert вернёт её: gone_at в строке синка null.
 */
const HEY_END_GRACE_MS = 6 * 60 * 60 * 1000;
const HEY_STALE_MS = 3 * 24 * 60 * 60 * 1000;

async function expireHey(type: string): Promise<number> {
  const ended = new Date(Date.now() - HEY_END_GRACE_MS).toISOString();
  const unseen = new Date(Date.now() - HEY_STALE_MS).toISOString();
  const { data, error } = await createServerClient()
    .from("carnect_lots")
    .update({ gone_at: new Date().toISOString() })
    .eq("house", "heydealer")
    .eq("hey_type", type)
    .is("gone_at", null)
    .or(`end_at.lt.${ended},and(end_at.is.null,last_seen_at.lt.${unseen})`)
    .select("external_id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

// ─── Надзор за прогоном ──────────────────────────────────────────────────
//
// Задача: прогон не может ни висеть бесконечно, ни упасть молча. Четыре
// механизма, каждый закрывает свой способ «тихо не сработать»:
//
//   1. ЛИМИТ ВРЕМЕНИ (FEEDS[лента].budgetMs). Обход сам останавливается, сохраняет
//      собранное и пишет «прервано по времени». Отдельный запрос к carnect и
//      так ограничен 20 с (client.ts), но страниц сотни, и медленный сайт
//      растянул бы обход на час. Лимит МЕНЬШЕ таймаута задачи в Coolify
//      (значения — у FEEDS): обрыв происходит по нашим правилам, с записью в
//      журнал, а не снаружи на полуслове.
//   2. ЗАПИСЬ В ЖУРНАЛ В НАЧАЛЕ, а не только в конце. Строка с пустым
//      finished_at = прогон идёт или умер на полпути (процесс убит деплоем).
//   3. ЗАВИСШИЕ ПРОГОНЫ. Каждый новый прогон ищет прежние строки без
//      finished_at старше лимита с запасом — они уже точно не закончатся —
//      закрывает их как сбой и сообщает в чат. Иначе прогон, убитый деплоем,
//      не оставил бы никакого следа, кроме устаревшего каталога.
//   4. ОДИН ПРОГОН ЛЕНТЫ ЗА РАЗ. Второй запуск, пока идёт первый, не
//      стартует и возвращает ok:false с причиной: два параллельных обхода
//      стояли бы в одной очереди client.ts, вдвое нагружая carnect, и оба
//      упёрлись бы в лимит.
//
// Обо всём, что пошло не так, — сообщение в рабочий Telegram (notify.ts).
// Об успехе — молчим.

/**
 * Самый длинный лимит из всех лент (FEEDS[...].budgetMs). Строка журнала без
 * finished_at старше него с запасом — прогон точно мёртв, а не идёт.
 */
const MAX_BUDGET_MS = Math.max(...Object.values(FEEDS).map((f) => f.budgetMs));
const STALE_AFTER_MS = MAX_BUDGET_MS + 5 * 60 * 1000;

/** Полнота ниже этой доли total — повод для уведомления (и не повод помечать ушедших). */
const MIN_COVERAGE = 0.9;
/** То же для HeyDealer: 85–95% там норма (сломанные страницы), тревога — ниже 70%. */
const HEY_MIN_COVERAGE = 0.7;

/**
 * Ленты, которые сейчас идут в этом процессе. Прод — один контейнер (как и
 * очередь в client.ts), поэтому памяти процесса достаточно.
 */
const running = new Set<FeedId>();

const sourceOf = (feed: FeedId) => `carnect:${feed}`;

/** Открывает строку журнала в начале прогона. Не вышло — синк всё равно идёт. */
async function openRun(feed: FeedId, startedAt: string): Promise<number | null> {
  try {
    const { data, error } = await createServerClient()
      .from("auction_sync_runs")
      .insert({ source: sourceOf(feed), kind: "lots", started_at: startedAt })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: number }).id;
  } catch (e) {
    console.error("[carnect] не удалось открыть строку журнала:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Закрывает строку журнала итогом. Строки нет (не открылась) — вставляет целиком. */
async function closeRun(runId: number | null, r: FeedSyncResult, startedAt: string) {
  const row = {
    finished_at: new Date().toISOString(),
    ok: r.ok,
    fetched: r.fetched,
    upserted: r.upserted,
    enriched: 0,
    error: r.error ?? null,
    notes: { ...r.notes, gone: r.gone, requests: r.requests, seconds: r.seconds },
  };
  try {
    const db = createServerClient();
    const { error } = runId
      ? await db.from("auction_sync_runs").update(row).eq("id", runId)
      : await db.from("auction_sync_runs").insert({ source: sourceOf(r.feed), kind: "lots", started_at: startedAt, ...row });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[carnect] не удалось закрыть строку журнала:", e instanceof Error ? e.message : e);
  }
}

/**
 * Прежние прогоны ленты, которые начались и не закончились: процесс убили
 * (деплой, перезапуск, нехватка памяти) посреди обхода. Закрывает их как
 * сбой и возвращает время старта каждого — для уведомления.
 */
async function closeStaleRuns(feed: FeedId): Promise<string[]> {
  try {
    const { data, error } = await createServerClient()
      .from("auction_sync_runs")
      .update({
        finished_at: new Date().toISOString(),
        ok: false,
        error: "прогон не завершился: процесс остановлен посреди обхода (деплой или перезапуск?)",
      })
      .eq("source", sourceOf(feed))
      .is("finished_at", null)
      .lt("started_at", new Date(Date.now() - STALE_AFTER_MS).toISOString())
      .select("started_at");
    if (error) throw new Error(error.message);
    return ((data ?? []) as { started_at: string }[]).map((d) => d.started_at);
  } catch (e) {
    console.error("[carnect] проверка зависших прогонов упала:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Доля строк с распознанным значением — главный индикатор здоровья нормализации. */
function share(rows: LotRow[], pick: (r: LotRow) => unknown): string {
  if (!rows.length) return "—";
  const n = rows.filter((r) => pick(r) !== null && pick(r) !== undefined).length;
  return `${n}/${rows.length} (${Math.round((100 * n) / rows.length)}%)`;
}

/** Время по Корее для сообщения — владелец читает чат оттуда. */
const kst = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Seoul" });

/**
 * Что в прогоне пошло не так — строками для сообщения. Пусто — всё хорошо,
 * сообщения не будет.
 */
function problems(r: FeedSyncResult, crawls: Crawl[], timedOut: boolean, budgetMs: number): string[] {
  const out: string[] = [];
  if (timedOut) out.push(`⏱ Прервано по лимиту времени (${budgetMs / 60000} мин). Собранное сохранено.`);
  if (r.error && !timedOut) out.push(`❌ Ошибка: ${r.error}`);
  for (const c of crawls) {
    if (c.skipped) continue; // не обходили — полноту не с чего считать
    const name = c.scope.heyType ? `${c.scope.house}:${c.scope.heyType}` : c.scope.house;
    // У HeyDealer неполнота заложена в схему (сломанные страницы), тревога —
    // только если собрано совсем мало: значит, сломалось что-то посерьёзнее.
    const min = c.scope.heyType ? HEY_MIN_COVERAGE : MIN_COVERAGE;
    if (c.total && c.rows.length < c.total * min) {
      out.push(`⚠️ ${name}: собрано ${c.rows.length} из ${c.total} (${Math.round((100 * c.rows.length) / c.total)}%)`);
    }
  }
  return out;
}

/**
 * Синхронизирует одну ленту. Не бросает: всё в результате, в журнале и, при
 * сбое, в рабочем Telegram.
 *
 * @param dry обойти и нормализовать, но НЕ писать в базу — проверить парсер и
 *   долю распознанных моделей, не трогая прод. Пробный прогон в журнал не
 *   пишется и уведомлений не шлёт: в истории он выглядел бы как настоящий.
 * @param signal внешняя отмена. ⚠️ Маршрут её НЕ передаёт намеренно: если
 *   Coolify перестанет ждать ответа, обход всё равно должен дойти до конца и
 *   записать итог, а не оборваться вместе с соединением. Время прогона
 *   ограничивает лимит ленты (FEEDS[лента].budgetMs), а не клиент.
 */
export async function syncFeed(feed: FeedId, opts: { dry?: boolean; signal?: AbortSignal } = {}): Promise<FeedSyncResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const result: FeedSyncResult = { ok: false, feed, fetched: 0, upserted: 0, gone: 0, requests: 0, seconds: 0, notes: {} };

  if (running.has(feed)) {
    // Не уведомляем: прошлый прогон идёт и сам сообщит, если что. Ответ с
    // ok:false покрасит задачу в истории Coolify (код 2) — этого достаточно.
    result.error = "прогон этой ленты уже идёт — второй не запускаем";
    return result;
  }
  running.add(feed);

  const budgetMs = FEEDS[feed].budgetMs;
  const budget = AbortSignal.timeout(budgetMs);
  const signal = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;
  const stale = opts.dry ? [] : await closeStaleRuns(feed);
  // Пробный прогон всегда обходит целиком: его смысл — проверить парсер.
  const prev = !opts.dry && isHouse(feed) ? await previousRun(feed) : null;
  const runId = opts.dry ? null : await openRun(feed, startedAt);
  let crawls: Crawl[] = [];

  try {
    crawls = await crawlFeed(feed, startedAt, signal, prev);

    // Площадка не изменилась с прошлого полного прогона — один запрос, и всё.
    // ok:true с skipped в журнале: задача в истории Coolify зелёная, а по
    // notes видно, что обхода не было и почему.
    if (crawls.length > 0 && crawls.every((c) => c.skipped)) {
      result.ok = true;
      result.requests = crawls.reduce((n, c) => n + c.requests, 0);
      result.notes = { skipped: true, reason: "отпечаток площадки не изменился", fingerprint: crawls[0].fingerprint, total: crawls[0].total };
      return await finish();
    }

    const rows = crawls.flatMap((c) => c.rows);
    result.fetched = rows.length;
    result.requests = crawls.reduce((n, c) => n + c.requests, 0);

    result.notes = {
      // По площадке: сколько обещано, собрано, полный ли обход, ошибка.
      scopes: crawls.map((c) => ({
        ...c.scope, total: c.total, collected: c.rows.length, complete: c.complete,
        // Отказ страницы после обрыва по лимиту — это наш отменённый запрос, а
        // не «сайт не ответил». Назвать его unavailable значит спутать причину.
        error: budget.aborted && c.error === "unavailable" ? "timeout" : c.error ?? null,
        coverage: c.total ? `${Math.round((100 * c.rows.length) / c.total)}%` : "—",
        ...(c.detail ?? {}),
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
      ...(budget.aborted ? { timedOut: true } : {}),
      // Отпечаток пишется только для ленты одной площадки: по нему следующий
      // прогон решает, нужен ли обход (previousRun).
      ...(crawls.length === 1 && crawls[0].fingerprint ? { fingerprint: crawls[0].fingerprint } : {}),
    };

    if (!rows.length) {
      // Пустой результат — не повод что-либо помечать ушедшим. Источник
      // чужой и может отдать пусто по своей причине.
      result.error = crawls.find((c) => c.error)?.error ?? "источник не отдал ни одного лота";
      return await finish();
    }

    const timeoutError = `лимит времени ${budgetMs / 60000} мин`;

    if (opts.dry) {
      result.ok = !crawls.some((c) => c.error) && !budget.aborted;
      if (budget.aborted) result.error = timeoutError;
      result.notes = { ...result.notes, dry: true, sample: rows.slice(0, 2).map((r) => ({ ...r, raw: undefined })) };
      return await finish();
    }

    // ⚠️ Собранное пишем и после обрыва по лимиту: это живые лоты, увиденные
    // только что. Ушедших при этом НЕ помечаем — обход неполный (ниже).
    const db = createServerClient();
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await db.from("carnect_lots").upsert(rows.slice(i, i + CHUNK), { onConflict: "house,external_id" });
      if (error) throw new Error(error.message);
      result.upserted += Math.min(CHUNK, rows.length - i);
    }

    // Отметка ушедших. HeyDealer — по окончанию торгов (expireHey), от
    // полноты обхода не зависит. Площадки — только по полным обходам,
    // собравшим >= 90% total, и на втором пропуске подряд (markMissing).
    for (const c of crawls) {
      if (c.scope.heyType) {
        result.gone += await expireHey(c.scope.heyType);
        continue;
      }
      if (!c.complete || c.error || c.rows.length < c.total * MIN_COVERAGE) continue;
      result.gone += await markMissing(c.scope, startedAt);
    }

    result.ok = !crawls.some((c) => c.error) && !budget.aborted;
    if (budget.aborted) {
      // Ошибки страниц после обрыва — следствие обрыва (запрос отменён), а не
      // отказ сайта; называть их «unavailable» значит путать причину.
      result.error = timeoutError;
    } else if (!result.ok) {
      result.error = crawls.map((c) => c.error).filter(Boolean).join(", ");
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    console.error(`[carnect] syncFeed ${feed} упал:`, result.error);
  }
  return await finish();

  async function finish(): Promise<FeedSyncResult> {
    result.seconds = Math.round((Date.now() - t0) / 1000);
    running.delete(feed);
    if (opts.dry) return result;

    await closeRun(runId, result, startedAt);

    const lines = problems(result, crawls, budget.aborted, budgetMs);
    for (const at of stale) lines.push(`🧟 Прогон, начатый ${kst(at)}, не завершился — процесс был остановлен.`);
    if (lines.length) {
      await notifyWorkChat([
        `carnect · ${feed} · ${result.ok ? "с замечаниями" : "СБОЙ"}`,
        ...lines,
        `Собрано ${result.fetched}, записано ${result.upserted}, ушло ${result.gone}, запросов ${result.requests}, ${result.seconds} с.`,
        "Подробности: auction_sync_runs, source = " + sourceOf(feed),
      ]);
    }
    return result;
  }
}
