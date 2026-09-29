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
import { getLots, getPremiumIndex, getSourceCounts } from "@/lib/kcar/query";
// ⚠️ Разбор адреса берётся у публичной витрины, а не копируется сюда. Раньше
// обе страницы читали searchParams своими руками, и любой новый фильтр
// пришлось бы заводить дважды — то есть однажды забыть. Фильтры у витрин
// одинаковые по замыслу: служебная отличается только гейтом, подписями и
// отсутствием оговорок для клиента.
import { hasFilters, readParams } from "@/app/(site)/[lang]/auction/shell";

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

  const query = readParams(searchParams);

  const [lots, counts, premiumIndex] = await Promise.all([
    getLots({ ...query, source }),
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
          filtersApplied={hasFilters(query)}
          premiumIndex={premiumIndex}
        />
      </div>
    </main>
  );
}
