import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { makeAlternates } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "О компании K-Axis — оригинальные запчасти из Кореи",
    description:
      "K-Axis — прямые поставки оригинальных автозапчастей Hyundai, Kia, Genesis из Южной Кореи. Работаем с 2025 года, доставляем в 8+ стран.",
  },
  en: {
    title: "About K-Axis — Genuine Korean Auto Parts",
    description:
      "K-Axis — direct supply of genuine Hyundai, Kia, Genesis auto parts from South Korea. Operating since 2025, delivering to 8+ countries.",
  },
  ko: {
    title: "K-Axis 소개 — 정품 한국 자동차 부품",
    description:
      "K-Axis — 한국에서 직접 공급하는 현대, 기아, 제네시스 정품 자동차 부품. 2025년부터 8개국 이상 배송.",
  },
  ka: {
    title: "K-Axis-ის შესახებ — ორიგინალური კორეული ავტონაწილები",
    description:
      "K-Axis — სამხრეთ კორეიდან Hyundai, Kia, Genesis ორიგინალური ავტონაწილების პირდაპირი მიწოდება. 2025 წლიდან, 8+ ქვეყანაში მიტანა.",
  },
  ar: {
    title: "عن K-Axis — قطع غيار كورية أصلية",
    description:
      "K-Axis — توريد مباشر لقطع غيار Hyundai وKia وGenesis الأصلية من كوريا الجنوبية. منذ 2025، توصيل إلى 8+ دول.",
  },
};

const LABEL: Record<string, string> = {
  ru: "О компании",
  en: "About",
  ko: "회사 소개",
  ka: "ჩვენს შესახებ",
  ar: "عن الشركة",
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const m = META[lang] || META.ru;

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `https://www.kmotors.shop/${lang}/about`,
      images: [{ url: "https://www.kmotors.shop/preview/preview.png" }],
    },
    alternates: makeAlternates(lang, "/about"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://www.kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: LABEL[lang] || "About", item: `https://www.kmotors.shop/${lang}/about` },
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "K-Axis",
    url: "https://www.kmotors.shop",
    logo: "https://www.kmotors.shop/preview/preview.png",
    foundingDate: "2025",
    description: (META[lang] || META.ru).description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["Russian", "English", "Korean", "Georgian", "Arabic"],
    },
    areaServed: ["RU", "KZ", "UZ", "GE", "AE", "SA", "BY", "AM"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <AboutClient lang={lang} />
    </>
  );
}
