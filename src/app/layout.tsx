import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#002C5F",
};

export const metadata: Metadata = {
  title: {
    default: "KMotors — авто из Кореи | Hyundai, Kia, Genesis",
    template: "%s | KMotors",
  },
  description:
    "KMotors (кмоторс) — покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis. Честные цены, без посредников.",
  keywords: [
    // RU
    "авто из Кореи", "купить авто из Кореи", "корейские автомобили",
    "авто из Южной Кореи", "кмоторс", "kmotors", "kmotors.shop",
    "Hyundai из Кореи", "Kia из Кореи", "Genesis из Кореи",
    "доставка авто из Кореи", "авто из Кореи в Россию",
    "авто из Кореи в Казахстан", "авто из Кореи в Узбекистан",
    // EN
    "Korean cars", "buy car from Korea", "Korean used cars",
    "Hyundai from Korea", "Kia from Korea", "Genesis from Korea",
    "car export Korea", "Korean car dealer",
    // KO
    "한국 중고차", "한국 자동차 수출", "현대 중고차", "기아 중고차",
    // KA
    "კორეული მანქანები", "კორეიდან ავტომობილი", "Hyundai კორეიდან",
    // AR
    "سيارات كورية", "شراء سيارة من كوريا", "هيونداي كوريا",
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

        {/* LocalBusiness + AutoDealer JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "AutoDealer"],
              name: "KMotors",
              url: "https://kmotors.shop/",
              logo: "https://kmotors.shop/favicon_io/android-chrome-192x192.png",
              image: "https://kmotors.shop/preview/preview.png",
              description:
                "Покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis.",
              telephone: "+821077324344",
              address: {
                "@type": "PostalAddress",
                streetAddress: "권선로 308-5 103호 1층",
                addressLocality: "수원시 권선구",
                addressRegion: "경기도",
                addressCountry: "KR",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 37.2636,
                longitude: 126.9723,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "18:00",
                },
              ],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  telephone: "+821077324344",
                  contactType: "customer service",
                  availableLanguage: ["Russian", "Korean", "English"],
                },
                {
                  "@type": "ContactPoint",
                  url: "https://t.me/kmotorsshop",
                  contactType: "customer service",
                  availableLanguage: ["Russian", "Korean", "English"],
                },
              ],
              currenciesAccepted: "USD",
              paymentAccepted: "Bank Transfer",
              priceRange: "$$",
              areaServed: ["RU", "KZ", "UZ", "GE", "AE", "SA"],
              sameAs: [
                "https://t.me/kmotorsshop",
                "https://www.instagram.com/kmotors.shop/",
              ],
            }),
          }}
        />
        {/* Microsoft Clarity */}
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wrkhuoyd68");`}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col mx-auto">
        {children}
      </body>
    </html>
  );
}
