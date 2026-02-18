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
  },
};

export default function ContactPage() {
  return <ContactClientPage />;
}
