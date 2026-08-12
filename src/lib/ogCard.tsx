/**
 * Общая og-карточка 1200×630, из неё собраны все `opengraph-image.tsx`.
 *
 * Рисуется кодом через Satori (`next/og`), а не лежит картинкой в `public/`:
 * до 12.08.2026 на 13 маршрутах стоял `preview/preview.png` — скриншот старой
 * оранжевой темы с кнопками «Add to Cart» / «Buy Now», которых на сайте нет.
 *
 * ⚠️ Шрифт — дефолтный у Satori, своих мы не грузим. Кириллицу он держит
 * (проверено вживую 12.08.2026), а вот грузинский и арабский — нет, там будут
 * пустые квадраты. Поэтому `ogCopy` знает ровно два языка: ru и всё остальное
 * английским. Это тот же приём, что у калькулятора, где ka/ar рендерятся
 * английским через fallbackLng.
 *
 * ⚠️ Знак красится градиентом ЛОГОТИПА (#9D5E34 → #DA9A67), слово «K-Axis» —
 * светлым #F5F0EB. Красить слово бронзой нельзя: тонкие штрихи разваливаются
 * (см. «Бренд» в CLAUDE.md). Интерфейсный --axis-bronze здесь только у
 * подзаголовка и линий.
 */

import { ImageResponse } from "next/og";

const BLACK = "#0A0A0A";
const WHITE = "#F5F0EB";
const BRONZE = "#B67749";
const BRONZE_DEEP = "#9D5E34";
const BRONZE_LIGHT = "#DA9A67";
const MUTED = "#8A8A8A";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgCopy = { headline: string; sub: string; alt: string };

type Section = "home" | "catalog" | "parts" | "blog" | "calculator";

/**
 * Текст карточек. Держим строки здесь, а не в locales: у `opengraph-image`
 * нет инстанса i18next (он поднимается на запрос), ровно как у
 * `generateMetadata` карточки авто.
 */
const COPY: Record<Section, Record<"ru" | "en", OgCopy>> = {
  home: {
    ru: {
      headline: "Автомобили из Кореи",
      sub: "Hyundai · Kia · Genesis — прямые поставки из Южной Кореи",
      alt: "K-Axis — автомобили из Кореи",
    },
    en: {
      headline: "Cars from Korea",
      sub: "Hyundai · Kia · Genesis — direct supply from South Korea",
      alt: "K-Axis — cars from Korea",
    },
  },
  catalog: {
    ru: {
      headline: "Каталог авто из Кореи",
      sub: "Подбор с корейских площадок, проверка истории, доставка",
      alt: "K-Axis — каталог авто из Кореи",
    },
    en: {
      headline: "Korean car catalogue",
      sub: "Sourcing, history checks and door-to-door delivery",
      alt: "K-Axis — Korean car catalogue",
    },
  },
  parts: {
    ru: {
      headline: "Оригинальные запчасти",
      sub: "Hyundai · Kia · Genesis — оригинал из Кореи",
      alt: "K-Axis — оригинальные запчасти из Кореи",
    },
    en: {
      headline: "Genuine spare parts",
      sub: "Hyundai · Kia · Genesis — genuine parts from Korea",
      alt: "K-Axis — genuine Korean spare parts",
    },
  },
  blog: {
    ru: {
      headline: "Блог K-Axis",
      sub: "Как покупать авто из Кореи: цены, растаможка, модели",
      alt: "K-Axis — блог об авто из Кореи",
    },
    en: {
      headline: "K-Axis blog",
      sub: "Buying cars from Korea: prices, duties, model guides",
      alt: "K-Axis — blog about Korean cars",
    },
  },
  calculator: {
    ru: {
      headline: "Калькулятор растаможки",
      sub: "Расчёт платежей при ввозе авто — семь стран",
      alt: "K-Axis — калькулятор растаможки",
    },
    en: {
      headline: "Car import duty calculator",
      sub: "Import payments for seven countries, live exchange rates",
      alt: "K-Axis — car import duty calculator",
    },
  },
};

