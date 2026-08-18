"use client";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";

/**
 * Кросс-промо второго магазина — caranalizer.com (б/у оптика с корейских
 * авторазборок). Обратная половина обмена: у них наверху уже стоит янтарная
 * полоса на kmotors.shop с utm_source=caranalizer&utm_medium=topbar.
 *
 * Стоит ПОЛОСОЙ ВО ВСЮ ШИРИНУ контейнера под хиро-контентом, а не карточкой
 * сбоку: хиро центрированный (бейдж, H1, поиск, статистика — всё по одной оси),
 * и блок, прижатый вправо, ломал композицию и не попадал ни на одну линию сетки.
 *
 * Цвета — чужие, из палитры caranalizer; стили в globals.css (.cz-*).
 *
 * Показывается только на ru и en (решение владельца): витрина партнёра целиком
 * на русском и в рублях, для ka/ar клик мёртвый. Гейт стоит по i18n.language,
 * поэтому ключи заведены только в ru/en.
 */

const HREF =
  "https://caranalizer.com/ru/zapchasti?utm_source=kaxis&utm_medium=parts_hero&utm_campaign=cross";

/** Системная настройка «меньше движения» — наклон и блик тогда не включаем. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function UsedPartsPromo({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation();

  const cardRef = useRef<HTMLAnchorElement>(null);
  const glossRef = useRef<HTMLSpanElement>(null);

  // Тот же эффект, что у карточек авто (CarCard): наклон в перспективе за
  // курсором + блик, привязанный к его позиции. Коэффициенты НОРМИРОВАНЫ по
  // размеру блока, а не взяты из CarCard как есть: там наклон считается от
  // пикселей до центра, и на полосе в 1232px это дало бы ~15° — баннер
  // выворачивало бы вместе с текстом.
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    const gloss = glossRef.current;
    if (!card || !gloss || prefersReducedMotion()) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.transform = `perspective(1200px) rotateX(${(0.5 - py) * 4}deg) rotateY(${
      (px - 0.5) * 4
    }deg) scale3d(1.008, 1.008, 1.008)`;
    gloss.style.background = `radial-gradient(340px circle at ${px * 100}% ${
      py * 100
    }%, rgba(255,255,255,0.10) 0%, rgba(251,191,36,0.06) 35%, transparent 65%)`;
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion()) return;
    e.currentTarget.style.boxShadow = "0 26px 70px -30px rgba(245,158,11,0.45)";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const gloss = glossRef.current;
    if (card) {
      card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      card.style.boxShadow = "";
    }
    if (gloss) gloss.style.background = "transparent";
  }, []);

  if (i18n.language !== "ru" && i18n.language !== "en") return null;

  const onClick = () => {
    trackEvent("cross_sell_click", { store: "caranalizer", placement: "parts_hero" });
    clarityEvent("cross_sell_caranalizer");
  };

  return (
    <a
      ref={cardRef}
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`cz-banner group relative block overflow-hidden rounded-2xl border text-left shadow-[0_24px_60px_-32px_rgba(0,0,0,0.95)] ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transition:
          "transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease, border-color 0.3s ease",
      }}
    >
      <span className="cz-orb cz-orb-amber" aria-hidden="true" />
      <span className="cz-orb cz-orb-blue" aria-hidden="true" />
      <span className="cz-shine" aria-hidden="true" />
      {/* Блик за курсором — рисуется поверх содержимого, клики не перехватывает */}
      <span
        ref={glossRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl transition-[background] duration-200"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:gap-6 sm:p-7 lg:flex-row lg:items-center lg:gap-10">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* Подпись логотипа: у них «Car» синий, «analizer» светлый */}
            <span className="text-[15px] font-bold tracking-tight">
              <span className="text-[#60a5fa]">Car</span>
              <span className="text-[#f8fafc]">analizer</span>
            </span>
            <span className="rounded-full border border-[#f59e0b]/50 bg-[#f59e0b]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#fbbf24]">
              {t("parts.crossSell.badge")}
            </span>
          </div>

          <h2 className="mt-3 text-[17px] font-bold leading-snug text-[#f8fafc] sm:text-[26px] sm:leading-tight">
            {t("parts.crossSell.title")}
          </h2>
          {/* На телефоне описание съедает пол-экрана до каталога — там баннер
              держится на заголовке, фактах и кнопке */}
          <p className="mt-2 hidden max-w-[70ch] text-[13px] leading-relaxed text-[#94a3b8] sm:block sm:text-sm">
            {t("parts.crossSell.text")}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#94a3b8]">
            <Fact value="900+" label={t("parts.crossSell.factItems")} />
            <Fact value="30" label={t("parts.crossSell.factBrands")} />
            <Fact
              value={t("parts.crossSell.factDelivery")}
              label={t("parts.crossSell.factDeliveryNote")}
            />
          </div>
        </div>

        <div className="shrink-0 lg:w-[260px]">
          <span className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#fbbf24_0%,#f59e0b_45%,#d97706_100%)] px-6 text-[15px] font-bold text-[#0b0f1a] shadow-[0_14px_30px_-14px_rgba(245,158,11,0.95)] transition-[filter,transform] group-hover:brightness-110">
            {t("parts.crossSell.cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
          </span>
          <span className="mt-2 block text-center text-[11px] text-[#64748b]">caranalizer.com</span>
        </div>
      </div>
    </a>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[14px] font-bold text-[#fbbf24]">{value}</span>
      {label}
    </span>
  );
}
