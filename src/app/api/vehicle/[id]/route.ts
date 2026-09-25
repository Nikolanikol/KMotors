// Карточка авто для генератора каруселей (AXIS Video).
//
//   curl -H "x-vehicle-secret: $VEHICLE_API_SECRET" https://www.kmotors.shop/api/vehicle/41630924
//
// Закрыт секретом: наружу это отдаёт нормализованные данные Encar, и открытый адрес
// превратился бы в бесплатный публичный API поверх чужого источника.
import { NextRequest, NextResponse } from "next/server";
import { buildVehicleCard, VehicleUpstreamError } from "@/lib/vehicleCard";

// Данные машины меняются редко, а Encar лучше не дёргать на каждый запрос: тот же час,
// что и у карточки на сайте.
export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const secret = process.env.VEHICLE_API_SECRET;
  // Без переменной в окружении маршрут не работает вовсе: пустой секрет тихо пустил бы всех
  if (!secret) {
    return NextResponse.json({ error: "VEHICLE_API_SECRET не задан" }, { status: 503 });
  }
  if (req.headers.get("x-vehicle-secret") !== secret) {
    return NextResponse.json({ error: "Неверный секрет" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "id должен быть числом" }, { status: 400 });
  }

  try {
    const car = await buildVehicleCard(id);
    // 404 от Encar означает «продана или снята», и это нормальный ответ, а не поломка
    if (!car) return NextResponse.json({ error: "Машина не найдена" }, { status: 404 });
    return NextResponse.json(car, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    // Источник лежит — это 502, а не 404: вызывающий не должен принять аварию за «продана»
    if (e instanceof VehicleUpstreamError) {
      return NextResponse.json({ error: "Encar недоступен" }, { status: 502 });
    }
    console.error(`vehicle ${id}:`, e);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
