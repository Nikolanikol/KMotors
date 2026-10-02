// Просмотрщик carnect.biz: одна страница списка одной площадки.
//
//   /admin/carnect?house=glovis&page=2
//
// Оценочный экран: что парсер достаёт, насколько заполнены поля, как быстро
// и откуда (свежий поход или кеш) пришли данные. В базу ничего не пишет —
// читает carnect напрямую через кеш (cached.ts), 15 минут на страницу.
//
// Живёт под /admin по той же причине, что и служебная витрина аукциона:
// cookie-гейт, noindex и пропуск мимо языкового редиректа уже настроены для
// этого префикса, новых строк в middleware не нужно.
//
// ⚠️ Одна страница за заход, а не обход площадки: листание здесь — это
// запросы к чужому серверу по одному на клик, и так и должно оставаться.

import Link from "next/link";

import { requireAdmin } from "../auction/shell";
import { getHeyPage, getListPage, getVenueFacets, type CachedPage } from "@/lib/carnect/cached";
import { HEY_TYPES, isHeyType, type HeyAuctionType, type HeyListCar } from "@/lib/carnect/heydealer";
import { HOUSES, isHouse, type CarnectHouse } from "@/lib/carnect/houses";
import type { CarnectListLot } from "@/lib/carnect/types";

import { C, HouseTabs, Page, Panel, Stat, SubTabs, ago, km, krw, type Source } from "./ui";

export const dynamic = "force-dynamic";

const ERROR_TEXT: Record<string, string> = {
  parser: "Страница пришла, но объект data в ней не найден — carnect сменил разметку. Чинить rsc.ts/list.ts.",
  unavailable: "carnect не ответил (после повторов). Обновите позже.",
  "rate-limited": "carnect попросил притормозить (429/503). Не обновляйте страницу несколько минут.",
  // ⚠️ 403 у carnect — правило доступа их Cloudflare, а не нагрузка: с корейских
  // адресов сайт закрыт целиком (02.10.2026, локальная машина владельца в Корее).
  // Из других стран отвечает 200, поэтому проверять надо с прода или из облака.
  blocked:
    "carnect закрыл доступ с этого адреса (403 от Cloudflare). С корейских адресов сайт закрыт целиком — проверяйте с сервера вне Кореи.",
  "unknown-house": "carnect не знает такой площадки — адрес переименовали, сверить houses.ts.",
};

/** Доля лотов страницы с заполненным полем — первое, что нужно для схемы. */
function coverage(lots: Record<string, unknown>[]): [string, number][] {
  const keys = new Set<string>();
  for (const l of lots) for (const k of Object.keys(l)) keys.add(k);
  return [...keys].sort().map((k) => [
    k,
    lots.filter((l) => {
      const v = l[k];
      return v !== undefined && v !== null && v !== "" && v !== 0;
    }).length,
  ]);
}

function LotTile({ house, lot }: { house: CarnectHouse; lot: CarnectListLot }) {
  return (
    <Link
      href={`/admin/carnect/${house}/${encodeURIComponent(lot.lotId)}`}
      className="block overflow-hidden rounded-xl transition-opacity hover:opacity-90"
      style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}
    >
      <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: "#1E1E1E" }}>
        {lot.photo && (
          // Фото лежит на CDN самой площадки (Autobell, Lotte, K Car…), а не у
          // carnect: на их сервер просмотр галерей нагрузки не даёт.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lot.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          №{lot.lotNo ?? "?"} {lot.lane ? `· ${lot.lane}` : ""}
        </span>
        {lot.inspGrade && (
          <span
            className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", color: C.accent }}
          >
            {lot.inspGrade}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold leading-tight">
          {lot.year ?? "—"} {lot.make} {lot.model}
        </div>
        <div className="mt-0.5 truncate text-xs" style={{ color: C.muted }}>
          {lot.grade ?? lot.titleEn ?? ""}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-semibold" style={{ color: C.accent }}>
            {krw(lot.startKrw)}
          </span>
          <span className="text-xs" style={{ color: C.muted }}>
            {km(lot.km)}
          </span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: C.muted }}>
          {[lot.fuel, lot.trans, lot.auctionDate, lot.venue || lot.location, lot.status].filter(Boolean).join(" · ")}
        </div>
      </div>
    </Link>
  );
}

