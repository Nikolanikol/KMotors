import type { Metadata } from "next";
import BuyClientPage from "./BuyClientPage";

export const metadata: Metadata = {
  title: "Как купить авто из Кореи — KMotors | Пошаговая инструкция",
  description:
    "Подробная инструкция по покупке автомобиля из Южной Кореи под заказ. Выбор модели, документы, оплата, доставка, таможня — всё пошагово.",
  openGraph: {
    title: "Как купить авто из Кореи — пошаговая инструкция",
    description:
      "Выбор, документы, доставка, таможня — полная инструкция по покупке корейского авто.",
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
