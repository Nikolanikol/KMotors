import { SlidingButton } from "@/components/ui/button";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { Fuel, Gauge, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const CarCard = ({
  photo,
  id,
  model,
  manufacture,

  mileage,
  transmission,
  fuel,
  price,
}: {
  id: string;
  photo: string;
  model: string;
  manufacture: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  price: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="shadow-2xl self-center border-2 inline-block rounded-2xl overflow-hidden md:min-w-[350px] w-[300px] ">
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
          <h3 className="heading-3 line-clamp-1">
            {translateGenerationRow(model, t)}
          </h3>
          <h4 className="opacity-20 ">
            {translateGenerationRow(manufacture, t)}
          </h4>
        </div>
        <div className="icon-row py-4 flex gap-5 justify-around border-t-2 border-b-2 h-[105px] ">
          <div className="flex flex-col items-center">
            <Fuel className="w-5 h-5 " />
            <p>{convertNumberKm(mileage)} км</p>
          </div>
          <div className="flex flex-col items-center">
            <Gauge className="w-5 h-5 " />
            <p>{translateGenerationRow(fuel, t)}</p>
          </div>
          <div className="flex flex-col items-center">
            <Settings className="w-5 h-5 " />
            <p>{translateGenerationRow(transmission, t)}</p>
          </div>
        </div>
        <div className="footer flex justify-between py-5">
          <div>
            <div>Цена покупки</div>
            <p className="font-bold">{convertNumber(price)} вон</p>
          </div>
          <SlidingButton className="px-2  ">
            <Link className="block " target="_blank" href={`/catalog/${id}`}>
              Подробнее
            </Link>{" "}
          </SlidingButton>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
