// Общая обвязка служебных вкладок аукциона.
//
// Служебная витрина отличается от публичной тремя вещами и только ими:
// cookie-гейт, русские подписи вместо словаря (инстанса i18next под /admin
// нет) и сырые данные без оговорок для клиента. Всё остальное — та же сетка,
// поэтому берётся тот же PlatformCatalog.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AuctionTabs, { type AuctionSourceTab } from "@/components/Auction/AuctionTabs";
import { RU_LOT_LABELS } from "@/components/Auction/LotCard";
import { RU_FILTER_LABELS } from "@/components/Auction/LotFilters";
import PlatformCatalog from "@/components/Auction/PlatformCatalog";
import { getLots, getPremiumIndex, getSourceCounts, type LotSort } from "@/lib/kcar/query";

const SORTS = new Set<LotSort>(["lot", "price_asc", "price_desc", "year_desc", "mileage_asc"]);

/** Служебные подписи сетки: русские, словарь здесь не подключить. */
const RU_GRID_LABELS = {
  ...RU_LOT_LABELS,
  found: "Найдено {{count}}",
  empty: "Под фильтр ничего не подошло.",
  failed: "Каталог временно недоступен — база не ответила.",
};

export async function requireAdmin() {
  const session = (await cookies()).get("admin_session");
  if (!session || session.value !== "1") redirect("/admin/login");
}

export async function AdminPlatformPage({
  searchParams,
  source,
  withForecast = false,
  note,
  children,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  source: AuctionSourceTab;
  withForecast?: boolean;
  /** Оговорка про источник конкретной площадки, если она нужна. */
  note?: string;
  /** Блок сводки над сеткой — он есть только у K Car. */
  children?: ReactNode;
}) {
  await requireAdmin();

  const one = (k: string) => (Array.isArray(searchParams[k]) ? searchParams[k][0] : searchParams[k]) ?? null;
  const sortRaw = one("sort");

  const [lots, counts, premiumIndex] = await Promise.all([
    getLots({
      source,
      maker: one("maker"),
      q: one("q"),
      sort: (sortRaw && SORTS.has(sortRaw as LotSort) ? sortRaw : "lot") as LotSort,
      page: Math.max(1, Number(one("page") ?? "1") || 1),
    }),
    getSourceCounts(),
    withForecast ? getPremiumIndex() : Promise.resolve(undefined),
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
          <AuctionTabs active={source} counts={counts} />
        </header>

        {note && (
          <p className="mb-4 text-xs" style={{ color: "var(--axis-gray)" }}>
            {note}
          </p>
        )}

        {children}

        <PlatformCatalog
          lots={lots}
          labels={RU_GRID_LABELS}
          filterLabels={RU_FILTER_LABELS}
          hrefBase="/admin/auction"
          lang="ru"
          filtersApplied={Boolean(one("maker") || one("q"))}
          premiumIndex={premiumIndex}
        />
      </div>
    </main>
  );
}
