import type { Metadata } from "next";
import ContactClientPage from "./ContactClientPage";

export const metadata: Metadata = {
  title: "Контакты KMotors — заказать авто из Кореи",
  description:
    "Свяжитесь с KMotors (кмоторс) для заказа автомобиля из Южной Кореи. Telegram, WhatsApp, телефон. Доставка в Россию, Казахстан, Узбекистан. Отвечаем быстро.",
  keywords: [
    "контакты кмоторс",
    "заказать авто из Кореи",
    "kmotors контакты",
    "купить авто из Кореи",
    "доставка авто из Кореи",
  ],
  openGraph: {
    title: "Контакты KMotors — заказать авто из Кореи",
    description:
      "Свяжитесь с нами для заказа корейского автомобиля. Telegram, WhatsApp, телефон.",
    url: "https://kmotors.shop/contact",
    images: [{ url: "https://kmotors.shop/preview/preview.png" }],
  },
  alternates: {
    canonical: "https://kmotors.shop/contact",
    languages: {
      ru: "https://kmotors.shop/contact",
      en: "https://kmotors.shop/contact",
      ko: "https://kmotors.shop/contact",
      ka: "https://kmotors.shop/contact",
      ar: "https://kmotors.shop/contact",
      "x-default": "https://kmotors.shop/contact",
    },
  },
};

export default function ContactPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Как связаться с KMotors?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Вы можете связаться с нами через Telegram, WhatsApp или по телефону. Заполните форму на сайте — менеджер ответит в ближайшее время.",
        },
      },
      {
        "@type": "Question",
        name: "Как быстро вы отвечаете на заявки?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Мы стараемся отвечать в течение нескольких часов. В рабочее время ответ приходит, как правило, в течение 30 минут.",
        },
      },
      {
        "@type": "Question",
        name: "Можно ли заказать подбор автомобиля под мои требования?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Да. Напишите нам желаемую марку, модель, год выпуска и бюджет — наш специалист подберёт подходящие варианты из Южной Кореи.",
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
      <ContactClientPage />
    </>
  );
}
