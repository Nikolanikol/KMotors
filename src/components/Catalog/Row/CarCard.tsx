"use client";

import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { Fuel, Gauge, Settings, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const BUY_FROM_KOREA: Record<string, string> = {
  ru: "купить из Кореи",
  en: "buy from Korea",
  ko: "한국에서 구매",
  ka: "კორეიდან შეძენა",
  ar: "شراء من كوريا",
};

const CarCard = ({
  photo,
  id,
  model,
  manufacture,
  year,
  mileage,
  transmission,
  fuel,
  price,
}: CarCardProps) => {
  const { t } = useTranslation(["common", "cars"]);
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const krw =
    typeof price === "number"
      ? (price as unknown as number) * 10000
      : Number(price) * 1000;
  const usdPrice = isNaN(krw) || krw === 0 ? null : Math.round(krw / 1380);

  return (
    <div className="group relative w-full max-w-[400px] mx-auto bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-400 shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Image
          fill
          unoptimized
          src={`https://ci.encar.com${photo}`}
          alt={`${manufacture} ${model} ${year} — ${BUY_FROM_KOREA[lang] ?? BUY_FROM_KOREA.ru}`}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
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
              <p className="text-xs text-gray-500 mb-1">
                {t("common:car.mileage")}
              </p>
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                {convertNumberKm(mileage)} {t("common:common.km")}
              </p>
            </div>
          </div>

          {/* Fuel */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Gauge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {t("common:car.fuel")}
              </p>
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
              <p className="text-xs text-gray-500 mb-1">
                {t("common:car.transmission")}
              </p>
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
            <p className="text-xs text-gray-500 mb-1">
              {t("common:car.buyPrice")}
            </p>
            <p className="text-xl font-bold text-orange-600">
              {convertNumber(price)}
              <span className="text-sm text-gray-600 ml-1">
                {t("common:common.won")}
              </span>
            </p>

            {usdPrice && (
              <p className="text-sm text-gray-500 mt-1 font-medium">
                ≈ ${usdPrice.toLocaleString("en-US")}{" "}
                <span className="text-xs font-normal">USD</span>
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${lang}/catalog/${id}`}
              target="_blank"
              className="group/btn flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:gap-3 shadow-md hover:shadow-lg"
            >
              <span className="hidden sm:inline">{t("common:car.details")}</span>
              <span className="sm:hidden">{t("common:car.details")}</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <a
              href={`https://t.me/KMOTORS_form_bot?start=car_${id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать в Telegram"
              className="flex items-center justify-center w-12 h-12 bg-[#229ED9] hover:bg-[#1a8bc2] text-white rounded-xl transition-colors shadow-md hover:shadow-lg flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
