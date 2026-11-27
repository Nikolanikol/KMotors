"use client";

import { convertedCarPrice, formatCarKrw } from "@/lib/carPricing";
import { Phone, MapPin, User, ExternalLink, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import CarRequestForm from "./CarRequestForm";
import { carContactLinks } from "@/lib/carContactLinks";
import { trackEvent } from "@/utils/gtag";
import type { EncarRaw } from "@/lib/vehicle";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";

interface Props {
  data: EncarRaw;
  id: string;
  carName: string;
  krwToRub?: number;
  krwToUsd?: number;
  lang: string;
}

export default function CarDetailSidebar({ data, id, carName, krwToRub, krwToUsd, lang }: Props) {
  const { t } = useTranslation(["common"]);

  const convertedPrice = convertedCarPrice(data?.advertisement?.price, lang, {
    krwToRub,
    krwToUsd,
  });

  const { waUrl, tgUrl } = carContactLinks(lang, id, carName);

  return (
    <div className="space-y-4">
      {/* Price — только десктоп, на мобиле показывается над фото */}
      <div className="hidden lg:block rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("common:car.buyPrice")}</p>
        <div className="rounded-xl px-5 py-4 mb-2" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))", boxShadow: "0 8px 24px rgba(182,119,73,0.25)" }}>
          <p className="text-2xl font-bold text-white">{formatCarKrw(data.advertisement.price)}</p>
          <p className="text-white/70 text-sm">{t("common:common.won")}</p>
        </div>
        {convertedPrice && (
          <p className="text-lg font-semibold" style={{ color: "var(--axis-white)" }}>
            ≈ {convertedPrice.value} {convertedPrice.symbol}
          </p>
        )}
        <p className="text-[11px] leading-tight mt-1.5" style={{ color: "var(--axis-gray)" }}>
          {t("common:car.storageFeeIncluded")}
        </p>
        {/* Метка «Цена покупки» читается как итог — подпись снимает это ожидание. */}
        <p className="text-[11px] leading-tight mt-1" style={{ color: "var(--axis-gray)" }}>
          {t("common:car.priceScope")}
        </p>
        {/* Якорь на калькулятор растаможки этой же карточки (id в page.tsx) */}
        <a
          href="#customs-calculator"
          className={`inline-block mt-2 text-sm font-semibold rounded px-1 -mx-1 transition-colors text-[var(--axis-bronze)] hover:bg-white/[0.06] hover:text-[var(--axis-white)] ${FOCUS_RING}`}
        >
          {t("common:car.calcTurnkey")}
        </a>
      </div>

      {/* Request form */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--axis-charcoal)",
          border: "1.5px solid rgba(182,119,73,0.5)",
          boxShadow: "0 0 24px rgba(182,119,73,0.12)",
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
            <p className="font-bold text-base" style={{ color: "var(--axis-white)" }}>{t("common:car.wantThisCarShort")}</p>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--axis-gray)" }}>{t("common:car.managerContact")}</p>
          <CarRequestForm carId={id} carName={carName} />

          {/* Те же ссылки, что в мобильной плашке: менеджер получает id и адрес машины */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>{t("common:car.orWrite")}</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("contact", { method: "whatsapp_sidebar", car_id: id })}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all hover:brightness-125 hover:-translate-y-0.5 ${FOCUS_RING}`}
                style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366" }}
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={tgUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("contact", { method: "telegram_sidebar", car_id: id })}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all hover:brightness-125 hover:-translate-y-0.5 ${FOCUS_RING}`}
                style={{ backgroundColor: "rgba(34,158,217,0.15)", color: "#229ED9" }}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Seller info */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
        <p className="text-xs font-semibold tracking-wide" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerInfo")}</p>

        <a href={`tel:${data.contact.no}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(182,119,73,0.12)", color: "var(--axis-orange)" }}>
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerPhone")}</p>
            <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>{data.contact.no}</p>
          </div>
        </a>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(182,119,73,0.08)", color: "var(--axis-gray)" }}>
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerAddress")}</p>
            <p className="text-sm" style={{ color: "var(--axis-white)" }}>{data.contact.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(182,119,73,0.08)", color: "var(--axis-gray)" }}>
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
        style={{ backgroundColor: "rgba(182,119,73,0.08)", color: "var(--axis-orange)", border: "1px solid rgba(182,119,73,0.2)" }}
      >
        <ExternalLink className="w-4 h-4" />
        {t("common:car.encarReport")}
      </a>
    </div>
  );
}
