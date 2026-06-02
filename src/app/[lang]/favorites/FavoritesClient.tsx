"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslation } from "react-i18next";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

export default function FavoritesClient() {
  const { t, i18n } = useTranslation(["common", "cars"]);
  const { favorites, removeFavorite } = useFavorites();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6" style={{ color: "var(--axis-orange)" }} fill="currentColor" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--axis-white)" }}>
            {t("common:favorites.title")}
          </h1>
          {favorites.length > 0 && (
            <span
              className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
              style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
            >
              {favorites.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Heart className="w-16 h-16 opacity-20" style={{ color: "var(--axis-gray)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--axis-gray)" }}>
              {t("common:favorites.empty")}
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: "rgba(120,120,120,0.8)" }}>
              {t("common:favorites.hint")}
            </p>
            <Link
              href={`/${lang}/catalog`}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
            >
              {t("common:nav.catalog")}
            </Link>
          </div>
        )}

        {/* Grid */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((car) => (
              <div
                key={car.id}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--axis-charcoal)",
                  border: "1px solid rgba(74,74,74,0.25)",
                }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10]" style={{ backgroundColor: "var(--axis-graphite)" }}>
                  <Image
                    fill
                    unoptimized
                    src={`https://ci.encar.com${car.photo}`}
                    alt={`${car.manufacture} ${car.model} ${car.year}`}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/70 to-transparent" />
                  <div
                    className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full text-white z-10"
                    style={{ backgroundColor: "var(--axis-orange)" }}
                  >
                    {car.year}
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeFavorite(car.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                    style={{ backgroundColor: "rgba(220,38,38,0.85)", backdropFilter: "blur(4px)" }}
                    aria-label={t("common:favorites.remove")}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-semibold line-clamp-1" style={{ color: "var(--axis-white)" }}>
                      {translateGenerationRow(car.model, t)}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
                      {translateGenerationRow(car.manufacture, t)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 py-2 border-y" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                    <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
                      {convertNumberKm(car.mileage)} {t("common:common.km")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
                      {translateGenerationRow(car.fuel, t)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
                      {translateGenerationRow(car.transmission, t)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold" style={{ color: "var(--axis-orange)" }}>
                      {convertNumber(car.price)}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--axis-gray)" }}>
                        {t("common:common.won")}
                      </span>
                    </p>
                    <Link
                      href={`/${lang}/catalog/${car.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
                    >
                      {t("common:car.details")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
