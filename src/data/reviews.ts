/**
 * Скриншоты переписок с клиентами — единственный источник для всех мест,
 * где показываются отзывы (блок на главной и попап на странице отслеживания).
 *
 * До 19.08.2026 список был зашит внутрь `Home/Testimonials.tsx`, и в нём два
 * скриншота стояли дважды с разными подписями: на листающемся слайдере это
 * терялось, в попапе бросалось бы в глаза.
 *
 * Файлы лежат в `public/review/`. Размеры исходников РАЗНЫЕ (736×1600 и
 * 942×2048 — скрины с разных телефонов), поэтому идут в данных: next/image
 * без них не сможет зарезервировать место и вёрстка прыгнет при загрузке.
 */

export type ReviewLang = "ru" | "en" | "ka" | "ar";

export type ReviewShot = {
  src: string;
  w: number;
  h: number;
  /** Подпись под плиткой. Артикулы одинаковы во всех языках, поэтому в тексте. */
  caption: Record<ReviewLang, string>;
};

export const REVIEW_SHOTS: ReviewShot[] = [
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
      ru: "Отзыв · Дженезис купе, выхлоп в Германию",
      en: "Review · Genesis coupe exhaust in Germany",
      ka: "შეფასება · Genesis coupe exhaust in Germany",
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
      ka: "გაგზავნა · Rear diffuser in Germany",
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
      ka: "გაგზავნა · Rear transmission in Dominican Republic",
      ar: "شحن · Rear transmission in Dominican Republic",
    },
  },
  {
    src: "/review/63ecba40-64cc-44d3-8cff-6962405b5af1.jpg",
    w: 942,
    h: 2048,
    caption: {
      ru: "Отправка · Хендай Дженезис, выхлоп в Германию срочно",
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
      ru: "Хендай Старекс, масляные поддоны в Германию",
      en: "Hyundai Starex oil pan in Germany",
      ka: "Hyundai Starex oil pan in Germany",
      ar: "Hyundai Starex oil pan in Germany",
    },
  },
  {
    src: "/review/dce90a3c-68d6-46e3-9809-e51a8a54d783.jpg",
    w: 736,
    h: 1600,
    caption: {
      ru: "Редуктор · Доминикана",
      en: "Transmission · Dominican Republic",
      ka: "Transmission · Dominican Republic",
      ar: "Transmission · Dominican Republic",
    },
  },
];

export const reviewLang = (lang: string): ReviewLang =>
  lang === "en" || lang === "ka" || lang === "ar" ? lang : "ru";
