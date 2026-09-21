// Переключатель площадок на странице аукционов.
//
// ⚠️ Табы — это <Link>, а не useState. Приём взят из калькулятора растаможки
// (см. CLAUDE.md): у каждого каталога остаётся свой адрес, его можно послать
// и положить в закладки, работает кнопка «назад», а ощущение таба даёт
// клиентская навигация Next. Компонент серверный, состояния здесь нет вовсе.
//
// Семантика навигационная: <nav> со ссылками и aria-current, а не role=tab —
// роль таба обещает скринридеру переключение панелей внутри страницы, чего
// здесь не происходит, мы уходим на другой URL.

import Link from "next/link";

import type { AuctionSourceId } from "@/lib/kcar/query";

export type AuctionSourceTab = AuctionSourceId;

// Имена площадок не переводятся: это бренды, и на всех языках они пишутся
// латиницей — как Hyundai в каталоге.
const TABS: { id: AuctionSourceTab; label: string; path: string }[] = [
  { id: "kcar", label: "K Car", path: "" },
  { id: "lotte", label: "Lotte", path: "/lotte" },
  { id: "sk", label: "SK", path: "/sk" },
];

export default function AuctionTabs({
  active,
  counts,
  base = "/admin/auction",
  ariaLabel = "Площадка аукциона",
}: {
  active: AuctionSourceTab;
  counts: Record<AuctionSourceTab, number>;
  /** «/admin/auction» у служебной витрины, «/ru/auction» у публичной. */
  base?: string;
  ariaLabel?: string;
}) {
  return (
    <nav
      className="flex gap-1 border-b"
      style={{ borderColor: "rgba(74,74,74,0.3)" }}
      aria-label={ariaLabel}
    >
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`${base}${tab.path}`}
            aria-current={on ? "page" : undefined}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: on ? "var(--axis-white)" : "var(--axis-gray)",
              // Подчёркивание рисуем рамкой поверх границы <nav>, иначе
              // активный таб «висит» на пиксель выше остальных.
              borderBottom: `2px solid ${on ? "var(--axis-bronze)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {tab.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-[11px] font-normal"
              style={{
                backgroundColor: "var(--axis-graphite)",
                color: on ? "var(--axis-bronze)" : "var(--axis-gray)",
              }}
            >
              {(counts[tab.id] ?? 0).toLocaleString("ru-RU")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
