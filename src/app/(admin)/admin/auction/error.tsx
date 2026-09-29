"use client";

// Граница ошибок служебной витрины аукционов.
//
// Тут она нужна по своей причине: под /admin инстанса i18next нет, страницы
// рендерятся по-русски, а падение уносило бы в корневой app/error.tsx — то
// есть оператор вместо рабочего экрана получал бы клиентскую страницу ошибки
// и не понимал, лёг ли сайт целиком. Здесь же видно, что это раздел.
//
// digest показан НАМЕРЕННО и крупнее, чем на публичной витрине: экран видит
// только оператор, и это единственная ниточка, по которой строку падения
// можно найти в логах контейнера.

import { useEffect } from "react";

export default function AdminAuctionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin auction error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-4">
        <h1 className="text-xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
          Витрина лотов не отрисовалась
        </h1>
        <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
          Упал рендер раздела, а не сайт целиком. Данные в базе не тронуты —
          синхронизация и лоты на месте.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
        >
          Перерисовать
        </button>
        {error.digest && (
          <p className="text-xs font-mono" style={{ color: "var(--axis-gray)" }}>
            digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
