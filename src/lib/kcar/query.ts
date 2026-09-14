// Чтение лотов для витрины. Отделено от sync.ts намеренно: тот пишет, этот
// читает, и у них разные правила деградации.
//
// ⚠️ Модуль НЕ БРОСАЕТ исключений, как и остальной kcar: страница обязана
// отрисоваться даже когда Supabase лежит. Возвращаем пустой результат с
// failed: true, а витрина разводит «ничего не нашлось» и «данные недоступны»
// — это разные сообщения для человека. Правило то же, что у getCars.
//
// ⚠️ Сортировка ВСЕГДА добирает (source, external_id) хвостом. Это полный
// первичный ключ таблицы, а без него .range() теряет строки между
// страницами: по цене или пробегу значения не уникальны, и порядок внутри
// группы Postgres не обещает. Постмортем про это есть в CLAUDE.md.

import { unstable_cache } from "next/cache";

import { createServerClient } from "@/lib/supabase";
import { buildPremiumIndex } from "./estimate";

export const LOTS_PAGE_SIZE = 24;

/** Колонки, которые реально нужны карточке. `select *` тянул бы лист осмотра. */
const CARD_COLUMNS =
  "source, external_id, lane, lot_no, auction_date, site, maker, model, trim, " +
  "name_ko, year, mileage_km, fuel, transmission, color, usage, grade_ext, " +
  "grade_int, defect_count, defect_parts, mortgages, seizures, start_price_krw, " +
  "status, remarks, conditions, blocked_export, thumb_url, photo_count, vin, " +
  "status_image_url";

export type LotSort = "lot" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";

export interface LotRow {
  source: string;
  external_id: string;
  lane: string | null;
  lot_no: number | null;
  auction_date: string | null;
  site: string | null;
  maker: string | null;
  model: string | null;
  trim: string | null;
  name_ko: string | null;
  year: number | null;
  mileage_km: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  usage: string | null;
  grade_ext: string | null;
  grade_int: string | null;
  defect_count: number | null;
  defect_parts: string[];
  mortgages: number | null;
  seizures: number | null;
  start_price_krw: number | null;
  status: string | null;
  remarks: string | null;
  conditions: string[];
  blocked_export: boolean;
  thumb_url: string | null;
  photo_count: number;
  vin: string | null;
  /** Только для Lotte: диаграмма кузова готовой картинкой. */
  status_image_url: string | null;
}

export interface LotQuery {
  /** Площадка. Каталоги разных площадок не смешиваются: у них разные цены. */
  source?: string | null;
  maker?: string | null;
  q?: string | null;
  sort?: LotSort;
  page?: number;
  /** false — показать и прошедшие торги (в таблице они остаются как история). */
  upcoming?: boolean;
}

export interface LotsPage {
  rows: LotRow[];
  total: number;
  /** Марки с числом лотов — для выпадашки фильтра. */
  makers: { maker: string; count: number }[];
  failed: boolean;
}

/**
 * Поисковая строка уходит в PostgREST-выражение `or=(...)`, где запятая и
 * скобки — разделители синтаксиса. Незачищенный ввод там не «не найдётся», а
 * сломает запрос целиком, поэтому режем всё, кроме букв, цифр и пробела.
 */
function safeSearch(q: string): string {
  return q.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
}

/**
 * Цена у обеих площадок лежит в start_price_krw: витрина Lotte умеет отдавать
 * её в вонах по параметру currency=KRW, и мы просим именно их — доллар там её
 * собственный пересчёт по неизвестному нам курсу.
 *
 * ⚠️ Порядок по умолчанию всё же разный: у KCar есть полоса и номер лота, у
 * Lotte их не существует вовсе — там осмысленно «сначала новые», благо
 * идентификаторы витрины сквозные и растут.
 */
