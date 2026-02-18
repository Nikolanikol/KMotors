import type { Metadata } from "next";
import ContactClientPage from "./ContactClientPage";

export const metadata: Metadata = {
  title: "Контакты — KMotors | Корейские автомобили",
  description:
    "Свяжитесь с KMotors для заказа автомобиля из Южной Кореи. Telegram, WhatsApp, телефон. Отвечаем быстро.",
  openGraph: {
    title: "Контакты KMotors",
    description: "Свяжитесь с нами для заказа корейского автомобиля.",
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
