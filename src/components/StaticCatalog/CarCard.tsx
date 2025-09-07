import { Button } from "../ui/button";
import { Card } from "../ui/card";

const CarCard = ({ item, mode }) => {
  return (
    <Card
      key={item.Id}
      className=" border-1 border-black overflow-hidden col-span-1  "
    >
      <div className="overflow-hidden h-50  flex justify-center items-center relative">
        <img src={item.images[0]} alt="car image" />
      </div>
      <div className="flex flex-col gap-2 ">
        <div className="text-2xs font-bold border-b-2 h-24  pt-2 px-2 text-center">
          {" "}
          <span>
            {item.brand} {item.model} {item.badge} {item.transmission}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Год:</span>
          <span>{item.Year} </span>
          <span>
            Пробег: {item.mileage && item.mileage.toLocaleString("ru-RU")} км
          </span>
        </div>

        <div className="flex justify-evenly">
          <span>Цена:</span>
          <span>{item.price.toLocaleString("ru-RU")} вон</span>
        </div>
        <div className="flex justify-evenly h-12">
          <span>Тип топлива:</span>

          <span>{item.fuel}</span>
        </div>
        <div>
          <Button
            className="cursor-pointer self-stretch w-full mt-auto"
            variant={"outline"}
          ></Button>
        </div>
      </div>
    </Card>
  );
};

export default CarCard;
