// Плашка «главное о машине»: иконка, подпись, значение — сеткой.
//
// Серверный компонент без состояния, поэтому иконки принимает готовыми узлами:
// передавать их из серверной страницы можно, а вот функцию-рендер уже нельзя —
// пропсы через границу сервер→клиент обязаны сериализоваться. Клиентом делать
// нечего, здесь нет ни одного обработчика.
//
// ⚠️ Палитра НАША, а не источника. У витрины-образца плашка светлая с синими
// иконками; повторять её значило бы притащить чужой бренд на свою страницу.
// Иконки и рамки — `--axis-bronze`, заливка карточная, как у остальных блоков.

import type { ReactNode } from "react";

export interface OverviewItem {
  icon: ReactNode;
  label: string;
  /** Пустые пункты не рисуются: «—» в сетке из шести ячеек выглядит поломкой. */
  value: ReactNode;
}

export default function OverviewStrip({ items }: { items: OverviewItem[] }) {
  const shown = items.filter(
    (i) => i.value !== null && i.value !== undefined && i.value !== "" && i.value !== "—",
  );
  if (!shown.length) return null;

  return (
    <section
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.25)" }}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                border: "1px solid rgba(182,119,73,0.35)",
                color: "var(--axis-bronze)",
              }}
              aria-hidden
            >
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs" style={{ color: "var(--axis-gray)" }}>
                {item.label}
              </span>
              <span
                className="block truncate text-base font-semibold"
                style={{ color: "var(--axis-cream, #F5F0EB)" }}
              >
                {item.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
