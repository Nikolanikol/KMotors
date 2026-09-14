// Публичная витрина лотов K Car.
//
// ⚠️ ЦЕНА — СТАРТОВАЯ, и это сказано на странице прямым текстом (решение
// владельца 12.09.2026). Лот уходит в среднем на 14% дороже старта — медиана по
// нашим же 9 651 состоявшейся сделке, — а сверх того идут сбор аукциона,
// доставка и растаможка. Показать старт как «цену машины» значило бы позвать
// человека на цифру, по которой сделка не проходит; в проекте это уже стоило
// расхождения витрины с каналом (см. правила про цены в CLAUDE.md).
//
// ⚠️ noindex НАМЕРЕННО (решение владельца 12.09.2026). Лоты живут дни: пустив
// их в индекс, мы через месяц получили бы сотни 404 в Search Console — ровно
// то, из-за чего страницам проданных машин пришлось ставить noindex задним
// числом. Снимать — только вместе с решением, что показывать по адресу
// прошедшего лота.
//
// ⚠️ Раздел `auction` лежит в ROUTE_SECTIONS, но SectionDictionary здесь НЕ
// нужен: страница и карточки серверные и подписи берут напрямую из словаря
// через auctionLabels(). Клиентских потребителей у этих ключей нет.

import type { Metadata } from "next";

import LotCard from "@/components/Auction/LotCard";
import LotFilters from "@/components/Auction/LotFilters";
import { Pagination } from "@/components/Catalog/Row/Pagination";
import { auctionLabels, fill } from "@/lib/auctionLabels";
import { estimateHammer } from "@/lib/kcar/estimate";
import { getLots, getPremiumIndex, getSourceCounts, LOTS_PAGE_SIZE } from "@/lib/kcar/query";

import { AuctionShell, filterLabels, readParams } from "./shell";

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

export default async function AuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  const L = auctionLabels(lang);
  const query = readParams(sp);

  const [lots, premiumIndex, counts] = await Promise.all([
    getLots({ ...query, source: "kcar" }),
    getPremiumIndex(),
    getSourceCounts(),
  ]);

  return (
    <AuctionShell lang={lang} labels={L} active="kcar" counts={counts}>
      <LotFilters makers={lots.makers} labels={filterLabels(L)} />

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
                estimate={estimateHammer(lot, premiumIndex)}
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
