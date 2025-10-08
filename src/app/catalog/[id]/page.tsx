import CarouselLight from "@/components/Catalog/CarIdPage/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarIdPage/DetailInfo";
import Header from "@/components/Catalog/CarIdPage/Header";
import OptionsRow from "@/components/Catalog/CarIdPage/OptionsRow/OptionsRow";
import { Button } from "@/components/ui/button";
import Script from "next/script";

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/formatDate";

interface PageProps {
  params: {
    id: string;
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
  console.log(data);
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
    description: `${carName} ${carData} — ${data?.fuel}, ${data?.carShape} км. Автомобиль из Южной Кореи, доступен на сайте Kmotors.`,

    brand: {
      "@type": "Brand",
      name: carName || "Неизвестный бренд",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.kmotors.shop/catalog/${data?.vehicleId}`,
      priceCurrency: "KRW",
      price: {
        price: data?.advertisement?.price * 10000,
      },
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
