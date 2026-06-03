"use client";

import { useState, useEffect } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { usePartsFavorites } from "@/hooks/usePartsFavorites";
import { useTranslation } from "react-i18next";
import { Heart, Trash2, ArrowRight, Car, Wrench, GitCompare, X, MessageCircle, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { generatePartSlug } from "@/utils/partSlug";
import { cn } from "@/lib/utils";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];
const WA_PHONE = "821058654344";
const TG_MANAGER = "axiskorea";

const usdFormatter = new Intl.NumberFormat("en-US");
const formatUsd = (krw: number, rate: number) =>
  "$" + usdFormatter.format(Math.ceil(krw * rate * 1.23));

export default function FavoritesClient() {
  const { t, i18n } = useTranslation(["common", "cars"]);
  const { favorites: cars, removeFavorite: removeCar } = useFavorites();
  const { favorites: parts, removeFavorite: removePart } = usePartsFavorites();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const [tab, setTab] = useState<"cars" | "parts">("cars");
  const [selected, setSelected] = useState<string[]>([]);
  const [krwToUsd, setKrwToUsd] = useState(0.00075);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => { if (d?.krwToUsd) setKrwToUsd(d.krwToUsd); })
      .catch(() => {});
  }, []);

  const totalPartsUsd = parts.reduce((sum, p) => sum + Math.ceil(p.price_krw * krwToUsd * 1.23), 0);

  const PARTS_ORDER_TEXT: Record<string, { greeting: string; total: string }> = {
    ru: { greeting: "Здравствуйте! Хочу заказать запчасти из избранного:", total: "Итого" },
    en: { greeting: "Hello! I'd like to order parts from my favorites:", total: "Total" },
    ko: { greeting: "안녕하세요! 즐겨찾기에서 부품을 주문하고 싶습니다:", total: "합계" },
    ka: { greeting: "გამარჯობა! მინდა შევუკვეთო ნაწილები რჩეულებიდან:", total: "სულ" },
    ar: { greeting: "مرحباً! أريد طلب قطع الغيار من المفضلة:", total: "المجموع" },
  };

  const buildOrderMessage = () => {
    const tx = PARTS_ORDER_TEXT[lang] ?? PARTS_ORDER_TEXT.ru;
    const lines = parts.map((p) => {
      const name = i18n.language === "ru" ? p.name_ru : (p.name_en || p.name_ru);
      return `• ${name} (${p.part_number}) — ${formatUsd(p.price_krw, krwToUsd)}`;
    });
    return `${tx.greeting}\n\n${lines.join("\n")}\n\n${tx.total}: ~$${usdFormatter.format(totalPartsUsd)}`;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const goCompare = () => {
    router.push(`/${lang}/compare?ids=${selected.join(",")}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6" style={{ color: "var(--axis-orange)" }} fill="currentColor" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--axis-white)" }}>
            {t("common:favorites.title")}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("cars")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === "cars"
                ? "text-white"
                : "text-[var(--axis-gray)] hover:text-white"
            )}
            style={{
              backgroundColor: tab === "cars" ? "var(--axis-orange)" : "var(--axis-charcoal)",
              border: "1px solid",
              borderColor: tab === "cars" ? "var(--axis-orange)" : "rgba(74,74,74,0.3)",
            }}
          >
            <Car className="w-4 h-4" />
            {t("common:nav.catalog")}
            {cars.length > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ backgroundColor: tab === "cars" ? "rgba(255,255,255,0.25)" : "var(--axis-orange)", color: "white" }}
              >
                {cars.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("parts")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === "parts"
                ? "text-white"
                : "text-[var(--axis-gray)] hover:text-white"
            )}
            style={{
              backgroundColor: tab === "parts" ? "var(--axis-orange)" : "var(--axis-charcoal)",
              border: "1px solid",
              borderColor: tab === "parts" ? "var(--axis-orange)" : "rgba(74,74,74,0.3)",
            }}
          >
            <Wrench className="w-4 h-4" />
            {t("common:nav.parts") ?? "Запчасти"}
            {parts.length > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ backgroundColor: tab === "parts" ? "rgba(255,255,255,0.25)" : "var(--axis-orange)", color: "white" }}
              >
                {parts.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Cars tab ── */}
        {tab === "cars" && (
          <>
            {cars.length === 0 ? (
              <EmptyState lang={lang} t={t} type="cars" />
            ) : (
              <>
              {cars.length >= 2 && (
                <p className="text-xs mb-4" style={{ color: "var(--axis-gray)" }}>
                  Выберите до 4 авто для сравнения
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cars.map((car) => {
                  const isSelected = selected.includes(car.id);
                  const isDisabled = !isSelected && selected.length >= 4;
                  return (
                  <div
                    key={car.id}
                    className="relative rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      backgroundColor: "var(--axis-charcoal)",
                      border: `2px solid ${isSelected ? "var(--axis-orange)" : "rgba(74,74,74,0.25)"}`,
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    <div className="relative aspect-[16/10]" style={{ backgroundColor: "var(--axis-graphite)" }}>
                      <Image
                        fill unoptimized
                        src={`https://ci.encar.com${car.photo}`}
                        alt={`${car.manufacture} ${car.model} ${car.year}`}
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/70 to-transparent" />
                      {/* Бейдж "Продано" */}
                      {car.sold && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}>
                          <span className="px-5 py-2 rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: "rgba(220,38,38,0.95)" }}>
                            Продано
                          </span>
                        </div>
                      )}
                      {/* Чекбокс выбора */}
                      <button
                        onClick={() => !isDisabled && toggleSelect(car.id)}
                        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105"
                        style={{
                          backgroundColor: isSelected ? "var(--axis-orange)" : "rgba(10,10,10,0.55)",
                          backdropFilter: "blur(6px)",
                          border: `1.5px solid ${isSelected ? "var(--axis-orange)" : "rgba(255,255,255,0.25)"}`,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {isSelected
                          ? <span className="text-white text-xs font-bold">#{selected.indexOf(car.id) + 1}</span>
                          : <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>Сравнить</span>
                        }
                      </button>
                      <button
                        onClick={() => removeCar(car.id)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(220,38,38,0.85)" }}
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
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
                        <span className="text-xs" style={{ color: "var(--axis-gray)" }}>{convertNumberKm(car.mileage)} {t("common:common.km")}</span>
                        <span className="text-xs" style={{ color: "var(--axis-gray)" }}>{translateGenerationRow(car.fuel, t)}</span>
                        <span className="text-xs" style={{ color: "var(--axis-gray)" }}>{translateGenerationRow(car.transmission, t)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold" style={{ color: "var(--axis-orange)" }}>
                          {convertNumber(car.price)}
                          <span className="text-xs font-normal ml-1" style={{ color: "var(--axis-gray)" }}>{t("common:common.won")}</span>
                        </p>
                        <Link
                          href={`/${lang}/catalog/${car.id}`}
                          target="_blank"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                          style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
                        >
                          {t("common:car.details")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              </>
            )}
          </>
        )}

        {/* ── Parts tab ── */}
        {tab === "parts" && (
          <>
            {parts.length === 0 ? (
              <EmptyState lang={lang} t={t} type="parts" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {parts.map((part) => {
                  const name = i18n.language === "ru" ? part.name_ru : (part.name_en || part.name_ru);
                  const href = `/${lang}/parts/${generatePartSlug(part.part_number, name, lang as "ru" | "en" | "ko", part.id)}`;
                  return (
                    <div
                      key={part.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="relative bg-gray-50" style={{ paddingBottom: "62%" }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {part.image_url
                            ? <Image src={part.image_url} alt={name} fill unoptimized className="object-contain p-3" />
                            : <Wrench className="w-8 h-8 text-gray-300" />}
                        </div>
                        {part.is_new && (
                          <div className="absolute top-2 left-2 bg-[#BB162B] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            NEW
                          </div>
                        )}
                        <button
                          onClick={() => removePart(part.id)}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
                          style={{ backgroundColor: "rgba(220,38,38,0.85)" }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div className="p-3 flex flex-col gap-1.5 flex-1">
                        <Link href={href} className="block hover:opacity-80">
                          <div className="text-[11px] text-gray-400 font-mono">{part.part_number}</div>
                          <h3 className="text-sm font-semibold text-[#002C5F] line-clamp-2 leading-snug">{name}</h3>
                        </Link>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                          <span className="text-base font-bold text-[#BB162B]">
                            {formatUsd(part.price_krw, krwToUsd)}
                          </span>
                          <Link
                            href={href}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: "#002C5F" }}
                          >
                            {t("common:car.details")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Итого + кнопки заказа */}
            {parts.length > 0 && (
              <div
                className="mt-6 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.25)" }}
              >
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--axis-gray)" }}>
                    {PARTS_ORDER_TEXT[lang]?.total ?? "Итого"} · {parts.length} {lang === "ru" ? (parts.length === 1 ? "позиция" : parts.length < 5 ? "позиции" : "позиций") : "items"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--axis-orange)" }}>
                    ~${usdFormatter.format(totalPartsUsd)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(120,120,120,0.8)" }}>
                    включая наценку 23%
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(buildOrderMessage())}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`https://t.me/${TG_MANAGER}?text=${encodeURIComponent(buildOrderMessage())}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: "rgba(34,158,217,0.15)", color: "#229ED9", border: "1px solid rgba(34,158,217,0.3)" }}
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Панель сравнения */}
      {selected.length >= 2 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
          style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid var(--axis-orange)" }}
        >
          <div className="flex items-center gap-2">
            {selected.map((id, i) => {
              const car = cars.find((c) => c.id === id);
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--axis-white)" }}>
                    {car ? `${car.manufacture} ${car.year}` : id}
                  </span>
                  {i < selected.length - 1 && <span style={{ color: "var(--axis-gray)" }}>vs</span>}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSelected([])}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-70"
            style={{ color: "var(--axis-gray)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={goCompare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
          >
            <GitCompare className="w-4 h-4" />
            Сравнить {selected.length}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ lang, t, type }: { lang: string; t: (k: string) => string; type: "cars" | "parts" }) {
  const href = type === "cars" ? `/${lang}/catalog` : `/${lang}/parts`;
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Heart className="w-16 h-16 opacity-20" style={{ color: "var(--axis-gray)" }} />
      <p className="text-lg font-medium" style={{ color: "var(--axis-gray)" }}>
        {t("common:favorites.empty")}
      </p>
      <p className="text-sm text-center max-w-xs" style={{ color: "rgba(120,120,120,0.8)" }}>
        {t("common:favorites.hint")}
      </p>
      <Link
        href={href}
        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
      >
        {type === "cars" ? t("common:nav.catalog") : (t("common:nav.parts") ?? "Запчасти")}
      </Link>
    </div>
  );
}
