// Каталог лотов аукциона Lotte — отдельный от KCar, и это не дублирование.
//
// Площадки сходятся только в таблице. У KCar цена старта приходит в ВОНАХ от
// самого аукциона, есть история молотков и прогноз премии; у Lotte — цена в
// ДОЛЛАРАХ от витрины-посредника, истории торгов нет вовсе. Свести их в одну
// выдачу значит поставить рядом два числа в разных валютах под одной подписью.
//
// ⚠️ Фильтр по дате торгов здесь выключен: у лотов Lotte в списочном обходе
// даты нет — она приходит только с детальной страницы, да и то не всегда
// (у части лотов витрина отдаёт заглушку 2099-01-01).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AuctionTabs from "@/components/Auction/AuctionTabs";
import LotCard, { RU_LOT_LABELS } from "@/components/Auction/LotCard";
import LotFilters from "@/components/Auction/LotFilters";
import { Pagination } from "@/components/Catalog/Row/Pagination";
import { getLots, getSourceCounts, LOTS_PAGE_SIZE, type LotSort } from "@/lib/kcar/query";

export const dynamic = "force-dynamic";

const SORTS = new Set<LotSort>(["lot", "price_asc", "price_desc", "year_desc", "mileage_asc"]);

export default async function LotteCatalogPage({
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

  const [lots, counts] = await Promise.all([
    getLots({
    source: "lotte",
    upcoming: false,
    maker: one("maker"),
    q: one("q"),
    sort: (sortRaw && SORTS.has(sortRaw as LotSort) ? sortRaw : "lot") as LotSort,
      page: Math.max(1, Number(one("page") ?? "1") || 1),
    }),
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
          <AuctionTabs active="lotte" counts={counts} />
        </header>

        <p className="mb-4 text-xs" style={{ color: "var(--axis-gray)" }}>
          Источник — витрина-посредник, а не сам аукцион: у Lotte публичного API нет.
          Цена подписана «старт, $» — витрина отдаёт её в долларах по своему курсу.
          Прогноза молотка здесь нет: истории торгов этой площадки у нас не существует.
        </p>

        <div className="mb-4">
          <LotFilters makers={lots.makers} showUpcomingToggle={false} />
        </div>

        {lots.failed ? (
          <p className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--axis-charcoal)", color: "#C4563F" }}>
            Данные временно недоступны — база не ответила.
          </p>
        ) : lots.rows.length === 0 ? (
          <p className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--axis-charcoal)", color: "var(--axis-gray)" }}>
            Пусто. Если каталог ещё не загружался — прогнать <code>/api/lotte/sync</code>.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs" style={{ color: "var(--axis-gray)" }}>
              Найдено {lots.total.toLocaleString("ru-RU")}
            </p>

            <div id="cars-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lots.rows.map((lot) => (
                <LotCard key={`${lot.source}:${lot.external_id}`} lot={lot} estimate={null} labels={RU_LOT_LABELS} />
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
