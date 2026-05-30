import Link from "next/link";

interface Props {
  lang: string;
  manufacturer: string;  // "Hyundai" | "KIA" | "Genesis"
  model: string;         // "Tucson" | "Sorento" etc.
  yearMonth: string;     // "202205" → показываем "2022"
  mileage: number;       // 34000
  displacement: number;  // 2000 (cc)
  fuelName: string;      // корейское название топлива
  catalogFilter: string; // параметр для фильтра каталога
}

// Перевод корейских названий топлива
function fuelRu(raw: string): string {
  if (raw.includes("가솔린")) return "бензиновым";
  if (raw.includes("디젤"))   return "дизельным";
  if (raw.includes("전기"))   return "электрическим";
  if (raw.includes("플러그인")) return "plug-in гибридным";
  if (raw.includes("하이브리드")) return "гибридным";
  if (raw.includes("LPG") || raw.includes("lpg")) return "газовым (LPG)";
  return "бензиновым";
}

function fuelEn(raw: string): string {
  if (raw.includes("가솔린")) return "gasoline";
  if (raw.includes("디젤"))   return "diesel";
  if (raw.includes("전기"))   return "electric";
  if (raw.includes("플러그인")) return "plug-in hybrid";
  if (raw.includes("하이브리드")) return "hybrid";
  if (raw.includes("LPG") || raw.includes("lpg")) return "LPG";
  return "gasoline";
}

// Объём двигателя: 2000 → "2.0"
function formatDisplacement(cc: number): string {
  if (!cc || cc < 100) return "";
  return (cc / 1000).toFixed(1);
}

// Пробег с разделителями
function formatMileage(km: number, lang: string): string {
  return km.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
}

export default function CarDescription({
  lang, manufacturer, model,
  mileage, displacement, fuelName, catalogFilter, yearMonth,
}: Props) {
  const mfr = manufacturer.trim();
  const mdl = model.split("(")[0].replace(/THE NEW |NEW |ALL NEW /gi, "").trim();
  const year = yearMonth?.length >= 4 ? yearMonth.slice(0, 4) : yearMonth;
  const disp = displacement ? formatDisplacement(displacement) : null;
  const fuel_ru = fuelRu(fuelName);
  const fuel_en = fuelEn(fuelName);
  const km = formatMileage(mileage, lang);

  // Текст только для RU — для других языков не показываем (у нас основная аудитория RU)
  if (lang !== "ru") return null;

  return (
    <div
      className="mt-6 rounded-2xl p-6 space-y-4"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(74,74,74,0.25)",
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
        О модели {mfr} {mdl}
      </h2>

      <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
        {mfr} {mdl} {year} года — автомобиль с{" "}
        {disp ? `${disp}-литровым ` : ""}{fuel_ru} двигателем
        {mileage > 0 ? ` и пробегом ${km} км` : ""}.{" "}
        Приобретён на корейском вторичном рынке и доступен для заказа через K-Axis
        с личным осмотром в Сувоне (Республика Корея).
      </p>

      <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
        Покупка {mfr} {mdl} из Кореи — это возможность получить автомобиль{" "}
        {mileage > 0 && mileage < 50000 ? "с небольшим пробегом " : ""}
        в оригинальной корейской комплектации по цене ниже российского рынка.
        Доставка морем до Владивостока занимает 7–14 дней,
        полный срок с таможенным оформлением — 3–6 недель.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {[
          `${mfr} ${mdl} из Кореи`,
          `${year}`,
          ...(disp ? [`${disp} л · ${fuelRu(fuelName).replace("ым", "").replace("им", "")}`] : []),
          ...(mileage > 0 ? [`${km} км`] : []),
        ].map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(255,69,0,0.08)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(255,69,0,0.2)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={`/${lang}/catalog?${catalogFilter ? `action=${catalogFilter}&` : ""}page=1`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--axis-orange)" }}
      >
        Все {mfr} {mdl} в каталоге →
      </Link>
    </div>
  );
}
