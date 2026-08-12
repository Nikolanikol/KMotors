/** @jsxRuntime automatic */
/** @jsxImportSource react */

/**
 * Общая og-карточка 1200×630, из неё собраны все `opengraph-image.tsx`.
 *
 * ⚠️ Директивы @jsxRuntime/@jsxImportSource сверху — не украшение. Файл
 * собирают ДВА разных инструмента: Next (там `jsx: "preserve"`, он всё делает
 * сам) и esbuild внутри tsx, когда `scripts/build-og-cards.tsx` импортирует
 * отсюда карточки. Без директив esbuild берёт классический трансформ, зовёт
 * `React.createElement`, а импорта React в файле нет — прогон падает с
 * `ReferenceError: React is not defined` (наступали 12.08.2026). Вторая
 * страховка — `include` в `scripts/tsconfig.json`.
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

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
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

/**
 * `fallback` — для страниц без своего сюжета: «о нас», контакты, партнёры,
 * «как купить». У них общий снимок главной и нейтральный текст.
 */
export type Section = "home" | "catalog" | "parts" | "blog" | "calculator" | "fallback";

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
  fallback: {
    ru: {
      headline: "Авто и запчасти из Кореи",
      sub: "Hyundai · Kia · Genesis — подбор, доставка, растаможка",
      alt: "K-Axis — авто и запчасти из Кореи",
    },
    en: {
      headline: "Korean cars and parts",
      sub: "Hyundai · Kia · Genesis — sourcing, delivery, customs",
      alt: "K-Axis — Korean cars and parts",
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
    return serve(section, lang);
  };
}

/** То же для сегментов без параметра `lang` (легаси `/blog/[slug]`, корень). */
export function makeStaticOgRoute(section: Section, lang: "ru" | "en") {
  return async function Image() {
    return serve(section, lang);
  };
}

/** Путь к собранной карточке. Собирает `scripts/build-og-cards.tsx`. */
function assetPath(section: Section, lang?: string) {
  return path.join(process.cwd(), "public/og", `${section}-${lang === "ru" ? "ru" : "en"}.jpg`);
}

/**
 * Отдаёт собранный JPEG, а если его нет — рисует текстовую карточку.
 *
 * Фолбэк не декоративный: пока картинка для раздела не собрана (или файл не
 * доехал в образ), маршрут обязан отдать ХОТЬ ЧТО-ТО. Пустой ответ здесь — это
 * ссылка без превью во всех мессенджерах сразу.
 */
async function serve(section: Section, lang?: string) {
  try {
    const buf = await readFile(assetPath(section, lang));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new ImageResponse(<OgCard {...ogCopy(section, lang)} />, { ...OG_SIZE });
  }
}

/**
 * Значение для `export const contentType` в файле маршрута — оно уходит в
 * `og:image:type`. Проверяем наличие собранного файла синхронно, на загрузке
 * модуля: тип обязан совпасть с тем, что реально отдаётся.
 */
