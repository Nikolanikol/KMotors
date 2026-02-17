import { Pagination } from "./Pagination";
import { getString } from "./utils";
import { getCars } from "./utils/service";
import { CarSearchParams } from "./utils/Types";
import CarCard from "./CarCard";
import { Suspense } from "react";

const CarsRow = async ({ searchParams }: { searchParams: CarSearchParams }) => {
  const params = await searchParams;
  const offset = params.page;
  const newString = getString(params);

  const { data, count } = await getCars(newString, offset);
  console.log(data, "data");
  return (
    <div className="px-8">
      <div className=" grid grid-cols-1 md:grid-cols-2   items-start gap-4 min-h-[80vh]">
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
            }) => (
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
              />
            )
          )}
      </div>
      <div className="flex gap-2 mt-4">
        <Pagination count={count} />
      </div>
    </div>
  );
};
export default CarsRow;
