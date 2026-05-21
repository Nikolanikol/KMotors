"use client";

import { useRef, useCallback } from "react";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

interface CarCardProps {
  id: string;
  photo: string;
  model: string;
  manufacture: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  price: string;
  krwToRub?: number;
  krwToUsd?: number;
}

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];
const WA_PHONE = "821058654344";

const BUY_FROM_KOREA: Record<string, string> = {
  ru: "купить из Кореи", en: "buy from Korea", ko: "한국에서 구매",
  ka: "კორეიდან შეძენა", ar: "شراء من كوريا",
};

const WA_CAR_TEXT: Record<string, (id: string, name: string) => string> = {
  ru: (id, name) => `Здравствуйте! Интересует ${name}, ID: ${id} — https://kmotors.shop/ru/catalog/${id}`,
  en: (id, name) => `Hello! I'm interested in ${name}, ID: ${id} — https://kmotors.shop/en/catalog/${id}`,
  ko: (id, name) => `안녕하세요! ${name} 차량에 관심 있습니다, ID: ${id} — https://kmotors.shop/ko/catalog/${id}`,
  ka: (id, name) => `გამარჯობა! მაინტერესებს ${name}, ID: ${id} — https://kmotors.shop/ka/catalog/${id}`,
  ar: (id, name) => `مرحباً! أنا مهتم بـ ${name}, ID: ${id} — https://kmotors.shop/ar/catalog/${id}`,
};

const CarCard = ({ photo, id, model, manufacture, year, mileage, transmission, fuel, price, krwToRub, krwToUsd }: CarCardProps) => {
  const { t } = useTranslation(["common", "cars"]);
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const cardRef = useRef<HTMLDivElement>(null);
  const glossyRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glossy = glossyRef.current;
    if (!card || !glossy) return;
    const rect = card.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    card.style.transform = `perspective(1000px) rotateX(${-dy * 0.025}deg) rotateY(${dx * 0.025}deg) scale3d(1.02,1.02,1.02)`;
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    glossy.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    if (glossyRef.current) glossyRef.current.style.background = "transparent";
  }, []);

  const krw = typeof price === "number" ? (price as unknown as number) * 10000 : Number(price) * 1000;

  const convertedPrice = (() => {
    if (!krw || isNaN(krw)) return null;
    if (lang === "ru" && krwToRub) return { value: Math.round(krw * krwToRub).toLocaleString("ru-RU"), symbol: "₽" };
    if (lang !== "ko" && krwToUsd) return { value: Math.round(krw * krwToUsd).toLocaleString("en-US"), symbol: "$" };
    return null;
  })();

  const carName = `${manufacture} ${model} ${year}`;
  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent((WA_CAR_TEXT[lang] ?? WA_CAR_TEXT.ru)(id, carName))}`;

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(74,74,74,0.25)",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(255,69,0,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.3)"; }}
    >
      {/* Glossy overlay */}
      <div ref={glossyRef} className="absolute inset-0 z-20 pointer-events-none rounded-2xl transition-all duration-200" />

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: "var(--axis-graphite)" }}>
        <Image
          fill
          src={`https://ci.encar.com${photo}`}
          alt={`${manufacture} ${model} ${year} — ${BUY_FROM_KOREA[lang] ?? BUY_FROM_KOREA.ru}`}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/70 to-transparent" />
        {/* Year badge */}
        <div
          className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full text-white z-10"
          style={{ backgroundColor: "var(--axis-orange)" }}
        >
          {year}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold line-clamp-1 transition-colors" style={{ color: "var(--axis-white)" }}>
            {translateGenerationRow(model, t)}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--axis-gray)" }}>
            {translateGenerationRow(manufacture, t)}
          </p>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-5 py-3 border-y" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--axis-orange)" }}>+</span>
            <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
              {convertNumberKm(mileage)} {t("common:common.km")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--axis-orange)" }}>◎</span>
            <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
              {translateGenerationRow(fuel, t)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--axis-orange)" }}>⊞</span>
            <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
              {translateGenerationRow(transmission, t)}
            </span>
          </div>
        </div>

        {/* Price + Buttons */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--axis-gray)" }}>{t("common:car.buyPrice")}</p>
            <p className="text-xl font-bold tracking-tight" style={{ color: "var(--axis-orange)" }}>
              {convertNumber(price)}
              <span className="text-sm font-normal ml-1" style={{ color: "var(--axis-gray)" }}>
                {t("common:common.won")}
              </span>
            </p>
            {convertedPrice && (
              <p className="text-sm mt-0.5" style={{ color: "var(--axis-silver)" }}>
                ≈ {convertedPrice.value} {convertedPrice.symbol}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Telegram */}
            <a
              href={`https://t.me/KMOTORS_form_bot?start=car_${id}`}
              target="_blank" rel="noopener noreferrer"
              aria-label="Telegram"
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "rgba(34,158,217,0.15)", color: "#229ED9" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            {/* Details */}
            <Link
              href={`/${lang}/catalog/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--axis-orange)", color: "var(--axis-white)" }}
            >
              {t("common:car.details")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
