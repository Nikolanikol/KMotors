import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { MODEL_PAGES } from "@/data/model-pages";
import CarouselLight from "@/components/Catalog/CarDetail/Carousel/Carousel";
import VinMileageSection from "@/components/Catalog/CarDetail/VinRow";
import { FC } from "react";
import { formatDate } from "@/utils/formatDate";
import { Metadata } from "next";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

// Lazy load — не нужны сразу при загрузке
const DetailInfo = dynamic(() => import("@/components/Catalog/CarDetail/DetailInfo"));
const OptionsRow = dynamic(() => import("@/components/Catalog/CarDetail/OptionsRow/OptionsRow"));
const CustomsCalculator = dynamic(() => import("@/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator"));
const CarDetailSidebar = dynamic(() => import("@/components/Catalog/CarDetail/CarDetailSidebar"));
const CarDescription = dynamic(() => import("@/components/Catalog/CarDetail/CarDescription"));
const StickyMobileCTA = dynamic(() => import("@/components/Catalog/CarDetail/StickyMobileCTA"));
const CarViewTracker = dynamic(() => import("@/components/Catalog/CarDetail/CarViewTracker"));

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export async function fetchData(id: string): Promise<any> {
  // Основной источник — прямой Encar API, кэш 1 час
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Encar ${res.status}`);
    return await res.json();
  } catch {
    // Fallback: тот же прокси что использует каталог
    try {
      const res = await fetch(
        `https://encar-proxy-main.onrender.com/api/vehicle/${id}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      return await res.json();
    } catch {
      return undefined;
    }
  }
}

// Separate fast fetch for metadata — strict 1.5s timeout so WhatsApp never waits too long
async function fetchDataFast(id: string) {
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const data = await fetchDataFast(id);

  // If API is slow → return fast generic metadata, WhatsApp gets it instantly
  if (!data) return {
    title: `Авто из Кореи`,
    description: "Купить автомобиль из Южной Кореи. Доставка 3–6 недель. K-Axis.",
    openGraph: { title: "Авто из Кореи", description: "Купить автомобиль из Южной Кореи.", type: "website" },
    alternates: { canonical: `https://www.kmotors.shop/${lang}/catalog/${id}` },
  };

  const carName = [
    data.category.manufacturerEnglishName,
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ].filter(Boolean).join(" ");

  const year = formatDate(data?.category?.yearMonth);
  const mileage = data?.spec.mileage?.toLocaleString("ru-RU") || "—";
  const krwPrice = data?.advertisement?.price
    ? data.advertisement.price * 10000
    : null;

  // Приблизительная цена в рублях для RU описания
  const rubPrice = krwPrice ? Math.round(krwPrice * 0.065).toLocaleString("ru-RU") : null;

  // Обрезаем carName если слишком длинный (лимит title ~60 символов)
  const shortCarName = carName.length > 40 ? carName.slice(0, 38) + "…" : carName;

  const TITLE: Record<string, string> = {
    ru: `${shortCarName} ${year} из Кореи`,
    en: `${shortCarName} ${year} from Korea`,
    ko: `한국산 ${shortCarName} ${year}`,
    ka: `${shortCarName} ${year} კორეიდან`,
    ar: `${shortCarName} ${year} من كوريا`,
  };

  const DESCRIPTION: Record<string, string> = {
    ru: `Купить ${carName} ${year} из Кореи${rubPrice ? ` — от ${rubPrice} ₽ под ключ` : ""}. Пробег ${mileage} км. Личный осмотр в Сувоне, доставка 3–6 недель. K-Axis.`,
    en: `Buy ${carName} ${year} from South Korea. Mileage ${mileage} km. Personal inspection in Suwon, delivery in 3–6 weeks. K-Axis.`,
    ko: `${carName} ${year} 한국에서 구매. 주행거리 ${mileage} km. 수원 현지 직접 검사, 3–6주 배송. K-Axis.`,
    ka: `${carName} ${year} კორეიდან შეძენა. გარბენი ${mileage} კმ. პირადი დათვალიერება სუვონში, მიტანა 3–6 კვირა. K-Axis.`,
    ar: `شراء ${carName} ${year} من كوريا الجنوبية. المسافة ${mileage} كم. فحص شخصي في سوون، التوصيل 3–6 أسابيع. K-Axis.`,
  };

  const title = TITLE[lang] ?? TITLE.ru;
  const description = DESCRIPTION[lang] ?? DESCRIPTION.ru;

  // Sort photos same way as Carousel (OUTER first) and get direct encar URL
  // WhatsApp fetches this directly — no latency from our server
  const TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };
  const sortedPhotos = [...(data?.photos || [])].sort((a: any, b: any) => {
    const typeA = TYPE_ORDER[a.type] ?? 1;
    const typeB = TYPE_ORDER[b.type] ?? 1;
    if (typeA !== typeB) return typeA - typeB;
    return (a.code || "").localeCompare(b.code || "", undefined, { numeric: true });
  });
  const ogImage = sortedPhotos[0]?.path
    ? `https://ci.encar.com${sortedPhotos[0].path}?impolicy=heightRate&rh=630&cw=1200&ch=630&cg=Center`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: carName }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.kmotors.shop/${lang}/catalog/${id}`,
      languages: {
        ru: `https://www.kmotors.shop/ru/catalog/${id}`,
        en: `https://www.kmotors.shop/en/catalog/${id}`,
        ko: `https://www.kmotors.shop/ko/catalog/${id}`,
        ka: `https://www.kmotors.shop/ka/catalog/${id}`,
        ar: `https://www.kmotors.shop/ar/catalog/${id}`,
        "x-default": `https://www.kmotors.shop/ru/catalog/${id}`,
      },
    },
  };
}

