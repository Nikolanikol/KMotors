// Сетка лотов одной площадки: фильтры, карточки, пагинация.
//
// Вынесено, потому что площадок стало три, а витрина у них одна и та же.
// Третья копия страницы разошлась бы с первыми двумя на первой же правке —
// так уже случилось с карточкой лота, где хангыль вычистили на детальной и
// забыли в каталоге.
//
// Отличается у площадок ровно одно: прогноз цены молотка. Он существует
// только для K Car, потому что история прошедших торгов есть только у неё —
// у Lotte и SK публичного API нет вовсе, и премию к старту считать не из чего.

import LotCard, { type LotCardLabels } from "@/components/Auction/LotCard";
import LotFilters, { type LotFilterLabels } from "@/components/Auction/LotFilters";
import { Pagination } from "@/components/Catalog/Row/Pagination";
import { estimateHammer } from "@/lib/kcar/estimate";
import { LOTS_PAGE_SIZE, type LotsPage } from "@/lib/kcar/query";
import type { buildPremiumIndex } from "@/lib/kcar/estimate";

export default function PlatformCatalog({
  lots,
  labels: L,
  filterLabels,
  hrefBase,
  lang,
  premiumIndex,
  numberLocale = "ru-RU",
  filtersApplied = false,
}: {
  lots: LotsPage;
  labels: LotCardLabels;
  filterLabels: LotFilterLabels;
  hrefBase: string;
  lang: string;
  /** Только для K Car: у остальных площадок истории торгов нет. */
  premiumIndex?: Awaited<ReturnType<typeof buildPremiumIndex>>;
  numberLocale?: string;
  /** Стоит ли фильтр: от этого зависит, что означает пустая выдача. */
  filtersApplied?: boolean;
}) {
  return (
    <>
      <LotFilters makers={lots.makers} labels={filterLabels} showUpcomingToggle={false} />

      {lots.failed ? (
        <p className="mt-6 text-sm" style={{ color: "#C4563F" }}>
          {L.failed}
        </p>
      ) : lots.rows.length === 0 ? (
        /*
          ⚠️ Пустая вкладка РАЗВЕДЕНА на два случая. «Ничего не нашлось» и
          «торги площадки закончились, новых лотов ещё нет» — разное: первое
          говорит человеку поправить фильтр, второе — зайти позже. Площадка
          между торгами пустеет целиком (замер 21.09.2026: Lotte осыпалась с
          1 451 до нуля за полчаса после дедлайна), и без этой подписи витрина
          выглядела бы сломанной.
        */
        <p className="mt-6 text-sm" style={{ color: "var(--axis-gray)" }}>
          {filtersApplied ? L.empty : (L.between ?? L.empty)}
        </p>
      ) : (
        <>
          <p className="mb-3 mt-4 text-xs" style={{ color: "var(--axis-gray)" }}>
            {(L.found ?? "").replace(/\{\{count\}\}/g, lots.total.toLocaleString(numberLocale))}
          </p>

          {/* id нужен Pagination — она скроллит именно к нему */}
          <div id="cars-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lots.rows.map((lot) => (
              <LotCard
                key={`${lot.source}:${lot.external_id}`}
                lot={lot}
                estimate={premiumIndex ? estimateHammer(lot, premiumIndex) : null}
                labels={L}
                hrefBase={hrefBase}
                lang={lang}
              />
            ))}
          </div>

          <div className="mt-8">
            <Pagination count={lots.total} pageSize={LOTS_PAGE_SIZE} />
          </div>
        </>
      )}
    </>
  );
}
