// Общие кирпичи каталога и страницы машины carnect: цвета, контейнер, панель.
// Живут здесь, а не в /admin, потому что их берут и витрина, и админка.

import type { ReactNode } from "react";

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

/**
 * Отступ сверху: на витрине над страницей фиксированная шапка сайта (как у
 * прежней витрины аукциона, pt-24), в админке шапки нет.
 */
export const pad = (withHeader: boolean) => (withHeader ? "px-4 pb-16 pt-24" : "px-4 py-6");

export function Page({ children, withHeader = false }: { children: ReactNode; withHeader?: boolean }) {
  return (
    <main className={`min-h-screen ${pad(withHeader)}`} style={{ backgroundColor: C.bg, color: C.text }}>
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

/** «12 мин назад» — по нему видно, пришли данные свежими или из кеша. Только служебное. */
export function ago(iso: string | undefined): string {
  if (!iso) return "—";
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s} с назад`;
  if (s < 3600) return `${Math.round(s / 60)} мин назад`;
  return `${Math.round(s / 3600)} ч назад`;
}