const Page: FC<{ params: Promise<{ lang: string; id: string }> }> = async ({ params }) => {
  const { lang, id } = await params;
  const data = await fetchData(id);
  if (!data) redirect(`/${lang}/catalog`);

  const carName = [
    data.category.manufacturerEnglishName,
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ].join(" ");
  const carData = formatDate(data?.category?.yearMonth);
  const rates = await getCurrencyRates();
  const mainPhoto = data?.photos?.[0]?.path
    ? `https://ci.encar.com${data.photos[0].path}`
    : null;

  const CATALOG_LABEL: Record<string, string> = {
    ru: "Каталог", en: "Catalog", ko: "카탈로그", ka: "კატალოგი", ar: "الكتالوج",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://www.kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CATALOG_LABEL[lang] || "Catalog", item: `https://www.kmotors.shop/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: carName, item: `https://www.kmotors.shop/${lang}/catalog/${id}` },
    ],
  };

  // Map Korean fuel names → schema.org vocabulary
  const fuelMap: Record<string, string> = {
    "가솔린": "https://schema.org/Gasoline",
    "디젤":   "https://schema.org/Diesel",
    "전기":   "https://schema.org/Electric",
    "LPG":    "https://schema.org/LPG",
    "lpg":    "https://schema.org/LPG",
    "하이브리드":     "https://schema.org/Hybrid",
    "플러그인하이브리드": "https://schema.org/Hybrid",
    "수소":   "https://schema.org/Hydrogen",
  };
  const rawFuel: string = data?.spec?.fuelName ?? "";
  const schemaFuel = Object.entries(fuelMap).find(([k]) => rawFuel.includes(k))?.[1];

  // vehicleModelDate: "YYYY-MM" from yearMonth "YYYYMM"
  const ym: string = data?.category?.yearMonth ?? "";
  const vehicleModelDate = ym.length >= 6 ? `${ym.slice(0, 4)}-${ym.slice(4, 6)}` : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Car",
    name: carName,
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.spec?.mileage?.toLocaleString("en-US")} km. South Korean car on K-Axis.`,
    brand: { "@type": "Brand", name: data.category.manufacturerEnglishName || "Unknown" },
    ...(data?.vin              && { vehicleIdentificationNumber: data.vin }),
    ...(vehicleModelDate       && { vehicleModelDate }),
    ...(data?.spec?.mileage    && {
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: data.spec.mileage,
        unitCode: "KMT",
      },
    }),
    ...(data?.spec?.displacement && {
      vehicleEngine: {
        "@type": "EngineSpecification",
        engineDisplacement: {
          "@type": "QuantitativeValue",
          value: data.spec.displacement,
          unitCode: "CMQ",
        },
        ...(schemaFuel && { fuelType: schemaFuel }),
      },
    }),
    offers: {
      "@type": "Offer",
      url: `https://www.kmotors.shop/${lang}/catalog/${data?.vehicleId}`,
      priceCurrency: "KRW",
      price: data?.advertisement?.price * 10000,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: "K-Axis",
        url: "https://www.kmotors.shop",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: "1500",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RU",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 7,
            maxValue: 14,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 14,
            maxValue: 30,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "RU",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
  };

  const fullCarName = `${carName} ${carData}`;
  const krwPrice = data?.advertisement?.price ? data.advertisement.price * 10000 : null;

  // Ищем совпадение в MODEL_PAGES для правильного catalogFilter
  const mfrLower = (data.category.manufacturerEnglishName ?? "").toLowerCase();
  const mdlClean = (data.category.modelGroupEnglishName ?? "")
    .split("(")[0].replace(/THE NEW |NEW |ALL NEW /gi, "").trim().toLowerCase();
  const matchedModel = MODEL_PAGES.find((m) =>
    mfrLower.includes(m.manufacturerEn.toLowerCase()) &&
    mdlClean.includes(m.modelEn.toLowerCase())
  );
  const catalogFilter = matchedModel?.catalogFilter ?? "";
  const photoLabel = ({ ru: "фото", en: "photo", ko: "사진", ka: "ფოტო", ar: "صورة" } as Record<string, string>)[lang] || "photo";

  // Sort: OUTER → OPTION → INNER, within each group sort by code ascending
  const TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };
  const sortedPhotos = [...(data.photos || [])].sort((a: any, b: any) => {
    const typeA = TYPE_ORDER[a.type] ?? 1;
    const typeB = TYPE_ORDER[b.type] ?? 1;
    if (typeA !== typeB) return typeA - typeB;
    return (a.code || "").localeCompare(b.code || "", undefined, { numeric: true });
  });

  return (
    <div className="min-h-screen pb-24 lg:pb-0" style={{ backgroundColor: "var(--axis-black)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Three column layout: [calculator] | [photos + specs] | [price + form + seller] */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-5">

          {/* Col 1 — Калькулятор (sticky) */}
          {data?.advertisement?.price && (
            <div className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:overflow-x-hidden h-fit min-w-0 car-detail-dark order-2 lg:order-1" style={{ scrollbarWidth: "none" }}>
              <CustomsCalculator
                priceKRW={data.advertisement.price * 10000}
                yearMonth={data?.category?.yearMonth || ""}
                engineVolume={data?.spec?.displacement ?? 0}
                fuelType={data?.spec?.fuelName}
                carId={id}
                carName={fullCarName}
              />
            </div>
          )}

          {/* Col 2 — Заголовок + Фото, VIN, спеки, опции */}
          <div className="space-y-5 car-detail-dark min-w-0 overflow-hidden order-1 lg:order-2">
            {/* Car title — над фото, в центральной колонке */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight" style={{ color: "var(--axis-white)" }}>
                {data.category.manufacturerEnglishName}{" "}
                <span style={{ color: "var(--axis-orange)" }}>{data.category.modelGroupEnglishName}</span>{" "}
                {data.category.gradeEnglishName}
                {data.category.gradeDetailEnglishName ? ` ${data.category.gradeDetailEnglishName}` : ""}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.3)" }}>
                  {carData}
                </span>
              </div>
            </div>
            <CarouselLight photos={sortedPhotos} carName={fullCarName} photoLabel={photoLabel} />

            {/* Цена — только мобиль, сразу под фото */}
            {data?.advertisement?.price && (
              <div className="lg:hidden rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))", boxShadow: "0 4px 20px rgba(255,69,0,0.25)" }}>
                <div>
                  <p className="text-white/70 text-xs mb-0.5">Цена покупки</p>
                  <p className="text-white text-2xl font-bold leading-tight">
                    {(data.advertisement.price * 10000).toLocaleString("ru-RU")} <span className="text-base font-normal">вон</span>
                  </p>
                  {rates.krwToRub && (
                    <p className="text-white/80 text-sm mt-0.5">
                      ≈ {Math.round(data.advertisement.price * 10000 * rates.krwToRub).toLocaleString("ru-RU")} ₽
                    </p>
                  )}
                </div>
              </div>
            )}
            <VinMileageSection vin={data.vin} vehicleNo={data.vehicleNo} mileage={data.spec.mileage} />
            <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
            <OptionsRow data={data.options} />
          </div>

          {/* Col 3 — Цена, форма, продавец (sticky) */}
          <div className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:overflow-x-hidden h-fit min-w-0 order-3" style={{ scrollbarWidth: "none" }}>
            <CarDetailSidebar
              data={data}
              id={id}
              carName={fullCarName}
              krwToRub={rates.krwToRub}
              krwToUsd={rates.krwToUsd}
              lang={lang}
              priceKRW={data?.advertisement?.price * 10000}
              yearMonth={data?.category?.yearMonth}
              engineVolume={data?.spec?.displacement ?? 0}
              fuelType={data?.spec?.fuelName}
            />
          </div>
        </div>
      </div>

      {/* Блок описания модели — виден пользователям и индексируется Google */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <CarDescription
          lang={lang}
          manufacturer={data.category.manufacturerEnglishName ?? ""}
          model={data.category.modelGroupEnglishName ?? ""}
          yearMonth={data?.category?.yearMonth ?? ""}
          mileage={data.spec?.mileage ?? 0}
          displacement={data.spec?.displacement ?? 0}
          fuelName={data.spec?.fuelName ?? ""}
          catalogFilter={catalogFilter}
        />
      </div>

      <StickyMobileCTA carId={id} carName={fullCarName} />
      <CarViewTracker carId={id} carName={fullCarName} price={krwPrice ?? undefined} />
    </div>
  );
};

export default Page;
