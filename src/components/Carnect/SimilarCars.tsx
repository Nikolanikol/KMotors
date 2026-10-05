// Блок «Похожие машины» на странице машины carnect. Подбор — similar.ts,
// плитки — те же, что в каталоге (Tile из CatalogView): фото, цена, $, таймер.
//
// На телефоне — лента с горизонтальной прокруткой (плитки не сжимаются в
// столбик на полэкрана), на широком — сетка. Пусто — блока нет вовсе.

import Link from "next/link";

import type { CardLang } from "@/lib/carnect/lang";
import type { CatalogRow } from "@/lib/carnect/query";

import { Tile } from "./CatalogView";
import { tx } from "./text";
import { C } from "./ui";

export default function SimilarCars({
  rows,
  lang,
  catalogBase,
  lotBase,
  krwToUsd,
  make,
  modelGroup,
  priceLocked = false,
}: {
  rows: CatalogRow[];
  lang: CardLang;
  /** Адрес каталога — ссылка «все такие» ведёт туда с фильтром марки и модели. */
  catalogBase: string;
  lotBase: string;
  krwToUsd?: number;
  make: string | null;
  modelGroup: string | null;
  /** Гость: вместо цен — замок. Сами цены страница уже вычистила из rows. */
  priceLocked?: boolean;
}) {
  if (!rows.length) return null;
  const ctx = { lang, base: catalogBase, lotBase, krwToUsd, priceLocked };
  const all =
    make && modelGroup
      ? `${catalogBase}?${new URLSearchParams({ make, model: modelGroup }).toString()}`
      : catalogBase;

  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: `1px solid ${C.line}` }}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--axis-white)" }}>
          {tx(lang, "similar")}
        </h2>
        <Link href={all} className="text-sm" style={{ color: C.accent }}>
          {tx(lang, "similarAll")}
        </Link>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {rows.map((r) => (
          <div key={`${r.house}/${r.external_id}`} className="w-64 flex-shrink-0 snap-start lg:w-auto">
            <Tile ctx={ctx} r={r} />
          </div>
        ))}
      </div>
    </section>
  );
}
