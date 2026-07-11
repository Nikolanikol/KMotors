import { NextResponse } from "next/server";
import { getRecommendedCars } from "@/components/Catalog/CarDetail/Recommended/getRecommended";

// Отдаёт рекомендованные авто для карточки детали. Дёргается лениво (по скроллу),
// поэтому не влияет на время загрузки самой страницы. Кэш 1 час.
export const revalidate = 3600;

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ cars: [] });

  const cars = await getRecommendedCars(id);
  return NextResponse.json(
    { cars },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
