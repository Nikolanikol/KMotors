// Мелкие кирпичи просмотрщика carnect: форматирование и общие блоки.
//
// Это СЛУЖЕБНЫЙ экран для оценки источника, а не будущая витрина: здесь
// нарочно видно всё сырое — нули, пустые поля, время похода, состояние их
// синхронизации. Публичная витрина будет строиться поверх нормализованного
// слоя и переиспользовать отсюда разве что идеи раскладки.

import Link from "next/link";
import type { ReactNode } from "react";

import { HOUSES, type CarnectHouse } from "@/lib/carnect/houses";

export const C = {
  bg: "var(--background, #0A0A0A)",
  card: "var(--axis-charcoal, #141414)",
  line: "rgba(74,74,74,0.35)",
  text: "var(--axis-cream, #F5F0EB)",
  muted: "var(--axis-gray, #8A8A8A)",
  accent: "var(--axis-bronze, #B67749)",
  bad: "#E5484D",
  good: "#3FB950",
};

/** Воны: 0 и отсутствие — это «нет цены», а не ₩0 (у Lotte startKrw всегда 0). */
export function krw(v: unknown): string {
  return typeof v === "number" && v > 0 ? `₩${v.toLocaleString("ru-RU")}` : "—";
}

export function km(v: unknown): string {
  return typeof v === "number" && v > 0 ? `${v.toLocaleString("ru-RU")} км` : "—";
}

/** «12 мин назад» — по нему видно, пришли данные свежими или из кеша. */
export function ago(iso: string | undefined): string {
  if (!iso) return "—";
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s} с назад`;
  if (s < 3600) return `${Math.round(s / 60)} мин назад`;
  return `${Math.round(s / 3600)} ч назад`;
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: C.bg, color: C.text }}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

export function Panel({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="mb-4 rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: C.accent }}>
        {title}
      </h2>
      {hint && (
        <p className="-mt-2 mb-3 text-xs" style={{ color: C.muted }}>
          {hint}
        </p>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>
        {label}
      </div>
      <div className="text-base font-semibold">{value}</div>
      {hint && (
        <div className="text-[11px]" style={{ color: C.muted }}>
          {hint}
        </div>
      )}
    </div>
  );
}

/** Источник на вкладке: аукционная площадка или HeyDealer (у него своя механика). */
export type Source = CarnectHouse | "heydealer";

function Tab({ href, on, title, sub }: { href: string; on: boolean; title: string; sub?: string }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className="rounded-lg px-3 py-2 text-sm"
      style={{
        backgroundColor: on ? "var(--axis-bronze-deep, #9D5E34)" : C.card,
        border: `1px solid ${on ? "transparent" : C.line}`,
        color: on ? "#fff" : C.text,
      }}
    >
      <div className="font-semibold">{title}</div>
      {sub && (
        <div className="text-[11px]" style={{ color: on ? "rgba(255,255,255,0.8)" : C.muted }}>
          {sub}
        </div>
      )}
    </Link>
  );
}

/**
 * Вкладки источников + календарь торгов под каждой площадкой. Ссылки, а не
 * состояние: у каждого источника свой адрес — тот же приём, что у вкладок
 * аукциона. HeyDealer последним: у него не дни торгов, а непрерывный поток.
 */
export function HouseTabs({ active }: { active: Source }) {
  return (
    <nav className="mb-3 flex flex-wrap gap-2">
      {Object.values(HOUSES).map((h) => (
        <Tab
          key={h.house}
          href={`/admin/carnect?house=${h.house}`}
          on={h.house === active}
          title={h.name}
          sub={h.sessions.map((s) => (s.venue ? `${s.day} · ${s.venue}` : s.day)).join(" / ")}
        />
      ))}
      <Tab href="/admin/carnect?house=heydealer" on={active === "heydealer"} title="HeyDealer" sub="Self / Zero / Instant" />
    </nav>
  );
}

/**
 * Второй ряд вкладок: аукционные дома Autobell или типы аукциона HeyDealer.
 * Поменьше и потише первого ряда, чтобы иерархия читалась без подписей.
 */
export function SubTabs({ items }: { items: { href: string; label: string; count?: number; hint?: string; on: boolean }[] }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-2">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.on ? "page" : undefined}
          title={it.hint}
          className="rounded-full px-3 py-1 text-xs"
          style={{
            border: `1px solid ${it.on ? C.accent : C.line}`,
            color: it.on ? C.accent : C.text,
          }}
        >
          {it.label}
          {it.count !== undefined && <span style={{ color: C.muted }}> · {it.count.toLocaleString("ru-RU")}</span>}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Таблица «поле → значение» для произвольного объекта. Вложенные объекты и
 * массивы показываются JSON-строкой: экран оценочный, и важнее увидеть всё,
 * чем красиво.
 */
export function FieldTable({ data, skip = [] }: { data: Record<string, unknown>; skip?: string[] }) {
  const rows = Object.entries(data).filter(([k]) => !skip.includes(k));
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => {
          const empty = v === undefined || v === null || v === "" || v === 0;
          return (
            <tr key={k} style={{ borderTop: `1px solid ${C.line}` }}>
              <td className="w-48 py-1 pr-3 align-top font-mono text-xs" style={{ color: C.muted }}>
                {k}
              </td>
              <td className="break-all py-1 align-top" style={{ color: empty ? C.muted : C.text }}>
                {typeof v === "object" && v !== null ? (
                  <code className="text-xs">{JSON.stringify(v)}</code>
                ) : (
                  String(v ?? "—")
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
