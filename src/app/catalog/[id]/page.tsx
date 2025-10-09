import CarouselLight from "@/components/Catalog/CarIdPage/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarIdPage/DetailInfo";
import Header from "@/components/Catalog/CarIdPage/Header";
import OptionsRow from "@/components/Catalog/CarIdPage/OptionsRow/OptionsRow";
import { Button } from "@/components/ui/button";
import Script from "next/script";

import { FC } from "react";

import { formatDate } from "@/utils/formatDate";
import { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
}
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchData(params?.id);
  if (!data) return { title: "Автомобиль | KMotors", description: "" };

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
  } catch (error) {
    console.log(error);
  }
}
const Page: FC<PageProps> = async ({ params }) => {
  const data = await fetchData(params.id);

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
        <div className="flex flex-col md:flex-row justify-between text-sm text-gray-600 gap-2">
          <p className="flex flex-wrap gap-2">
            <span>
              VIN: <span className="font-mono">{data.vin || "не указано"}</span>
            </span>
            <span>| Номер: {data.vehicleNo}</span>
          </p>
          <span className="font-semibold text-gray-800">
            Пробег: {data.spec.mileage.toLocaleString()} км
          </span>
        </div>
        <CarouselLight photos={data.photos} />
        <OptionsRow data={data.options} />
        <DetailInfo id={data?.vehicleId} carnumber={data?.vehicleNo} />
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
      </div>
    </div>
  );
};

export default Page;
