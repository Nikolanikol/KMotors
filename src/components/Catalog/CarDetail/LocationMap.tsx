"use client";

import { useState } from "react";
import { MapPin, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocationMapProps {
  address: string;
}

export default function LocationMap({ address }: LocationMapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language || "ru";

  if (!address) return null;

  const encodedAddress = encodeURIComponent(address);
  const mapLang = lang === "ko" ? "ko" : lang === "en" ? "en" : "ru";

  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed&hl=${mapLang}&zoom=13`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <div className="w-full mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors group"
      >
        <MapPin className="w-4 h-4" />
        <span>{isOpen ? "Скрыть карту" : "Посмотреть на карте"}</span>
        {isOpen
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />
        }
      </button>

      {/* Map container */}
      {isOpen && (
        <div className="mt-3 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-sm">
          {/* Map iframe */}
          <iframe
            src={embedUrl}
            width="100%"
            height="280"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Карта: ${address}`}
          />

          {/* Open in Google Maps link */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border-t border-orange-100">
            <span className="text-xs text-gray-500 truncate">{address}</span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap ml-3 transition-colors"
            >
              Открыть в Google Maps
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
