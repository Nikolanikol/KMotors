import { Metadata } from "next";
import CalculatorPage from "@/components/Calculator/CalculatorPage";
import { makeAlternates } from "@/lib/seo";

interface Props {
  params: Promise<{ lang: string }>;
}

const META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Калькулятор растаможки авто из Кореи 2026",
    description:
      "Рассчитайте стоимость растаможки корейского автомобиля в Россию, Казахстан или Узбекистан. Актуальные ставки пошлин 2026 для физических лиц. Онлайн-калькулятор.",
  },
  en: {
    title: "Korean Car Import Duty Calculator 2026",
    description:
      "Calculate import customs duties for Korean cars to Russia, Kazakhstan or Uzbekistan. Updated 2026 rates for individuals.",
  },
  ko: {
    title: "한국 자동차 통관 관세 계산기 2026",
    description:
      "러시아, 카자흐스탄, 우즈베키스탄으로 한국 자동차 수입 관세를 계산하세요. 2026년 최신 요율.",
  },
  ka: {
    title: "კორეული მანქანის საბაჟო გადასახადის კალკულატორი 2026",
    description:
      "გამოთვალეთ კორეული ავტომობილის იმპორტის საბაჟო გადასახადი რუსეთში, ყაზახეთში ან უზბეკეთში. 2026 წლის განახლებული განაკვეთები.",
  },
  ar: {
    title: "حاسبة الرسوم الجمركية للسيارات الكورية 2026",
    description:
      "احسب رسوم الاستيراد الجمركية للسيارات الكورية إلى روسيا أو كازاخستان أو أوزبكستان. أسعار 2026 المحدّثة للأفراد.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = META[lang] ?? META.ru;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      images: [
        {
          url: "https://www.kmotors.shop/preview/preview.png",
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
      images: ["https://www.kmotors.shop/preview/preview.png"],
    },
    alternates: makeAlternates(lang, "/calculator"),
  };
}

// FAQ translations for structured data (FAQPage schema)
const FAQ: Record<string, { q: string; a: string }[]> = {
  ru: [
    {
      q: "Включена ли доставка в расчёт?",
      a: "Нет. Стоимость доставки из Кореи до таможни рассчитывается отдельно и зависит от маршрута, веса и габаритов автомобиля.",
    },
    {
      q: "Для каких лиц работает калькулятор?",
      a: "Только для физических лиц. Для юридических лиц и ИП ставки существенно отличаются.",
    },
    {
      q: "Насколько точен расчёт?",
      a: "Расчёт ориентировочный. Итоговая сумма может незначительно отличаться из-за актуального курса валют на дату оформления и индивидуальных параметров автомобиля.",
    },
    {
      q: "Какие авто выгоднее всего ввозить в Казахстан?",
      a: "Новые электромобили (до 1 года): нулевой утильсбор и льготная пошлина. Новые бензиновые до 2 лет с объёмом до 2 000 см³ — оптимальное соотношение таможенной нагрузки к стоимости.",
    },
    {
      q: "Почему в Узбекистане так дорого растаможивать ДВС?",
      a: "С 1 января 2026 года Узбекистан отменил льготы на малолитражки. Теперь все бензиновые и дизельные авто платят 15% пошлины плюс фиксированную доплату за каждый кубический сантиметр объёма.",
    },
  ],
  en: [
    {
      q: "Is delivery included in the calculation?",
      a: "No. Shipping costs from Korea to customs are calculated separately and depend on the route, weight and dimensions of the car.",
    },
    {
      q: "Who is this calculator for?",
      a: "For private individuals only. Rates for legal entities and sole traders differ significantly.",
    },
    {
      q: "How accurate is the calculation?",
      a: "The calculation is approximate. The final amount may slightly differ due to the current exchange rate on the clearance date and individual vehicle parameters.",
    },
    {
      q: "Which cars are most cost-efficient to import to Kazakhstan?",
      a: "New electric vehicles (under 1 year): zero recycling fee and preferential duty. New petrol cars under 2 years with engine up to 2,000 cc — optimal customs-to-price ratio.",
    },
    {
      q: "Why is customs clearance so expensive for ICE cars in Uzbekistan?",
      a: "From January 1, 2026 Uzbekistan abolished preferential rates for small-displacement cars. All petrol and diesel cars now pay 15% duty plus a fixed surcharge per cubic centimetre of engine displacement.",
    },
  ],
};

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const meta = META[lang] ?? META.ru;
  const faqs = FAQ[lang] ?? FAQ.ru;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url: `https://www.kmotors.shop/${lang}/calculator`,
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: "K-Axis", url: "https://www.kmotors.shop/" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://www.kmotors.shop/${lang}/` },
        { "@type": "ListItem", position: 2, name: meta.title, item: `https://www.kmotors.shop/${lang}/calculator` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <CalculatorPage lang={lang} />
    </>
  );
}
