import CarouselLight from "@/components/Catalog/CarDetail/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarDetail/DetailInfo";
import Header from "@/components/Catalog/CarDetail/Header";
import OptionsRow from "@/components/Catalog/CarDetail/OptionsRow/OptionsRow";
import CustomsCalculator from "@/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator";
import CarRequestForm from "@/components/Catalog/CarDetail/CarRequestForm";
import StickyMobileCTA from "@/components/Catalog/CarDetail/StickyMobileCTA";
import CarViewTracker from "@/components/Catalog/CarDetail/CarViewTracker";
import { Button } from "@/components/ui/button";
import { FC } from "react";
import { formatDate } from "@/utils/formatDate";
import { Metadata } from "next";
import VinMileageSection from "@/components/Catalog/CarDetail/VinRow";

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

  if (!data) return { title: "Car | KMotors", description: "" };

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
    ru: `${carName} ${year} из Кореи — цена, доставка | KMotors`,
    en: `${carName} ${year} from Korea — price, delivery | KMotors`,
    ko: `한국산 ${carName} ${year} — 가격, 배송 | KMotors`,
    ka: `${carName} ${year} კორეიდან — ფასი, მიტანა | KMotors`,
    ar: `${carName} ${year} من كوريا — السعر والتوصيل | KMotors`,
  };

  const DESCRIPTION: Record<string, string> = {
    ru: `Купить ${carName} ${year} из Кореи${rubPrice ? ` — от ${rubPrice} ₽ под ключ` : ""}. Пробег ${mileage} км. Личный осмотр в Сувоне, доставка 3–6 недель. KMotors.`,
    en: `Buy ${carName} ${year} from South Korea. Mileage ${mileage} km. Personal inspection in Suwon, delivery in 3–6 weeks. KMotors.`,
    ko: `${carName} ${year} 한국에서 구매. 주행거리 ${mileage} km. 수원 현지 직접 검사, 3–6주 배송. KMotors.`,
    ka: `${carName} ${year} კორეიდან შეძენა. გარბენი ${mileage} კმ. პირადი დათვალიერება სუვონში, მიტანა 3–6 კვირა. KMotors.`,
    ar: `شراء ${carName} ${year} من كوريا الجنوبية. المسافة ${mileage} كم. فحص شخصي في سوون، التوصيل 3–6 أسابيع. KMotors.`,
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
      title: `${carName} ${carDate}`,
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
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: CATALOG_LABEL[lang] || "Catalog", item: `https://kmotors.shop/${lang}/catalog` },
      { "@type": "ListItem", position: 3, name: carName, item: `https://kmotors.shop/${lang}/catalog/${id}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: carName,
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.spec.mileage} km. South Korean car on Kmotors.`,
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

  return (
    <div className="bg-gray-200 py-5 rounded-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto">
        <Header data={data} />

        {/* Шаг 4: форма заявки сразу под ценой */}
        <div className="mt-4 bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
          <p className="font-bold text-lg mb-1">Хочу эту машину</p>
          <p className="text-sm text-gray-500 mb-4">
            Менеджер свяжется в течение 1 часа и расскажет об условиях доставки
          </p>
          <CarRequestForm carId={id} carName={`${carName} ${carData}`} />
        </div>

        <VinMileageSection
          vin={data.vin}
          vehicleNo={data.vehicleNo}
          mileage={data.spec.mileage}
        />
        <CarouselLight
          photos={data.photos}
          carName={`${carName} ${carData}`}
          photoLabel={{ ru: "фото", en: "photo", ko: "사진", ka: "ფოტო", ar: "صورة" }[lang] || "photo"}
        />
        <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
        <CustomsCalculator
          priceKRW={data?.advertisement?.price * 10000}
          yearMonth={data?.category?.yearMonth}
          engineVolume={data?.spec?.displacement ?? 0}
          fuelType={data?.spec?.fuelName}
          carId={id}
          carName={`${carName} ${carData}`}
        />
        <div className="flex items-center justify-center mt-6">
          <Button className="py-3 px-6 text-lg" variant="destructive">
            <a
              target="_blank"
              href={"https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=" + data?.vehicleId}
            >
              Просмотреть подробный отчет
            </a>
          </Button>
        </div>
        <OptionsRow data={data.options} />
      </div>

      {/* Шаг 5: sticky CTA на мобильном */}
      <StickyMobileCTA carId={id} carName={`${carName} ${carData}`} />
      <CarViewTracker carId={id} carName={`${carName} ${carData}`} />
    </div>
  );
};

export default Page;
