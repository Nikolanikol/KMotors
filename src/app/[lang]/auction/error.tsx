"use client";

// Граница ошибок сегмента аукционов.
//
// Зачем она, если слой чтения и так не бросает: чтения закрыты по одному, а
// эта граница ловит ВСЁ остальное — рендер карточки на неожиданной форме
// строки, сбой в чужом компоненте галереи, любой будущий вызов, который
// добавят сюда, забыв про try/catch. Без неё такой throw уходит в корневой
// app/error.tsx, где теряются header, footer и весь layout: человек видит
// голую страницу ошибки вместо сайта с нерабочим разделом.
//
// ⚠️ Языков два, ru и английский на всё остальное — ровно как у самого раздела
// аукционов (ka/ar там намеренно идут английским фолбэком). Заводить сюда
// четыре локали, когда в разделе их две, значит обещать перевод, которого
// на соседнем экране нет.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";

const TEXT: Record<string, { title: string; hint: string; retry: string }> = {
  ru: {
    title: "Аукцион временно недоступен",
    hint: "Не удалось загрузить лоты. Попробуйте ещё раз — торги и сами лоты никуда не делись.",
    retry: "Попробовать снова",
  },
  en: {
    title: "Auction is temporarily unavailable",
    hint: "Could not load the lots. Please try again — the auction itself is unaffected.",
    retry: "Try again",
  },
};

export default function AuctionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const t = TEXT[pathname.split("/")[1]] ?? TEXT.en;

  useEffect(() => {
    console.error("Auction error:", error);
  }, [error]);

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--axis-black)" }}
    >
      <div className="max-w-md w-full text-center space-y-5">
        <WifiOff className="w-12 h-12 mx-auto opacity-25" style={{ color: "var(--axis-gray)" }} />
        <h1 className="text-xl font-semibold" style={{ color: "var(--axis-white)" }}>
          {t.title}
        </h1>
        <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
          {t.hint}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
        >
          {t.retry}
        </button>
        {error.digest && (
          <p className="text-xs" style={{ color: "var(--axis-gray)" }}>
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
