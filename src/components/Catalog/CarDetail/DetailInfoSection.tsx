// Серверная обёртка над DetailInfo: тянет историю авто на сервере, чтобы блок
// оказался в HTML и индексировался. Рендерится внутри <Suspense> на странице —
// поэтому ожидание Encar не задерживает первую отрисовку карточки, но контент
// всё равно приезжает в том же HTTP-ответе, то есть боту он виден.

import { fetchVehicleRecord } from "@/lib/vehicleRecord";
import DetailInfo from "./DetailInfo";

export default async function DetailInfoSection({
  id,
  vehicleNo,
}: {
  id: string | number | undefined;
  vehicleNo: string | undefined;
}) {
  const record = await fetchVehicleRecord(id, vehicleNo);
  if (!record) return null;
  return <DetailInfo data={record} />;
}

export function DetailInfoSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{ backgroundColor: "var(--axis-charcoal)" }}
    >
      <div
        className="h-4 w-32 rounded mb-4"
        style={{ backgroundColor: "var(--axis-graphite)" }}
      />
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-3 rounded mb-3"
          style={{ backgroundColor: "var(--axis-graphite)" }}
        />
      ))}
    </div>
  );
}
