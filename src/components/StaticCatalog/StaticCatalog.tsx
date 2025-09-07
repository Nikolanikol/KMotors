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

  useEffect(() => {
    fetch("/data/cars.json")
      .then((res) => res.json())
      .then((data) => setCars(data))
      .then((res) => console.log(res));
  }, []);

  return (
    <div className="container border-2 border-black min-h-screen mx-auto p-2">
      <div className=" gap-4  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {cars.map((car, i) => {
          return <CarCard item={car} key={i} />;
        })}
      </div>
    </div>
  );
}
