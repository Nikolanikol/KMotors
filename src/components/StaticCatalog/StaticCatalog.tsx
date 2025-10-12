import fs from "fs/promises";
import path from "path";
import CarCard from "./CarCard";

export default async function StaticCatalog() {
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

  // Читаем JSON-файл на этапе сборки
  const filePath = path.join(process.cwd(), "public/data/cars.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const cars: Car[] = JSON.parse(fileContent);

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
export const dynamic = "force-static";
