"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { encarLoader, encarThumbLoader } from "@/utils/encarLoader";

// Лайтбокс (вместе с плагинами и их CSS) грузим только когда пользователь
// кликнул на фото. Монтируем по клику ещё и потому, что ssr:false-компонент,
// отсутствующий в дереве и на сервере, и при гидрации, не сдвигает radix useId
// у соседних компонентов.
const GalleryLightbox = dynamic(() => import("./GalleryLightbox"), {
  ssr: false,
  loading: () => null,
});

interface Photo {
  code: string;
  path: string;
  desc: string;
  updateDateTime: string;
  type: string;
}

interface Props {
  photos: Photo[] | string[];
  mode?: string;
  carName?: string;
  photoLabel?: string;
}

const ENCAR_CDN = "https://ci.encar.com";
// Порог свайпа: ниже него жест считается тапом и открывает галерею.
const SWIPE_PX = 40;
// Ступенька 320 — не для слайда, а для ЛЕНТЫ лайтбокса: плагин Thumbnails
// рисует те же slides в плитках 80×50 и берёт из srcSet самую маленькую
// ступеньку. Без 320 на каждую плитку уезжало по 640px-фото (~32 КБ вместо
// ~10 КБ). Замерено в дев-сборке: sizes="80px", currentSrc с cw=640.
const LIGHTBOX_WIDTHS = [320, 640, 960, 1280, 1600, 1920];

// ⚠️ Мастер-файл у Encar — 2200×1238, то есть 16:9 (замерено curl'ом по всем
// типам кадров: OUTER, INNER, OPTION). Полноэкранные слайды просим тем же
// соотношением: прежние 16:10 срезали ~10% ширины, и в лайтбоксе — там, где
// покупатель как раз рассматривает машину, — кадр был подрезан с боков.
const slideUrl = (base: string, w: number) => {
  const h = Math.round(w * 0.5625);
  return `${base}?impolicy=heightRate&rh=${h}&cw=${w}&ch=${h}&cg=Center`;
};

