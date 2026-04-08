import type { Metadata } from "next";
import { Hero } from "@/app/parts/sections/Hero";
import { Catalog } from "@/app/parts/sections/Catalog";
import { Products } from "@/app/parts/sections/Products";
import { About } from "@/app/parts/sections/About";
import { ContactForm } from "@/app/parts/sections/ContactForm";

const PARTS_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Оригинальные запчасти из Кореи — Hyundai, Kia, Genesis | KMotors",
    description: "Оригинальные запчасти из Южной Кореи с доставкой. Двигатели, подвеска, кузов, тормоза для Hyundai, Kia, Genesis. Гарантия качества, прямые поставки.",
  },
  en: {
    title: "Original Korean Car Parts — Hyundai, Kia, Genesis | KMotors",
    description: "Original spare parts from South Korea with delivery. Engines, suspension, body, brakes for Hyundai, Kia, Genesis. Quality guarantee, direct supply.",
  },
  ko: {
    title: "한국 정품 자동차 부품 — Hyundai, Kia, Genesis | KMotors",
    description: "한국에서 직배송 정품 부품. 엔진, 서스펜션, 차체, 브레이크 (Hyundai, Kia, Genesis). 품질 보증, 직접 공급.",
  },
  ka: {
    title: "კორეული ორიგინალი სათადარიგო ნაწილები — Hyundai, Kia, Genesis | KMotors",
    description: "კორეიდან ორიგინალი სათადარიგო ნაწილები მიტანით. ძრავი, საკიდი, კუზოვი, სამუხრუჭო სისტემა Hyundai, Kia, Genesis-ისთვის.",
  },
  ar: {
    title: "قطع غيار كورية أصلية — Hyundai وKia وGenesis | KMotors",
    description: "قطع غيار أصلية من كوريا الجنوبية مع التوصيل. محركات، تعليق، هيكل، فرامل لـ Hyundai وKia وGenesis. ضمان الجودة، توريد مباشر.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = PARTS_META[lang] || PARTS_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://kmotors.shop/${lang}/parts`,
      images: [
        {
          url: "https://kmotors.shop/preview/preview.png",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      type: "website",
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/parts`,
      languages: {
        ru: "https://kmotors.shop/ru/parts",
        en: "https://kmotors.shop/en/parts",
        ko: "https://kmotors.shop/ko/parts",
        ka: "https://kmotors.shop/ka/parts",
        ar: "https://kmotors.shop/ar/parts",
        "x-default": "https://kmotors.shop/ru/parts",
      },
    },
  };
}

const PARTS_LABEL: Record<string, string> = {
  ru: "Запчасти", en: "Parts", ko: "부품", ka: "სათადარიგო ნაწილები", ar: "قطع الغيار",
};

export default async function PartsPage({ params }: Props) {
  const { lang } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: PARTS_LABEL[lang] || "Parts", item: `https://kmotors.shop/${lang}/parts` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div>
        <Hero />
        <Catalog />
        <Products />
        <About />
        <ContactForm />
      </div>
    </>
  );
}
