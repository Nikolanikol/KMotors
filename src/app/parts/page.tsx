import type { Metadata } from "next";

import { Hero } from "./sections/Hero";
import { Catalog } from "./sections/Catalog";
import { Products } from "./sections/Products";
import { About } from "./sections/About";
import { ContactForm } from "./sections/ContactForm";

export const metadata: Metadata = {
  title: "Оригинальные запчасти из Кореи — Hyundai, Kia, Genesis | Kmotors",
  description:
    "Оригинальные запчасти из Южной Кореи с доставкой. Двигатели, подвеска, кузов, тормоза, электрика для Hyundai, Kia, Genesis. Гарантия качества, прямые поставки.",
  openGraph: {
    title: "Оригинальные запчасти из Кореи — Hyundai, Kia, Genesis",
    description:
      "Оригинальные запчасти из Южной Кореи с доставкой. Hyundai, Kia, Genesis. Гарантия качества.",
    url: "https://kmotors.shop/parts",
    siteName: "Kmotors",
    images: [
      {
        url: "https://kmotors.shop/preview/preview.png",
        width: 1200,
        height: 630,
        alt: "Оригинальные запчасти из Кореи — Kmotors",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  alternates: {
    canonical: "https://kmotors.shop/parts",
    languages: {
      ru: "https://kmotors.shop/parts",
      en: "https://kmotors.shop/parts",
      ko: "https://kmotors.shop/parts",
      ka: "https://kmotors.shop/parts",
      ar: "https://kmotors.shop/parts",
      "x-default": "https://kmotors.shop/parts",
    },
  },
  keywords: [
    "запчасти из Кореи",
    "оригинальные запчасти Hyundai",
    "запчасти Kia",
    "запчасти Genesis",
    "корейские запчасти",
    "автозапчасти из Южной Кореи",
    "kmotors запчасти",
  ],
};

export default function PartsPage() {
  return (
    <div>
      <Hero />
      <Catalog />
      <Products />
      <About />
      <ContactForm />
    </div>
  );
}
