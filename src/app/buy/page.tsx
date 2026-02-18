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
  },
};

export default function BuyPage() {
  return <BuyClientPage />;
}
