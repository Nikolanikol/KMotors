"use client";
import { Copy, Gauge, FileText, Hash } from "lucide-react";
import { useState } from "react";
interface VinMileageSectionProps {
  vin: string;
  vehicleNo: string;
  mileage: number;
}

function VinMileageSection({
  vin,
  vehicleNo,
  mileage,
}: VinMileageSectionProps) {
  const [copiedVin, setCopiedVin] = useState(false);
  const [copiedNo, setCopiedNo] = useState(false);

  const copyToClipboard = (text: string, isVin: boolean) => {
    navigator.clipboard.writeText(text);
    if (isVin) {
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    } else {
      setCopiedNo(true);
      setTimeout(() => setCopiedNo(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {/* VIN */}
      <div className="bg-white rounded-2xl p-5 border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">VIN код</h3>
        </div>
        <div className="flex items-center gap-2 group">
          <code className="font-mono text-gray-800 font-semibold tracking-wider text-sm break-all flex-1">
            {vin || "не указано"}
          </code>
          <button
            onClick={() => copyToClipboard(vin || "", true)}
            className="p-2 hover:bg-orange-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Копировать VIN"
          >
            <Copy
              className={`w-4 h-4 transition-colors ${
                copiedVin ? "text-green-500" : "text-orange-600"
              }`}
            />
          </button>
        </div>
        {copiedVin && (
          <p className="text-xs text-green-600 mt-2 font-medium">
            Скопировано!
          </p>
        )}
      </div>

      {/* Vehicle Number */}
      <div className="bg-white rounded-2xl p-5 border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Номер ТС</h3>
        </div>
        <div className="flex items-center gap-2 group">
          <code className="font-mono text-gray-800 font-semibold tracking-wider text-sm flex-1">
            {vehicleNo || "не указано"}
          </code>
          <button
            onClick={() => copyToClipboard(vehicleNo || "", false)}
            className="p-2 hover:bg-orange-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Копировать номер"
          >
            <Copy
              className={`w-4 h-4 transition-colors ${
                copiedNo ? "text-green-500" : "text-orange-600"
              }`}
            />
          </button>
        </div>
        {copiedNo && (
          <p className="text-xs text-green-600 mt-2 font-medium">
            Скопировано!
          </p>
        )}
      </div>

      {/* Mileage */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-sm">Пробег</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white">
            {mileage.toLocaleString()}
          </p>
          <p className="text-white/80 font-medium">км</p>
        </div>
        <p className="text-white/70 text-xs mt-3">
          Оригинальный пробег из Южной Кореи
        </p>
      </div>
    </div>
  );
}

export default VinMileageSection;
