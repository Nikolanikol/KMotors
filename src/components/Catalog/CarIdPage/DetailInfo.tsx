"use client";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
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
  const { t } = useTranslation();
  useEffect(() => {
    fetch(
      `https://api.encar.com/v1/readside/record/vehicle/${id}/open?vehicleNo=${carnumber}`
    )
      .then((data) => data.json())
      .then((res) => {
        setData(res);
      })

      .then(() => setIsloading(false))
      .catch(() => setError(true));
  }, []);

  if (isLoading) return " loading";
  if (error) return " error";
  return (
    <div className="m-5  ">
      <div className="flex flex-col ">
        {/* <span> {id}- id</span>
        <span>{carnumber} carnumber</span> */}
        <div className="px-4 mx-auto  w-full  bg-white rounded shadow space-y-6 text-gray-900 py-4">
          <h1 className="text-3xl font-bold mb-4">Детальная информация</h1>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6   ">
            <div className="">
              <h2 className="text-xl font-semibold mb-2">Основные данные</h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <span className="font-semibold">Год выпуска:</span>{" "}
                  {data?.year}
                </li>
                <li>
                  <span className="font-semibold">Производитель:</span>{" "}
                  {translateGenerationRow(data.maker, t)}
                </li>
                <li>
                  <span className="font-semibold">Модель:</span>{" "}
                  {translateGenerationRow(data.model, t) ?? "—"}
                </li>
                <li>
                  <span className="font-semibold">Тип кузова:</span>{" "}
                  {translateGenerationRow(data.carShape, t)}
                </li>
                <li>
                  <span className="font-semibold">Тип топлива:</span>{" "}
                  {translateGenerationRow(data.fuel, t)}
                </li>
                <li>
                  <span className="font-semibold">Объем двигателя:</span>{" "}
                  {data.displacement} cc
                </li>
                <li>
                  <span className="font-semibold">Трансмиссия:</span>{" "}
                  {data.transmission || "не указано"}
                </li>

                <li>
                  <span className="font-semibold">Тип автомобиля:</span>{" "}
                  {data.vehicleType || "не указано"}
                </li>
                <li>
                  <span className="font-semibold">Дата регистрации:</span>{" "}
                  {new Date(data.regDate).toLocaleDateString()}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">
                Статистика и история
              </h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <span className="font-semibold">ДТП :</span>{" "}
                  {data.myAccidentCnt + data.otherAccidentCnt}
                </li>

                <li>
                  <span className="font-semibold">Смена владельцев:</span>{" "}
                  {data.ownerChangeCnt}
                </li>
                <li>
                  <span className="font-semibold">Смена номеров:</span>{" "}
                  {data.carNoChangeCnt}
                </li>
                <li>
                  <span className="font-semibold">Угоны:</span> {data.robberCnt}
                </li>
                <li>
                  <span className="font-semibold">Дата угона:</span>{" "}
                  {data.robberDate ?? "—"}
                </li>

                <li>
                  <span className="font-semibold">Затопления полные:</span>{" "}
                  {data.floodTotalLossCnt}
                </li>
                <li>
                  <span className="font-semibold">Затопления частичные:</span>{" "}
                  {data.floodPartLossCnt ?? "—"}
                </li>
                <li>
                  <span className="font-semibold">Дата затопления:</span>{" "}
                  {data.floodDate ?? "—"}
                </li>
              </ul>
            </div>
          </section>

          <section className="">
            <h2 className="text-xl font-semibold mb-2">Список собственников</h2>
            {data.carInfoChanges.length === 0 ? (
              <p className="text-sm text-gray-600">Нет данных об изменениях</p>
            ) : (
              <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto space-y-1">
                {data.carInfoChanges.map((change, idx) => (
                  <li key={idx}>
                    Дата: {change.date}, Номер: {change.carNo}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <section className="overflow-hidden max-w-full md:w-full md:max-w-full">
          <h2 className="text-xl font-semibold mb-2">Аварийный лист</h2>
          {data.accidents.length === 0 ? (
            <p className="text-sm text-gray-600">Нет данных о ДТП</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-1 text-left">
                      Дата
                    </th>
                    <th className="border border-gray-300 px-1 text-right">
                      Страховое покрытие
                    </th>
                    <th className="border border-gray-300 px-1  text-right">
                      Стоимость запчастей
                    </th>
                    <th className="border border-gray-300 px-1 text-right">
                      Стоимость работы
                    </th>
                    <th className="border border-gray-300 px-1  text-right">
                      Стоимость покраски
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.accidents.map((acc, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {/* <td className="border border-gray-300 px-3 py-1">
                          {acc.type}
                        </td> */}
                      <td className="border border-gray-300 px-1.5 py-1">
                        {acc.date}
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">
                        {acc.insuranceBenefit.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">
                        {acc.partCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">
                        {acc.laborCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">
                        {acc.paintingCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DetailInfo;
