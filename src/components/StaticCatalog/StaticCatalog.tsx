"use client";

import { useEffect, useState } from "react";

export default function StaticCatalog() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetch("/data/cars.json")
      .then((res) => res.json())
      .then((data) => setCars(data));
  }, []);

  return (
    <div className="flex gap-4">
      {cars.map((car) => (
        <div className="border-2 border-black" key={car.id}>
          {car.brand} {car.model}
        </div>
      ))}
    </div>
  );
}
