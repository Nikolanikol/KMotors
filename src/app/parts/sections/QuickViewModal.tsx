"use client";
import { useEffect, useState } from "react";
import { X, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import type { Product } from "./PartsCatalogClient";
import { formatUsd } from "@/lib/pricing";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  krwToUsd: number;
  lang: string;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  krwToUsd,
  lang,
}: QuickViewModalProps) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!product) return null;

  const name =
    lang === "ko" && product.name_ko
      ? product.name_ko
      : lang === "en"
        ? product.name_en
        : product.name_ru;

  const price = formatUsd(product.price_krw, krwToUsd);

  const scrollToContact = () => {
    onClose();
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--pn-light-gray)] flex items-center justify-center hover:bg-[var(--pn-medium-gray)] transition-colors z-10"
        >
          <X className="w-4 h-4 text-[var(--pn-dark-gray)]" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Image */}
          <div className="sm:w-[280px] flex-shrink-0 bg-[var(--pn-light-gray)] rounded-lg flex items-center justify-center aspect-square overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={name}
                width={280}
                height={280}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <Wrench className="w-16 h-16 text-[var(--pn-medium-gray)]" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--pn-dark-gray)] font-mono mb-1">
              {product.part_number}
            </div>
            <h3 className="text-lg font-bold text-[var(--pn-deep-navy)] mb-4 leading-tight">
              {name}
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-[var(--pn-orange)]">
                {price}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--pn-success)]">
                <span className="w-1.5 h-1.5 bg-[var(--pn-success)] rounded-full" />
                {t("parts.products.inStock")}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-[var(--pn-dark-gray)]">
                {t("parts.detail.priceLabel")}:
              </span>
              <div className="flex items-center border border-[var(--pn-medium-gray)] rounded-md">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-l-md transition-colors"
                >
                  —
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-r-md transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={scrollToContact}
              className="w-full pn-btn-primary text-center text-sm mb-3"
            >
              {t("parts.catalog.orderBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
