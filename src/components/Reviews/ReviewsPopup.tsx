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
        const cards = gsap.utils.toArray<HTMLElement>("[data-review-card]");
        // Подсказка компоновщику: карточек дюжина, и без неё браузер
        // перерисовывает их на CPU — на слабом телефоне это и есть «дёргается».
        //
        // Снимается после приземления: двенадцать вечных слоёв на GPU — ровно
        // то, от чего will-change предостерегают.
        const setWillChange = (value: string) =>
          cards.forEach((card) => {
            card.style.willChange = value;
          });
        setWillChange("transform");

        // Разлёт и проявление разведены на два твина НАМЕРЕННО. Одним твином
        // прозрачность тянется всю дорогу, и карточка половину полёта висит
        // полупрозрачной — глаз читает это как мерцание. Проявляется быстро,
        // летит долго.
        const stagger = { each: 0.045, from: "random" as const };

        // ⚠️ fromTo, а не from, и остаточный наклон задан КОНЕЧНЫМ значением.
        // GSAP сводит отдельные CSS-свойства rotate/translate/scale в общий
        // transform и проставляет им `rotate: none` — наклон, выставленный
        // стилем на элементе, он затирает. С `from` карточки приземлялись бы
        // идеально ровными, и вся «куча» превращалась бы в строгую сетку.
        gsap.fromTo(
          cards,
          {
            x: () => gsap.utils.random(-380, 380),
            y: () => gsap.utils.random(-300, 300),
            rotation: () => gsap.utils.random(-42, 42),
            scale: 0.78,
          },
          {
            x: 0,
            y: 0,
            rotation: (_i: number, el: HTMLElement) => Number(el.dataset.tilt ?? 0),
            scale: 1,
            duration: 1.05,
            // power3.out — торможение без отскока. back.out(1.4) стоял здесь
            // раньше и давал перелёт с возвратом: он-то и читался как рывок.
            ease: "power3.out",
            stagger,
            onComplete: () => setWillChange("auto"),
          }
        );

        gsap.from(cards, {
          opacity: 0,
          duration: 0.45,
          ease: "power1.out",
          stagger,
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
          {/* Пульсирующее кольцо. Штатный animate-ping идёт за секунду и
              выглядит как резкий хлопок — растягиваем до 2.5с, получается
              спокойное дыхание. motion-reduce убирает его совсем: бесконечная
              анимация — ровно то, от чего эта настройка защищает. */}
          <span
            className="absolute inset-0 animate-ping rounded-full border border-[var(--axis-bronze)] opacity-60 [animation-duration:2.5s] motion-reduce:hidden"
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
          /* Подложка проявляется, а не возникает: раньше попап включался
             мгновенно, и разлёт карточек начинался на уже готовом чёрном
             фоне — вместе это и давало ощущение рывка. */
          className="fixed inset-0 z-[70] overflow-y-auto bg-[rgba(10,10,10,0.96)] backdrop-blur-sm animate-in fade-in-0 duration-300 motion-reduce:animate-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
            <header className="mb-8 flex items-start justify-between gap-4 animate-in fade-in-0 slide-in-from-top-2 duration-500 motion-reduce:animate-none">
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
                  /* Наклон задан transform'ом и продублирован в data-tilt:
                     стиль работает, пока GSAP не загрузился (и при отключённой
                     анимации), а data-tilt — то же число для конечной точки
                     твина. Ховер-масштаб живёт на вложенном узле: transform
                     внешнего принадлежит GSAP, и CSS дралась бы с ним за него. */
                  data-tilt={TILT[i % TILT.length]}
                  style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
                  className="group cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--axis-bronze)]/20 bg-[var(--axis-charcoal)] text-left transition-colors duration-300 hover:border-[var(--axis-bronze)]/60"
                >
                 <span className="block transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                  <Image
                    src={shot.src}
                    alt={shot.caption[lang]}
                    width={shot.w}
                    height={shot.h}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                    /* Первый экран грузим сразу: иначе карточки летят пустыми
                       прямоугольниками, а картинки проявляются уже после
                       приземления — самая заметная часть «дёрганья». */
                    loading={i < 6 ? "eager" : "lazy"}
                    className="block h-auto w-full"
                  />
                  <span className="block border-t border-[rgba(74,74,74,0.3)] px-3 py-2.5 text-[11px] font-medium leading-snug text-[var(--axis-white)]">
                    {shot.caption[lang]}
                  </span>
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
