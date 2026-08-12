"use client";

// Своя граница ошибок для карточки авто. Без неё сюда доставала граница листинга
// (../error.tsx) и показывала «каталог временно недоступен» — не про эту страницу.
// Типовая причина попадания: VehicleUpstreamError из src/lib/vehicle.ts.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";
import Link from "next/link";

const TEXT: Record<
  string,
  { title: string; hint: string; retry: string; toCatalog: string }
> = {
  ru: { title: "Не удалось загрузить авто", hint: "Данные по автомобилю сейчас недоступны. Попробуйте ещё раз через минуту.", retry: "Попробовать снова", toCatalog: "В каталог" },
  en: { title: "Could not load this car", hint: "Vehicle data is unavailable right now. Please try again in a minute.", retry: "Try again", toCatalog: "Back to catalog" },
  ka: { title: "ავტომობილი ვერ ჩაიტვირთა", hint: "მონაცემები ამჟამად მიუწვდომელია. სცადეთ ერთი წუთის შემდეგ.", retry: "ხელახლა ცდა", toCatalog: "კატალოგში" },
  ar: { title: "تعذر تحميل السيارة", hint: "بيانات السيارة غير متاحة حاليًا. حاول مرة أخرى بعد دقيقة.", retry: "حاول مرة أخرى", toCatalog: "إلى الكتالوج" },
};

export default function CarDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const lang = pathname.split("/")[1];
  const t = TEXT[lang] || TEXT.ru;

  useEffect(() => {
    console.error("Car detail error:", error);
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
          >
            {t.retry}
          </button>
          <Link
            href={`/${TEXT[lang] ? lang : "ru"}/catalog`}
            className="px-6 py-3 rounded-full font-semibold text-sm"
            style={{ border: "1px solid rgba(74,74,74,0.5)", color: "var(--axis-gray)" }}
          >
            {t.toCatalog}
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs" style={{ color: "var(--axis-gray-dim)" }}>{error.digest}</p>
        )}
      </div>
    </div>
  );
}
