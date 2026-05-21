"use client";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Accident {
  type: string;
  date: string;
  insuranceBenefit: number;
  partCost: number;
  laborCost: number;
  paintingCost: number;
}

interface VehicleCatalog {
  openData: boolean;
  regDate: string;
  carNo: string;
  year: string;
  maker: string;
  carKind: string;
  use: string;
  displacement: string;
  carName: string | null;
  firstDate: string;
  fuel: string;
  carShape: string;
  model: string | null;
  transmission: string;
  carNameCode: string | null;
  myAccidentCnt: number;
  otherAccidentCnt: number;
  ownerChangeCnt: number;
  robberCnt: number;
  robberDate: string | null;
  totalLossCnt: number;
  totalLossDate: string | null;
  floodTotalLossCnt: number;
  floodPartLossCnt: number | null;
  floodDate: string | null;
  government: number;
  business: number;
  loan: number;
  carNoChangeCnt: number;
  myAccidentCost: number;
  otherAccidentCost: number;
  carInfoChanges: { date: string; carNo: string }[];
  carInfoUse1s: string[];
  carInfoUse2s: string[];
  ownerChanges: string[];
  notJoinDate1: string | null;
  notJoinDate2: string | null;
  notJoinDate3: string | null;
  notJoinDate4: string | null;
  notJoinDate5: string | null;
  accidentCnt: number;
  accidents: Accident[];
  vehicleType: string;
  vin: string;
  vehicleId: number;
  vehicleNo: string;
}

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

interface DetailInfoProps { id: string; carnumber: string; }

const DetailInfo: FC<DetailInfoProps> = ({ id, carnumber }) => {
  const [data, setData] = useState<VehicleCatalog>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    fetch(`https://api.encar.com/v1/readside/record/vehicle/${id}/open?vehicleNo=${carnumber}`)
      .then(r => r.json())
      .then(res => { setData(res); setIsLoading(false); })
      .catch(() => setError(true));
  }, []);

  if (isLoading) return (
    <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: "var(--axis-graphite)" }} />
      {[1,2,3,4].map(i => <div key={i} className="h-3 rounded mb-3" style={{ backgroundColor: "var(--axis-graphite)" }} />)}
    </div>
  );
  if (error || !data) return null;

  const totalAccidents = data.myAccidentCnt + data.otherAccidentCnt;
  const hasProblems = totalAccidents > 0 || data.robberCnt > 0 || data.floodTotalLossCnt > 0;
  const statusOk = !hasProblems && data.ownerChangeCnt <= 2;

  return (
    <div className="space-y-4">

      {/* Status */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: statusOk ? "rgba(34,197,94,0.08)" : "rgba(255,69,0,0.08)",
          border: `1px solid ${statusOk ? "rgba(34,197,94,0.3)" : "rgba(255,69,0,0.3)"}`,
        }}>
        {statusOk
          ? <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#22c55e" }} />
          : <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--axis-orange)" }} />}
        <div>
          <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("car.carStatus")}</p>
          <p className="text-sm font-semibold" style={{ color: statusOk ? "#22c55e" : "var(--axis-orange)" }}>
            {statusOk ? t("car.condition.excellent") : t("car.condition.attention")}
          </p>
        </div>
      </div>

      {/* Specs */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <SectionTitle>{t("car.detailedInfo")}</SectionTitle>
        <div>
          <Row label={t("car.year")} value={data.year} />
          <Row label={t("car.manufacturer")} value={translateGenerationRow(data.maker, t)} />
          <Row label={t("car.model")} value={translateGenerationRow(data.model, t) ?? "—"} />
          <Row label={t("car.bodyType")} value={translateGenerationRow(data.carShape, t)} />
          <Row label={t("car.fuel")} value={translateGenerationRow(data.fuel, t)} />
          <Row label={t("car.engineVolume")} value={`${data.displacement} cc`} />
          <Row label={t("car.transmission")} value={data.transmission || t("common.notSpecified")} />
          <Row label={t("car.registrationDate")} value={new Date(data.regDate).toLocaleDateString()} />
        </div>
      </div>

      {/* History summary */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <SectionTitle>{t("car.history")}</SectionTitle>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: t("car.accidents"), value: totalAccidents, bad: totalAccidents > 0 },
            { label: t("car.ownerChanges"), value: data.ownerChangeCnt, bad: false },
            { label: t("car.plateChanges"), value: data.carNoChangeCnt, bad: false },
            { label: t("car.theft"), value: data.robberCnt, bad: data.robberCnt > 0 },
            { label: t("car.floods"), value: (data.floodTotalLossCnt || 0) + (data.floodPartLossCnt || 0), bad: data.floodTotalLossCnt > 0 },
          ].map(({ label, value, bad }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: bad && value > 0 ? "rgba(255,69,0,0.12)" : "var(--axis-graphite)",
                border: `1px solid ${bad && value > 0 ? "rgba(255,69,0,0.3)" : "rgba(74,74,74,0.3)"}`,
                color: bad && value > 0 ? "var(--axis-orange)" : "var(--axis-gray)",
              }}>
              <span style={{ color: bad && value > 0 ? "var(--axis-orange)" : "var(--axis-white)", fontWeight: 700 }}>{value}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Owner history */}
        {data.carInfoChanges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("car.ownerHistory")}</p>
            <div className="space-y-2">
              {data.carInfoChanges.map((change, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: "var(--axis-graphite)" }}>
                  <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--axis-orange)", color: "white" }}>{i + 1}</span>
                  <span className="text-xs font-mono" style={{ color: "var(--axis-white)" }}>{change.carNo}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--axis-gray)" }}>{new Date(change.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accidents table */}
        {data.accidents.length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("car.accidentReport")} ({data.accidents.length})</p>
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(74,74,74,0.2)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--axis-graphite)" }}>
                    {[t("common.date"), t("car.insuranceCoverage"), t("car.parts"), t("car.labor"), t("car.painting")].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--axis-gray)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.accidents.map((acc, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-white)" }}>{acc.date}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{acc.insuranceBenefit.toLocaleString()}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{acc.partCost.toLocaleString()}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--axis-gray)" }}>{acc.laborCost.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: acc.paintingCost > 0 ? "var(--axis-orange)" : "var(--axis-gray)" }}>
                        {acc.paintingCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailInfo;
