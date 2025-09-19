"use client";

import { useEffect, useState } from "react";
import CarCard from "./CarCard";

export default function StaticCatalog() {
  interface Car {
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
  }
  const [cars, setCars] = useState<Car[]>([]);
  //   const [isFormVisible, setIsFormVisible] = useState(false);
  useEffect(() => {
    fetch("/data/cars.json")
      .then((res) => res.json())
      .then((data) => setCars(data))
      .then((res) => console.log(res));
  }, []);

  return (
    <div className="container shadow-2xl py-4 px-6 min-h-screen rounded-2xl mx-auto p-2">
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] justify-center">
        {cars.map((car, i) => {
          return <CarCard item={car} key={i} />;
        })}
      </div>
    </div>
  );
}
