"use client";

import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { Fuel, Gauge, Settings, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface CarCardProps {
  id: string;
  photo: string;
  model: string;
  manufacture: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  price: string;
}

const CarCard = ({
  photo,
  id,
  model,
  manufacture,
  mileage,
  transmission,
  fuel,
  price,
}: CarCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="group relative w-full max-w-[400px] mx-auto bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-400 shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          //   fill
          src={`https://ci.encar.com${photo}`}
          alt={`${manufacture} ${model}`}
          className="h-full object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title Section */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {translateGenerationRow(model, t)}
          </h3>
          <p className="text-sm text-gray-400 font-medium">
            {translateGenerationRow(manufacture, t)}
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-y-2 border-gray-100">
          {/* Mileage */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Fuel className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Пробег</p>
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                {convertNumberKm(mileage)} км
              </p>
            </div>
          </div>

          {/* Fuel */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Gauge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Топливо</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">
                {translateGenerationRow(fuel, t)}
              </p>
            </div>
          </div>

          {/* Transmission */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Коробка</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">
                {translateGenerationRow(transmission, t)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Price & Button */}
        <div className="flex items-center justify-between gap-4">
          {/* Price */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Цена покупки</p>
            <p className="text-xl font-bold text-orange-600">
              {convertNumber(price)}
              <span className="text-sm text-gray-600 ml-1">вон</span>
            </p>
          </div>

          {/* Button */}
          <Link
            href={`/catalog/${id}`}
            target="_blank"
            className="group/btn flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:gap-3 shadow-md hover:shadow-lg"
          >
            <span className="hidden sm:inline">Подробнее</span>
            <span className="sm:hidden">Открыть</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
