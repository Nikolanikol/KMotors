// Общая обвязка публичных вкладок аукциона: шапка, предупреждение о цене,
// табы и разбор параметров. Вынесено, чтобы обе вкладки не расходились —
// именно шапка с оговоркой про старт обязана быть одинаковой на обеих.

import type { ReactNode } from "react";

import AuctionTabs, { type AuctionSourceTab } from "@/components/Auction/AuctionTabs";
import type { LotFilterLabels } from "@/components/Auction/LotFilters";
import PlatformCatalog from "@/components/Auction/PlatformCatalog";
import { auctionLabels } from "@/lib/auctionLabels";
import type { AuctionLabels } from "@/lib/auctionLabels";
import { getLots, getPremiumIndex, getSourceCounts, type LotSort } from "@/lib/kcar/query";

export const SORTS = new Set<LotSort>(["lot", "price_asc", "price_desc", "year_desc", "mileage_asc"]);

/** Параметры выдачи из адреса. Одинаковы у обеих вкладок. */
export function readParams(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? null;
  const sortRaw = one("sort");
  return {
    maker: one("maker"),
    q: one("q"),
    sort: (sortRaw && SORTS.has(sortRaw as LotSort) ? sortRaw : "lot") as LotSort,
    page: Math.max(1, Number(one("page") ?? "1") || 1),
  };
}

export function filterLabels(L: AuctionLabels): LotFilterLabels {
  return {
    search: L.search,
    find: L.find,
    reset: L.reset,
    allMakers: L.allMakers,
    sortLot: L.sortLot,
    sortPriceAsc: L.sortPriceAsc,
    sortPriceDesc: L.sortPriceDesc,
    sortYear: L.sortYear,
    sortMileage: L.sortMileage,
    showPast: L.showPast,
  };
}

export function AuctionShell({
  lang,
  labels: L,
  active,
  counts,
  children,
}: {
  lang: string;
  labels: AuctionLabels;
  active: AuctionSourceTab;
  counts: Record<AuctionSourceTab, number>;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 pb-16 pt-24" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: "var(--axis-white)" }}>
          {L.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--axis-gray)" }}>
          {L.subtitle}
        </p>

        {/*
          ⚠️ Оговорка про цену стоит ВЫШЕ списка и на обеих вкладках. Это не
          мелкий шрифт внизу: цена на карточках — стартовая, и человек должен
          прочитать об этом до того, как увидит цифры, а не после.
        */}
        <p
          className="mt-4 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: "var(--axis-charcoal)",
            border: "1px solid rgba(182,119,73,0.3)",
            color: "var(--axis-gray)",
          }}
        >
          {L.priceNote}
        </p>

        <div className="mt-5">
          <AuctionTabs active={active} counts={counts} base={`/${lang}/auction`} ariaLabel={L.title} />
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}

/**
 * Страница одной площадки целиком. Три маршрута отличаются ровно двумя
 * строчками — какая площадка и нужен ли прогноз, — поэтому всё остальное
 * живёт здесь, а не копируется трижды.
 */
export async function PlatformPage({
  lang,
  searchParams,
  source,
  withForecast = false,
}: {
  lang: string;
  searchParams: Record<string, string | string[] | undefined>;
  source: AuctionSourceTab;
  withForecast?: boolean;
}) {
  const L = auctionLabels(lang);
  const query = readParams(searchParams);

  const [lots, counts, premiumIndex] = await Promise.all([
    getLots({ ...query, source }),
    getSourceCounts(),
    withForecast ? getPremiumIndex() : Promise.resolve(undefined),
  ]);

  return (
    <AuctionShell lang={lang} labels={L} active={source} counts={counts}>
      <PlatformCatalog
        lots={lots}
        labels={L}
        filterLabels={filterLabels(L)}
        hrefBase={`/${lang}/auction`}
        lang={lang}
        premiumIndex={premiumIndex}
        numberLocale={lang === "ru" ? "ru-RU" : "en-US"}
        filtersApplied={Boolean(query.maker || query.q)}
      />
    </AuctionShell>
  );
}
