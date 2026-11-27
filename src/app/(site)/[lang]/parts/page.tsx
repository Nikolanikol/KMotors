import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/app/parts/sections/Hero";
import { UsedPartsPromo } from "@/app/parts/sections/UsedPartsPromo";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { PartsTopLinks } from "@/app/parts/sections/PartsTopLinks";
import { PopularModels } from "@/app/parts/sections/PopularModels";
import SectionDictionary from "@/components/I18nProvider/SectionDictionary";
import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";
import { makeAlternates } from "@/lib/seo";
import { getServerT } from "@/lib/serverT";
import { hasFilterParams, jsonLd } from "@/lib/partsSeo";

// Lazy load — грузятся после Hero
const PartsCatalog = dynamic(() => import("@/app/parts/sections/PartsCatalog").then(m => ({ default: m.PartsCatalog })));
const About = dynamic(() => import("@/app/parts/sections/About").then(m => ({ default: m.About })));
const ContactForm = dynamic(() => import("@/app/parts/sections/ContactForm").then(m => ({ default: m.ContactForm })));
// Час, а не false. Первый экран каталога рендерится на сервере ради SEO, и
// вместе с ним PartsTopLinks + PopularModels — это видимый ботам граф
// внутренних ссылок. При revalidate = false он оставался слепком с билда, и
// новые товары не попадали в него до следующего деплоя. TTL совпадает с
// внутренним кешем parts-catalog-data (unstable_cache, 3600).
export const revalidate = 3600;

/**
 * Сколько товаров в каталоге — для счётчика в хиро.
 *
 * ⚠️ Берётся из базы, а НЕ зашивается в текст. В хиро стояло «5000+» при
 * 48 689 реальных позициях: самое сильное отличие магазина объявлялось
 * вдесятеро меньше, чем есть. Любое зашитое число здесь протухнет молча.
 *
 * head + count: exact — строки не тянутся, уходит только число. TTL совпадает
 * с revalidate страницы: держать его короче бессмысленно, сегмент всё равно не
 * перерендерится чаще.
 */
const getPartsCount = unstable_cache(
  async () => {
    const { count, error } = await createServerClient()
      .from("parts_products")
      .select("*", { count: "exact", head: true });
    if (error) {
      // Витрина важнее счётчика: при сбое хиро покажет осторожное «48 000+».
      console.error("[parts] счётчик товаров:", error.message);
      return null;
    }
    return count ?? null;
  },
  ["parts-total-count"],
  { revalidate: 3600, tags: ["parts-total-count"] },
);

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

  const alternates = makeAlternates(lang, "/parts");

  // noindex только у настоящей выдачи с фильтром (белый список параметров). Метки
  // кампаний (utm_*, gclid, fbclid…) содержимое не меняют: страница остаётся в индексе,
  // canonical ведёт на чистый URL.
  const hasFilters = hasFilterParams(sp);

  return {
    title: meta.title,
    description: meta.description,
    ...(hasFilters && { robots: { index: false, follow: true } }),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: alternates.canonical,
      // Картинку даёт parts/opengraph-image.tsx — см. комментарий на главной.
      type: "website",
    },
    alternates,
  };
}

export default async function PartsPage({ params }: Props) {
  const { lang } = await params;
  const partsCount = await getPartsCount();
  const meta = PARTS_META[lang] || PARTS_META.ru;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: getServerT(lang)("parts.detail.breadcrumbParts"), item: `${SITE_URL}/${lang}/parts` },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}/${lang}/parts`,
    provider: {
      "@type": "Organization",
      name: "K-Axis",
      url: `${SITE_URL}/`,
    },
    serviceType: "Auto Parts Import",
    areaServed: [
      { "@type": "Country", name: "Russia" },
      { "@type": "Country", name: "Kazakhstan" },
      { "@type": "Country", name: "Uzbekistan" },
      { "@type": "Country", name: "Georgia" },
    ],
    // Offer без цены не валиден для rich results (Google требует price), а у услуги
    // по подбору и доставке цены нет вовсе — поэтому offers здесь не выводится.
  };

  return (
    <>
      <SectionDictionary lang={lang} sections={["parts"]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(serviceSchema) }} />
      <div className="parts-page min-h-screen" style={{ position: "relative" }}>
        <PartsTopLinks lang={lang} />
        <Hero partsCount={partsCount ?? undefined} />
        <PopularModels lang={lang} />
        <PartsCatalog />
        {/* ⚠️ Баннер партнёра стоит ПОСЛЕ собственного каталога, а не в хиро.
            Раньше он занимал второй экран — самое дорогое место страницы — и
            уводил людей на чужой магазин раньше, чем они видели наш товар.
            Обмен ссылками при этом сохранён, изменилось только место. */}
        <UsedPartsPromo className="mx-auto max-w-[1280px] px-4 mt-14 mb-4" />
        <About />
        <ContactForm />
      </div>
    </>
  );
}
