// Публичная витрина лотов Lotte. Вторая вкладка того же раздела.
//
// ⚠️ Прогноза молотка здесь нет и быть не может: история торгов наполняется из
// списочного API KCar, у Lotte такого API не существует вовсе, а премия одной
// площадки к другой неприменима — это разные торги с разной механикой. Поэтому
// карточка показывает только старт, и оговорка в шапке одна на обе вкладки.
//
// ⚠️ Фильтр по дате торгов выключен: у лотов Lotte в списочном обходе есть дата
// окончания, но нет разделения на «предстоящие» и «архив» — весь набор и есть
// ближайшие торги.

import type { Metadata } from "next";

import LotCard from "@/components/Auction/LotCard";
import LotFilters from "@/components/Auction/LotFilters";
import { Pagination } from "@/components/Catalog/Row/Pagination";
import { auctionLabels, fill } from "@/lib/auctionLabels";
import { getLots, getSourceCounts, LOTS_PAGE_SIZE } from "@/lib/kcar/query";

import { AuctionShell, filterLabels, readParams } from "../shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const L = auctionLabels(lang);
  return {
    title: L.title,
    description: L.subtitle,
    robots: { index: false, follow: true },
  };
}

export default async function LotteAuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  const L = auctionLabels(lang);
  const query = readParams(sp);

  const [lots, counts] = await Promise.all([
    getLots({ ...query, source: "lotte", upcoming: false }),
    getSourceCounts(),
  ]);

  return (
    <AuctionShell lang={lang} labels={L} active="lotte" counts={counts}>
      <LotFilters makers={lots.makers} labels={filterLabels(L)} showUpcomingToggle={false} />

      {lots.failed ? (
        <p className="mt-6 text-sm" style={{ color: "#C4563F" }}>{L.failed}</p>
      ) : lots.rows.length === 0 ? (
        <p className="mt-6 text-sm" style={{ color: "var(--axis-gray)" }}>{L.empty}</p>
      ) : (
        <>
          <p className="mb-3 mt-4 text-xs" style={{ color: "var(--axis-gray)" }}>
            {fill(L.found, lots.total.toLocaleString(lang === "ru" ? "ru-RU" : "en-US"))}
          </p>

          <div id="cars-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lots.rows.map((lot) => (
              <LotCard
                key={`${lot.source}:${lot.external_id}`}
                lot={lot}
                estimate={null}
                labels={L}
                hrefBase={`/${lang}/auction`}
                lang={lang}
              />
            ))}
          </div>

          <div className="mt-8">
            <Pagination count={lots.total} pageSize={LOTS_PAGE_SIZE} />
          </div>
        </>
      )}
    </AuctionShell>
  );
}
