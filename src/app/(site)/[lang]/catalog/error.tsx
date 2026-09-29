"use client";

// Локальная граница ошибок сегмента каталога: неожиданный throw в CarsRow/Filter
// гасится здесь и не уносит всю страницу в корневой app/error.tsx (там теряются
// header/footer и весь layout).

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";

const TEXT: Record<string, { title: string; hint: string; retry: string }> = {
  ru: { title: "Каталог временно недоступен", hint: "Не удалось загрузить список авто. Попробуйте ещё раз.", retry: "Попробовать снова" },
  en: { title: "Catalog is temporarily unavailable", hint: "Could not load the car list. Please try again.", retry: "Try again" },
  ka: { title: "კატალოგი დროებით მიუწვდომელია", hint: "ავტომობილების სია ვერ ჩაიტვირთა. სცადეთ ხელახლა.", retry: "ხელახლა ცდა" },
  ar: { title: "الكتالوج غير متاح مؤقتًا", hint: "تعذر تحميل قائمة السيارات. حاول مرة أخرى.", retry: "حاول مرة أخرى" },
};

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const t = TEXT[pathname.split("/")[1]] || TEXT.ru;

  useEffect(() => {
    console.error("Catalog error:", error);
  }, [error]);

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--axis-black)" }}
    >
      <div className="max-w-md w-full text-center space-y-5">
        <WifiOff className="w-12 h-12 mx-auto opacity-25" style={{ color: "var(--axis-gray)" }} />
        <h1 className="text-xl font-semibold" style={{ color: "var(--axis-white)" }}>{t.title}</h1>
        <p className="text-sm" style={{ color: "var(--axis-gray)" }}>{t.hint}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
        >
          {t.retry}
        </button>
        {error.digest && (
          <p className="text-xs" style={{ color: "var(--axis-gray-dim)" }}>{error.digest}</p>
        )}
      </div>
    </div>
  );
}
