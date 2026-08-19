"use client";
import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import Counter from "yet-another-react-lightbox/plugins/counter";
// БЕЗ этих стилей лайтбокс рендерится position:static и картинка вываливается
// в конец страницы (нет fixed-оверлея). Обязательны для полноэкранного режима.
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
// Список скриншотов общий с попапом отзывов на странице отслеживания.
import { REVIEW_SHOTS as SHOTS, type ReviewLang as Lang } from "@/data/reviews";

// Полноразмерные скрины (736×1600, ~130КБ каждый) грузятся только в лайтбоксе.
// В сетке next/image отдаёт превью шириной с плитку.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
  loading: () => null,
});

const UI: Record<
  Lang,
  { title: string; accent: string; subtitle: string; open: string }
> = {
  ru: {
    title: "Отзывы",
    accent: "клиентов",
    subtitle:
      "Скриншоты переписок в WhatsApp — как есть. Нажмите, чтобы прочитать целиком.",
    open: "Открыть",
  },
  en: {
    title: "Client",
    accent: "Reviews",
    subtitle:
      "WhatsApp chat screenshots, unedited. Tap to read the full conversation.",
    open: "Open",
  },
  ka: {
    title: "კლიენტების",
    accent: "შეფასებები",
    subtitle: "WhatsApp-ის მიმოწერის სქრინშოტები. დააჭირეთ სრულად წასაკითხად.",
    open: "გახსნა",
  },
  ar: {
    title: "آراء",
    accent: "العملاء",
    subtitle: "لقطات شاشة لمحادثات واتساب كما هي. اضغط لقراءة المحادثة كاملة.",
    open: "فتح",
  },
};

export default function Testimonials() {
  const { i18n } = useTranslation();
  const lang = (i18n.language as Lang) in UI ? (i18n.language as Lang) : "ru";
  const t = UI[lang];

  const [index, setIndex] = useState(-1);

  return (
    <section
      className="py-24 md:py-32"
      style={{ backgroundColor: "var(--axis-black)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <header className="mb-10 md:mb-14 text-center">
          <h2
            className="font-heading text-4xl md:text-6xl mb-4"
            style={{ color: "var(--axis-white)" }}
          >
            {t.title} <span className="text-gradient-orange">{t.accent}</span>
          </h2>
          <p
            className="text-sm md:text-base max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--axis-gray)" }}
          >
            {t.subtitle}
          </p>
        </header>

        {/* Горизонтальный слайдер — та же механика, что в Stage: нативная прокрутка,
            скрытый скроллбар, карточки фиксированной ширины. */}
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {SHOTS.map((shot, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${t.open}: ${shot.caption[lang]}`}
              className="group flex-shrink-0 w-[280px] rounded-2xl overflow-hidden cursor-pointer
                         text-left transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--axis-charcoal)",
                border: "1px solid rgba(182,119,73,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(182,119,73,0.5)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(182,119,73,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(182,119,73,0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="relative">
                {/* Скрин целиком, без кадрирования: пропорции исходника 736×1600. */}
                <Image
                  src={shot.src}
                  alt={shot.caption[lang]}
                  width={shot.w}
                  height={shot.h}
                  sizes="280px"
                  className="block w-full h-auto"
                />
                {/* Иконка «развернуть» — только на ховере/фокусе. */}
                <span
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center
                             opacity-0 scale-90 transition-all duration-300
                             group-hover:opacity-100 group-hover:scale-100
                             group-focus-visible:opacity-100 group-focus-visible:scale-100"
                  style={{
                    backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)",
                    color: "#fff",
                  }}
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </span>
              </div>

              <span
                className="block px-4 py-3.5 text-xs font-medium leading-snug"
                style={{
                  color: "var(--axis-white)",
                  borderTop: "1px solid rgba(74,74,74,0.3)",
                }}
              >
                {shot.caption[lang]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Монтируем только после клика — иначе чанк лайтбокса грузится сразу с главной. */}
      {index >= 0 && (
        <Lightbox
          open
          index={index}
          close={() => setIndex(-1)}
          slides={SHOTS.map((s) => ({ src: s.src, width: s.w, height: s.h }))}
          plugins={[Counter]}
          styles={{ container: { backgroundColor: "rgba(10,10,10,.96)" } }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </section>
  );
}