function applySort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: LotSort,
  source: string | null | undefined,
) {
  const isLotte = source === "lotte";

  switch (sort) {
    // Цена у обеих площадок теперь в ОДНОЙ колонке: у Lotte витрина умеет
    // отдавать её в вонах, и мы просим именно их.
    case "price_asc":
      return query.order("start_price_krw", { ascending: true, nullsFirst: false });
    case "price_desc":
      return query.order("start_price_krw", { ascending: false, nullsFirst: false });
    case "year_desc":
      return query.order("year", { ascending: false, nullsFirst: false });
    case "mileage_asc":
      return query.order("mileage_km", { ascending: true, nullsFirst: false });
    default:
      return isLotte
        ? query.order("external_id", { ascending: false })
        : query.order("lane", { ascending: true, nullsFirst: false })
               .order("lot_no", { ascending: true, nullsFirst: false });
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export async function getLots(opts: LotQuery = {}): Promise<LotsPage> {
  const empty: LotsPage = { rows: [], total: 0, makers: [], failed: false };
  const page = Math.max(1, opts.page ?? 1);
  const sort: LotSort = opts.sort ?? "lot";
  const upcoming = opts.upcoming !== false;
  const from = (page - 1) * LOTS_PAGE_SIZE;

  try {
    const db = createServerClient();

    /**
     * ⚠️ `withMaker` существует ради ВЫПАДАШКИ МАРОК. Счётчики марок обязаны
     * считаться по выдаче БЕЗ фильтра по марке: иначе после выбора SsangYong в
     * списке остаётся один SsangYong, и сменить марку нечем — только сбросом
     * через адрес. Ровно это и происходило: намерение было записано
     * комментарием у collectMakers, а код фильтр применял.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = (select: string, opt: { head?: boolean; withMaker?: boolean } = {}): any => {
      const { head = false, withMaker = true } = opt;
      let q = db.from("auction_lots").select(select, head ? { count: "exact", head: true } : { count: "exact" });
      if (opts.source) q = q.eq("source", opts.source);
      if (upcoming) q = q.gte("auction_date", today());
      if (withMaker && opts.maker) q = q.eq("maker", opts.maker);
      const needle = opts.q ? safeSearch(opts.q) : "";
      if (needle) {
        q = q.or(
          `model.ilike.%${needle}%,maker.ilike.%${needle}%,` +
          `name_ko.ilike.%${needle}%,external_id.ilike.%${needle}%`,
        );
      }
      return q;
    };

    const listQuery = applySort(base(CARD_COLUMNS), sort, opts.source)
      .order("source")
      .order("external_id")
      .range(from, from + LOTS_PAGE_SIZE - 1);

    const [{ data, count, error }, makers] = await Promise.all([
      listQuery,
      collectMakers(base("maker", { withMaker: false })),
    ]);

    if (error) {
      console.error("[kcar] getLots:", error.message);
      return { ...empty, failed: true };
    }

    return {
      rows: (data ?? []) as LotRow[],
      total: count ?? 0,
      makers,
      failed: false,
    };
  } catch (e) {
    console.error("[kcar] getLots упал:", e);
    return { ...empty, failed: true };
  }
}

/**
 * Счётчики марок. PostgREST не умеет GROUP BY, поэтому считаем на своей
 * стороне — колонка одна, строк меньше тысячи, это дешевле отдельной вьюхи.
 *
 * ⚠️ Вызывать ТОЛЬКО с base(..., { withMaker: false }). Список марок обязан
 * оставаться полным независимо от выбранной: иначе выпадашка схлопывается до
 * одного пункта и сменить марку можно лишь правкой адреса.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function collectMakers(query: any): Promise<{ maker: string; count: number }[]> {
  const tally = new Map<string, number>();
  const PAGE = 1000;
  // ⚠️ .order() у билдера PostgREST НАКАПЛИВАЕТСЯ, а билдер здесь один на все
  // страницы — внутри цикла ключи сортировки дублировались бы с каждой
  // итерацией. Задаём порядок один раз, в цикле двигаем только .range().
  const ordered = query.order("source").order("external_id");
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await ordered.range(from, from + PAGE - 1);
    if (error) {
      console.error("[kcar] счётчики марок:", error.message);
      break;
    }
    const rows = (data ?? []) as { maker: string | null }[];
    for (const r of rows) if (r.maker) tally.set(r.maker, (tally.get(r.maker) ?? 0) + 1);
    if (rows.length < PAGE) break;
  }
  return [...tally.entries()]
    .map(([maker, count]) => ({ maker, count }))
    .sort((a, b) => b.count - a.count || a.maker.localeCompare(b.maker, "ru"));
}

export interface AuctionSummary {
  upcomingLots: number;
  archiveLots: number;
  nextDate: string | null;
  sites: string[];
  observations: number;
  sales: number;
  lastSession: number | null;
  failed: boolean;
}

/** Шапка витрины: что вообще есть в базе. Один заход, четыре счётчика. */
export async function getAuctionSummary(): Promise<AuctionSummary> {
  const empty: AuctionSummary = {
    upcomingLots: 0, archiveLots: 0, nextDate: null, sites: [],
    observations: 0, sales: 0, lastSession: null, failed: false,
  };
  try {
    const db = createServerClient();
    const day = today();

    const [upcoming, archive, nearest, observations, sales, last] = await Promise.all([
      db.from("auction_lots").select("site", { count: "exact" }).gte("auction_date", day),
      db.from("auction_lots").select("*", { count: "exact", head: true }).lt("auction_date", day),
      db.from("auction_lots").select("auction_date").gte("auction_date", day)
        .order("auction_date", { ascending: true }).order("source").order("external_id").limit(1),
      db.from("auction_results").select("*", { count: "exact", head: true }),
      db.from("auction_results").select("*", { count: "exact", head: true }).eq("sold", true),
      db.from("auction_results").select("session")
        .order("session", { ascending: false }).order("source").order("external_id").limit(1),
    ]);

    const sites = [
      ...new Set(((upcoming.data ?? []) as { site: string | null }[]).map((r) => r.site).filter(Boolean)),
    ] as string[];

    return {
      upcomingLots: upcoming.count ?? 0,
      archiveLots: archive.count ?? 0,
      nextDate: ((nearest.data ?? [])[0] as { auction_date: string } | undefined)?.auction_date ?? null,
      sites,
      observations: observations.count ?? 0,
      sales: sales.count ?? 0,
      lastSession: ((last.data ?? [])[0] as { session: number } | undefined)?.session ?? null,
      failed: false,
    };
  } catch (e) {
    console.error("[kcar] getAuctionSummary упал:", e);
    return { ...empty, failed: true };
  }
}

/**
 * Кешированный индекс премий.
 *
 * buildPremiumIndex вычитывает ВСЕ состоявшиеся сделки — сейчас это 8.7 тысячи
 * строк девятью последовательными запросами к Supabase, который живёт на VPS,
 * то есть девять сетевых round-trip'ов. Замер до кеша: 12 секунд на рендер
 * страницы, и ровно столько же на каждый следующий, потому что маршрут
 * динамический. История прошедших торгов меняется раз в неделю, так что
 * пересчитывать её на запрос бессмысленно.
 *
 * ⚠️ unstable_cache кладёт значение в кеш данных ЧЕРЕЗ JSON, а Map через JSON
 * не проходит — сериализуется в `{}`. Поэтому внутри кеша живут массивы пар, а
 * Map'ы собираются уже снаружи. Без этого индекс молча оказывался бы пустым, и
 * прогноз у всех лотов выродился бы в «по рынку» — тихо и правдоподобно.
 */
const cachedPools = unstable_cache(
  async () => {
    const index = await buildPremiumIndex();
    return {
      byModel: [...index.byModel.entries()],
      byGrade: [...index.byGrade.entries()],
      overall: index.overall,
    };
  },
  ["kcar-premium-index"],
  { revalidate: 3600, tags: ["kcar-premium-index"] },
);

export async function getPremiumIndex(): Promise<Awaited<ReturnType<typeof buildPremiumIndex>>> {
  const pools = await cachedPools();
  return {
    byModel: new Map(pools.byModel),
    byGrade: new Map(pools.byGrade),
    overall: pools.overall,
  };
}

/** Лот целиком — всё, что есть в строке, включая поля добора. */
export interface FullLotRow extends LotRow {
  maker_ko: string | null;
  model_ko: string | null;
  auction_code: string | null;
  auction_window: string | null;
  plate: string | null;
  first_reg: string | null;
  reserve_price_krw: number | null;
  hammer_price_krw: number | null;
  notices: { text: string; level: string }[];
  doc_days: number | null;
  engine_cc: number | null;
  body_type: string | null;
  seats: number | null;
  drive: string | null;
  inspection: Record<string, string> | null;
  photos: string[];
  diagram_url: string | null;
  source_url: string | null;
  first_seen_at: string | null;
  updated_at: string | null;
}

/**
 * Один лот по идентификатору площадки.
 *
 * ⚠️ .limit(1) стоит на НЕуникальном по себе external_id, поэтому порядок
 * задан явно по source. Идентификаторы площадок не пересекаются (так в схеме),
 * но полагаться на это молча нельзя: без .order() Postgres волен вернуть любую
 * строку, и на второй подключённой площадке это стало бы плавающим багом.
 */
export async function getLot(externalId: string): Promise<FullLotRow | null> {
  try {
    const { data, error } = await createServerClient()
      .from("auction_lots")
      .select("*")
      .eq("external_id", externalId)
      .order("source")
      .limit(1);

    if (error) {
      console.error("[kcar] getLot:", error.message);
      return null;
    }
    return ((data ?? [])[0] as FullLotRow | undefined) ?? null;
  } catch (e) {
    console.error("[kcar] getLot упал:", e);
    return null;
  }
}

/**
 * Сколько лотов у каждой площадки — для подписей табов.
 *
 * Два head-запроса вместо GROUP BY: PostgREST группировать не умеет, а
 * тянуть ради двух чисел все полторы тысячи строк было бы расточительно.
 */
export async function getSourceCounts(): Promise<{ kcar: number; lotte: number }> {
  try {
    const db = createServerClient();
    const [kcar, lotte] = await Promise.all([
      db.from("auction_lots").select("*", { count: "exact", head: true })
        .eq("source", "kcar").gte("auction_date", today()),
      db.from("auction_lots").select("*", { count: "exact", head: true }).eq("source", "lotte"),
    ]);
    // ⚠️ У KCar считаем только предстоящие торги, у Lotte — всё. Это не
    // небрежность: у лотов KCar есть дата торгов и прошедшие лежат архивом,
    // а у Lotte даты нет вовсе — списочный обход витрины её не отдаёт.
    return { kcar: kcar.count ?? 0, lotte: lotte.count ?? 0 };
  } catch (e) {
    console.error("[auction] getSourceCounts:", e);
    return { kcar: 0, lotte: 0 };
  }
}
