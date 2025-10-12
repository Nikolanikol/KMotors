import { SlidingButton } from "@/components/ui/button";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { Fuel, Gauge, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

interface CarCardProps {
  car: {
    id: string;
    badge: string;
    description: string;
    fuel: string;
    mileage: number;
    image_urls: string[];
    model: string;
    price: number;
    status: string;
    transmission: string;
    vin: string;
    year: number;
    brand: string;
  };
}
const CarCard: FC<CarCardProps> = ({ car }) => {
  const {
    id,
    badge,
    description,
    fuel,
    mileage,
    image_urls,
    model,
    price,
    status,
    transmission,
    vin,
    year,
    brand,
  } = car;
  return (
    <div className="shadow-2xl self-center border-2 inline-block rounded-2xl overflow-hidden md:min-w-[300px]  xl:min-w-[400px] ">
      <div className="max-w-[400px] max-h-[225px] overflow-hidden lg:max-w-[600px] xl:max-h-[500px]">
        <Image
          width={700}
          height={400}
          src={image_urls[0]}
          alt={`${brand} ${model} `}
        />
      </div>
      <div className="text-wrapper px-5">
        <div className="py-3 ">
          <h3 className="heading-3 line-clamp-1">{model}</h3>
          <h4 className="opacity-20 ">{brand}</h4>
        </div>
        <div className="icon-row py-4 flex gap-5 justify-around border-t-2 border-b-2 h-[105px] ">
          <div className="flex flex-col items-center">
            <Fuel className="w-5 h-5 " />
            <p>{mileage.toLocaleString("ru")} км</p>
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
            <p className="font-bold">{price.toLocaleString("ru")} вон</p>
          </div>
          <SlidingButton className="px-2  ">
            <Link
              href={`/catalog2/${id}`}
              className="block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Подробнее
            </Link>
          </SlidingButton>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
