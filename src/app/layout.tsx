import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: {
    default: "KMotors — авто из Кореи | Hyundai, Kia, Genesis",
    template: "%s | KMotors",
  },
  description:
    "KMotors (кмоторс) — покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis. Честные цены, без посредников.",
  keywords: [
    "авто из Кореи",
    "купить авто из Кореи",
    "корейские автомобили",
    "авто из Южной Кореи",
    "кмоторс",
    "kmotors",
    "kmotors.shop",
    "Hyundai из Кореи",
    "Kia из Кореи",
    "Genesis из Кореи",
    "доставка авто из Кореи",
    "авто из Кореи в Россию",
    "авто из Кореи в Казахстан",
    "авто из Кореи в Узбекистан",
  ],
  other: {
    "yandex-verification": "f71551035d1c4fbb",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Читаем lang из cookie (выставляется middleware при каждом запросе)
  const cookieStore = await cookies();
  const lang = cookieStore.get("kmotors-lang")?.value || "ru";

  return (
    <html lang={lang}>
      <head>
        <meta name="robots" content="index, follow" />
        <link rel="alternate" href="https://kmotors.shop/ru/" hrefLang="ru" />
        <link rel="alternate" href="https://kmotors.shop/en/" hrefLang="en" />
        <link rel="alternate" href="https://kmotors.shop/ko/" hrefLang="ko" />
        <link rel="alternate" href="https://kmotors.shop/ka/" hrefLang="ka" />
        <link rel="alternate" href="https://kmotors.shop/ar/" hrefLang="ar" />
        <link rel="alternate" href="https://kmotors.shop/ru/" hrefLang="x-default" />
        <link rel="icon" type="image/png" href="/favicon_io/android-chrome-192x192.png" />

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

        {/* Organization + AutoDealer JSON-LD */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "AutoDealer"],
              name: "KMotors",
              url: "https://kmotors.shop/",
              logo: "https://kmotors.shop/favicon_io/android-chrome-192x192.png",
              image: "https://kmotors.shop/preview/preview.png",
              description:
                "Покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis.",
              areaServed: ["RU", "KZ", "UZ", "GE", "AE", "SA"],
              priceRange: "$$",
              sameAs: [
                "https://t.me/kmotorsshop",
                "https://www.instagram.com/kmotors.shop/",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col mx-auto">
        {children}
      </body>
    </html>
  );
}
