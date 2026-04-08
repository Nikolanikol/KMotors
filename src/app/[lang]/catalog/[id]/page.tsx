import CarouselLight from "@/components/Catalog/CarDetail/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarDetail/DetailInfo";
import Header from "@/components/Catalog/CarDetail/Header";
import OptionsRow from "@/components/Catalog/CarDetail/OptionsRow/OptionsRow";
import CustomsCalculator from "@/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator";
import { Button } from "@/components/ui/button";
import Script from "next/script";
import { FC } from "react";
import { formatDate } from "@/utils/formatDate";
import { Metadata } from "next";
import VinMileageSection from "@/components/Catalog/CarDetail/VinRow";

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export async function fetchData(id: string): Promise<any> {
  try {
    return await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`)
      .then((data) => data.json());
  } catch {
    return undefined;
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
  ].join(" ");

  const carDate = formatDate(data?.category?.yearMonth);
  const vin = data?.vin || "N/A";
  const mileage = data?.spec.mileage?.toLocaleString() || "—";
  const price = data?.advertisement?.price
    ? (data.advertisement.price * 10000).toLocaleString()
    : "—";

  const description = `${carName} ${carDate} — VIN: ${vin}, ${mileage} km, ${price} KRW. South Korean car on Kmotors.shop.`;
  const mainPhoto = data?.photos?.[0]?.location
    ? `https://ci.encar.com${data.photos[0].location}`
    : "/noimage.png";

  return {
    title: `${carName} ${carDate} | KMotors`,
    description,
    openGraph: {
      title: `${carName} ${carDate}`,
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
    },
    vin: data?.vin,
    vehicleEngine: {
      "@type": "EngineSpecification",
      fuelType: data?.fuelType || "",
    },
  };

  return (
    <div className="bg-gray-200 py-5 rounded-3xl">
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="product-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto">
        <Header data={data} />
        <VinMileageSection
          vin={data.vin}
          vehicleNo={data.vehicleNo}
          mileage={data.spec.mileage}
        />
        <CarouselLight photos={data.photos} />
        <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
        <CustomsCalculator
          priceKRW={data?.advertisement?.price * 10000}
          yearMonth={data?.category?.yearMonth}
          engineVolume={data?.spec?.displacement ?? 0}
          fuelType={data?.fuel}
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
    </div>
  );
};

export default Page;
