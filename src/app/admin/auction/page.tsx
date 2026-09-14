// Служебная витрина лотов аукциона.
//
// Живёт под /admin намеренно: isExcluded в middleware.ts уже пропускает этот
// префикс мимо языкового редиректа, noindex стоит в admin/layout.tsx, а
// cookie-гейт admin_session работает там же. Ни одной новой строки в
// middleware — и ни одной новой дырки.
//
// ⚠️ Это РАБОЧИЙ маршрут, не публичная витрина. Тексты зашиты по-русски,
// i18n нет, цена показана как есть — стартовая в вонах плюс прогноз молотка.
// Что видит клиент и с какой надбавкой, ещё не решено; когда решится,
// страница переезжает в /[lang]/auction, а отсюда переносятся ровно три
// вещи: LotCard, LotFilters и вызовы из lib/kcar/query.ts. Тексты в обоих
// компонентах собраны одним объектом сверху именно ради этого переноса.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AuctionTabs from "@/components/Auction/AuctionTabs";
import LotCard, { RU_LOT_LABELS } from "@/components/Auction/LotCard";
import LotFilters from "@/components/Auction/LotFilters";
import { Pagination } from "@/components/Catalog/Row/Pagination";
import { estimateHammer } from "@/lib/kcar/estimate";
import {
  getAuctionSummary,
  getLots,
  getPremiumIndex,
  getSourceCounts,
  LOTS_PAGE_SIZE,
  type LotSort,
} from "@/lib/kcar/query";

// Читает searchParams и живые данные — статикой быть не может.
export const dynamic = "force-dynamic";

const SORTS = new Set<LotSort>(["lot", "price_asc", "price_desc", "year_desc", "mileage_asc"]);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.25)" }}
    >
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
        {label}
      </div>
      <div className="text-lg font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
        {value}
      </div>
      {hint && (
        <div className="text-[11px]" style={{ color: "var(--axis-gray)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default async function AuctionAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "1") redirect("/admin/login");

  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? null;

  const sortRaw = one("sort");
  const query = {
    // ⚠️ Площадка задаётся явно: в auction_lots лежат лоты нескольких
    // аукционов, и смешивать их в одной выдаче нельзя — у KCar цена в вонах
    // со стартом от самого аукциона, у Lotte в долларах от витрины-посредника.
    source: "kcar",
    maker: one("maker"),
    q: one("q"),
    sort: (sortRaw && SORTS.has(sortRaw as LotSort) ? sortRaw : "lot") as LotSort,
    page: Math.max(1, Number(one("page") ?? "1") || 1),
    upcoming: one("upcoming") !== "0",
  };

  // Прогноз строится ОДНИМ индексом на страницу, а не запросом на карточку —
  // так задуман estimate.ts. Индекс вдобавок кеширован на час: без кеша он
  // давал 12 секунд на рендер (см. getPremiumIndex).
  const [summary, lots, premiumIndex, counts] = await Promise.all([
    getAuctionSummary(),
    getLots(query),
    getPremiumIndex(),
    getSourceCounts(),
  ]);

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-4">
          <h1 className="text-xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            Лоты автоаукционов
          </h1>
          <p className="mb-4 mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
            Служебная страница: цены сырые, переводов нет, в индекс не идёт.
          </p>
          <AuctionTabs active="kcar" counts={counts} />
        </header>

        <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Stat
            label="ближайшие торги"
            value={summary.nextDate ?? "—"}
            hint={summary.sites.join(", ") || undefined}
          />
          <Stat label="лотов выставлено" value={summary.upcomingLots.toLocaleString("ru-RU")} />
          <Stat label="архив лотов" value={summary.archiveLots.toLocaleString("ru-RU")} hint="прошедшие торги" />
          <Stat
            label="наблюдений"
            value={summary.observations.toLocaleString("ru-RU")}
            hint={summary.lastSession ? `по сессию ${summary.lastSession}` : undefined}
          />
          <Stat
            label="из них сделок"
            value={summary.sales.toLocaleString("ru-RU")}
            hint={
              summary.observations
                ? `${Math.round((summary.sales / summary.observations) * 100)}% выборки`
                : undefined
            }
          />
        </section>

        <div className="mb-4">
          <LotFilters makers={lots.makers} />
        </div>

        {lots.failed ? (
          <p className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--axis-charcoal)", color: "#C4563F" }}>
            Данные временно недоступны — база не ответила. Это не «лотов нет»: смотрите консоль сервера.
          </p>
        ) : lots.rows.length === 0 ? (
          <p className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--axis-charcoal)", color: "var(--axis-gray)" }}>
            Под фильтр ничего не подошло. {query.upcoming && "Возможно, торги уже прошли — включите «показывать прошедшие»."}
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs" style={{ color: "var(--axis-gray)" }}>
              Найдено {lots.total.toLocaleString("ru-RU")}
            </p>

            {/* id нужен Pagination — она скроллит именно к нему */}
            <div id="cars-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lots.rows.map((lot) => (
                <LotCard
                  key={`${lot.source}:${lot.external_id}`}
                  lot={lot}
                  estimate={estimateHammer(lot, premiumIndex)}
                  labels={RU_LOT_LABELS}
                />
              ))}
            </div>

            <div className="mt-6">
              <Pagination count={lots.total} pageSize={LOTS_PAGE_SIZE} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
