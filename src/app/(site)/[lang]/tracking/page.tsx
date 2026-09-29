import type { Metadata } from "next";
import TrackingClient from "@/app/tracking/TrackingClient";
import { isTrackingIndexed } from "@/lib/emsTracking";
import { makeAlternates } from "@/lib/seo";
import SectionDictionary from "@/components/I18nProvider/SectionDictionary";

const BASE = "https://www.kmotors.shop";

const TRACKING_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Отследить посылку Korea Post EMS — трек-номер онлайн",
    description:
      "Отслеживание посылок из Южной Кореи по трек-номеру EMS. Статусы Korea Post на русском, вся история перемещений, сохранение номеров для повторной проверки.",
  },
  en: {
    title: "Korea Post EMS Tracking — Track Your Parcel Online",
    description:
      "Track EMS parcels from South Korea by tracking number. Korea Post statuses in plain English, full movement history, saved numbers for repeat checks.",
  },
  // ka/ar здесь намеренно НЕТ: страница на них рендерится английским текстом,
  // значит и title с описанием должны быть английскими.
};

const BREADCRUMB_LABEL: Record<string, string> = {
  ru: "Отслеживание посылки",
  en: "Parcel tracking",
};

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  // ka/ar показывают английский текст (fallbackLng у i18next), поэтому и
  // метаданные им отдаём английские — иначе в выдаче был бы грузинский title
  // над английской страницей. Тот же приём, что у калькулятора.
  const meta = TRACKING_META[lang] || TRACKING_META.en;

  // ?n=<номер> — это результат по конкретной посылке. Таких URL столько же,
  // сколько посылок на свете; в индексе им делать нечего, canonical смотрит
  // на чистую страницу (её отдаёт makeAlternates).
  const hasNumber = typeof sp.n === "string" && sp.n.length > 0;
  const noindex = hasNumber || !isTrackingIndexed(lang);

  return {
    title: meta.title,
    description: meta.description,
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE}/${lang}/tracking`,
      // Картинку даёт [lang]/opengraph-image.tsx — заданный здесь images
      // перекрыл бы файловую конвенцию.
    },
    alternates: makeAlternates(lang, "/tracking"),
  };
}

export default async function TrackingPage({ params }: Props) {
  const { lang } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${BASE}/${lang}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: BREADCRUMB_LABEL[lang] || BREADCRUMB_LABEL.en,
        item: `${BASE}/${lang}/tracking`,
      },
    ],
  };

  return (
    <>
      <SectionDictionary lang={lang} sections={["tracking"]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <TrackingClient />
    </>
  );
}
