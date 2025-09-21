import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Script from "next/script";

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
  other: {
    "yandex-verification": "f71551035d1c4fbb", // 👈 мета-тег для Яндекса
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
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        /> */}
        <link rel="canonical" href="https://www.kmotors.shop/" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon_io/android-chrome-192x192.png"
        />
        {/* Google Analytics 4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-ZMRTQCD8SF"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZMRTQCD8SF');
          `}
        </Script>
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
