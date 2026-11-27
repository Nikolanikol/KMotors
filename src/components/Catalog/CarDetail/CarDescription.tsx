// Блок «О модели» карточки авто. Серверный и асинхронный: текст собирается из
// данных КОНКРЕТНОЙ машины (год и месяц, пробег, объём, КПП, кузов, цвет, места,
// регион продавца, число опций, история и осмотр Encar), а не шаблоном —
// раньше девять из двенадцати предложений были одинаковы у всех карточек.
//
// Сборка текста — чистая функция из src/lib/carContent.ts (под неё тесты).
// История и лист осмотра берутся теми же функциями, что у блоков ниже и у
// generateMetadata: fetch с одним адресом Next дедуплицирует, лишних походов
// к Encar нет. Сбой любого из них — предложения просто не будет.
import Link from "next/link";
import { loadCarsDict, localizeSpec } from "@/lib/carLabels";
import { buildCarDescription } from "@/lib/carContent";
import { fetchVehicleRecord } from "@/lib/vehicleRecord";
import { fetchVehicleInspection, normalizeInspection } from "@/lib/vehicleInspection";

interface Props {
  lang: string;
  manufacturer: string;
  model: string;
  yearMonth: string;
  mileage: number;
  displacement: number;
  fuelName: string;
  transmissionName?: string;
  bodyName?: string;
  colorName?: string;
  seatCount?: number;
  /** Адрес продавца Encar — из него берём только регион и город. */
  address?: string;
  standardOptions?: string[];
  choiceOptions?: string[];
  vehicleId?: string | number;
  vehicleNo?: string;
  catalogFilter: string;
}

export default async function CarDescription({
  lang, manufacturer, model, yearMonth, mileage, displacement, fuelName,
  transmissionName, bodyName, colorName, seatCount, address,
  standardOptions, choiceOptions, vehicleId, vehicleNo, catalogFilter,
}: Props) {
  const [dict, record, inspectionRaw] = await Promise.all([
    loadCarsDict(lang),
    fetchVehicleRecord(vehicleId, vehicleNo),
    fetchVehicleInspection(vehicleId),
  ]);
  const inspection = normalizeInspection(inspectionRaw);

  const mfr = manufacturer.trim();
  const mdl = model.split("(")[0].replace(/THE NEW |NEW |ALL NEW /gi, "").trim();

  // Кузов: поле спецификации, а если оно не переводится — форма из истории.
  const bodyRaw = [bodyName, record?.carShape].find((b) => localizeSpec(b, dict)) ?? null;

  const view = buildCarDescription(
    {
      lang,
      brand: mfr,
      model: mdl,
      yearMonth,
      mileage,
      displacement,
      fuelRaw: fuelName,
      transmissionRaw: transmissionName,
      bodyRaw,
      colorRaw: colorName,
      seats: seatCount,
      address,
      standardCodes: standardOptions,
      choiceCodes: choiceOptions,
      record: record
        ? {
            accidents:
              record.myAccidentCnt != null || record.otherAccidentCnt != null
                ? (record.myAccidentCnt ?? 0) + (record.otherAccidentCnt ?? 0)
                : null,
            owners: typeof record.ownerChangeCnt === "number" ? record.ownerChangeCnt : null,
          }
        : null,
      inspection: inspection
        ? { simpleRepair: inspection.simpleRepair, date: inspection.inspectedAt }
        : null,
    },
    dict,
  );

  return (
    <div
      className="mt-6 rounded-2xl p-6 space-y-4"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(74,74,74,0.25)",
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
        {view.heading}
      </h2>

      {view.paragraphs.map((text, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
          {text}
        </p>
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        {view.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(182,119,73,0.08)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(182,119,73,0.2)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={`/${lang}/catalog?${catalogFilter ? `action=${catalogFilter}&` : ""}page=1`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)] rounded"
        style={{ color: "var(--axis-orange)" }}
      >
        {view.linkLabel}
      </Link>
    </div>
  );
}
