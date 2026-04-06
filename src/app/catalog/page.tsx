import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const params = await searchParams;

  const manufacture = params.manufacture?.slice(1) || "";
  const yearMin   = params.yearMin   || "";
  const yearMax   = params.yearMax   || "";
  const priceMin  = params.priceMin  || "";
  const priceMax  = params.priceMax  || "";
  const mileageMax = params.mileageMax || "";

  // --- Title ---
  let title = "Каталог авто из Кореи — Hyundai, Kia, Genesis | KMotors";
  if (manufacture && yearMin && yearMax) {
    title = `${manufacture} ${yearMin}–${yearMax} г.в. из Кореи — каталог | KMotors`;
  } else if (manufacture) {
    title = `Купить ${manufacture} из Кореи — каталог авто | KMotors`;
  } else if (yearMin && yearMax) {
    title = `Авто из Кореи ${yearMin}–${yearMax} г.в. — каталог | KMotors`;
  } else if (yearMin) {
    title = `Авто из Кореи от ${yearMin} г.в. — каталог | KMotors`;
  } else if (priceMax) {
    title = `Авто из Кореи до ${Number(priceMax).toLocaleString("ru")} вон — каталог | KMotors`;
  }

  // --- Description ---
  const parts: string[] = [];
  if (manufacture) parts.push(manufacture);
  if (yearMin && yearMax) parts.push(`${yearMin}–${yearMax} г.в.`);
  else if (yearMin) parts.push(`от ${yearMin} г.в.`);
  if (priceMin && priceMax) parts.push(`цена ${Number(priceMin).toLocaleString("ru")}–${Number(priceMax).toLocaleString("ru")} вон`);
  else if (priceMax) parts.push(`до ${Number(priceMax).toLocaleString("ru")} вон`);
  if (mileageMax) parts.push(`пробег до ${Number(mileageMax).toLocaleString("ru")} км`);

  const description = parts.length > 0
    ? `Каталог ${parts.join(", ")} из Южной Кореи. Актуальные цены, фото, характеристики. Доставка в Россию, Казахстан, Узбекистан, Грузию. KMotors.`
    : "Каталог корейских автомобилей из Южной Кореи: Hyundai, Kia, Genesis, SsangYong. Актуальные цены, фото, характеристики. Доставка в Россию, Казахстан, Узбекистан, Грузию. KMotors (кмоторс).";

  // --- Keywords ---
  const keywords = [
    manufacture ? `${manufacture} из Кореи` : "авто из Кореи",
    manufacture ? `купить ${manufacture} из Кореи` : "купить авто из Кореи",
    yearMin ? `авто ${yearMin} года из Кореи` : "каталог корейских авто",
    priceMax ? `авто из Кореи до ${priceMax} вон` : "корейские автомобили цены",
    "кмоторс каталог",
    "Hyundai из Кореи",
    "Kia из Кореи",
    "Genesis из Кореи",
  ];

  // --- Canonical (только manufacture попадает в canonical, остальные фильтры — client-side) ---
  const canonical = manufacture
    ? `https://kmotors.shop/catalog?manufacture=.${manufacture}`
    : "https://kmotors.shop/catalog";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical,
      languages: {
        ru: "https://kmotors.shop/catalog",
        en: "https://kmotors.shop/catalog",
        ko: "https://kmotors.shop/catalog",
        ka: "https://kmotors.shop/catalog",
        ar: "https://kmotors.shop/catalog",
        "x-default": "https://kmotors.shop/catalog",
      },
    },
  };
}
export default async function ({
  searchParams,
}: {
  searchParams: CarSearchParams;
}) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://kmotors.shop/" },
      { "@type": "ListItem", position: 2, name: "Каталог", item: "https://kmotors.shop/catalog" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    <div>
      <form action="" className="border-2 flex justify-end">
        {" "}
        {/* <div className="flex ">
          <Input type="text" /> <Button type="submit">submit</Button>
        </div> */}
      </form>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 h-full m-0 mx-auto">
        {/* каталог */}
        <div className="col-span-1 lg:col-span-4 h-ful px-1 py-2 ">
          <Filter />
        </div>
        {/* машины */}
        <div className="col-span-1 lg:col-span-8  h-full ">
          <CarsRow searchParams={searchParams} />
        </div>
      </div>
    </div>
    </>
  );
}
