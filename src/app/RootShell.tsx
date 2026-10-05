import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";

import NavigationStatus from "@/components/NavigationStatus";

// Общая оболочка <html>/<body> для всех корневых layout.
//
// ⚠️ Раньше это был единственный корневой layout, и он читал cookies() ради
// двух вещей: языка для <html lang> и флага админа для счётчиков. Вызов
// cookies() в корне делает ДИНАМИЧЕСКИМ всё дерево приложения — 48 тысяч
// страниц запчастей рендерились заново на каждый запрос, ISR не включался
// нигде (в prerender-manifest было 0 dynamicRoutes). Теперь язык приходит
// пропом из сегмента, а счётчики — флагом.

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" });

export default function RootShell({
  lang,
  withAnalytics = true,
  children,
}: {
  /** Язык для <html lang>. Приходит из сегмента [lang], а не из cookie. */
  lang: string;
  /** Счётчики. В админке не нужны и раньше отключались чтением cookie. */
  withAnalytics?: boolean;
  children: React.ReactNode;
}) {

  // RTL-переворот отключён намеренно: макет всегда LTR даже на арабском
  // (браузер сам корректно рендерит арабский текст внутри строк по bidi)
  return (
    <html lang={lang} dir="ltr" className={inter.className}>
      <head>
        {/* robots задаёт ТОЛЬКО Next Metadata API на уровне страниц — единый
            источник правды. Раньше здесь был жёстко зашит
            <meta name="robots" content="index, follow">, который печатался на
            КАЖДОЙ странице и делал индексируемыми даже проданные карточки и
            другие noindex-страницы (конфликт из 2–3 robots-тегов). Отсутствие
            тега = индексируемо по умолчанию, поэтому живые страницы не страдают. */}

        {/* Preconnect — только для ресурсов загружаемых в браузере (не SSR) */}
        <link rel="preconnect" href="https://ci.encar.com" />
        <link rel="dns-prefetch" href="https://ci.encar.com" />
        {/* SEO: make content visible for bots that don't execute JS */}
        <noscript><style>{`.opacity-0{opacity:1!important}.translate-y-4,.translate-y-5,.translate-y-7,.translate-y-8,.-translate-x-8,.translate-x-8{transform:none!important}.scale-95{transform:none!important}`}</style></noscript>
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        {/* Ссылки на иконки НЕ ставить руками: их подставляет файловая конвенция
            Next из src/app/{icon.svg, favicon.ico, apple-icon.png}. Ручной <link>
            рядом с конвенцией даёт дубль в <head>, а прежний вариант ещё и
            подключал apple-touch-icon весом 815 КБ как фавиконку 192px. */}

        {/* LocalBusiness + AutoDealer JSON-LD — нативный script, не Next.js Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "AutoDealer"],
              name: "K-Axis",
              url: "https://www.kmotors.shop/",
              logo: "https://www.kmotors.shop/favicon_io/android-chrome-192x192.png",
              image: "https://www.kmotors.shop/opengraph-image",
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
        {/* Индикатор перехода на всех трёх корнях, включая админку. Suspense —
            из-за useSearchParams: без него статические страницы при сборке
            ушли бы в клиентский рендер целиком. */}
        <Suspense fallback={null}>
          <NavigationStatus />
        </Suspense>
        {children}

        {/* GA4 — afterInteractive (нужен быстро для конверсий) */}
        {withAnalytics && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-ZMRTQCD8SF"
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                // Служебный хост (вход владельца и менеджеров) и localhost —
                // внутренний трафик: в GA4 его отсекает фильтр данных по
                // traffic_type = internal (Admin → Data filters). Определение
                // служебного хоста то же, что в middleware.ts и serviceHost.ts.
                var internal = location.hostname !== new URL(${JSON.stringify(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop")}).hostname;
                // set — на ВСЕ события страницы, а не только на page_view из config.
                if (internal) gtag('set', { traffic_type: 'internal' });
                gtag('config', 'G-ZMRTQCD8SF', { send_page_view: true });
                gtag('config', 'AW-18196150435');
                window.gtag = gtag;
              `}
            </Script>

            {/* Metricool — lazyOnload (аналитика соцсетей, не критично) */}
            <Script id="metricool-init" strategy="lazyOnload">
              {`
                function loadScript(a){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}loadScript(function(){beTracker.t({hash:"6c43e81d00fb6aa48054d35893179184"})});
              `}
            </Script>

            {/* Clarity — lazyOnload (не критично, грузим в idle) */}
            <Script id="clarity-init" strategy="lazyOnload">
              {`
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window,document,'clarity','script','wrkhuoyd68');
              `}
            </Script>

            {/* Яндекс.Метрика — только для СНГ аудитории по языку браузера */}
            <Script id="metrika-init" strategy="lazyOnload">
              {`
                var _lang = (navigator.language || '').toLowerCase();
                var _cis = ['ru','uk','kk','uz','be','ky','tg','az','hy','ka'];
                var _isCIS = _cis.some(function(l){ return _lang.startsWith(l); });
                if (_isCIS) {
                  (function(m,e,t,r,i,k,a){
                    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                    m[i].l=1*new Date();
                    for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
                    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                  })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109267986','ym');
                  ym(109267986,'init',{clickmap:true,ecommerce:'dataLayer',accurateTrackBounce:true,trackLinks:true});
                }
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
