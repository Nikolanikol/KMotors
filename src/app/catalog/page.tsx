import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";

export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const canonicalUrl = `https://kmotors.shop/catalog${
    page > 1 ? `?page=${page}` : ""
  }`;

  return {
    title: `Каталог корейских автомобилей${
      page > 1 ? ` - Страница ${page}` : ""
    }`,
    description: "...",
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      // Пагинация для Google
      ...(page > 1 && {
        prev: `https://kmotors.shop/catalog?page=${page - 1}`,
      }),
      next: `https://kmotors.shop/catalog?page=${page + 1}`,
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
