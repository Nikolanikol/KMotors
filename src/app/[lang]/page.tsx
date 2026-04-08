import type { Metadata } from "next";
import Brands from "@/components/Home/Brands/Brands";
import CarSlider from "@/components/Home/CarSlider/CarSlider";
import Main from "@/components/Home/Main";

const LANG_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "KMotors — авто из Кореи | Купить Hyundai, Kia, Genesis в СНГ",
    description:
      "KMotors — покупка автомобилей из Южной Кореи с доставкой в Россию, Казахстан, Узбекистан. Большой каталог Hyundai, Kia, Genesis. Честная цена, помощь с растаможкой.",
  },
  en: {
    title: "KMotors — Korean Cars | Buy Hyundai, Kia, Genesis from Korea",
    description:
      "KMotors — purchase Korean cars from South Korea with delivery to Russia, Kazakhstan, Uzbekistan, Georgia. Wide catalog of Hyundai, Kia, Genesis. Fair prices, customs assistance.",
  },
  ko: {
    title: "KMotors — 한국 자동차 | Hyundai, Kia, Genesis 구매",
    description:
      "KMotors — 한국에서 러시아, 카자흐스탄, 우즈베키스탄으로 자동차 수출. 현대, 기아, 제네시스 대형 카탈로그. 합리적인 가격.",
  },
  ka: {
    title: "KMotors — კორეული ავტომობილები | Hyundai, Kia, Genesis",
    description:
      "KMotors — სამხრეთ კორეიდან ავტომობილების შეძენა საქართველოში მიტანით. Hyundai, Kia, Genesis — საუკეთესო ფასები.",
  },
  ar: {
    title: "KMotors — سيارات كورية | اشتر Hyundai وKia وGenesis",
    description:
      "KMotors — شراء سيارات من كوريا الجنوبية مع التوصيل. كتالوج واسع من Hyundai وKia وGenesis. أسعار عادلة، مساعدة في الجمارك.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = LANG_META[lang] || LANG_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://kmotors.shop/${lang}/`,
      siteName: "KMotors",
      type: "website",
      locale: lang === "ko" ? "ko_KR" : lang === "ar" ? "ar_SA" : lang === "ka" ? "ka_GE" : lang === "en" ? "en_US" : "ru_RU",
      images: [
        {
          url: "https://kmotors.shop/preview/preview.png",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["https://kmotors.shop/preview/preview.png"],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/`,
      languages: {
        ru: "https://kmotors.shop/ru/",
        en: "https://kmotors.shop/en/",
        ko: "https://kmotors.shop/ko/",
        ka: "https://kmotors.shop/ka/",
        ar: "https://kmotors.shop/ar/",
        "x-default": "https://kmotors.shop/ru/",
      },
    },
  };
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const meta = LANG_META[lang] || LANG_META.ru;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KMotors",
    url: "https://kmotors.shop/",
    description: meta.description,
    inLanguage: lang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://kmotors.shop/${lang}/catalog?manufacture={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "KMotors",
    url: "https://kmotors.shop",
    logo: "https://kmotors.shop/favicon_io/android-chrome-512x512.png",
    image: "https://kmotors.shop/preview/preview.png",
    telephone: "+821077324344",
    address: {
      "@type": "PostalAddress",
      streetAddress: "권선로 308-5 103호 1층",
      addressLocality: "수원시 권선구",
      addressRegion: "경기도",
      addressCountry: "KR",
    },
    areaServed: ["RU", "KZ", "UZ", "GE", "SA", "KR"],
    sameAs: [],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    <div className="min-h-[70vh]">
      <Main />
      <div className="py-20 rounded-[50px] md:rounded-[100px] mt-[-100px] relative z-10 bg-white overflow-hidden">
        <CarSlider
          reqString="https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84.))&sr=%7CModifiedDate%7C0%7C20"
          title="Kia"
        />
        <CarSlider
          reqString="https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80.))&sr=%7CModifiedDate%7C0%7C20"
          title="Hyundai"
        />
      </div>
      <Brands />
    </div>
    </>
  );
}