/**
 * Плитка машины HeyDealer. Отличается от лота аукциона по существу: нет
 * номера лота и дня торгов, зато у каждой машины своё окончание торгов и
 * число ставок, а цена есть только у Instant.
 */
function HeyTile({ car }: { car: HeyListCar }) {
  const cond = car.heyCondition;
  return (
    <Link
      href={`/admin/carnect/heydealer/${encodeURIComponent(car.id)}`}
      className="block overflow-hidden rounded-xl transition-opacity hover:opacity-90"
      style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}
    >
      <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: "#1E1E1E" }}>
        {car.photo && (
          // Фото на S3 самого HeyDealer, не у carnect.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={car.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          ставок: {car.bidCount ?? 0}
        </span>
        {cond?.grade && (
          <span
            className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", color: cond.grade.includes("no_accident") ? C.good : C.accent }}
          >
            {cond.grade}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold leading-tight">
          {car.year ?? "—"} {car.make} {car.model}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-semibold" style={{ color: C.accent }}>
            {car.priceOnRequest ? "ставки" : krw(car.krw)}
          </span>
          <span className="text-xs" style={{ color: C.muted }}>
            {km(car.km)}
          </span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: C.muted }}>
          {[car.fuel, car.trans, car.endAt ? `до ${car.endAt.slice(0, 16).replace("T", " ")}` : null, car.status]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </Link>
  );
}

/** Адрес просмотрщика с непустыми параметрами — чтобы листание не теряло фильтр. */
function viewerHref(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && v !== 1) q.set(k, String(v));
  return `/admin/carnect?${q.toString()}`;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CarnectPreview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const rawHouse = first(sp.house);
  const source: Source = rawHouse === "heydealer" ? "heydealer" : isHouse(rawHouse) ? rawHouse : "glovis";
  const pageRaw = Number(first(sp.page) || 1);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  // Второй ряд вкладок и параметр фильтра для запроса к carnect.
  // venue — код аукционного дома (только из кодов, что отдал их фасет, —
  // произвольная строка из адреса до carnect не дойдёт); type — тип HeyDealer.
  const heyType: HeyAuctionType = isHeyType(first(sp.type)) ? (first(sp.type) as HeyAuctionType) : HEY_TYPES[0].type;
  const venues = source !== "heydealer" && HOUSES[source].venues ? await getVenueFacets(source) : null;
  const venue = venues?.some((v) => v.code === first(sp.venue)) ? first(sp.venue) : "";

  // Время ответа меряем здесь: из кеша это миллисекунды, свежий поход —
  // секунды (пауза очереди + сеть). Так на экране видно, что откуда пришло.
  const t0 = Date.now();
  const res: CachedPage<CarnectListLot> | CachedPage<HeyListCar> =
    source === "heydealer" ? await getHeyPage(heyType, page) : await getListPage(source, page, venue);
  const ms = Date.now() - t0;

  const pages = res.ok ? Math.max(1, Math.ceil(res.page.total / (res.page.pageSize || 24))) : 1;
  const filter = source === "heydealer" ? { house: source, type: heyType } : { house: source, venue };
  const items = res.ok ? (res.page.items as Record<string, unknown>[]) : [];

  return (
    <Page>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">carnect.biz — просмотр источника</h1>
        <p className="mt-1 text-xs" style={{ color: C.muted }}>
          Служебная страница. Данные читаются с carnect напрямую (кеш 15 мин на страницу), в базу ничего не
          пишется. Нули и прочерки показаны как есть.
        </p>
      </header>

      <HouseTabs active={source} />

      {source === "heydealer" && (
        <SubTabs
          items={HEY_TYPES.map((t) => ({
            href: viewerHref({ house: "heydealer", type: t.type }),
            label: t.label,
            hint: t.hint,
            on: t.type === heyType,
          }))}
        />
      )}
      {venues && venues.length > 0 && (
        <SubTabs
          items={[
            {
              href: viewerHref({ house: source }),
              label: "все дома",
              count: venues.reduce((n, v) => n + v.count, 0),
              on: !venue,
            },
            ...venues.map((v) => {
              const known = source !== "heydealer" ? HOUSES[source].venues?.find((k) => k.code === v.code) : undefined;
              return {
                href: viewerHref({ house: source, venue: v.code }),
                label: known ? `${v.name} · ${known.day}` : v.name,
                count: v.count,
                on: v.code === venue,
              };
            }),
          ]}
        />
      )}
      {source === "heydealer" && (
        <p className="-mt-2 mb-4 text-xs" style={{ color: C.muted }}>
          {HEY_TYPES.find((t) => t.type === heyType)?.hint}
        </p>
      )}

      {!res.ok ? (
        <Panel title="Ошибка">
          <p className="text-sm" style={{ color: C.bad }}>
            {ERROR_TEXT[res.error] ?? res.error}
          </p>
        </Panel>
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label={source === "heydealer" ? "машин этого типа" : "лотов в выдаче"} value={res.page.total.toLocaleString("ru-RU")} />
            <Stat label="страница" value={`${page} / ${pages}`} hint={`по ${res.page.pageSize}`} />
            <Stat label="ответ" value={`${ms} мс`} hint={ms < 200 ? "из кеша" : "свежий поход"} />
            <Stat label="загружено с carnect" value={ago(res.fetchedAt)} />
            <Stat
              label="их синхронизация"
              value={ago(res.ingest.lastIngestAt ?? undefined)}
              hint={res.ingest.lastStatus ?? undefined}
            />
            <Stat
              label="забрали у площадки"
              value={
                res.ingest.lastIngestCount !== null
                  ? `${res.ingest.lastIngestCount} / ${res.ingest.lastIngestExpected ?? "?"}`
                  : "—"
              }
              hint="получено / ожидалось"
            />
          </section>

          {items.length === 0 ? (
            <Panel title="Пусто">
              <p className="text-sm" style={{ color: C.muted }}>
                Сейчас здесь ничего нет (total = {res.page.total}). Это норма между торгами, а не поломка
                парсера — поломка показалась бы ошибкой выше.
              </p>
            </Panel>
          ) : (
            <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {source === "heydealer"
                ? (res.page.items as HeyListCar[]).map((car) => <HeyTile key={car.id} car={car} />)
                : (res.page.items as CarnectListLot[]).map((lot) => (
                    <LotTile key={lot.lotId} house={source} lot={lot} />
                  ))}
            </section>
          )}

          <nav className="mb-6 flex items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <Link href={viewerHref({ ...filter, page: page - 1 })} style={{ color: C.accent }}>
                ← назад
              </Link>
            )}
            <span style={{ color: C.muted }}>
              {page} из {pages}
            </span>
            {page < pages && (
              <Link href={viewerHref({ ...filter, page: page + 1 })} style={{ color: C.accent }}>
                дальше →
              </Link>
            )}
          </nav>

          {items.length > 0 && (
            <Panel
              title="Заполненность полей на этой странице"
              hint="Сколько записей из страницы имеют поле непустым (0 и пустая строка считаются пустыми)."
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3 lg:grid-cols-4">
                {coverage(items).map(([k, n]) => (
                  <div key={k} className="flex justify-between font-mono">
                    <span style={{ color: C.muted }}>{k}</span>
                    <span style={{ color: n === 0 ? C.bad : n < items.length ? C.accent : C.good }}>
                      {n}/{items.length}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}
