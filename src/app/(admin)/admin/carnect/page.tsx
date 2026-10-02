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
import { getListPage } from "@/lib/carnect/cached";
import { isHouse, type CarnectHouse } from "@/lib/carnect/houses";
import type { CarnectListLot } from "@/lib/carnect/types";

import { C, HouseTabs, Page, Panel, Stat, ago, km, krw } from "./ui";

export const dynamic = "force-dynamic";

const ERROR_TEXT: Record<string, string> = {
  parser: "Страница пришла, но объект data в ней не найден — carnect сменил разметку. Чинить rsc.ts/list.ts.",
  unavailable: "carnect не ответил (после повторов). Обновите позже.",
  "rate-limited": "carnect попросил притормозить (429/503/403). Не обновляйте страницу несколько минут.",
  "unknown-house": "carnect не знает такой площадки — адрес переименовали, сверить houses.ts.",
};

/** Доля лотов страницы с заполненным полем — первое, что нужно для схемы. */
function coverage(lots: CarnectListLot[]): [string, number][] {
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

export default async function CarnectPreview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const house: CarnectHouse = isHouse(String(sp.house ?? "")) ? (sp.house as CarnectHouse) : "glovis";
  const pageRaw = Number(sp.page ?? 1);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  // Время ответа меряем здесь: из кеша это миллисекунды, свежий поход —
  // секунды (пауза очереди + сеть). Так на экране видно, что откуда пришло.
  const t0 = Date.now();
  const res = await getListPage(house, page);
  const ms = Date.now() - t0;

  const pages = res.ok ? Math.max(1, Math.ceil(res.page.total / (res.page.pageSize || 24))) : 1;

  return (
    <Page>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">carnect.biz — просмотр источника</h1>
        <p className="mt-1 text-xs" style={{ color: C.muted }}>
          Служебная страница. Данные читаются с carnect напрямую (кеш 15 мин на страницу), в базу ничего не
          пишется. Нули и прочерки показаны как есть.
        </p>
      </header>

      <HouseTabs active={house} />

      {!res.ok ? (
        <Panel title="Ошибка">
          <p className="text-sm" style={{ color: C.bad }}>
            {ERROR_TEXT[res.error] ?? res.error}
          </p>
        </Panel>
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="лотов у площадки" value={res.page.total.toLocaleString("ru-RU")} />
            <Stat label="страница" value={`${page} / ${pages}`} hint={`по ${res.page.pageSize} лотов`} />
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

          {res.page.items.length === 0 ? (
            <Panel title="Пусто">
              <p className="text-sm" style={{ color: C.muted }}>
                У площадки сейчас нет лотов (total = {res.page.total}). Это норма между торгами, а не поломка
                парсера — поломка показалась бы ошибкой выше.
              </p>
            </Panel>
          ) : (
            <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {res.page.items.map((lot) => (
                <LotTile key={lot.lotId} house={house} lot={lot} />
              ))}
            </section>
          )}

          <nav className="mb-6 flex items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <Link href={`/admin/carnect?house=${house}&page=${page - 1}`} style={{ color: C.accent }}>
                ← назад
              </Link>
            )}
            <span style={{ color: C.muted }}>
              {page} из {pages}
            </span>
            {page < pages && (
              <Link href={`/admin/carnect?house=${house}&page=${page + 1}`} style={{ color: C.accent }}>
                дальше →
              </Link>
            )}
          </nav>

          {res.page.items.length > 0 && (
            <Panel
              title="Заполненность полей на этой странице"
              hint="Сколько лотов из страницы имеют поле непустым (0 и пустая строка считаются пустыми)."
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3 lg:grid-cols-4">
                {coverage(res.page.items).map(([k, n]) => (
                  <div key={k} className="flex justify-between font-mono">
                    <span style={{ color: C.muted }}>{k}</span>
                    <span style={{ color: n === 0 ? C.bad : n < res.page.items.length ? C.accent : C.good }}>
                      {n}/{res.page.items.length}
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
