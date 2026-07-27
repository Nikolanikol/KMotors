"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { isBucketCategory } from "@/lib/partsCategories";
import type { Category } from "./PartsCatalogClient";

// Облако категорий в левой колонке каталога, под фильтром.
//
// Это крауловый путь, которого у раздела не было: со страницы /parts вело
// 64 ссылки на товары, пагинация каталога и фильтры отдают noindex, и
// единственным способом добраться до 48 689 карточек оставался сайтмап.
// Отсюда ссылки идут на категорийные страницы, а уже с них — на товары.
//
// Данные не запрашиваются: полный список категорий уже приходит в
// PartsCatalogClient пропом для фильтров, тут он просто переиспользован.

const HEADING: Record<string, string> = {
  ru: "Запчасти по категориям",
  en: "Parts by category",
  ka: "ნაწილები კატეგორიების მიხედვით",
  ar: "قطع الغيار حسب الفئة",
};

export function CategoryCloud({
  categories,
  indexable,
}: {
  categories: Category[];
  /** Слаги, прошедшие порог по числу товаров. Пустой список = фильтр не применяем. */
  indexable: string[];
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const name = (c: Category) => (lang === "ru" ? c.name_ru : c.name_en || c.name_ru);

  const groups = useMemo(() => {
    // Показываем ровно то, что уходит в sitemap: иначе в навигацию попадали бы
    // пустые ветки (у «Зеркала» под «Кузов» ноль товаров) и внутренние вёдра.
    // Если список не доехал — откатываемся на отсев одних лишь вёдер.
    const allow = new Set(indexable);
    const show = (c: Category) =>
      allow.size ? allow.has(c.slug) : !isBucketCategory(c.slug);

    const roots = categories.filter((c) => c.parent_id === null && show(c));

    // Одно и то же название встречается в разных ветках («Зеркала» в «Салон»
    // и в «Кузов», «Освещение» там же). Две одинаковые подписи на разные
    // адреса сбивают и человека, и поисковик — уточняем родителем.
    const seen = new Map<string, number>();
    for (const c of categories) {
      if (c.parent_id === null || !show(c)) continue;
      seen.set(name(c), (seen.get(name(c)) ?? 0) + 1);
    }

    return roots
      .map((root) => ({
        root,
        children: categories
          .filter((c) => c.parent_id === root.id && show(c))
          .map((c) => ({
            ...c,
            label: (seen.get(name(c)) ?? 0) > 1 ? `${name(c)} · ${name(root)}` : name(c),
          })),
      }))
      .filter((g) => g.children.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, indexable, lang]);

  if (!groups.length) return null;

  return (
    <nav aria-label={HEADING[lang] ?? HEADING.ru} className="mt-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pn-text-dim)] mb-3">
        {HEADING[lang] ?? HEADING.ru}
      </h2>

      <div className="space-y-4">
        {groups.map(({ root, children }) => (
          <div key={root.id}>
            <Link
              href={`/${lang}/parts/category/${root.slug}`}
              className="block text-[12px] font-semibold text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition-colors mb-1.5"
            >
              {name(root)}
            </Link>
            <div className="flex flex-wrap gap-1.5">
              {children.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/parts/category/${c.slug}`}
                  className="text-[11px] leading-none px-2 py-1.5 rounded-md bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-dim)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
