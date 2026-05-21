import CarouselLight from "@/components/Catalog/CarDetail/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarDetail/DetailInfo";
import OptionsRow from "@/components/Catalog/CarDetail/OptionsRow/OptionsRow";
import CustomsCalculator from "@/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator";
import StickyMobileCTA from "@/components/Catalog/CarDetail/StickyMobileCTA";
import CarViewTracker from "@/components/Catalog/CarDetail/CarViewTracker";
import CarDetailSidebar from "@/components/Catalog/CarDetail/CarDetailSidebar";
import { FC } from "react";
import { formatDate } from "@/utils/formatDate";
import { Metadata } from "next";
import VinMileageSection from "@/components/Catalog/CarDetail/VinRow";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const data = await fetchData(id);

  if (!data) return { title: "Car | K-Axis", description: "" };

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

  const TITLE: Record<string, string> = {
    ru: `${carName} ${year} из Кореи — цена, доставка | K-Axis`,
    en: `${carName} ${year} from Korea — price, delivery | K-Axis`,
    ko: `한국산 ${carName} ${year} — 가격, 배송 | K-Axis`,
    ka: `${carName} ${year} კორეიდან — ფასი, მიტანა | K-Axis`,
    ar: `${carName} ${year} من كوريا — السعر والتوصيل | K-Axis`,
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
  const mainPhoto = data?.photos?.[0]?.location
    ? `https://ci.encar.com${data.photos[0].location}`
    : "/noimage.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [mainPhoto],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [mainPhoto],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/catalog/${id}`,
      languages: {
        ru: `https://kmotors.shop/ru/catalog/${id}`,
        en: `https://kmotors.shop/en/catalog/${id}`,
        ko: `https://kmotors.shop/ko/catalog/${id}`,
        ka: `https://kmotors.shop/ka/catalog/${id}`,
        ar: `https://kmotors.shop/ar/catalog/${id}`,
        "x-default": `https://kmotors.shop/ru/catalog/${id}`,
      },
    },
  };
}

const Page: FC<{ params: Promise<{ lang: string; id: string }> }> = async ({ params }) => {
  const { lang, id } = await params;
  const data = await fetchData(id);
  if (!data) return <div>not found</div>;

  const carName = [
    data.category.manufacturerEnglishName,
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ].join(" ");
  const carData = formatDate(data?.category?.yearMonth);
  const rates = await getCurrencyRates();
  const mainPhoto = data?.photos?.[0]?.location
    ? `https://ci.encar.com${data.photos[0].location}`
    : "/noimage.png";

  const CATALOG_LABEL: Record<string, string> = {
    ru: "Каталог", en: "Catalog", ko: "카탈로그", ka: "კატალოგი", ar: "الكتالوج",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CATALOG_LABEL[lang] || "Catalog", item: `https://kmotors.shop/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: carName, item: `https://kmotors.shop/${lang}/catalog/${id}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: carName,
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.spec.mileage} km. South Korean car on K-Axis.`,
    brand: { "@type": "Brand", name: data.category.manufacturerEnglishName || "Unknown" },
    offers: {
      "@type": "Offer",
      url: `https://kmotors.shop/${lang}/catalog/${data?.vehicleId}`,
      priceCurrency: "KRW",
      price: data?.advertisement?.price * 10000,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: "0",
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
            maxValue: 30,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 7,
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
    vin: data?.vin,
    vehicleEngine: {
      "@type": "EngineSpecification",
      fuelType: data?.fuelType || "",
    },
  };

  const fullCarName = `${carName} ${carData}`;
  const photoLabel = ({ ru: "фото", en: "photo", ko: "사진", ka: "ფოტო", ar: "صورة" } as Record<string, string>)[lang] || "photo";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--axis-black)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Car title */}
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight" style={{ color: "var(--axis-white)" }}>
            {data.category.manufacturerName}{" "}
            <span style={{ color: "var(--axis-orange)" }}>{data.category.modelName}</span>{" "}
            {data.category.gradeName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.3)" }}>
              {carData}
            </span>
            <span className="text-xs" style={{ color: "var(--axis-gray)" }}>ID: {id}</span>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left column */}
          <div className="space-y-5 car-detail-dark min-w-0 overflow-hidden">
            <CarouselLight photos={data.photos} carName={fullCarName} photoLabel={photoLabel} />
            <VinMileageSection vin={data.vin} vehicleNo={data.vehicleNo} mileage={data.spec.mileage} />
            <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
            <OptionsRow data={data.options} />
          </div>

          {/* Right sticky column */}
          <div className="lg:sticky lg:top-[88px] h-fit min-w-0">
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

      <StickyMobileCTA carId={id} carName={fullCarName} />
      <CarViewTracker carId={id} carName={fullCarName} />
    </div>
  );
};

export default Page;
