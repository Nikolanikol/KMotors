"use client";

import { useMemo } from "react";
import { useFavorites, FavoriteCar } from "@/hooks/useFavorites";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = {
  label: string;
  key: keyof FavoriteCar;
  format?: (val: string, t: any) => string;
  best?: "min" | "max";
};

const ROWS: Row[] = [
  { label: "Год", key: "year", best: "max" },
  { label: "Цена", key: "price", format: (v) => convertNumber(v), best: "min" },
  { label: "Пробег", key: "mileage", format: (v) => `${convertNumberKm(v)} км`, best: "min" },
  { label: "Топливо", key: "fuel", format: (v, t) => translateGenerationRow(v, t) },
  { label: "КПП", key: "transmission", format: (v, t) => translateGenerationRow(v, t) },
];

export default function CompareClient() {
  const { t } = useTranslation(["common", "cars"]);
  const { favorites } = useFavorites();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const ids = useMemo(
    () => (searchParams.get("ids") ?? "").split(",").filter(Boolean),
    [searchParams]
  );

  const cars = useMemo(
    () => ids.map((id) => favorites.find((f) => f.id === id)).filter(Boolean) as FavoriteCar[],
    [ids, favorites]
  );

  // Находим лучшее значение по строке
  const getBest = (row: Row): string | null => {
    if (!row.best) return null;
    const nums = cars.map((c) => Number(c[row.key])).filter((n) => !isNaN(n));
    if (!nums.length) return null;
    const best = row.best === "min" ? Math.min(...nums) : Math.max(...nums);
    return String(best);
  };

  if (cars.length < 2) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--axis-black)" }}>
        <p className="text-lg" style={{ color: "var(--axis-gray)" }}>Недостаточно авто для сравнения</p>
        <Link href={`/${lang}/favorites`} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--axis-orange)" }}>
          <ArrowLeft className="w-4 h-4" /> Вернуться к избранному
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Назад */}
        <Link
          href={`/${lang}/favorites`}
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-80"
          style={{ color: "var(--axis-gray)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Избранное
        </Link>

        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--axis-white)" }}>
          Сравнение авто
        </h1>

        {/* Таблица */}
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(74,74,74,0.25)" }}>
          <table className="w-full min-w-[600px]">

            {/* Фото + название */}
            <thead>
              <tr>
                <th className="w-32 p-4 text-left text-xs font-medium" style={{ color: "var(--axis-gray)", backgroundColor: "var(--axis-charcoal)", borderBottom: "1px solid rgba(74,74,74,0.2)" }}>
                  Характеристика
                </th>
                {cars.map((car) => (
                  <th key={car.id} className="p-4 text-center" style={{ backgroundColor: "var(--axis-charcoal)", borderBottom: "1px solid rgba(74,74,74,0.2)", borderLeft: "1px solid rgba(74,74,74,0.15)" }}>
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3">
                      <Image
                        fill unoptimized
                        src={`https://ci.encar.com${car.photo}`}
                        alt={`${car.manufacture} ${car.model}`}
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--axis-white)" }}>
                      {translateGenerationRow(car.manufacture, t)} {translateGenerationRow(car.model, t)}
                    </p>
                    <Link
                      href={`/${lang}/catalog/${car.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 mt-2 text-xs transition-colors hover:opacity-80"
                      style={{ color: "var(--axis-orange)" }}
                    >
                      Подробнее <ArrowRight className="w-3 h-3" />
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Строки характеристик */}
            <tbody>
              {ROWS.map((row, ri) => {
                const best = getBest(row);
                return (
                  <tr key={row.key} style={{ backgroundColor: ri % 2 === 0 ? "var(--axis-graphite)" : "var(--axis-charcoal)" }}>
                    <td className="p-4 text-xs font-medium" style={{ color: "var(--axis-gray)", borderTop: "1px solid rgba(74,74,74,0.1)" }}>
                      {row.label}
                    </td>
                    {cars.map((car) => {
                      const raw = car[row.key] as string;
                      const display = row.format ? row.format(raw, t) : raw;
                      const isBest = best !== null && raw === best;
                      return (
                        <td
                          key={car.id}
                          className="p-4 text-center text-sm font-semibold"
                          style={{
                            color: isBest ? "var(--axis-orange)" : "var(--axis-white)",
                            borderTop: "1px solid rgba(74,74,74,0.1)",
                            borderLeft: "1px solid rgba(74,74,74,0.15)",
                          }}
                        >
                          {display}
                          {isBest && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(255,69,0,0.15)", color: "var(--axis-orange)" }}>
                              ✓
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
