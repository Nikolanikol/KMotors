// Карточка характеристик в стиле карточки авто.
//
// Повторяет приём из Catalog/CarDetail/DetailInfo: заголовок с бронзовой
// градиентной полоской слева, строки с нижней границей, подпись серым слева и
// значение полужирным справа. Заведено отдельным компонентом, потому что обе
// страницы лотов рисуют такие блоки, а DetailInfo клиентский и завязан на
// i18next — под [lang] он живёт, в админке нет.
//
// ⚠️ Градиент полоски идёт по токенам-алиасам --axis-orange/--axis-amber. Они
// давно указывают на бронзу (см. «Бренд» в CLAUDE.md), оранжевого за ними нет;
// имена оставлены, чтобы блок совпадал с карточкой авто строка в строку.

import type { ReactNode } from "react";

export function SpecCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
    >
      <h2
        className="mb-3 flex items-center gap-2 text-base font-semibold"
        style={{ color: "var(--axis-white)" }}
      >
        <span
          className="inline-block h-5 w-1 rounded-full"
          style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))" }}
        />
        {title}
      </h2>
      {children}
    </div>
  );
}

export type SpecRow = {
  label: string;
  value: ReactNode;
  /** Значение бронзой — для того, ради чего строку и открывают. */
  accent?: boolean;
  /** Моноширинный: VIN и госномер иначе не прочитать посимвольно. */
  mono?: boolean;
};

/**
 * Пустые строки не рисуются: прочерк в половине ячеек выглядит поломкой, а не
 * отсутствием данных. Если не осталось ни одной — блока нет вовсе.
 */
export function SpecRows({ rows }: { rows: SpecRow[] }) {
  const shown = rows.filter(
    (r) => r.value !== null && r.value !== undefined && r.value !== "" && r.value !== "—",
  );
  if (!shown.length) {
    return (
      <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
        нет данных
      </p>
    );
  }

  return (
    <div>
      {shown.map((r, i) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-4 py-2.5"
          // Последняя строка без границы — иначе карточка выглядит обрезанной.
          style={i < shown.length - 1 ? { borderBottom: "1px solid rgba(74,74,74,0.2)" } : undefined}
        >
          <span className="text-sm" style={{ color: "var(--axis-gray)" }}>
            {r.label}
          </span>
          <span
            className={`text-right text-sm font-semibold ${r.mono ? "font-mono text-xs tracking-tight" : ""}`}
            style={{ color: r.accent ? "var(--axis-bronze)" : "var(--axis-white)" }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
