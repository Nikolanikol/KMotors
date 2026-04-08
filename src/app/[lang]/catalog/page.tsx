import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { getString } from "@/components/Catalog/Row/utils";
import { getCars } from "@/components/Catalog/Row/utils/service";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Metadata } from "next";

const CATALOG_META: Record<string, { default: string; withBrand: string; description: string }> = {
  ru: {
    default: "Каталог авто из Кореи — Hyundai, Kia, Genesis | KMotors",
    withBrand: "Купить {brand} из Кореи — каталог авто | KMotors",
    description: "Каталог корейских автомобилей из Южной Кореи: Hyundai, Kia, Genesis. Актуальные цены, фото, характеристики. Доставка в Россию, Казахстан, Узбекистан, Грузию.",
  },
  en: {
    default: "Korean Cars Catalog — Hyundai, Kia, Genesis | KMotors",
    withBrand: "Buy {brand} from Korea — car catalog | KMotors",
    description: "Catalog of Korean cars from South Korea: Hyundai, Kia, Genesis. Current prices, photos, specs. Delivery to Russia, Kazakhstan, Uzbekistan, Georgia.",
  },
  ko: {
    default: "한국 자동차 카탈로그 — Hyundai, Kia, Genesis | KMotors",
    withBrand: "한국에서 {brand} 구매 — 자동차 카탈로그 | KMotors",
    description: "한국 자동차 카탈로그: Hyundai, Kia, Genesis. 최신 가격, 사진, 사양. 러시아, 카자흐스탄, 우즈베키스탄, 조지아 배송.",
  },
  ka: {
    default: "კორეული ავტომობილების კატალოგი — Hyundai, Kia, Genesis | KMotors",
    withBrand: "შეიძინეთ {brand} კორეიდან — კატალოგი | KMotors",
    description: "კორეული ავტომობილების კატალოგი: Hyundai, Kia, Genesis. აქტუალური ფასები, ფოტოები, მახასიათებლები. მიტანა საქართველოში.",
  },
  ar: {
    default: "كتالوج السيارات الكورية — Hyundai وKia وGenesis | KMotors",
    withBrand: "اشتر {brand} من كوريا — كتالوج السيارات | KMotors",
    description: "كتالوج السيارات الكورية من كوريا الجنوبية: Hyundai وKia وGenesis. أسعار حالية، صور، مواصفات. التوصيل إلى روسيا وكازاخستان وأوزبكستان.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: CarSearchParams;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const meta = CATALOG_META[lang] || CATALOG_META.ru;

  const manufacture = sp.manufacture?.slice(1) || "";
  const yearMin = sp.yearMin || "";
  const yearMax = sp.yearMax || "";
  const priceMax = sp.priceMax || "";

  let title = meta.default;
  if (manufacture) title = meta.withBrand.replace("{brand}", manufacture);

  const descParts: string[] = [];
  if (manufacture) descParts.push(manufacture);
  if (yearMin && yearMax) descParts.push(`${yearMin}–${yearMax}`);
  if (priceMax) descParts.push(`≤${Number(priceMax).toLocaleString()} KRW`);

  const description = descParts.length > 0
    ? `${meta.description} ${descParts.join(", ")}.`
    : meta.description;

  const canonical = manufacture
    ? `https://kmotors.shop/${lang}/catalog?manufacture=.${manufacture}`
    : `https://kmotors.shop/${lang}/catalog`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical,
      languages: {
        ru: "https://kmotors.shop/ru/catalog",
        en: "https://kmotors.shop/en/catalog",
        ko: "https://kmotors.shop/ko/catalog",
        ka: "https://kmotors.shop/ka/catalog",
        ar: "https://kmotors.shop/ar/catalog",
        "x-default": "https://kmotors.shop/ru/catalog",
      },
    },
  };
}

const CATALOG_LABEL: Record<string, string> = {
  ru: "Каталог", en: "Catalog", ko: "카탈로그", ka: "კატალოგი", ar: "الكتالوج",
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CATALOG_LABEL[lang] || "Catalog", item: `https://kmotors.shop/${lang}/catalog` },
    ],
  };

  // ItemList schema — fetch deduplicated by Next.js cache (same call as CarsRow)
  let itemListSchema = null;
  try {
    const query = getString(sp);
    const { data } = await getCars(query, sp.page);
    if (data && data.length > 0) {
      itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: CATALOG_LABEL[lang] || "Catalog",
        url: `https://kmotors.shop/${lang}/catalog`,
        numberOfItems: data.length,
        itemListElement: data.map((car: { Id: string; Manufacturer?: string; Model?: string; Year?: string; Price?: string }, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://kmotors.shop/${lang}/catalog/${car.Id}`,
          name: [car.Manufacturer, car.Model, car.Year].filter(Boolean).join(" "),
        })),
      };
    }
  } catch {
    // schema is optional — don't break page if fetch fails
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 h-full m-0 mx-auto">
          <div className="col-span-1 lg:col-span-4 h-full px-1 py-2">
            <Filter />
          </div>
          <div className="col-span-1 lg:col-span-8 h-full">
            <CarsRow searchParams={searchParams} />
          </div>
        </div>
      </div>
    </>
  );
}
