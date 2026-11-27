// Обвязка служебной страницы лотов K Car (/admin/auction).
//
// Отличается от прежней публичной витрины тремя вещами: cookie-гейт, русские
// подписи вместо словаря (инстанса i18next под /admin нет) и сырые данные без
// оговорок для клиента. Вкладки Lotte и SK (витрина dokanmazad) удалены
// 27.11.2026 вместе с остальным стеком витрины.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { RU_LOT_LABELS } from "@/components/Auction/LotCard";
import { RU_FILTER_LABELS } from "@/components/Auction/LotFilters";
import PlatformCatalog from "@/components/Auction/PlatformCatalog";
import { getLots, getPremiumIndex, type LotSort } from "@/lib/kcar/query";

const SORTS = new Set<LotSort>(["lot", "price_asc", "price_desc", "year_desc", "mileage_asc"]);

/** Параметры выдачи из адреса. */
function readParams(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? null;
  const sortRaw = one("sort");
  /**
   * ⚠️ Числа из адреса проверяются, а не просто приводятся. В ?priceMax
   * прилетает что угодно — от мусора сканеров до ручной правки, — а
   * Number("abc") это NaN, и NaN в .lte() уходит в PostgREST строкой "NaN":
   * запрос отвечает 400, и getLots отдаёт «временно недоступно» вместо лотов.
   * Отрицательные значения отсекаются по той же причине, что и NaN: они дают
   * заведомо пустую выдачу, неотличимую для человека от поломки.
   */
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
  };
  return {
    maker: one("maker"),
    model: one("model"),
    priceMax: num("priceMax"),
    yearMin: num("yearMin"),
    mileageMax: num("mileageMax"),
    q: one("q"),
    sort: (sortRaw && SORTS.has(sortRaw as LotSort) ? sortRaw : "lot") as LotSort,
    page: Math.max(1, Number(one("page") ?? "1") || 1),
  };
}

/**
 * Применён ли хоть один фильтр. Нужно, чтобы отличить «под фильтр ничего не
 * подошло» от «торги уже прошли»: снаружи оба состояния — пустая сетка, а
 * значат прямо противоположное.
 */
function hasFilters(p: ReturnType<typeof readParams>): boolean {
  return Boolean(p.maker || p.model || p.q || p.priceMax || p.yearMin || p.mileageMax);
}

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
  children,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  source: "kcar";
  withForecast?: boolean;
  /** Блок сводки над сеткой. */
  children?: ReactNode;
}) {
  await requireAdmin();

  const query = readParams(searchParams);

  const [lots, premiumIndex] = await Promise.all([
    getLots({ ...query, source }),
    withForecast ? getPremiumIndex() : Promise.resolve(undefined),
  ]);

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-4">
          <h1 className="text-xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            Лоты аукциона K Car
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
            Служебная страница: цены сырые, переводов нет, в индекс не идёт.
          </p>
        </header>

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
