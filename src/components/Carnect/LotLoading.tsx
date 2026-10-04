// Заглушка на время загрузки страницы машины. Сама по себе не маршрут: её
// рендерят loading.tsx витрины и админки со своими языком и отступом.
//
// Зачем: страница серверная и перед отрисовкой ходит к carnect (свежий поход —
// секунды, очередь client.ts держит паузы между запросами). Без этого файла
// Next держит СТАРУЮ страницу до готовности новой, и клик по карточке в
// каталоге выглядит так, будто ничего не произошло. loading.tsx показывается
// сразу по клику — это граница Suspense сегмента, отдельного кода не нужно.
//
// ⚠️ Раскладка — КОПИЯ CarCardView: тот же контейнер (`max-w-7xl`), та же
// сетка `[1fr_320px]`, те же отступы и размеры блоков (галерея 16/10 и
// миниатюры 90×60, как в Carousel). Прежняя заглушка рисовала сетку плиток
// узкой колонкой `Page`, и при подмене страница прыгала целиком (замечание
// владельца 04.10.2026). Меняешь раскладку CarCardView — меняй и здесь.

import type { CSSProperties } from "react";

import type { CardLang } from "@/lib/carnect/lang";

import { tx } from "./text";
import { pad } from "./ui";

const card: CSSProperties = { backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" };
const bar: CSSProperties = { backgroundColor: "rgba(74,74,74,0.35)" };

/** Серая полоска на месте текста. */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md ${className}`} style={bar} />;
}

/** Карточка как SpecCard: заголовок с полоской и строки. */
function SpecSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl p-5" style={card}>
      <Bar className="mb-4 h-5 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex justify-between gap-4 py-2.5">
          <Bar className="h-4 w-24" />
          <Bar className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function SideSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ ...card, border: "1px solid rgba(182,119,73,0.4)" }}>
        <Bar className="mb-3 h-3 w-24" />
        <Bar className="mb-2 h-9 w-44" />
        <Bar className="mb-4 h-3 w-full" />
        <div className="h-[68px] rounded-xl" style={{ border: "1px solid rgba(182,119,73,0.4)" }} />
      </div>
      <div className="rounded-2xl p-5" style={{ ...card, border: "1.5px solid rgba(182,119,73,0.5)" }}>
        <Bar className="mb-2 h-5 w-40" />
        <Bar className="mb-4 h-3 w-48" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Bar key={i} className="h-9" />
          ))}
        </div>
        <Bar className="mb-3 h-10 w-full" />
        <Bar className="h-11 w-full" />
      </div>
    </div>
  );
}

/** Маршрутный loading.tsx язык и шапку не знает — их передаёт обёртка маршрута. */
export default function LotLoading({ lang = "ru", withHeader = false }: { lang?: CardLang; withHeader?: boolean }) {
  return (
    <main className={`min-h-screen ${pad(withHeader)}`} style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        {/* На месте ссылки «← каталог» — той же высоты строка со статусом. */}
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm" style={{ color: "var(--axis-gray)" }}>
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2"
            style={{ borderColor: "rgba(74,74,74,0.6)", borderTopColor: "var(--axis-bronze)" }}
            aria-hidden
          />
          {tx(lang, "loading")}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-4">
            <div>
              <Bar className="h-8 w-2/3 max-w-md lg:h-9" />
              <Bar className="mt-2 h-5 w-1/2 max-w-xs" />
              <div className="mt-2 flex gap-2">
                <Bar className="h-7 w-32 rounded-full" />
                <Bar className="h-7 w-20 rounded-full" />
              </div>
            </div>

            <div className="rounded-2xl p-5" style={card}>
              <Bar className="mb-3 h-5 w-24" />
              <div className="animate-pulse rounded-2xl" style={{ ...bar, aspectRatio: "16/10" }} />
              <div className="mt-2 flex gap-2 overflow-hidden pb-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse rounded-lg" style={{ ...bar, width: 90, height: 60 }} />
                ))}
              </div>
            </div>

            <div className="lg:hidden">
              <SideSkeleton />
            </div>

            <section className="rounded-xl p-4" style={card}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-full" style={bar} />
                    <div className="flex-1">
                      <Bar className="mb-1.5 h-3 w-14" />
                      <Bar className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <SpecSkeleton rows={6} />
              <SpecSkeleton rows={5} />
            </div>
          </div>

          <div className="hidden h-fit min-w-0 lg:sticky lg:top-6 lg:block">
            <SideSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}
