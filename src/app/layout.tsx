import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Корейские автомобили Hyundai, Kia, Genesis — каталог моделей и цены",
  description:
    "Обзор корейских автомобилей: Hyundai, Kia, Genesis, SsangYong. Характеристики, цены, фото, отзывы. Каталог авто из Южной Кореи",
  openGraph: {
    title: "Каталог корейских авто — Hyundai, Kia, Genesis",
    description:
      "Выбирайте лучшие автомобили из Южной Кореи. Фото, цены, характеристики, отзывы.",
    url: "https://kmotors.vercel.app/",
    siteName: "Kmotors",
    images: [
      {
        url: "https://kmotors.vercel.app/preview/preview.png",
        width: 1200,
        height: 630,
        alt: "Каталог корейских авто — Hyundai, Kia, Genesis",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        <link
          rel="icon"
          type="image/png"
          href="/favicon_io/android-chrome-192x192.png"
        />
      </head>

      <body className="min-h-screen flex flex-col   mx-auto ">
        <h1 className="absolute -left-9999999">
          Авто из кореи под заказ Автомобили из Южной Кореи: Hyundai, Kia,
          Genesis, SsangYong, BMW, Mercedes-Benz, Audi, Volkswagen — каталог
          моделей, цены, характеристики
        </h1>
        <Header />
        <main className="flex-grow min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