export function ogContentType(section: Section): string {
  return existsSync(assetPath(section, "ru")) ? "image/jpeg" : OG_CONTENT_TYPE;
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

/** Панель со скриншотом: положение и размер в пикселях карточки 1200×630. */
export const PANEL = { left: 596, top: 62, width: 604, height: 506 };

/**
 * Карточка со СКРИНШОТОМ интерфейса. Тоже собирается заранее.
 *
 * ⚠️ Скриншот кладётся КРОПОМ, а не целиком. Уменьшенный до 1200×630 снимок
 * страницы — это и был `preview.png`: в превью мессенджера его ужимают ещё
 * втрое, и весь интерфейс превращается в кашу. Поэтому берётся кусок с парой
 * карточек авто в масштабе, близком к натуральному: название модели и цена
 * остаются различимы, а обрез по правому краю честно говорит, что список
 * продолжается.
 *
 * Кроп задаётся в `scripts/build-og-cards.tsx` в пикселях ИСХОДНИКА, а sharp
 * заранее приводит его ровно к размеру панели — поэтому здесь не нужен
 * `overflow: hidden`, с которым у Satori свои сложности.
 */
export function OgScreenshotCard({ headline, sub, shot }: OgCopy & { shot: string }) {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        position: "relative",
        background: BLACK,
        fontFamily: "sans-serif",
      }}
    >
      {/* Бронзовая подсветка за панелью — иначе панель висит в пустоте */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1200px",
          height: "630px",
          background:
            "linear-gradient(115deg, rgba(182,119,73,0.16) 0%, rgba(182,119,73,0.04) 40%, rgba(10,10,10,0) 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "8px",
          height: "630px",
          background: `linear-gradient(to bottom, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element -- Satori рисует
          картинку сам, next/image внутри ImageResponse не работает. */}
      <img
        src={shot}
        alt=""
        width={PANEL.width}
        height={PANEL.height}
        style={{
          position: "absolute",
          left: `${PANEL.left}px`,
          top: `${PANEL.top}px`,
          width: `${PANEL.width}px`,
          height: `${PANEL.height}px`,
          borderRadius: "16px",
          border: `1px solid rgba(182,119,73,0.45)`,
        }}
      />

      {/* Растушёвка левого края панели в чёрный, чтобы стык не был линейкой */}
      <div
        style={{
          position: "absolute",
          left: `${PANEL.left - 2}px`,
          top: `${PANEL.top}px`,
          width: "110px",
          height: `${PANEL.height}px`,
          background: `linear-gradient(90deg, ${BLACK} 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0) 100%)`,
        }}
      />

      <div style={{ position: "absolute", left: "72px", top: "150px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "30px" }}>
          <Mark height={58} />
          <span style={{ fontSize: "48px", fontWeight: 800, color: WHITE, letterSpacing: "-1.5px", lineHeight: 1 }}>
            K-Axis
          </span>
        </div>

        <div
          style={{
            width: "110px",
            height: "3px",
            background: `linear-gradient(to right, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
            marginBottom: "28px",
            borderRadius: "2px",
          }}
        />

        <div
          style={{
            fontSize: "46px",
            fontWeight: 700,
            color: WHITE,
            marginBottom: "16px",
            letterSpacing: "-1px",
            maxWidth: "470px",
            lineHeight: 1.1,
          }}
        >
          {headline}
        </div>

        <div style={{ fontSize: "23px", color: "#B9B0A8", maxWidth: "440px", lineHeight: 1.35 }}>{sub}</div>
      </div>

      <div style={{ position: "absolute", bottom: "34px", left: "72px", fontSize: "20px", color: BRONZE_LIGHT }}>
        kmotors.shop
      </div>
    </div>
  );
}

/**
 * Карточка с фотографией. Собирается ЗАРАНЕЕ скриптом `scripts/build-og-cards.tsx`
 * в JPEG, в рантайме не рендерится.
 *
 * ⚠️ Причина ровно одна и она арифметическая: `ImageResponse` умеет отдавать
 * только PNG, а PNG с фотографией весит 740–970 КБ (замерено 12.08.2026 на трёх
 * глубинах затемнения). Лимит превью у WhatsApp ~300 КБ — карточка просто не
 * показалась бы. Тот же кадр в JPEG q82 весит 55 КБ. Поэтому фото-карточки
 * лежат готовыми файлами в `public/og/`, а маршрут их отдаёт с диска.
 *
 * Текст прижат влево и лежит на непрозрачной части шторы: фото читается справа,
 * буквы не спорят с деталями кадра. Равномерное затемнение вместо шторы не
 * годится — чтобы текст стал читаемым, фото приходится глушить настолько, что
 * от него не остаётся смысла.
 */
export function OgPhotoCard({ headline, sub, photo }: OgCopy & { photo: string }) {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        position: "relative",
        background: BLACK,
        fontFamily: "sans-serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori рисует
          картинку сам, next/image внутри ImageResponse не работает. */}
      <img
        src={photo}
        alt=""
        width={1200}
        height={630}
        style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover" }}
      />

      {/* Штора слева направо */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1200px",
          height: "630px",
          background:
            "linear-gradient(90deg, #0A0A0A 0%, #0A0A0A 34%, rgba(10,10,10,0.88) 52%, rgba(10,10,10,0.58) 78%, rgba(10,10,10,0.34) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "8px",
          height: "630px",
          background: `linear-gradient(to bottom, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
        }}
      />

      <div style={{ position: "absolute", left: "72px", top: "148px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
          <Mark height={64} />
          <span style={{ fontSize: "54px", fontWeight: 800, color: WHITE, letterSpacing: "-1.5px", lineHeight: 1 }}>
            K-Axis
          </span>
        </div>

        <div
          style={{
            width: "120px",
            height: "3px",
            background: `linear-gradient(to right, ${BRONZE_DEEP}, ${BRONZE_LIGHT})`,
            marginBottom: "30px",
            borderRadius: "2px",
          }}
        />

        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: WHITE,
            marginBottom: "18px",
            letterSpacing: "-1px",
            maxWidth: "620px",
            lineHeight: 1.1,
          }}
        >
          {headline}
        </div>

        <div style={{ fontSize: "26px", color: "#B9B0A8", maxWidth: "560px", lineHeight: 1.35 }}>{sub}</div>
      </div>

      <div style={{ position: "absolute", bottom: "36px", right: "48px", fontSize: "20px", color: BRONZE_LIGHT }}>
        kmotors.shop
      </div>
    </div>
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
