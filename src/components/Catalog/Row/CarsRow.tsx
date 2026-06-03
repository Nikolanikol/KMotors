import { Pagination } from "./Pagination";
import { getString } from "./utils";
import { getCars } from "./utils/service";
import { CarSearchParams } from "./utils/Types";
import CarCard from "./CarCard";
import { Suspense } from "react";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { Search } from "lucide-react";

const CarsRow = async ({ searchParams }: { searchParams: CarSearchParams }) => {
  const params = await searchParams;
  const offset = params.page;
  const newString = getString(params);

  const [{ data, count }, rates] = await Promise.all([
    getCars(newString, offset),
    getCurrencyRates(),
  ]);

  if (!data || data.length === 0) {
    const isCarNoSearch = !!params.carNo;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Search className="w-12 h-12 opacity-20" style={{ color: "var(--axis-gray)" }} />
        <p className="text-base font-medium" style={{ color: "var(--axis-gray)" }}>
          {isCarNoSearch ? `Авто с номером «${params.carNo}» не найдено` : "Ничего не найдено"}
        </p>
        {isCarNoSearch && (
          <p className="text-sm" style={{ color: "rgba(120,120,120,0.8)" }}>
            Проверьте номер и попробуйте снова
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-5 min-h-[80vh]">
        {data &&
          data.length > 0 &&
          data.map(
            (item: {
              Id: string;
              Photos: { location: string; type: string }[];
              Model: string;
              Manufacturer: string;
              Year: string;
              Mileage: string;
              Transmission: string;
              FuelType: string;
              Price: string;
            }, index: number) => (
              <CarCard
                key={item.Id}
                id={item.Id}
                photo={item.Photos[0]?.location}
                model={item.Model}
                manufacture={item.Manufacturer}
                year={item.Year}
                mileage={item.Mileage}
                transmission={item.Transmission}
                fuel={item.FuelType}
                price={item.Price}
                krwToRub={rates.krwToRub}
                krwToUsd={rates.krwToUsd}
                priority={index < 2}
              />
            )
          )}
      </div>
      <div className="flex gap-2 mt-8 pb-8">
        <Pagination count={count} />
      </div>
    </div>
  );
};
export default CarsRow;
