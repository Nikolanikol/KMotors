import Image from "next/image";
import { Fuel, Gauge, Settings } from "lucide-react";
import { SlidingButton } from "@/components/ui/button";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
const reqString = `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=(And.Hidden.N._.(C.CarType.Y._.Manufacturer.%ED%98%84%EB%8C%80.))&sr=%7CModifiedDate%7C%7C20`;

const getCars = async () => {
  const res = await fetch(reqString, {
    cache: "force-cache", // можно использовать "no-store" для SSR
  });

  if (!res.ok) throw new Error("Failed to fetch cars");
  const data: ICarResponce = await res.json();
  return data.SearchResults;
};

const CarSlider = async () => {
  const data = await getCars();
  console.log(data);
  return (
    <div className="px-4 py-2 border-2 border-black min-h-80">
      <h2 className="text-lg font-bold mb-2">CarSlider</h2>
      <div className="flex  overflow-x-scroll py-10 gap-5">
        <Carousel>
          <CarouselContent>
            {data &&
              data.map((item, i) => (
                <CarCard
                  key={i}
                  photo={item.Photos[0].location}
                  model={item.Model}
                  manufacture={item.Manufacturer}
                  transmission={item.Transmission}
                  fuel={item.FuelType}
                  mileage={item.Mileage}
                  price={item.Price}
                />
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default CarSlider;

interface ICar {
  Badge: string;
  FormYear: string;
  FuelType: string;
  Id: string;
  Manufacturer: string;
  Mileage: string;
  Model: string;
  ModifiedDate: string;
  Photo: string;
  Price: string;
  Transmission: string;
  Photos: {
    location: string;
    type: string;
  }[];
}
interface ICarResponce {
  Count: string;
  SearchResults: ICar[];
}

const CarCard = ({
  photo,
  imageUrl,
  model,
  manufacture,
  year,
  mileage,
  transmission,
  fuel,
  price,
}) => {
  return (
    <div className="shadow-2xl self-center border-2 inline-block rounded-2xl overflow-hidden min-w-[400px] ">
      <div>
        <Image
          width={400}
          height={400}
          src={`https://ci.encar.com${photo}`}
          alt="car photo"
        />
      </div>
      <div className="text-wrapper px-5">
        <div className="py-3 ">
          <h3 className="heading-3">{model}</h3>
          <h4 className="opacity-20-">{manufacture}</h4>
        </div>
        <div className="icon-row py-4 flex gap-5 justify-around border-t-2 border-b-2">
          <div className="flex flex-col items-center">
            <Fuel className="w-5 h-5 " />
            <p>{mileage} км</p>
          </div>
          <div className="flex flex-col items-center">
            <Gauge className="w-5 h-5 " />
            <p>{fuel}</p>
          </div>
          <div className="flex flex-col items-center">
            <Settings className="w-5 h-5 " />
            <p>{transmission}</p>
          </div>
        </div>
        <div className="footer flex justify-between py-5">
          <div>
            <div>Цена покупки</div>
            <p>{price}</p>
          </div>
          <SlidingButton>Подробности</SlidingButton>
        </div>
      </div>
    </div>
  );
};
