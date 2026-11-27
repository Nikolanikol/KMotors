import React from "react";
import PaginationLink from "./PaginationLink";
import { pageHref, pageWindow, type CatalogSearchParams, type PageItem } from "@/lib/catalogPagination";

const LABELS: Record<string, { nav: string; prev: string; next: string; page: string }> = {
  ru: { nav: "Страницы каталога", prev: "Предыдущая страница", next: "Следующая страница", page: "Страница" },
  en: { nav: "Catalog pages", prev: "Previous page", next: "Next page", page: "Page" },
  ka: { nav: "კატალოგის გვერდები", prev: "წინა გვერდი", next: "შემდეგი გვერდი", page: "გვერდი" },
  ar: { nav: "صفحات الكتالوج", prev: "الصفحة السابقة", next: "الصفحة التالية", page: "صفحة" },
};

// Кнопка 40px на мобиле (окно ±1 + стрелки влезает в 390px), 44px с sm.
const BOX =
  "inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border text-sm font-medium select-none transition-colors";
const LINK =
  `${BOX} border-[rgba(74,74,74,0.3)] bg-[var(--axis-charcoal)] text-[var(--axis-gray)] ` +
  "hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";
// Текущая: бронза по правилу двух токенов — заливка deep, белый текст.
const CURRENT = `${BOX} border-[var(--axis-bronze-deep)] bg-[var(--axis-bronze-deep)] text-white cursor-default`;
const DISABLED = `${BOX} border-[rgba(74,74,74,0.3)] bg-[var(--axis-charcoal)] text-[var(--axis-gray-dim)] cursor-not-allowed opacity-60`;

function List({
  items, current, total, basePath, sp, t, className,
}: {
  items: PageItem[];
  current: number;
  total: number;
  basePath: string;
  sp: CatalogSearchParams;
  t: (typeof LABELS)[string];
  className: string;
}) {
  const prev = current - 1;
  const next = current + 1;
  return (
    <ul className={`${className} items-center justify-center gap-1.5 sm:gap-2 list-none p-0 m-0`}>
      <li>
        {prev >= 1 ? (
          <PaginationLink href={pageHref(basePath, sp, prev)} aria-label={t.prev} className={LINK}>←</PaginationLink>
        ) : (
          <span aria-disabled="true" aria-label={t.prev} className={DISABLED}>←</span>
        )}
      </li>
      {items.map((p, i) => (
        <li key={p === "gap" ? `gap-${i}` : p}>
          {p === "gap" ? (
            <span aria-hidden="true" className="inline-flex h-10 items-center px-0.5 text-[var(--axis-gray-dim)]">…</span>
          ) : p === current ? (
            <span aria-current="page" aria-label={`${t.page} ${p}`} className={CURRENT}>{p}</span>
          ) : (
            <PaginationLink href={pageHref(basePath, sp, p)} aria-label={`${t.page} ${p}`} className={LINK}>{p}</PaginationLink>
          )}
        </li>
      ))}
      <li>
        {next <= total ? (
          <PaginationLink href={pageHref(basePath, sp, next)} aria-label={t.next} className={LINK}>→</PaginationLink>
        ) : (
          <span aria-disabled="true" aria-label={t.next} className={DISABLED}>→</span>
        )}
      </li>
    </ul>
  );
}

/**
 * Пагинация листинга — настоящие ссылки (<a href>), поэтому Googlebot проходит по
 * страницам списка, а не видит только первую. Серверный компонент: адреса строятся
 * из searchParams и сохраняют все фильтры, меняется только `page`. `total` уже
 * обрезан по потолку глубины Encar (reachableTotalPages), глубже ссылок нет.
 * Два списка — окно ±2 с sm и ±1 на узком экране; лишний прячет CSS.
 */
export const CatalogPagination = ({
  total, current, lang, searchParams,
}: {
  total: number;
  current: number;
  lang: string;
  searchParams: CatalogSearchParams;
}) => {
  if (total <= 1) return null;
  const t = LABELS[lang] || LABELS.ru;
  const basePath = `/${lang}/catalog`;
  const shared = { current, total, basePath, sp: searchParams, t };
  return (
    <nav aria-label={t.nav} className="w-full">
      <List {...shared} items={pageWindow(current, total, 2)} className="hidden sm:flex flex-wrap" />
      <List {...shared} items={pageWindow(current, total, 1)} className="flex sm:hidden flex-wrap" />
      <p className="mt-2 text-center text-xs text-[var(--axis-gray)]">
        {current} / {total}
      </p>
    </nav>
  );
};
