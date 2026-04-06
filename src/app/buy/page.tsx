import type { Metadata } from "next";
import BuyClientPage from "./BuyClientPage";

export const metadata: Metadata = {
  title: "Как купить авто из Кореи — пошаговая инструкция | KMotors",
  description:
    "Пошаговая инструкция по покупке автомобиля из Южной Кореи под заказ через KMotors (кмоторс). Выбор модели, документы, оплата, доставка в Россию, Казахстан, Узбекистан, таможня.",
  keywords: [
    "как купить авто из Кореи",
    "покупка авто из Кореи",
    "авто из Кореи под заказ",
    "доставка авто из Кореи в Россию",
    "доставка авто из Кореи в Казахстан",
    "растаможка авто из Кореи",
    "пригнать авто из Кореи",
    "кмоторс купить авто",
  ],
  openGraph: {
    title: "Как купить авто из Кореи — пошаговая инструкция | KMotors",
    description:
      "Выбор, документы, доставка, таможня — полная инструкция по покупке корейского авто через KMotors.",
    url: "https://kmotors.shop/buy",
    images: [{ url: "https://kmotors.shop/preview/preview.png" }],
  },
  alternates: {
    canonical: "https://kmotors.shop/buy",
    languages: {
      ru: "https://kmotors.shop/buy",
      en: "https://kmotors.shop/buy",
      ko: "https://kmotors.shop/buy",
      ka: "https://kmotors.shop/buy",
      ar: "https://kmotors.shop/buy",
      "x-default": "https://kmotors.shop/buy",
    },
  },
};

export default function BuyPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Как купить автомобиль из Кореи?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Процесс состоит из 8 этапов: выбор автомобиля в каталоге, внесение задатка (2 000 000 вон), проверка и осмотр специалистом, оплата остатка, таможенное оформление, доставка морем, растаможивание, получение автомобиля.",
        },
      },
      {
        "@type": "Question",
        name: "Сколько стоит доставка авто из Кореи в Россию?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Стоимость доставки зависит от модели, года выпуска и пункта назначения. Доставка до Владивостока обычно занимает 7–14 дней. Свяжитесь с нами для точного расчёта.",
        },
      },
      {
        "@type": "Question",
        name: "Какой задаток нужно внести при заказе авто?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Задаток составляет 2 000 000 корейских вон. Все средства застрахованы и гарантированно вернутся, если автомобиль вам не подойдёт.",
        },
      },
      {
        "@type": "Question",
        name: "В какие страны вы доставляете автомобили из Кореи?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "KMotors осуществляет доставку в Россию, Казахстан, Узбекистан, Грузию и страны арабского мира. Свяжитесь с нами, чтобы узнать условия для вашей страны.",
        },
      },
      {
        "@type": "Question",
        name: "Можно ли проверить автомобиль перед покупкой?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Да. После внесения задатка наш специалист проводит полный осмотр автомобиля в Южной Корее и отправляет вам подробный фото- и видеоотчёт.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <BuyClientPage />
    </>
  );
}
