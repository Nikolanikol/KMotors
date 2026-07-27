import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/app/parts/sections/Hero";
import { PartsTopLinks } from "@/app/parts/sections/PartsTopLinks";
import { PopularModels } from "@/app/parts/sections/PopularModels";

// Lazy load — грузятся после Hero
const PartsCatalog = dynamic(() => import("@/app/parts/sections/PartsCatalog").then(m => ({ default: m.PartsCatalog })));
const About = dynamic(() => import("@/app/parts/sections/About").then(m => ({ default: m.About })));
const ContactForm = dynamic(() => import("@/app/parts/sections/ContactForm").then(m => ({ default: m.ContactForm })));

const LANGS = ["ru", "en", "ka", "ar"];
const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

// Полностью статично — пересобирается только при следующем деплое
export const revalidate = false;

// Pre-generate все 5 языковых вариантов при сборке
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const PARTS_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Оригинальные запчасти из Кореи — Hyundai, Kia, Genesis",
    description: "Оригинальные запчасти из Южной Кореи с доставкой. Двигатели, подвеска, кузов, тормоза для Hyundai, Kia, Genesis. Гарантия качества, прямые поставки.",
  },
  en: {
    title: "Original Korean Car Parts — Hyundai, Kia, Genesis",
    description: "Original spare parts from South Korea with delivery. Engines, suspension, body, brakes for Hyundai, Kia, Genesis. Quality guarantee, direct supply.",
  },
  ko: {
    title: "한국 정품 자동차 부품 — Hyundai, Kia, Genesis",
    description: "한국에서 직배송 정품 부품. 엔진, 서스펜션, 차체, 브레이크 (Hyundai, Kia, Genesis). 품질 보증, 직접 공급.",
  },
  ka: {
    title: "კორეული ორიგინალი სათადარიგო ნაწილები — Hyundai, Kia, Genesis",
    description: "კორეიდან ორიგინალი სათადარიგო ნაწილები მიტანით. ძრავი, საკიდი, კუზოვი, სამუხრუჭო სისტემა Hyundai, Kia, Genesis-ისთვის.",
  },
  ar: {
    title: "قطع غيار كورية أصلية — Hyundai وKia وGenesis",
    description: "قطع غيار أصلية من كوريا الجنوبية مع التوصيل. محركات، تعليق، هيكل، فرامل لـ Hyundai وKia وGenesis. ضمان الجودة، توريد مباشر.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const meta = PARTS_META[lang] || PARTS_META.ru;

  const cleanUrl = `${BASE}/${lang}/parts`;

  // Если в URL есть любые фильтры — не индексируем, canonical на чистый URL
  const hasFilters = Object.keys(sp).length > 0;

  return {
    title: meta.title,
    description: meta.description,
    ...(hasFilters && { robots: { index: false, follow: true } }),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: cleanUrl,
      images: [
        {
          url: `${BASE}/preview/preview.png`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      type: "website",
    },
    alternates: {
      canonical: cleanUrl,
      languages: {
        ru: `${BASE}/ru/parts`,
        en: `${BASE}/en/parts`,
        ka: `${BASE}/ka/parts`,
        ar: `${BASE}/ar/parts`,
        "x-default": `${BASE}/ru/parts`,
      },
    },
  };
}

const PARTS_LABEL: Record<string, string> = {
  ru: "Запчасти", en: "Parts", ko: "부품", ka: "სათადარიგო ნაწილები", ar: "قطع الغيار",
};

export default async function PartsPage({ params }: Props) {
  const { lang } = await params;
  const meta = PARTS_META[lang] || PARTS_META.ru;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${BASE}/${lang}/` },
      { "@type": "ListItem", position: 2, name: PARTS_LABEL[lang] || "Parts", item: `${BASE}/${lang}/parts` },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: meta.title,
    description: meta.description,
    url: `${BASE}/${lang}/parts`,
    provider: {
      "@type": "Organization",
      name: "K-Axis",
      url: `${BASE}/`,
    },
    serviceType: "Auto Parts Import",
    areaServed: [
      { "@type": "Country", name: "Russia" },
      { "@type": "Country", name: "Kazakhstan" },
      { "@type": "Country", name: "Uzbekistan" },
      { "@type": "Country", name: "Georgia" },
    ],
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
      seller: { "@type": "Organization", name: "K-Axis" },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <div className="parts-page min-h-screen" style={{ position: "relative" }}>
        <PartsTopLinks lang={lang} />
        <Hero />
        <PopularModels lang={lang} />
        <PartsCatalog />
        <About />
        <ContactForm />
      </div>
    </>
  );
}
