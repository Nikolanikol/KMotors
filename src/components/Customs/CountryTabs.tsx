"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/customs/core/registry";
import { resolveText } from "@/lib/customs/i18nText";

/**
 * Табы стран — это ссылки, а не переключатель состояния.
 *
 * У каждой страны свой маршрут, свои метаданные и свой текст в HTML первого
 * ответа; ощущение таба даёт клиентская навигация Next: переход не
 * перезагружает страницу, а layout с этой плашкой не перемонтируется.
 * Поэтому семантика здесь навигационная (`aria-current`), а не `role="tab"` —
 * иначе разметка врала бы скринридеру про переключение панелей.
 */
export default function CountryTabs({ lang }: { lang: string }) {
  const { t } = useTranslation("customs");
  // Активная страна берётся из адреса, а не из пропа: плашка живёт в layout,
  // который при переходе между странами не перемонтируется и нового пропа
  // не получил бы.
  const pathname = usePathname();

  return (
    <nav aria-label={t("ui.countriesNav")} className="w-full">
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {COUNTRIES.map((country) => {
          // У страны по умолчанию адрес без сегмента: этот URL накоплен в
          // индексе, и вести на него надо напрямую, а не через дубль.
          const href =
            country.id === DEFAULT_COUNTRY
              ? `/${lang}/calculator`
              : `/${lang}/calculator/${country.id}`;
          const isActive = pathname === href;
          return (
            <li key={country.id}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "block rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calc-gold",
                  isActive
                    ? "border-calc-red bg-calc-red text-white"
                    : "border-calc-line bg-calc-panel-2 text-calc-fg-dim hover:text-calc-fg",
                ].join(" ")}
              >
                {resolveText(t, country.tabLabel)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
