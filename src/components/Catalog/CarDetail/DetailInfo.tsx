"use client";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import {
  Calendar,
  Factory,
  Zap,
  Gauge,
  AlertTriangle,
  Users,
  FileText,
  Droplets,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// 1. Тип для отдельных изменений информации о автомобиле (carInfoChanges)
interface CarInfoChange {
  date: string; // например, "2019-12-31"
  carNo: string; // например, "226보XXXX"
}

// 2. Тип для информации о ДТП (accidents)
interface Accident {
  type: string; // тип ДТП, например "1"
  date: string; // дата происшествия, например "2024-12-13"
  insuranceBenefit: number; // страховое покрытие
  partCost: number; // стоимость запасных частей
  laborCost: number; // стоимость работы
  paintingCost: number; // стоимость покраски
}

// 3. Основной тип для каталога автомобиля из этого JSON-файла
interface VehicleCatalog {
  // Блок управления
  openData: boolean;
  regDate: string; // дата регистрации, ISO-строка, например "2025-01-20T16:01:29.623"
  carNo: string; // номер автомобиля, например "226보6899"
  year: string; // год выпуска как строка, например "2020"
  maker: string; // производитель, например "현대"
  carKind: string; // тип автомобиля (код), например "1"
  use: string; // код использования, например "2"
  displacement: string; // рабочий объём двигателя, например "2497"
  carName: string | null; // Дополнительное имя автомобиля (может быть null)
  firstDate: string; // первая дата, например "2019-12-31"
  fuel: string; // тип топлива, например "가솔린"
  carShape: string; // тип кузова, например "세단 4도어"
  model: string | null; // модель (может отсутствовать)
  transmission: string; // тип трансмиссии, здесь пустая строка, если нет данных
  carNameCode: string | null;
  myAccidentCnt: number;
  otherAccidentCnt: number;
  ownerChangeCnt: number;
  robberCnt: number;
  robberDate: string | null;
  totalLossCnt: number;
  totalLossDate: string | null;
  floodTotalLossCnt: number;
  floodPartLossCnt: number | null; // в примере: null
  floodDate: string | null;
  government: number;
  business: number;
  loan: number;
  carNoChangeCnt: number;
  myAccidentCost: number;
  otherAccidentCost: number;

  // Множественные изменения информации о автомобиле
  carInfoChanges: CarInfoChange[];
  carInfoUse1s: string[];
  carInfoUse2s: string[];
  ownerChanges: string[];
  notJoinDate1: string | null;
  notJoinDate2: string | null;
  notJoinDate3: string | null;
  notJoinDate4: string | null;
  notJoinDate5: string | null;

  // Информация о ДТП
  accidentCnt: number;
  accidents: Accident[];

  // Дополнительная информация (если потребуется, можно добавить другие разделы)
  // Например, можно добавить ключи vehicleType, vin, vehicleId и vehicleNo:
  vehicleType: string;
  vin: string;
  vehicleId: number;
  vehicleNo: string;
}

////////////////
interface DetailInfoProps {
  id: string;
  carnumber: string;
}
const DetailInfo: FC<DetailInfoProps> = ({ id, carnumber }) => {
  const [data, setData] = useState<VehicleCatalog>();
  const [isLoading, setIsloading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation("common");
  useEffect(() => {
    fetch(
      `https://api.encar.com/v1/readside/record/vehicle/${id}/open?vehicleNo=${carnumber}`,
    )
      .then((data) => data.json())
      .then((res) => {
        setData(res);
        console.log(res, "res");
      })

      .then(() => setIsloading(false))
      .catch(() => setError(true));
  }, []);
  // Определяем статус автомобиля

  if (isLoading) return " loading";
  if (error) return " error";
  const getCarStatus = () => {
    const totalAccidents = data.myAccidentCnt + data.otherAccidentCnt;
    const totalProblems =
      totalAccidents + data.robberCnt + data.floodTotalLossCnt;

    if (totalProblems === 0 && data.ownerChangeCnt <= 2) {
      return {
        status: t("car.condition.excellent"),
        color: "green",
        icon: CheckCircle,
      };
    } else if (totalProblems <= 2) {
      return {
        status: t("car.condition.good"),
        color: "blue",
        icon: TrendingUp,
      };
    } else {
      return {
        status: t("car.condition.attention"),
        color: "red",
        icon: AlertTriangle,
      };
    }
  };

  const carStatus = getCarStatus();
  const StatusIcon = carStatus.icon;
  return (
    <div className="space-y-6 mt-8">
      {/* Status Badge */}
      <div
        className={`px-6 py-4 rounded-2xl border-2 ${
          carStatus.color === "green"
            ? "bg-green-50 border-green-300"
            : carStatus.color === "blue"
              ? "bg-blue-50 border-blue-300"
              : "bg-red-50 border-red-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon
            className={`w-6 h-6 ${
              carStatus.color === "green"
                ? "text-green-600"
                : carStatus.color === "blue"
                  ? "text-blue-600"
                  : "text-red-600"
            }`}
          />
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t("car.carStatus")}
            </p>
            <p
              className={`text-xl font-bold ${
                carStatus.color === "green"
                  ? "text-green-700"
                  : carStatus.color === "blue"
                    ? "text-blue-700"
                    : "text-red-700"
              }`}
            >
              {carStatus.status}
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="bg-white rounded-2xl p-8 border-2 border-orange-100 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
          {t("car.detailedInfo")}
        </h2>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Год выпуска */}
          <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.year")}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data?.year}</p>
          </div>

          {/* Производитель */}
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Factory className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.manufacturer")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {translateGenerationRow(data.maker, t)}
            </p>
          </div>

          {/* Модель */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.model")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {translateGenerationRow(data.model, t) ?? "—"}
            </p>
          </div>

          {/* Тип кузова */}
          <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Gauge className="w-5 h-5 text-pink-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.bodyType")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {translateGenerationRow(data.carShape, t)}
            </p>
          </div>

          {/* Топливо */}
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.fuel")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {translateGenerationRow(data.fuel, t)}
            </p>
          </div>

          {/* Объём двигателя */}
          <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-red-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.engineVolume")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {data.displacement} cc
            </p>
          </div>

          {/* Трансмиссия */}
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Gauge className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.transmission")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {data.transmission || t("common.notSpecified")}
            </p>
          </div>

          {/* Тип автомобиля */}
          <div className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.vehicleType")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {data.vehicleType || t("common.notSpecified")}
            </p>
          </div>

          {/* Дата регистрации */}
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {t("car.registrationDate")}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {new Date(data.regDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-2xl p-8 border-2 border-orange-100 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
          {t("car.history")}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* ДТП */}
          <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t("car.accidents")}
            </p>
            <p className="text-3xl font-bold text-red-600">
              {data.myAccidentCnt + data.otherAccidentCnt}
            </p>
          </div>

          {/* Смена владельцев */}
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t("car.ownerChanges")}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {data.ownerChangeCnt}
            </p>
          </div>

          {/* Смена номеров */}
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-4 text-center">
            <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t("car.plateChanges")}
            </p>
            <p className="text-3xl font-bold text-green-600">
              {data.carNoChangeCnt}
            </p>
          </div>

          {/* Угоны */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4 text-center">
            <AlertCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t("car.theft")}
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {data.robberCnt}
            </p>
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Затопления */}
          <div className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5 text-cyan-600" />
              <h3 className="font-bold text-gray-900">{t("car.floods")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">{t("car.floodsTotal")}:</span>{" "}
                <span className="text-cyan-600 font-bold">
                  {data.floodTotalLossCnt}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">{t("car.floodsPartial")}:</span>{" "}
                <span className="text-cyan-600 font-bold">
                  {data.floodPartLossCnt ?? 0}
                </span>
              </p>
              {data.floodDate && (
                <p className="text-gray-600 text-xs">
                  <span className="font-semibold">{t("common.date")}:</span>{" "}
                  {data.floodDate}
                </p>
              )}
            </div>
          </div>

          {/* Угоны детали */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">{t("car.theft")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">{t("car.theftCount")}:</span>{" "}
                <span className="text-purple-600 font-bold">
                  {data.robberCnt}
                </span>
              </p>
              {data.robberDate && (
                <p className="text-gray-600 text-xs">
                  <span className="font-semibold">{t("common.date")}:</span>{" "}
                  {data.robberDate}
                </p>
              )}
            </div>
          </div>

          {/* ДТП детали */}
          <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-gray-900">{t("car.accidents")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">{t("car.myAccidents")}:</span>{" "}
                <span className="text-red-600 font-bold">
                  {data.myAccidentCnt}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">
                  {t("car.otherAccidents")}:
                </span>{" "}
                <span className="text-red-600 font-bold">
                  {data.otherAccidentCnt}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Changes History */}
      {data.carInfoChanges.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border-2 border-orange-100 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
            {t("car.ownerHistory")} ({data.carInfoChanges.length})
          </h2>

          <div className="space-y-3">
            {data.carInfoChanges.map((change, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t("car.plateNumber")}: {change.carNo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(change.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accidents Table */}
      {data.accidents.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border-2 border-orange-100 shadow-md overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
            {t("car.accidentReport")} ({data.accidents.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("common.date")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("car.insuranceCoverage")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("car.parts")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("car.labor")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("car.painting")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.accidents.map((acc, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 transition-colors hover:bg-orange-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {acc.date}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">
                      {acc.insuranceBenefit.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">
                      {acc.partCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">
                      {acc.laborCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-orange-600">
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
  );
};

export default DetailInfo;
