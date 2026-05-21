"use client";
import { Copy, Gauge, FileText, Hash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface VinMileageSectionProps {
  vin: string;
  vehicleNo: string;
  mileage: number;
}

function VinMileageSection({ vin, vehicleNo, mileage }: VinMileageSectionProps) {
  const [copiedVin, setCopiedVin] = useState(false);
  const [copiedNo, setCopiedNo] = useState(false);
  const { t } = useTranslation("common");

  const copy = (text: string, isVin: boolean) => {
    navigator.clipboard.writeText(text);
    if (isVin) { setCopiedVin(true); setTimeout(() => setCopiedVin(false), 2000); }
    else { setCopiedNo(true); setTimeout(() => setCopiedNo(false), 2000); }
  };

  const Card = ({ icon: Icon, label, value, onCopy, copied }: { icon: any; label: string; value: string; onCopy?: () => void; copied?: boolean }) => (
    <div className="rounded-xl p-4 group" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,69,0,0.1)", color: "var(--axis-orange)" }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--axis-gray)" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="font-mono text-sm font-semibold flex-1 break-all" style={{ color: "var(--axis-white)" }}>
          {value || t("common.notSpecified")}
        </code>
        {onCopy && (
          <button onClick={onCopy} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(255,69,0,0.1)" }}>
            <Copy className="w-3.5 h-3.5" style={{ color: copied ? "#22c55e" : "var(--axis-orange)" }} />
          </button>
        )}
      </div>
      {copied && <p className="text-xs mt-1" style={{ color: "#22c55e" }}>{t("common.copied")}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card icon={FileText} label={t("car.vinCode")} value={vin} onCopy={() => copy(vin || "", true)} copied={copiedVin} />
      <Card icon={Hash} label={t("car.vehicleNumber")} value={vehicleNo} onCopy={() => copy(vehicleNo || "", false)} copied={copiedNo} />
      <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-white/80">{t("car.mileage")}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-white">{mileage?.toLocaleString()}</p>
          <p className="text-white/70 text-sm">{t("common.km")}</p>
        </div>
        <p className="text-white/60 text-xs mt-1">{t("car.mileageNote")}</p>
      </div>
    </div>
  );
}

export default VinMileageSection;
