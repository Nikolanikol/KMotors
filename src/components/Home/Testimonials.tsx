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

// Полноразмерные скрины (736×1600, ~130КБ каждый) грузятся только в лайтбоксе.
// В сетке next/image отдаёт превью шириной с плитку.
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
  loading: () => null,
});

type Lang = "ru" | "en" | "ka" | "ar";

type Shot = {
  src: string;
  /** Размеры исходника — у скринов с разных телефонов они разные (736×1600 и 942×2048). */
  w: number;
  h: number;
  /** Подпись под плиткой. Артикулы одинаковы во всех языках, поэтому в тексте. */
  caption: Record<Lang, string>;
};

// Первыми — два скрина с развёрнутым отзывом, дальше подтверждения отправки.
const SHOTS: Shot[] = [
  {
    src: "/review/0a843af4-fde7-4c4a-811c-ffdf59752f93.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Отзыв · Доминиканская Республика",
      en: "Review · Dominican Republic",
      ka: "შეფასება · დომინიკის რესპუბლიკა",
      ar: "رأي · جمهورية الدومينيكان",
    },
  },
  {
    src: "/review/de04a340-66b6-4e94-a794-8b65b7108972.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Отзыв · Дженезис купе выхлоп в Германию",
      en: "Review · Genesis coupe exhaust in Germany",
      ka: "შეფასება · გენეს კუპე ვისხული გერმანისთვის",
      ar: "رأي · Genesis coupe exhaust in Germany",
    },
  },
  {
    // Та же переписка, что в 4cd2727f, но в кадр попали и реплика клиента, и артикул.
    src: "/review/7cbeb9b2-1ce8-48b0-a6ce-bdafcc65323e.jpg",
    w: 942,
    h: 2048,
    caption: {
      ru: "Отправка · Муфта для рулевой в Германию",
      en: "Shipped · Rear diffuser in Germany",
      ka: "გაგზავნა · მუფრესი რელევისთვის გერმანისთვის",
      ar: "شحن · Rear diffuser in Germany",
    },
  },
  {
    src: "/review/66129b68-43f1-4d7a-8019-65fb9c541a50.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Отправка · Задний редуктор в Доминикану",
      en: "Shipped · Rear transmission in Dominican Republic",
      ka: "გაგზავნა · Rear transmission in Dominican Republic ",
      ar: "شحن · Rear transmission in Dominican Republic AA0",
    },
  },
  {
    src: "/review/63ecba40-64cc-44d3-8cff-6962405b5af1.jpg",
    w: 942,
    h: 2048,
    caption: {
      ru: "Отправка · Хендай Дженезис выхлоп в Германию срочная отправка ",
      en: "Shipped · Genesis coupe exhaust in Germany",
      ka: "გაგზავნა · Genesis coupe exhaust in Germany",
      ar: "شحن · Genesis coupe exhaust in Germany",
    },
  },
  {
    src: "/review/81384b35-f820-49de-b486-f8697b3c0400.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Хендай Старекс маслянные подддоны в Германию",
      en: "Hyundai Starex oil pan in Germany",
      ka: "ხენდაიური სტარეკი მასკული გერმანისთვის",
      ar: "Hyundai Starex oil pan in Germany",
    },
  },
  {
    src: "/review/dce90a3c-68d6-46e3-9809-e51a8a54d783.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Редуктор Доминикана",
      en: "Transmission Dominican Republic",
      ka: "Transmission Dominican Republic",
      ar: "Transmission Dominican Republic",
    },
  },
  {
    src: "/review/de04a340-66b6-4e94-a794-8b65b7108972.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Отзыв Германия",
      en: "Review Germany",
      ka: " Review Germany",
      ar: " Review Germany",
    },
  },
  {
    src: "/review/0a843af4-fde7-4c4a-811c-ffdf59752f93.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Отзыв Доминикана",
      en: "Review Dominican Republic",
      ka: " Review Dominican Republic",
      ar: " Review Dominican Republic",
    },
  },
];

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
