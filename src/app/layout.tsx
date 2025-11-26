import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import I18nProvider from "@/components/I18nProvider/I18nProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Корейские автомобили Hyundai, Kia, Genesis — каталог моделей и цены",
  description:
    "Обзор корейских автомобилей: Hyundai, Kia, Genesis, SsangYong. Характеристики, цены, фото, отзывы. Каталог авто из Южной Кореи",
  openGraph: {
    title: "Каталог корейских авто — Hyundai, Kia, Genesis",
    description:
      "Выбирайте лучшие автомобили из Южной Кореи. Фото, цены, характеристики, отзывы.",
    url: "https://kmotors.shop/",
    siteName: "Kmotors",
    images: [
      {
        url: "https://kmotors.shop/preview/preview.png",
        width: 1200,
        height: 630,
        alt: "Каталог корейских авто — Hyundai, Kia, Genesis",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  other: {
    "yandex-verification": "f71551035d1c4fbb",
    keywords: [
      "Hyundai",
      "Kia",
      "Genesis",
      "SsangYong",
      "корейские автомобили",
      "авто из Южной Кореи",
      "купить авто",
      "цены",
      "kmotors",
      "кмоторс ",
    ],
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
        <meta name="robots" content="index, follow" />
        <link rel="alternate" href="https://kmotors.shop/" hrefLang="ru-ru" />
        <link
          rel="alternate"
          href="https://kmotors.shop/"
          hrefLang="x-default"
        />

        <link rel="canonical" href="https://kmotors.shop/" />
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
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Kmotors",
              url: "https://kmotors.shop/",
              logo: "https://kmotors.shop/favicon_io/android-chrome-192x192.png",
              sameAs: [
                "https://t.me/kmotorsshop",
                "https://www.instagram.com/kmotors.shop/",
              ],
            }),
          }}
        />
      </head>

      <body className="min-h-screen flex flex-col   mx-auto ">
        <I18nProvider>
          <h1 className="absolute -left-9999999">
            Авто из Южной Кореи под заказ
          </h1>
          <Header />
          <main className="flex-grow min-h-[70vh]">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