const CarouselLight = ({
  photos,
  mode,
  carName,
  photoLabel = "фото",
}: Props) => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [warm, setWarm] = useState(false);

  const warmed = useRef(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const total = photos?.length || 0;

  const getUrl = useCallback(
    (photo: Photo | string) => {
      if (mode === "static" || typeof photo === "string") return photo as string;
      // Базовый URL без параметров — размер добавит loader.
      return `${ENCAR_CDN}${(photo as Photo).path}`;
    },
    [mode],
  );

  // Соседние кадры монтируются НЕ сразу. Окно предзагрузки держит листание
  // мгновенным, но на первой отрисовке это три полноразмерных фото в вьюпорте
  // (~300 КБ при DPR 2) ради действия, которое совершит меньшинство. Ждём
  // простоя после первой отрисовки или первого действия — дальше как раньше.
  const warmUp = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    setWarm(true);
  }, []);

  // ⚠️ Прогрев вешать на onLoad первой картинки НЕЛЬЗЯ: к моменту гидрации она
  // обычно уже complete, событие не повторяется, и окно не открывалось бы
  // вовсе (проверено в дев-сборке — 20 секунд на странице, один смонтированный
  // кадр). Поэтому таймер простоя, а не событие загрузки.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("requestIdleCallback" in window)) {
      const id = setTimeout(warmUp, 1500);
      return () => clearTimeout(id);
    }
    const id = window.requestIdleCallback(warmUp, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }, [warmUp]);

  const goTo = useCallback(
    (i: number) => {
      warmUp();
      setIndex(Math.max(0, Math.min(total - 1, i)));
    },
    [total, warmUp],
  );

  const slides = useMemo(
    () =>
      (photos || []).map((photo, i) => {
        const base = getUrl(photo);
        const alt = carName
          ? `${carName} — ${photoLabel} ${i + 1}`
          : `photo ${i + 1}`;
        // Не-encar источники (static/строки) отдаём как есть, без параметров.
        if (!base.startsWith(ENCAR_CDN)) {
          return { src: base, alt, width: 1920, height: 1080 };
        }
        return {
          src: slideUrl(base, 1280), // фолбэк для браузеров без srcSet
          alt,
          width: 1920,
          height: 1080,
          srcSet: LIGHTBOX_WIDTHS.map((w) => ({
            src: slideUrl(base, w),
            width: w,
            height: Math.round(w * 0.5625),
          })),
        };
      }),
    [photos, getUrl, carName, photoLabel],
  );

  // Окно предзагрузки: назад 1, вперёд 2. Соседние фото уже смонтированы и
  // закэшированы → листание стрелками мгновенное, без «мелькания» и залипания.
  const windowIdx = useMemo(
    () =>
      warm
        ? Array.from(new Set([index - 1, index, index + 1, index + 2])).filter(
            (i) => i >= 0 && i < total,
          )
        : [index],
    [warm, index, total],
  );

  // Активная миниатюра подкручивается в ленту сама: листая стрелками или
  // свайпом, пользователь иначе терял её из виду. Крутим САМУ ленту, а не
  // scrollIntoView — тот утягивает и страницу по вертикали, когда галерея
  // видна не целиком.
  useEffect(() => {
    const strip = stripRef.current;
    const btn = thumbRefs.current[index];
    if (!strip || !btn) return;
    const target = btn.offsetLeft - (strip.clientWidth - btn.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [index]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      // Гасим последующий click, иначе свайп открывал бы лайтбокс.
      swiped.current = true;
      goTo(index + (dx < 0 ? 1 : -1));
    }
  };

  const handleClick = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setOpen(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-zoom-in group"
        style={{
          aspectRatio: "16/10",
          backgroundColor: "var(--axis-graphite)",
          // Горизонталь забираем под свайп, вертикаль оставляем странице.
          touchAction: "pan-y",
        }}
        role="button"
        tabIndex={0}
        aria-label={t("car.gallery.open")}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {windowIdx.map((i) => (
          <Image
            key={i}
            loader={encarLoader}
            src={getUrl(photos[i])}
            alt={
              carName
                ? `${carName} — ${photoLabel} ${i + 1}`
                : `photo ${i + 1}`
            }
            fill
            className="object-cover transition-opacity duration-300 pointer-events-none"
            style={{ opacity: i === index ? 1 : 0 }}
            /* На lg включается сетка 340px_1fr_300px, и средняя колонка — это
               552px при вьюпорте 1280 и максимум 600px на широких экранах
               (контент ограничен max-w-7xl). Прежние 60vw объявляли 768px, то
               есть на 39% больше реального контейнера: при DPR 2 браузер просил
               1536 и брал ступеньку 1920 (211 КБ) вместо 1200 (100 КБ).
               Мобильная ветка остаётся 100vw — там замер показал точное
               попадание (343px → cw=750). */
            sizes="(max-width: 1023px) 100vw, 600px"
            priority={i === 0}
            draggable={false}
          />
        ))}

        {/* Counter */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold z-10"
          style={{
            backgroundColor: "rgba(10,10,10,0.7)",
            color: "var(--axis-white)",
            backdropFilter: "blur(8px)",
          }}
        >
          {index + 1} / {total}
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label={t("car.gallery.prev")}
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              disabled={index === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100"
              style={{
                backgroundColor: "rgba(10,10,10,0.7)",
                color: "white",
                backdropFilter: "blur(8px)",
                opacity: index === 0 ? 0.3 : undefined,
                fontSize: 22,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={t("car.gallery.next")}
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              disabled={index === total - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100"
              style={{
                backgroundColor: "rgba(10,10,10,0.7)",
                color: "white",
                backdropFilter: "blur(8px)",
                opacity: index === total - 1 ? 0.3 : undefined,
                fontSize: 22,
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Expand hint */}
        <div
          className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{
            backgroundColor: "rgba(10,10,10,0.7)",
            color: "var(--axis-gray)",
            backdropFilter: "blur(8px)",
          }}
        >
          ⛶ {t("car.gallery.open")}
        </div>
      </div>

      {/* Thumbnails strip */}
      {total > 1 && (
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide mt-2 pb-1"
        >
          {(photos as Photo[]).map((photo, i) => (
            <button
              key={i}
              type="button"
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              onClick={() => goTo(i)}
              aria-label={`${photoLabel} ${i + 1}`}
              aria-current={i === index}
              className="relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
              style={{
                width: 90,
                height: 60,
                outline:
                  i === index
                    ? "2px solid var(--axis-orange)"
                    : "2px solid transparent",
                opacity: i === index ? 1 : 0.5,
              }}
            >
              <Image
                loader={encarThumbLoader}
                src={getUrl(photo)}
                alt=""
                fill
                className="object-cover"
                sizes="90px"
              />
            </button>
          ))}
        </div>
      )}

      {open && (
        <GalleryLightbox
          slides={slides}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setOpen(false)}
          closeLabel={t("car.gallery.close")}
        />
      )}
    </>
  );
};

export default CarouselLight;
