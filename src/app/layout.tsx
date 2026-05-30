import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF4500",
};

export const metadata: Metadata = {
  title: {
    default: "K-Axis — авто из Кореи | Hyundai, Kia, Genesis",
    template: "%s | K-Axis",
  },
  description:
    "K-Axis — покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis. Честные цены, без посредников.",
  keywords: [
    "авто из Кореи", "купить авто из Кореи", "kmotors",
    "Hyundai из Кореи", "Kia из Кореи", "Genesis из Кореи",
    "Korean cars", "buy car from Korea", "Korean car dealer",
    "한국 중고차", "კორეული მანქანები", "سيارات كورية",
  ],
  other: {
    "yandex-verification": "f71551035d1c4fbb",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("kmotors-lang")?.value || "ru";
  const isAdmin = cookieStore.get("admin_session")?.value === "1";

  return (
    <html lang={lang} className={inter.className}>
      <head>
        <meta name="robots" content="index, follow" />
        <link rel="alternate" href="https://kmotors.shop/ru/" hrefLang="ru" />
        <link rel="alternate" href="https://kmotors.shop/en/" hrefLang="en" />
        <link rel="alternate" href="https://kmotors.shop/ko/" hrefLang="ko" />
        <link rel="alternate" href="https://kmotors.shop/ka/" hrefLang="ka" />
        <link rel="alternate" href="https://kmotors.shop/ar/" hrefLang="ar" />
        <link rel="alternate" href="https://kmotors.shop/ru/" hrefLang="x-default" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" href="/apple-touch-icon.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* LocalBusiness + AutoDealer JSON-LD — нативный script, не Next.js Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "AutoDealer"],
              name: "K-Axis",
              url: "https://kmotors.shop/",
              logo: "https://kmotors.shop/favicon_io/android-chrome-192x192.png",
              image: "https://kmotors.shop/preview/preview.png",
              description: "Покупка и доставка автомобилей из Южной Кореи. Hyundai, Kia, Genesis.",
              telephone: "+821058654344",
              address: {
                "@type": "PostalAddress",
                streetAddress: "권선로 308-5 103호 1층",
                addressLocality: "수원시 권선구",
                addressRegion: "경기도",
                addressCountry: "KR",
              },
              geo: { "@type": "GeoCoordinates", latitude: 37.2636, longitude: 126.9723 },
              openingHoursSpecification: [{
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                opens: "09:00",
                closes: "18:00",
              }],
              contactPoint: [
                { "@type": "ContactPoint", telephone: "+821058654344", contactType: "customer service", availableLanguage: ["Russian", "Korean", "English"] },
                { "@type": "ContactPoint", url: "https://t.me/avto_korea_nikolai", contactType: "customer service", availableLanguage: ["Russian", "Korean", "English"] },
              ],
              currenciesAccepted: "USD",
              paymentAccepted: "Bank Transfer",
              priceRange: "$$",
              areaServed: ["RU", "KZ", "UZ", "GE", "AE", "SA"],
              sameAs: ["https://t.me/avto_korea_nikolai"],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col mx-auto">
        {children}

        {/* GA4 + Яндекс.Метрика + Clarity — не рендерятся для админа вообще */}
        {!isAdmin && (
          <>
            <Script id="analytics-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-ZMRTQCD8SF');
                window.gtag = gtag;
                var s1 = document.createElement('script');
                s1.async = true;
                s1.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZMRTQCD8SF';
                document.body.appendChild(s1);

                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window,document,'clarity','script','wrkhuoyd68');

                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109267986','ym');
                ym(109267986,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
              `}
            </Script>
            <noscript>
              <div><img src="https://mc.yandex.ru/watch/109267986" style={{position:"absolute",left:"-9999px"}} alt="" /></div>
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
