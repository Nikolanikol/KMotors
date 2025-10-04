"use client";

import { formatDate } from "@/utils/formatDate";
import { convertNumber } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";

import React from "react";
import { useTranslation } from "react-i18next";

const Header = ({ data }) => {
  const { t } = useTranslation();

  return (
    <header className="space-y-4 px-6">
      <h1 className="lg:text-4xl text-2xl font-bold flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="border-b-2 border-black pb-1">
          {translateGenerationRow(data.category.manufacturerName, t)}{" "}
          {translateGenerationRow(data.category.modelName, t)}{" "}
          {translateGenerationRow(data.category.gradeName, t)}{" "}
          {formatDate(data.category.yearMonth)}
        </div>
        <div className="text-red-600">
          {convertNumber(data.advertisement.price)} вон
        </div>
      </h1>

      <div className="flex flex-col md:flex-row justify-between text-sm text-gray-600 gap-2">
        <p className="flex flex-wrap gap-2">
          <span>
            VIN: <span className="font-mono">{data.vin || "не указано"}</span>
          </span>
          <span>| Номер: {data.vehicleNo}</span>
        </p>
        <span className="font-semibold text-gray-800">
          Пробег: {data.spec.mileage.toLocaleString()} км
        </span>
      </div>
    </header>
  );
};

export default Header;
