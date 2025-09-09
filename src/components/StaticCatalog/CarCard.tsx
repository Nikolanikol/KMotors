import { FC } from "react";
import { Button, SlidingButton } from "../ui/button";
import { Card } from "../ui/card";
import StaticCatalogForm from "./StaticCatalogForm";
import Image from "next/image";
import CarouselDialog from "./CarouselDialog";

interface CarCardProps {
  item: {
    id: string;
    brand: string;
    model: string;
    badge?: string;
    year: string;
    price: number;
    mileage: number;
    images: string[];
    location?: string;
    transmission: string;
    fuel: string;
  };
}
const CarCard: FC<CarCardProps> = ({ item }) => {
  return (
    <Card
      key={item.id}
      className=" border-1 border-black overflow-hidden col-span-1  "
    >
      <div
        onClick={() => console.log("click")}
        className=" overflow-hidden h-48 flex justify-center items-center hover:scale-105 transition-all duration-300 cursor-pointer"
      >
        <div className="">
          <CarouselDialog images={item.images} />

          {/* <img
            className="pointer-events-none"
            src={item.images[0]}
            alt="car image"
          /> */}
        </div>
      </div>
      <div className="flex flex-col gap-2  items-center ">
        <div className="text-2xl  font-bold h-24  pt-2 px-2 flex items-center ">
          <span>
            {item.brand} {item.model} {item.badge} {item.transmission}
          </span>
        </div>
        <div className="bg-gray-600 w-full h-0.5"></div>
        {/* // Details */}
        <DescriptionBlock
          year={item.year}
          mileage={item.mileage}
          price={item.price}
          fuel={item.fuel}
        />
      </div>
      <StaticCatalogForm isVisible={false} />
    </Card>
  );
};

export default CarCard;

const Description = ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div className="flex justify-between h-12 gap-x-30">
      <span className="font-bold">{title}:</span>

      <span>{desc}</span>
    </div>
  );
};

const DescriptionBlock = ({
  year,
  mileage,
  price,
  fuel,
}: {
  year: string;
  mileage: number;
  price: number;
  fuel: string;
}) => {
  return (
    <div className="max-w-80  ">
      <Description title="Год" desc={year} />
      <Description
        title="Пробег"
        desc={mileage.toLocaleString("ru-RU") + " км"}
      />
      <Description title="Цена" desc={price.toLocaleString("ru-RU") + " вон"} />
      <Description title="Тип топлива" desc={fuel} />
    </div>
  );
};
