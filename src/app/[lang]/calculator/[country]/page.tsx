import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CalculatorPanel from "@/components/Customs/CalculatorPanel";
import { COUNTRIES, type CountryId } from "@/lib/customs/core/registry";
import { getRates } from "@/lib/customs/fx/getRates";
import { customsText, hasCustomsDictionary } from "@/lib/customs/serverDict";
import { makeAlternates } from "@/lib/seo";

/**
 * Курс запекается в HTML в момент рендера, поэтому маршрут обязан
 * перерендериваться не реже, чем живёт кэш курса: правило проекта —
 * revalidate не выше 86400 на любом маршруте, который рендерит цену.
 * Шесть часов совпадают с TTL запросов к провайдерам в слое fx.
 */
export const revalidate = 21600;

const SITE = "https://www.kmotors.shop";

interface Props {
  params: Promise<{ lang: string; country: string }>;
}

function isKnownCountry(value: string): value is CountryId {
  return COUNTRIES.some((country) => country.id === value);
}

/**
 * `generateStaticParams` здесь СОЗНАТЕЛЬНО нет, и добавлять его бесполезно.
 *
 * Корневой layout читает куки (`src/app/layout.tsx`), а это переводит всё
 * дерево под ним в динамический рендер: пререндер на сборке невозможен ни
 * для одного маршрута под `[lang]` — их 55 из 59 помечены `ƒ`. Проверено:
 * список из lang × country дал пустой prerender-manifest и пустой каталог
 * `.next/server/app/ru/calculator`.
 *
 * На рантайм это не влияет. Пометка `ƒ` значит только «не пререндерено на
 * сборке»; маршрут всё равно кешируется после первого рендера и подчиняется
 * `revalidate` — см. разбор двух ложных следов в docs/postmortems.md.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, country } = await params;
  if (!isKnownCountry(country)) return {};

  const title = customsText(lang, `${country}.meta.title`);
  const description = customsText(lang, `${country}.meta.description`);
  const translated = hasCustomsDictionary(lang) && Boolean(title);

  return {
    title: title ?? "",
    description: description ?? "",
    alternates: makeAlternates(lang, `/calculator/${country}`),
    // Страница без перевода состоит из сырых ключей — в индекс её пускать
    // нельзя. Условие снимется само, когда словарь языка заполнят.
    robots: translated ? undefined : { index: false, follow: true },
    openGraph: {
      title: title ?? "",
      description: description ?? "",
      type: "website",
      url: `${SITE}/${lang}/calculator/${country}`,
    },
  };
}

export default async function CountryCalculatorPage({ params }: Props) {
  const { lang, country } = await params;
  if (!isKnownCountry(country)) notFound();

  // Курсы получает серверный слой: нет CORS-сюрпризов, лимиты провайдеров под
  // контролем, и значения попадают в HTML первого ответа, а не подгружаются
  // после гидратации.
  const rates = await getRates();

  const title = customsText(lang, `${country}.meta.title`);
  const description = customsText(lang, `${country}.meta.description`);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${SITE}/${lang}/calculator/${country}`,
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
          name: customsText(lang, "hub.heading") ?? "",
          item: `${SITE}/${lang}/calculator`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: `${SITE}/${lang}/calculator/${country}`,
        },
      ],
    },
  };

  return (
    <>
      {title && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
        />
      )}
      <CalculatorPanel countryId={country} rates={rates} />
    </>
  );
}
