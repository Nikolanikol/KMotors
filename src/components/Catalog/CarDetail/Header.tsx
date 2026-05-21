"use client";

import { formatDate } from "@/utils/formatDate";
import { convertNumber } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import { Phone, MapPin, User } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import LocationMap from "./LocationMap";

const Header = ({ data }) => {
  const { t } = useTranslation(["common", "cars"]);

  return (
    <header className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
      {/* Title + Price */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 rounded-full" style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))" }} />
            <h1 className="text-2xl lg:text-4xl font-bold leading-tight" style={{ color: "var(--axis-white)" }}>
              {translateGenerationRow(data.category.manufacturerName, t)}{" "}
              <span style={{ color: "var(--axis-orange)" }}>
                {translateGenerationRow(data.category.modelName, t)}
              </span>{" "}
              {translateGenerationRow(data.category.gradeName, t)}
            </h1>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.3)" }}>
              {t("common:car.firstRegistration")}: {formatDate(data.category.yearMonth)}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-start lg:items-end gap-1">
          <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.buyPrice")}</p>
          <div className="px-6 py-4 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))", boxShadow: "0 8px 32px rgba(255,69,0,0.3)" }}>
            <p className="text-3xl font-bold text-white">{convertNumber(data.advertisement.price)}</p>
            <p className="text-white/70 text-sm mt-0.5">{t("common:common.won")}</p>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(74,74,74,0.3)" }}>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <a
            href={`tel:${data.contact.no}`}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group"
            style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(74,74,74,0.3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.4)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)" }}>
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerPhone")}</p>
              <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>{data.contact.no}</p>
            </div>
          </a>

          <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(74,74,74,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}>
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--axis-gray)" }}>{t("common:car.sellerAddress")}</p>
                <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>{data.contact.address}</p>
              </div>
            </div>
            <LocationMap address={data.contact.address} />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(74,74,74,0.3)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}>
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
      </div>
    </header>
  );
};

export default Header;
