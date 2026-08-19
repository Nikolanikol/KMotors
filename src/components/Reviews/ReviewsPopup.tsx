"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { MessageSquareQuote, X } from "lucide-react";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { REVIEW_SHOTS, reviewLang } from "@/data/reviews";

/**
 * Круглая пульсирующая кнопка «Отзывы» и попап, куда скриншоты переписок
 * влетают с разных сторон с поворотом.
 *
 * Смысл в месте: человек пришёл посмотреть, где его посылка, — это самый
 * доверчивый момент разговора. Отзывы рядом с трек-номером работают лучше,
 * чем те же отзывы на главной, куда он больше не вернётся.
 *
 * ⚠️ Ни картинки, ни GSAP, ни лайтбокс не грузятся, пока кнопку не нажали.
 * Страница отслеживания — рабочий инструмент, и платить за декорацию она не
 * должна. GSAP в зависимостях проекта лежал неиспользованным; здесь он
 * подключается динамическим импортом ВНУТРИ обработчика открытия.
 */

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
  loading: () => null,
});

/**
 * Остаточный наклон карточек после приземления — то, что делает кучу «живой».
 * Значения зашиты, а не случайны: при случайных числах карточка меняла бы
 * наклон на каждом ре-рендере, а на сервере и клиенте они бы не совпали.
 */
const TILT = [-4, 3, -2.5, 5, -3.5, 2, -5];

export default function ReviewsPopup() {
  const { t, i18n } = useTranslation();
  const lang = reviewLang(i18n.language);

  const [open, setOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape закрывает — сначала лайтбокс (он свой обработчик ставит сам),
  // потом попап.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex < 0) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lightboxIndex]);

  // Блокировка прокрутки страницы под попапом. Возвращаем прежнее значение,
  // а не пустую строку: под попапом может быть уже заблокированный body.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Разлёт карточек. gsap.context() собирает все твины и снимает их одним
  // revert() — без него анимация переживёт закрытие и оставит на элементах
  // свои inline-стили.
  useEffect(() => {
    if (!open || !gridRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    void (async () => {
      const { gsap } = await import("gsap");
      if (cancelled || !gridRef.current) return;

      ctx = gsap.context(() => {
        gsap.from("[data-review-card]", {
          x: () => gsap.utils.random(-700, 700),
          y: () => gsap.utils.random(-600, 600),
          rotation: () => gsap.utils.random(-120, 120),
          scale: 0.3,
          opacity: 0,
          duration: 0.85,
          ease: "back.out(1.4)",
          stagger: { each: 0.07, from: "random" },
        });
      }, gridRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [open]);

  const close = useCallback(() => {
    setLightboxIndex(-1);
    setOpen(false);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="group relative flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full bg-[image:var(--axis-bronze-fill)] text-white shadow-[0_10px_30px_rgba(182,119,73,0.35)] transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--axis-bronze)]"
        >
          {/* Пульсирующее кольцо. motion-reduce его убирает — бесконечная
              анимация относится ровно к тому, от чего эта настройка защищает. */}
          <span
            className="absolute inset-0 animate-ping rounded-full border border-[var(--axis-bronze)] opacity-60 motion-reduce:hidden"
            aria-hidden
          />
          <MessageSquareQuote className="h-6 w-6" strokeWidth={2} />
          <span className="text-xs font-semibold">{t("tracking.reviews.button")}</span>
        </button>
        <p className="max-w-xs text-center text-xs text-[var(--axis-gray-dim)]">
          {t("tracking.reviews.hint")}
        </p>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("tracking.reviews.title")}
          className="fixed inset-0 z-[70] overflow-y-auto bg-[rgba(10,10,10,0.96)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
            <header className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--axis-white)] sm:text-3xl">
                  {t("tracking.reviews.title")}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm text-[var(--axis-gray)]">
                  {t("tracking.reviews.subtitle")}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={t("tracking.reviews.close")}
                className="shrink-0 rounded-full border border-white/10 p-2 text-[var(--axis-gray)] transition-colors hover:border-[var(--axis-bronze)]/50 hover:text-[var(--axis-white)]"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {REVIEW_SHOTS.map((shot, i) => (
                <button
                  key={shot.src}
                  data-review-card
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  style={{ rotate: `${TILT[i % TILT.length]}deg` }}
                  className="group overflow-hidden rounded-2xl border border-[var(--axis-bronze)]/20 bg-[var(--axis-charcoal)] text-left transition-transform duration-300 hover:!rotate-0 hover:scale-[1.03]"
                >
                  <Image
                    src={shot.src}
                    alt={shot.caption[lang]}
                    width={shot.w}
                    height={shot.h}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                    className="block h-auto w-full"
                  />
                  <span className="block border-t border-[rgba(74,74,74,0.3)] px-3 py-2.5 text-[11px] font-medium leading-snug text-[var(--axis-white)]">
                    {shot.caption[lang]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxIndex >= 0 && (
        <Lightbox
          open
          index={lightboxIndex}
          close={() => setLightboxIndex(-1)}
          slides={REVIEW_SHOTS.map((s) => ({ src: s.src, width: s.w, height: s.h }))}
          plugins={[Counter]}
          styles={{ container: { backgroundColor: "rgba(10,10,10,.98)" } }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </>
  );
}
