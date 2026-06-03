"use client";

import { convertNumber } from "@/utils/splitNumber";
import { Phone, MapPin, User, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import CarRequestForm from "./CarRequestForm";
import CustomsCalculator from "./CustomsCalculator/CustomsCalculator";

interface Props {
  data: any;
  id: string;
  carName: string;
  krwToRub?: number;
  krwToUsd?: number;
  lang: string;
  priceKRW?: number;
  yearMonth?: string;
  engineVolume?: number;
  fuelType?: string;
}

export default function CarDetailSidebar({ data, id, carName, krwToRub, krwToUsd, lang, priceKRW, yearMonth, engineVolume, fuelType }: Props) {
  const { t } = useTranslation(["common"]);

  const krw = data?.advertisement?.price * 10000;
  const convertedPrice = (() => {
    if (!krw || isNaN(krw)) return null;
    if (lang === "ru" && krwToRub) return { value: Math.round(krw * krwToRub).toLocaleString("ru-RU"), symbol: "₽" };
    if (lang !== "ko" && krwToUsd) return { value: Math.round(krw * krwToUsd).toLocaleString("en-US"), symbol: "$" };
    return null;
  })();

  return (
    <div className="space-y-4">
      {/* Price — только десктоп, на мобиле показывается над фото */}
      <div className="hidden lg:block rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("common:car.buyPrice")}</p>
        <div className="rounded-xl px-5 py-4 mb-2" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))", boxShadow: "0 8px 24px rgba(255,69,0,0.25)" }}>
          <p className="text-2xl font-bold text-white">{convertNumber(data.advertisement.price)}</p>
          <p className="text-white/70 text-sm">{t("common:common.won")}</p>
        </div>
        {convertedPrice && (
          <p className="text-lg font-semibold" style={{ color: "var(--axis-white)" }}>
            ≈ {convertedPrice.value} {convertedPrice.symbol}
          </p>
        )}
      </div>

      {/* Request form */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--axis-charcoal)",
          border: "1.5px solid rgba(255,69,0,0.5)",
          boxShadow: "0 0 24px rgba(255,69,0,0.12)",
        }}
      >
        {/* Акцентная полоска сверху */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--axis-orange), var(--axis-amber))" }} />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            {/* Пульсирующий индикатор */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#22c55e" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "#22c55e" }} />
            </span>
            <p className="font-bold text-base" style={{ color: "var(--axis-white)" }}>Хочу эту машину</p>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--axis-gray)" }}>Менеджер свяжется в течение 1 часа</p>
          <CarRequestForm carId={id} carName={carName} />
        </div>
      </div>

      {/* Seller info */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <p className="text-xs font-semibold tracking-wide" style={{ color: "var(--axis-gray)" }}>Информация о продавце</p>

        <a href={`tel:${data.contact.no}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)" }}>
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerPhone")}</p>
            <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>{data.contact.no}</p>
          </div>
        </a>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}>
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerAddress")}</p>
            <p className="text-sm" style={{ color: "var(--axis-white)" }}>{data.contact.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}>
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.seller")}</p>
            <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>
              {data.contact.userType === "DEALER" ? t("common:car.dealer") : t("common:car.privateSeller")}
            </p>
          </div>
        </div>
      </div>

      {/* Encar link */}
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${data?.vehicleId}`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200"
        style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.2)" }}
      >
        <ExternalLink className="w-4 h-4" />
        Отчёт на Encar
      </a>
    </div>
  );
}
