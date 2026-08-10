import type { Metadata } from "next";
import CalculatorPanel from "@/components/Customs/CalculatorPanel";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/customs/core/registry";
import { getRates } from "@/lib/customs/fx/getRates";
import { customsText, hasCustomsDictionary } from "@/lib/customs/serverDict";
import { makeAlternates } from "@/lib/seo";

/**
 * Курс запекается в HTML в момент рендера, поэтому маршрут обязан
 * перерендериваться не реже, чем живёт кэш курса: правило проекта —
 * revalidate не выше 86400 на любом маршруте, который рендерит цену.
 */
export const revalidate = 21600;

const SITE = "https://www.kmotors.shop";

interface Props {
  params: Promise<{ lang: string }>;
}

/**
 * FAQ перенесён с прежней версии страницы без изменений: разметка
 * FAQPage уже отработала в выдаче, терять её при слиянии незачем.
 */
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
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;

  const title = customsText(lang, "hub.meta.title");
  const description = customsText(lang, "hub.meta.description");
  const translated = hasCustomsDictionary(lang) && Boolean(title);

  return {
    title: title ?? "",
    description: description ?? "",
    alternates: makeAlternates(lang, "/calculator"),
    robots: translated ? undefined : { index: false, follow: true },
    openGraph: {
      title: title ?? "",
      description: description ?? "",
      type: "website",
      url: `${SITE}/${lang}/calculator`,
      images: [
        {
          url: `${SITE}/preview/preview.png`,
          width: 1200,
          height: 630,
          alt: title ?? "",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? "",
      description: description ?? "",
      images: [`${SITE}/preview/preview.png`],
    },
  };
}

/**
 * Главная страница калькулятора: страна по умолчанию плюс общая плашка табов
 * из layout. Семь направлений живут в ОДНОМ интерфейсе — отдельной страницы
 * со ссылками на них нет и быть не должно.
 */
export default async function CalculatorPage({ params }: Props) {
  const { lang } = await params;
  const rates = await getRates();

  const title = customsText(lang, "hub.meta.title");
  const description = customsText(lang, "hub.meta.description");
  const faqs = FAQ[lang] ?? FAQ.ru;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${SITE}/${lang}/calculator`,
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: "K-Axis", url: `${SITE}/` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "K-Axis",
          item: `${SITE}/${lang}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: `${SITE}/${lang}/calculator`,
        },
      ],
    },
    // Перечисляем направления: из главной видно, какие страны покрыты,
    // и у каждой есть собственный адрес.
    mainEntity: {
      "@type": "ItemList",
      itemListElement: COUNTRIES.map((country, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: customsText(lang, `${country.id}.title`) ?? country.id,
        url:
          country.id === DEFAULT_COUNTRY
            ? `${SITE}/${lang}/calculator`
            : `${SITE}/${lang}/calculator/${country.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {title && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
        />
      )}
      <CalculatorPanel countryId={DEFAULT_COUNTRY} rates={rates} />
    </>
  );
}
