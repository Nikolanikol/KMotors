// import StaticCatalog from "@/components/StaticCatalog/StaticCatalog";
// import React from "react";

// const pages = () => {
//   return (
//     <div className="wrapper">
//       <StaticCatalog />
//     </div>
//   );
// };

// export default pages;
import { Metadata } from "next";
import Filter from "@/components/Catalog/Filter/Filter";
import CarsRow from "@/components/Catalog/Row/CarsRow";
import { CarSearchParams } from "@/components/Catalog/Row/utils/Types";
import { getAllCars } from "@/lib/db";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CarCard from "@/components/Catalog2/CarCard";

// SSG: Генерируем страницу при сборке
export const revalidate = 86400; // Пересчитываем раз в 24 часа (ISR)
export const dynamic = "force-static"; // Всегда статично генерируем

export const metadata: Metadata = {
  title: "Каталог корейских автомобилей - KMotors",
  description:
    "Полный каталог корейских автомобилей Hyundai, Kia, Genesis. Фильтры по цене, пробегу, году выпуска.",
  openGraph: {
    title: "Каталог корейских автомобилей - KMotors",
    description: "Выбирайте лучшие автомобили из Южной Кореи",
    type: "website",
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CarSearchParams>;
}) {
  // На сервере загружаем все авто один раз при генерации
  const allCars = await getAllCars(); // пока на этапе тестов
  //   console.log("allCars", allCars);
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 h-full m-0 mx-auto">
        {/* Фильтры */}

        {/* Сетка авто */}
        <div className="col-span-1 lg:col-span-8  h-full border-2  ">
          <div className=" grid grid-cols-1 md:grid-cols-2    gap-4">
            {allCars.map((car, i) => {
              return <CarCard key={i} car={car} />;
            })}
            {/* <CarsRow 
            searchParams={searchParams} 
            initialCars={allCars}
          /> */}
          </div>
        </div>
      </div>

      {/* JSON-LD для SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Каталог корейских автомобилей",
            description: "Полный каталог авто из Южной Кореи",
            url: "https://kmotors.shop/catalog",
            numberOfItems: allCars.length,
          }),
        }}
      />
    </div>
  );
}
