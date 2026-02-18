import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import I18nProvider from "@/components/I18nProvider/I18nProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "KMotors — авто из Кореи | Hyundai, Kia, Genesis",
    template: "%s | KMotors",
  },
  description:
    "KMotors (кмоторс) — покупка и доставка автомобилей из Южной Кореи в Россию, Казахстан, Узбекистан. Hyundai, Kia, Genesis. Честные цены, без посредников.",
  keywords: [
    "авто из Кореи",
    "купить авто из Кореи",
    "корейские автомобили",
    "авто из Южной Кореи",
    "кмоторс",
    "кмоторсшоп",
    "kmotors",
    "kmotors.shop",
    "Hyundai из Кореи",
    "Kia из Кореи",
    "Genesis из Кореи",
    "доставка авто из Кореи",
    "авто из Кореи в Россию",
    "авто из Кореи в Казахстан",
    "авто из Кореи в Узбекистан",
    "купить корейское авто",
    "пригнать авто из Кореи",
    "авто под заказ из Кореи",
  ],
  openGraph: {
    title: "KMotors — авто из Кореи | Hyundai, Kia, Genesis",
    description:
      "Покупка и доставка автомобилей из Южной Кореи в страны СНГ. Hyundai, Kia, Genesis — честные цены, без посредников.",
    url: "https://kmotors.shop/",
    siteName: "KMotors",
    images: [
      {
        url: "https://kmotors.shop/preview/preview.png",
        width: 1200,
        height: 630,
        alt: "KMotors — авто из Кореи",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  other: {
    "yandex-verification": "f71551035d1c4fbb",
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
        {/* hreflang — язык выбирается на клиенте через localStorage */}
        <link rel="alternate" href="https://kmotors.shop/" hrefLang="ru" />
        <link rel="alternate" href="https://kmotors.shop/" hrefLang="x-default" />
        <meta property="og:url" content="https://kmotors.shop/" />
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
        {/* Organization JSON-LD — не defer, нужен при загрузке страницы */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "KMotors",
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
          <Header />
          <main className="flex-grow min-h-[70vh]">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
