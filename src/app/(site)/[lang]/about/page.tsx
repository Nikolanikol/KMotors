import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { makeAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Заголовок и описание переписаны 28.11.2026 вместе со страницей: раньше страница говорила
// только о запчастях, теперь — авто и запчасти, без комиссии (решение владельца).
const META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "О компании K-Axis — авто и запчасти из Кореи без комиссии",
    description:
      "K-Axis — команда в Южной Корее: подбор и доставка автомобилей с Encar и аукционов, оригинальные запчасти Hyundai, Kia, Genesis. Без комиссии, скидки — в личных сообщениях.",
  },
  en: {
    title: "About K-Axis — Cars and Parts from Korea, No Commission",
    description:
      "K-Axis is a team in South Korea: car sourcing and delivery from Encar and auctions, genuine Hyundai, Kia, Genesis parts. No commission, discounts via direct message.",
  },
  ko: {
    title: "K-Axis 소개 — 한국 자동차와 부품, 수수료 없음",
    description:
      "K-Axis — 한국 팀: Encar와 경매 차량 구매·배송, 현대·기아·제네시스 정품 부품. 수수료 없음, 할인은 메시지로 안내.",
  },
  ka: {
    title: "K-Axis-ის შესახებ — ავტომობილები და ნაწილები კორეიდან, საკომისიოს გარეშე",
    description:
      "K-Axis — გუნდი სამხრეთ კორეაში: ავტომობილების შერჩევა და მიტანა Encar-იდან და აუქციონებიდან, Hyundai, Kia, Genesis ორიგინალური ნაწილები. საკომისიოს გარეშე.",
  },
  ar: {
    title: "عن K-Axis — سيارات وقطع غيار من كوريا بدون عمولة",
    description:
      "K-Axis فريق في كوريا الجنوبية: اختيار السيارات من Encar والمزادات وشحنها، وقطع غيار Hyundai وKia وGenesis الأصلية. بدون عمولة، والخصومات عبر الرسائل الخاصة.",
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
      url: `${SITE_URL}/${lang}/about`,
      // Картинку даёт [lang]/opengraph-image.tsx — заданный здесь images
      // перекрыл бы файловую конвенцию.
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
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${SITE_URL}/${lang}/` },
      { "@type": "ListItem", position: 2, name: LABEL[lang] || "About", item: `${SITE_URL}/${lang}/about` },
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "K-Axis",
    url: `${SITE_URL}`,
    logo: `${SITE_URL}/favicon_io/android-chrome-512x512.png`,
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
