import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const params = await searchParams;
  const manufacture = params.manufacture?.slice(1) || "";

  const title = manufacture
    ? `Купить ${manufacture} из Кореи — каталог авто | KMotors`
    : "Каталог авто из Кореи — Hyundai, Kia, Genesis | KMotors";

  const description = manufacture
    ? `Каталог ${manufacture} из Южной Кореи. Актуальные цены, фото, характеристики. Доставка в Россию, Казахстан, Узбекистан. KMotors (кмоторс).`
    : "Каталог корейских автомобилей из Южной Кореи: Hyundai, Kia, Genesis, SsangYong. Актуальные цены, фото, характеристики. Доставка в СНГ. KMotors (кмоторс).";

  return {
    title,
    description,
    keywords: [
      manufacture ? `${manufacture} из Кореи` : "авто из Кореи",
      "каталог корейских авто",
      "купить авто из Кореи",
      "кмоторс каталог",
      "Hyundai из Кореи",
      "Kia из Кореи",
      "Genesis из Кореи",
      "корейские автомобили цены",
    ],
    alternates: {
      canonical: manufacture
        ? `https://kmotors.shop/catalog?manufacture=.${manufacture}`
        : "https://kmotors.shop/catalog",
    },
  };
}
export default async function ({
  searchParams,
}: {
  searchParams: CarSearchParams;
}) {
  return (
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
  );
}
