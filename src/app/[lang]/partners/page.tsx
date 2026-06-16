import type { Metadata } from "next";
import PartnersClient from "./PartnersClient";
import { makeAlternates } from "@/lib/seo";

const META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Партнёрская программа K-Axis — оптовые поставки запчастей из Кореи",
    description:
      "Станьте партнёром K-Axis: оптовые цены на оригинальные запчасти Hyundai, Kia, Genesis. Скидки до 25%, отсрочка платежа, приоритетная доставка для автосервисов и магазинов.",
  },
  en: {
    title: "K-Axis Partner Program — Wholesale Korean Auto Parts",
    description:
      "Become a K-Axis partner: wholesale pricing on genuine Hyundai, Kia, Genesis parts. Up to 25% discount, deferred payments, priority shipping for auto shops and resellers.",
  },
  ko: {
    title: "K-Axis 파트너 프로그램 — 한국 자동차 부품 도매",
    description:
      "K-Axis 파트너가 되세요: 현대, 기아, 제네시스 정품 부품 도매가. 최대 25% 할인, 후불 결제, 우선 배송.",
  },
  ka: {
    title: "K-Axis პარტნიორული პროგრამა — კორეული ავტონაწილების საბითუმო მიწოდება",
    description:
      "გახდით K-Axis-ის პარტნიორი: Hyundai, Kia, Genesis ორიგინალურ ნაწილებზე საბითუმო ფასები. 25%-მდე ფასდაკლება, გადავადებული გადახდა.",
  },
  ar: {
    title: "برنامج شراكة K-Axis — قطع غيار كورية بالجملة",
    description:
      "كن شريك K-Axis: أسعار الجملة لقطع غيار Hyundai وKia وGenesis الأصلية. خصم يصل إلى 25%، دفع مؤجل، شحن مُعجّل.",
  },
};

const LABEL: Record<string, string> = {
  ru: "Партнёрам",
  en: "Partners",
  ko: "파트너",
  ka: "პარტნიორებს",
  ar: "الشركاء",
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
      url: `https://www.kmotors.shop/${lang}/partners`,
      images: [{ url: "https://www.kmotors.shop/preview/preview.png" }],
    },
    alternates: makeAlternates(lang, "/partners"),
  };
}

export default async function PartnersPage({ params }: Props) {
  const { lang } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://www.kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: LABEL[lang] || "Partners", item: `https://www.kmotors.shop/${lang}/partners` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <PartnersClient lang={lang} />
    </>
  );
}
