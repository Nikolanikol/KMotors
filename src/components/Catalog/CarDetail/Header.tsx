"use client";

import { formatDate } from "@/utils/formatDate";
import { convertNumber } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { Star, Phone, MapPin, User } from "lucide-react";

import React from "react";
import { useTranslation } from "react-i18next";

const Header = ({ data }) => {
  const { t } = useTranslation();

  return (
    <header className="space-y-6 px-6 py-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-3xl border-2 border-orange-100">
      {/* Top section - Title and Price */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        {/* Left side - Car Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-10 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full"></div>
            <h1 className="lg:text-4xl text-2xl font-bold text-gray-900">
              {translateGenerationRow(data.category.manufacturerName, t)}{" "}
              <span className="text-orange-600">
                {translateGenerationRow(data.category.modelName, t)}
              </span>{" "}
              {translateGenerationRow(data.category.gradeName, t)}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-4 py-2 bg-orange-100 text-orange-700 font-semibold rounded-full text-sm border border-orange-200">
              <span>Дата первой регистрации: </span>
              {formatDate(data.category.yearMonth)}
            </span>
          </div>
        </div>

        {/* Right side - Price */}
        <div className="flex flex-col items-start lg:items-end gap-2">
          <p className="text-gray-600 text-sm font-medium">Цена покупки:</p>
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-4 rounded-2xl shadow-lg">
              <p className="text-3xl font-bold">
                {convertNumber(data.advertisement.price)}
              </p>
              <p className="text-orange-100 text-sm mt-1">вон</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div className="pt-4 border-t-2 border-orange-100">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

          {/* Телефон */}
          <a
            href={`tel:${data.contact.no}`}
            className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-orange-200 rounded-2xl hover:border-orange-400 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Phone className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Телефон продавца</p>
              <p className="text-sm font-bold text-gray-900">{data.contact.no}</p>
            </div>
          </a>

          {/* Адрес */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Адрес</p>
              <p className="text-sm font-bold text-gray-900">{data.contact.address}</p>
            </div>
          </div>

          {/* Тип продавца */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-100 rounded-2xl">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Продавец</p>
              <p className="text-sm font-bold text-gray-900">
                {data.contact.userType === "DEALER" ? "Дилер" : "Частное лицо"}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom section - Features */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t-2 border-orange-100">
        <div className="text-center">
          <p className="text-gray-500 text-xs font-medium mb-2">Кузов</p>
          <p className="text-gray-900 font-bold">
            {data.category.bodyTypeName || "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs font-medium mb-2">Топливо</p>
          <p className="text-gray-900 font-bold">{data.fuelType || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs font-medium mb-2">Коробка</p>
          <p className="text-gray-900 font-bold">{data.transmission || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs font-medium mb-2">Привод</p>
          <p className="text-gray-900 font-bold">{data.driveTrain || "—"}</p>
        </div>
      </div> */}

      {/* Badge section */}
      {/* <div className="flex items-center gap-2 pt-2">
        <div className="flex items-center gap-1 text-orange-600">
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
        </div>
        <span className="text-sm text-gray-600">Проверено K Motors</span>
      </div> */}
    </header>
  );
};

export default Header;