export function ogCopy(section: Section, lang?: string): OgCopy {
  return COPY[section][lang === "ru" ? "ru" : "en"];
}

/**
 * Готовый обработчик `opengraph-image.tsx` для сегмента под `[lang]`.
 *
 * ⚠️ Файл нужен В КАЖДОМ сегменте, чья страница объявляет свой `openGraph`.
 * Картинка файловой конвенции подмешивается в метаданные ТОГО сегмента, где
 * лежит файл, а собственный `openGraph` вложенной страницы заменяет
 * унаследованный объект целиком — вместе с картинкой. Проверено на проде-сборке
 * 12.08.2026: при файле только в `[lang]/` страницы `/ru/about`, `/ru/contact`,
 * `/ar/buy` отдавали og:title и og:url, но og:image не отдавали вовсе.
 * Добавляя странице `openGraph`, класть рядом и `opengraph-image.tsx`.
 */
export function makeOgRoute(section: Section) {
  return async function Image({
    params,
  }: {
    params: Promise<{ lang: string }>;
  }) {
    const { lang } = await params;
    return new ImageResponse(<OgCard {...ogCopy(section, lang)} />, { ...OG_SIZE });
  };
}

/** Знак Axis — геометрия 1:1 из public/logo/logo-mark.svg. */
function Mark({ height }: { height: number }) {
  const width = Math.round((height * 782) / 552);
  return (
    <svg width={width} height={height} viewBox="0 0 782 552" fill="none">
      <defs>
        <linearGradient id="mark" gradientUnits="userSpaceOnUse" x1="42" y1="582" x2="465" y2="2">
          <stop offset="0" stopColor={BRONZE_DEEP} />
          <stop offset="1" stopColor={BRONZE_LIGHT} />
        </linearGradient>
      </defs>
      <g fill="url(#mark)">
        <path d="M464.26 100.49 393.87 0.72 0.72 551.09 164.15 499.08Z" />
        <path d="M781.72 550.27 611.42 501.54 412.11 226.59 487.86 136.80Z" />
        <path d="M558.72 483.60 399.41 464.54 222.97 539.77 272.18 475.79 398.44 398.59Z" />
      </g>
    </svg>
  );
}

export function OgCard({ headline, sub }: OgCopy) {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: BLACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      {/* Бронзовая подсветка из левого верхнего угла.
          ⚠️ Именно linear-gradient, не radial: radial-gradient Satori растрит
          ступенями, и на карточке проступают концентрические кольца. Проверено
          рендером 12.08.2026. */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "1200px",
          height: "630px",
          background: `linear-gradient(125deg, rgba(182,119,73,0.22) 0%, rgba(182,119,73,0.05) 38%, rgba(10,10,10,0) 62%)`,
        }}
      />

      {/* Бронзовая полоса слева */}
      <div
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          width: "8px",
          height: "630px",
          background: `linear-gradient(to bottom, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
        }}
      />

      {/* Лок-ап: знак + слово */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px", marginBottom: "30px" }}>
        <Mark height={92} />
        <span
          style={{
            fontSize: "76px",
            fontWeight: 800,
            letterSpacing: "-2px",
            color: WHITE,
            lineHeight: 1,
          }}
        >
          K-Axis
        </span>
      </div>

      <div
        style={{
          width: "140px",
          height: "3px",
          background: `linear-gradient(to right, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
          marginBottom: "34px",
          borderRadius: "2px",
        }}
      />

      <div
        style={{
          fontSize: "44px",
          fontWeight: 600,
          color: WHITE,
          marginBottom: "20px",
          letterSpacing: "-0.5px",
          textAlign: "center",
          maxWidth: "1000px",
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontSize: "26px",
          color: MUTED,
          maxWidth: "820px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "36px",
          right: "48px",
          fontSize: "20px",
          color: BRONZE,
          letterSpacing: "0.5px",
        }}
      >
        kmotors.shop
      </div>
    </div>
  );
}
