import CarouselLight from "@/components/Catalog/CarIdPage/Carousel/Carousel";
import DetailInfo from "@/components/Catalog/CarIdPage/DetailInfo";
import Header from "@/components/Catalog/CarIdPage/Header";
import OptionsRow from "@/components/Catalog/CarIdPage/OptionsRow/OptionsRow";
import { Button } from "@/components/ui/button";
import Script from "next/script";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

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
  const { t } = useTranslation();
  const data = await fetchData(params.id);
  // =================?
  const carName = `${translateGenerationRow(data.category.manufacturerName, t)}
              ${translateGenerationRow(data.category.modelName, t)}
              ${translateGenerationRow(data.category.gradeName, t)}`.trim();
  const carData = formatDate(data.category.yearMonth);
  const mainPhoto = data?.photos?.[0]?.location
    ? `https://ci.encar.com${data.photos[0].location}`
    : "/noimage.png";
  // --- JSON-LD Schema.org Product ---
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: `${carName}`,
    image: [mainPhoto],
    description: `${carName} ${carData} — ${data?.fuelType}, ${data?.transmission}, пробег ${data?.mileage} км. Автомобиль из Южной Кореи, доступен на сайте Kmotors.`,
    sku: data?.vehicleId,
    vinNumber: data.vehicleNo,
    brand: {
      "@type": "Brand",
      name: carName || "Неизвестный бренд",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.kmotors.shop/catalog/${data?.vehicleId}`,
      priceCurrency: "KRW",
      price: data?.price || "0",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
    vehicleConfiguration: `${data?.transmission || ""}, ${
      data?.fuelType || ""
    }`,
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
