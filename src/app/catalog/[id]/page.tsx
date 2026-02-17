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
  params: {
    id: string;
  };
}
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchData(params?.id);

  if (!data || data === undefined)
    return { title: "Автомобиль | KMotors", description: "" };
  const carName = [
    data.category.manufacturerEnglishName,
    data.category.modelGroupEnglishName,
    data.category.gradeDetailEnglishName,
    data.category.gradeEnglishName,
  ].join(" ");

  const carData = formatDate(data?.category?.yearMonth);
  const vin = data?.vin || "не указано";
  const mileage = data?.spec.mileage?.toLocaleString() || "неизвестно";
  const price = data?.advertisement?.price
    ? (data.advertisement.price * 10000).toLocaleString()
    : "не указана";

  const description = `${carName} ${carData} — VIN: ${vin}, пробег: ${mileage} км, цена: ${price} KRW. Автомобиль из Южной Кореи, доступен на Kmotors.shop.`;

  return {
    title: `${carName} ${carData} — VIN: ${vin} | KMotors`,
    description,
    openGraph: {
      title: `${carName} ${carData} — VIN: ${vin}`,
      description,
      images: [
        data?.photos?.[0]?.location
          ? `https://ci.encar.com${data.photos[0].location}`
          : "/noimage.png",
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${carName} ${carData} — VIN: ${vin}`,
      description,
      images: [
        data?.photos?.[0]?.location
          ? `https://ci.encar.com${data.photos[0].location}`
          : "/noimage.png",
      ],
    },
  };
}

export async function fetchData(id: string): Promise<any> {
  try {
    return await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`)
      .then((data) => data.json())
      .then((res) => res);
  } catch (error) {}
}
const Page: FC<PageProps> = async ({ params }) => {
  const data = await fetchData(params.id);
  if (data === undefined) return <div>not found</div>;
  // =================?
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
  // --- JSON-LD Schema.org Product ---
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: [
      data.category.manufacturerEnglishName,
      data.category.modelGroupEnglishName,
      data.category.gradeDetailEnglishName,
      data.category.gradeEnglishName,
    ].join(" "),
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.category.gradeEnglishName}, ${data?.spec.mileage} км. Автомобиль из Южной Кореи, доступен на сайте Kmotors.`,

    brand: {
      "@type": "Brand",
      name: carName || "Неизвестный бренд",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.kmotors.shop/catalog/${data?.vehicleId}`,
      priceCurrency: "KRW",
      price: data?.advertisement?.price * 10000,

      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
    vehicleConfiguration: `${data?.transmission || ""}, ${
      data?.fuelType || ""
    }`,
    vin: data?.vin,
    vehicleEngine: {
      "@type": "EngineSpecification",
      fuelType: data?.fuelType || "",
    },
  };

  return (
    <div className="bg-gray-200 py-5 rounded-3xl">
      <Script
        id="product-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto ">
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
              href={
                "https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=" +
                data?.vehicleId
              }
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

// ===================
