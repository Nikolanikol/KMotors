// Публичная витрина аукционов: каталог carnect — пять площадок и HeyDealer.
//
// Заменила прежнюю витрину на dokanmazad (решение владельца 02.10.2026,
// выкладка 04.10.2026). Каталог — общий компонент с админкой
// (src/components/Carnect/CatalogView.tsx), здесь только пропсы витрины.
//
// ⚠️ АНГЛИЙСКИЙ на всех локалях, включая ru (решение владельца 04.10.2026,
// «пока что»). Вернуть русский — lang={lang === "ru" ? "ru" : "en"}.
//
// ⚠️ noindex, nofollow: лоты живут дни, в индексе они обернулись бы сотнями
// 404 (как было со страницами проданных машин), а обход страниц лотов ботами —
// это запросы к carnect. Страницы лотов закрыты ещё и в robots.ts.
//
// Кеш: страница читает searchParams и потому динамическая — ISR ей недоступен.
// Кешируется выборка из базы (searchCatalogCached, 10 минут).

import type { Metadata } from "next";

import CatalogView, { type SP } from "@/components/Carnect/CatalogView";
import { tx } from "@/components/Carnect/text";
import { isServiceHost } from "@/lib/serviceHost";
import { getViewer } from "@/lib/viewer";

const LANG = "en" as const;

export const metadata: Metadata = {
  title: tx(LANG, "catalogTitle"),
  description: tx(LANG, "catalogSubtitle"),
  robots: { index: false, follow: false },
};

export default async function AuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<SP>;
}) {
  // Гость не видит цен лотов (решение владельца 05.10.2026) — проверка входа на
  // сервере; страница и так динамическая (searchParams), кешу это не мешает.
  const [{ lang }, sp, service, viewer] = await Promise.all([params, searchParams, isServiceHost(), getViewer()]);
  return (
    <CatalogView
      searchParams={sp}
      lang={LANG}
      base={`/${lang}/auction`}
      lotBase={`/${lang}/auction/lot`}
      cached
      showReason={service}
      signedIn={!!viewer}
      withHeader
      intro={
        <header className="mb-5">
          <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: "var(--axis-white)" }}>
            {tx(LANG, "catalogTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--axis-gray)" }}>
            {tx(LANG, "catalogSubtitle")}
          </p>
          {/* ⚠️ Оговорка про цену — ВЫШЕ списка: человек должен прочитать её до цифр, а не после. */}
          <p
            className="mt-4 rounded-xl p-3 text-xs leading-relaxed"
            style={{
              backgroundColor: "var(--axis-charcoal)",
              border: "1px solid rgba(182,119,73,0.3)",
              color: "var(--axis-gray)",
            }}
          >
            {tx(LANG, "catalogPriceNote")}
          </p>
        </header>
      }
    />
  );
}
