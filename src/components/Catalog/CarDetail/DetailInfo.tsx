"use client";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { ChevronDown } from "lucide-react";
import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VehicleRecord } from "@/lib/vehicleRecord";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--axis-white)" }}>
    <span className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))", display: "inline-block" }} />
    {children}
  </h2>
);

const Row = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
  <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
    <span className="text-sm" style={{ color: "var(--axis-gray)" }}>{label}</span>
    <span className="text-sm font-semibold" style={{ color: accent ? "var(--axis-orange)" : "var(--axis-white)" }}>{value}</span>
  </div>
);

// Данные приходят пропом из серверного DetailInfoSection — блок обязан попадать
// в HTML: характеристики и история ДТП это самый уникальный контент карточки,
// а клиентский useEffect делал его невидимым для поисковых ботов.
// Клиентским компонент остаётся только ради аккордеона и переводов.
interface DetailInfoProps { data: VehicleRecord | null }

const DetailInfo: FC<DetailInfoProps> = ({ data }) => {
  const { t } = useTranslation(["common", "cars"]);
  const [specsOpen, setSpecsOpen] = useState(true);

  if (!data) return null;
  // Ответ Encar не гарантирует ни счётчиков, ни массивов: раньше отсутствующий
  // carInfoChanges/accidents ронял рендер клиента целиком.
  const totalAccidents = (data.myAccidentCnt ?? 0) + (data.otherAccidentCnt ?? 0);
  const carInfoChanges = Array.isArray(data.carInfoChanges) ? data.carInfoChanges : [];
  const accidents = Array.isArray(data.accidents) ? data.accidents : [];

  return (
    <div className="space-y-4">


      {/* Specs — сворачиваемая */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <button
          onClick={() => setSpecsOpen(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <span className="font-semibold text-sm" style={{ color: "var(--axis-white)" }}>{t("car.detailedInfo")}</span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: "var(--axis-gray)", transform: specsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {specsOpen && (
          <div className="px-5 pb-5">
            <Row label={t("car.year")} value={data.year ?? "—"} />
            <Row label={t("car.manufacturer")} value={translateGenerationRow(data.maker ?? "", t) || "—"} />
            <Row label={t("car.model")} value={translateGenerationRow(data.model ?? "", t) || "—"} />
            <Row label={t("car.bodyType")} value={translateGenerationRow(data.carShape ?? "", t) || "—"} />
            <Row label={t("car.fuel")} value={translateGenerationRow(data.fuel ?? "", t) || "—"} />
            <Row label={t("car.engineVolume")} value={data.displacement ? `${data.displacement} cc` : "—"} />
            <Row label={t("car.transmission")} value={translateGenerationRow(data.transmission ?? "", t) || t("common.notSpecified")} />
            <Row label={t("car.registrationDate")} value={data.regDate?.slice(0, 10) ?? "—"} />
          </div>
        )}
      </div>

      {/* History summary */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <SectionTitle>{t("car.history")}</SectionTitle>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: t("car.accidents"), value: totalAccidents, bad: totalAccidents > 0 },
            { label: t("car.ownerChanges"), value: data.ownerChangeCnt ?? 0, bad: false },
            { label: t("car.plateChanges"), value: data.carNoChangeCnt ?? 0, bad: false },
            { label: t("car.theft"), value: data.robberCnt ?? 0, bad: (data.robberCnt ?? 0) > 0 },
            { label: t("car.floods"), value: (data.floodTotalLossCnt || 0) + (data.floodPartLossCnt || 0), bad: (data.floodTotalLossCnt ?? 0) > 0 },
          ].map(({ label, value, bad }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: bad && value > 0 ? "rgba(182,119,73,0.12)" : "var(--axis-graphite)",
                border: `1px solid ${bad && value > 0 ? "rgba(182,119,73,0.3)" : "rgba(74,74,74,0.3)"}`,
                color: bad && value > 0 ? "var(--axis-orange)" : "var(--axis-gray)",
              }}>
              <span style={{ color: bad && value > 0 ? "var(--axis-orange)" : "var(--axis-white)", fontWeight: 700 }}>{value}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Owner history */}
        {carInfoChanges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("car.ownerHistory")}</p>
            <div className="space-y-2">
              {carInfoChanges.map((change, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: "var(--axis-graphite)" }}>
                  <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "white" }}>{i + 1}</span>
                  <span className="text-xs font-mono" style={{ color: "var(--axis-white)" }}>{change.carNo}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--axis-gray)" }}>{change.date?.slice(0, 10) ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accidents table */}
        {accidents.length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("car.accidentReport")} ({accidents.length})</p>
            <div className="relative">
              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(74,74,74,0.2)" }}>
              <table className="min-w-[420px] w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--axis-graphite)" }}>
                    {[t("common.date"), t("car.insuranceCoverage"), t("car.parts"), t("car.labor"), t("car.painting")].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--axis-gray)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accidents.map((acc, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-white)" }}>{acc.date}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{(acc.insuranceBenefit ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{(acc.partCost ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{(acc.laborCost ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: (acc.paintingCost ?? 0) > 0 ? "var(--axis-orange)" : "var(--axis-gray)" }}>
                        {(acc.paintingCost ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <p className="text-[10px] mt-1 sm:hidden" style={{ color: "var(--axis-gray)" }}>← листайте вправо</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailInfo;
