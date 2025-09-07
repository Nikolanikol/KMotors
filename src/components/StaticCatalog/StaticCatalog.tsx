"use client";

import { Car } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import CarCard from "./CarCard";

export default function StaticCatalog() {
  interface Car {
    brand: string;
    model: string;
  }
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    fetch("/data/cars.json")
      .then((res) => res.json())
      .then((data) => setCars(data))
      .then((res) => console.log(res));
  }, []);

  return (
    <div className="flex gap-4">
      {cars.map((car, i) => {
        return <CarCard item={car} key={i} />;
      })}
    </div>
  );
}

// "id": "1806",
// "brand": "Kia",
// "model": "Sorento",
// "year": 2023,
// "price": 43000000,
// "mileage": 35092,
// "images": [
//   "/catalog/1806/6149995832313759130.jpg",
//   "/catalog/1806/6149995832313759131.jpg",
//   "/catalog/1806/6149995832313759132.jpg",
//   "/catalog/1806/6149995832313759133.jpg",
//   "/catalog/1806/6149995832313759134.jpg",
//   "/catalog/1806/6149995832313759135.jpg",
//   "/catalog/1806/6149995832313759136.jpg",
//   "/catalog/1806/6149995832313759137.jpg"
// ],
// "location": "Сеул",
// "transmission": "Автомат",
// "fuel": "Бензин"

// <div className="border-2 border-black" key={i}>
//   {car.brand} {car.model}
//   {car.images.map((s) => (
//     <div>
//       <h1>
//         {s}
//         <Image src={s} alt={car.model} width={200} height={200} />
//       </h1>
//     </div>
//   ))}
// </div>
