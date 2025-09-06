"use client";

import { useEffect, useState } from "react";

export default function StaticCatalog() {
  interface Car {
    brand: string;
    model: string;
  }
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    fetch("/data/cars.json")
      .then((res) => res.json())
      .then((data) => setCars(data));
  }, []);

  return (
    <div className="flex gap-4">
      {cars.map((car, i) => (
        <div className="border-2 border-black" key={i}>
          {car.brand} {car.model}
        </div>
      ))}
    </div>
  );
}
