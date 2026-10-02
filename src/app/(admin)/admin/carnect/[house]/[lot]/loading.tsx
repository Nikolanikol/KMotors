// Заглушка на время загрузки страницы машины.
//
// Зачем: страница серверная и перед отрисовкой ходит к carnect (свежий поход —
// секунды, очередь client.ts держит паузы между запросами). Без этого файла
// Next держит СТАРУЮ страницу до готовности новой, и клик по карточке в
// каталоге выглядит так, будто ничего не произошло. loading.tsx показывается
// сразу по клику — это граница Suspense сегмента, отдельного кода не нужно.
//
// Раскладка повторяет настоящую страницу (шапка → ряд показателей → галерея),
// чтобы при подмене ничего не прыгало.

import { C, Page } from "../../ui";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }} />;
}

export default function LotLoading() {
  return (
    <Page>
      <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 text-sm" style={{ color: C.muted }}>
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2"
          style={{ borderColor: C.line, borderTopColor: C.accent }}
          aria-hidden
        />
        Загружаем машину…
      </div>
      <Block className="mb-2 h-7 w-2/3 max-w-md" />
      <Block className="mb-4 h-4 w-1/2 max-w-sm" />
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Block key={i} className="h-16" />
        ))}
      </section>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <Block key={i} className="aspect-[4/3]" />
        ))}
      </div>
    </Page>
  );
}
