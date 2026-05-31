"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  Car,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/utils/gtag";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { generatePartSlug } from "@/utils/partSlug";
import { OrderModal } from "./OrderModal";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ProductDetail = {
  id: number;
  product_no: string | null;
  part_number: string;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  official_name_ko: string | null;
  manufacturer: string | null;
  price_krw: number;
  is_new: boolean;
  image_url: string | null;
  detail_url: string | null;
  category_id: number | null;
  subcategory_id: number | null;
};

export type CompatibleBrand = {
  id: number;
  name: string;
  slug: string;
  models: { id: number; name_en: string; name_ko: string | null }[];
};

interface Props {
  product: ProductDetail;
  categoryName: { ru: string; en: string; slug: string } | null;
  subcategoryName: { ru: string; en: string } | null;
  compatibleBrands: CompatibleBrand[];
  lang: string;
  krwToUsd: number;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductDetailClient({
  product,
  categoryName,
  subcategoryName,
  compatibleBrands,
  lang,
  krwToUsd,
}: Props) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [backSearch, setBackSearch] = useState("");
  useScrollDepth(`part_${product.partNumber}`);

  useEffect(() => {
    const saved = sessionStorage.getItem("parts:filters");
    if (saved) setBackSearch(saved);
    // Track product view
    trackEvent("view_item", {
      item_id: String(product.id),
      item_name: product.name_en || product.name_ru,
      part_number: product.part_number,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Localised product name
  const productName =
    i18n.language === "ru"
      ? product.name_ru
      : i18n.language === "ko"
      ? product.name_ko || product.name_en || product.name_ru
      : product.name_en || product.name_ru;

  const catName = categoryName
    ? i18n.language === "ru"
      ? categoryName.ru
      : categoryName.en
    : null;

  const subName = subcategoryName
    ? i18n.language === "ru"
      ? subcategoryName.ru
      : subcategoryName.en
    : null;

  const formatUsd = (priceKrw: number) =>
    "$" + new Intl.NumberFormat("en-US").format(Math.ceil(priceKrw * krwToUsd * 1.23));

  const copyPartNumber = async () => {
    try {
      await navigator.clipboard.writeText(product.part_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select/copy via execCommand
    }
  };

  const backHref = `/${lang}/parts${backSearch}`;

  const handleOrder = () => setIsOrderOpen(true);

  const partSlug = generatePartSlug(
    product.part_number,
    lang === "ko"
      ? product.name_ko || product.name_en || product.name_ru
      : lang === "ru"
      ? product.name_ru
      : product.name_en || product.name_ru
  );

  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/${lang}/parts/${partSlug}`;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        productName={productName}
        partNumber={product.part_number}
        productUrl={productUrl}
      />
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link
              href={`/${lang}`}
              className="hover:text-[#002C5F] transition-colors"
            >
              {t("parts.detail.breadcrumbHome")}
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={backHref}
              className="hover:text-[#002C5F] transition-colors"
            >
              {t("parts.detail.breadcrumbParts")}
            </Link>
            {catName && (
              <>
                <span className="text-gray-300">/</span>
                <Link
                  href={`/${lang}/parts?cat=${categoryName?.slug}`}
                  className="hover:text-[#002C5F] transition-colors"
                >
                  {catName}
                </Link>
              </>
            )}
            <span className="text-gray-300">/</span>
            <span className="text-[#002C5F] font-medium truncate max-w-[220px]">
              {productName}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002C5F] transition-colors mb-7 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("parts.detail.backToCatalog")}
        </Link>

        {/* ── Hero grid ──────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 mb-10">

          {/* Image card */}
          <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden relative"
               style={{ minHeight: "320px" }}>
            {product.image_url && !imgError ? (
              <Image
                src={product.image_url}
                alt={productName}
                fill
                unoptimized
                priority
                onError={() => setImgError(true)}
                className="object-contain p-8"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-300 py-16">
                <Package className="w-24 h-24" />
                <span className="text-sm">{t("parts.detail.noPhoto")}</span>
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col">

            {/* NEW badge */}
            {product.is_new && (
              <span className="self-start mb-4 bg-[#BB162B] text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
                {t("parts.detail.newBadge")}
              </span>
            )}

            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[#002C5F] leading-tight mb-2">
              {productName}
            </h1>

            {/* Official Korean name */}
            {product.official_name_ko && (
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {product.official_name_ko}
              </p>
            )}

            {/* Part number */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-gray-500 shrink-0">
                {t("parts.detail.partNumber")}:
              </span>
              <code className="text-sm font-mono font-semibold text-[#002C5F] bg-[#002C5F]/5 px-2.5 py-1 rounded-md">
                {product.part_number}
              </code>
              <button
                onClick={copyPartNumber}
                title={t("parts.detail.copySuccess")}
                className="p-1.5 text-gray-400 hover:text-[#002C5F] transition-colors rounded-md hover:bg-gray-50"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              {copied && (
                <span className="text-xs text-green-500">
                  {t("parts.detail.copySuccess")}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-xs text-gray-500 uppercase tracking-widest">
                {t("parts.detail.priceLabel")}
              </span>
              <div className="text-4xl font-bold text-[#BB162B] mt-1">
                {formatUsd(product.price_krw)}
              </div>
            </div>

            {/* Order CTA */}
            <Button
              onClick={handleOrder}
              size="lg"
              className="bg-[#002C5F] hover:bg-[#001f45] text-white h-12 text-base font-semibold w-full mb-6"
            >
              {t("parts.detail.orderBtn")}
            </Button>

            {/* Specifications */}
            <div className="border-t border-gray-100 pt-5 space-y-3 flex-1">
              <SpecRow
                label={t("parts.detail.manufacturer")}
                value={product.manufacturer || "Hyundai Mobis"}
              />
              {catName && (
                <SpecRow
                  label={t("parts.detail.category")}
                  value={catName}
                />
              )}
              {subName && (
                <SpecRow
                  label={t("parts.detail.subcategory")}
                  value={subName}
                />
              )}

            </div>
          </div>
        </div>

        {/* ── Compatible models ──────────────────────────────────────────────── */}
        {compatibleBrands.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-10">
            <h2 className="text-xl font-bold text-[#002C5F] mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#002C5F]/5 flex items-center justify-center">
                <Car className="w-4 h-4 text-[#002C5F]" />
              </div>
              {t("parts.detail.fitsTitle")}
            </h2>
            <div
              className={cn(
                "grid gap-6",
                compatibleBrands.length === 1
                  ? "grid-cols-1 max-w-sm"
                  : compatibleBrands.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-3"
              )}
            >
              {compatibleBrands.map((brand) => (
                <div key={brand.id}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#002C5F]/10">
                    <BrandDot slug={brand.slug} />
                    <span className="text-sm font-semibold text-[#002C5F]">
                      {brand.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {brand.models.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brand.models.map((m) => (
                      <span
                        key={m.id}
                        className="px-3 py-1.5 rounded-full bg-[#F5F7FA] text-[#002C5F] text-xs font-medium border border-[#002C5F]/8 hover:border-[#002C5F]/25 transition-colors"
                      >
                        {i18n.language === "ko"
                          ? m.name_ko || m.name_en
                          : m.name_en}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#002C5F] to-[#003d7a] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm mb-1">
              {t("parts.detail.partNumber")}: {product.part_number}
            </p>
            <p className="text-white font-bold text-xl">{productName}</p>
          </div>
          <Button
            onClick={handleOrder}
            size="lg"
            className="bg-[#BB162B] hover:bg-[#9B1220] text-white font-semibold shrink-0 h-12 px-8"
          >
            {t("parts.detail.orderBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 min-w-[120px] shrink-0">{label}</span>
      <span className="font-medium text-[#002C5F]">{value}</span>
    </div>
  );
}

const BRAND_COLORS: Record<string, string> = {
  hyundai: "#002C5F",
  kia: "#BB162B",
  genesis: "#8B6914",
};

function BrandDot({ slug }: { slug: string }) {
  const color = BRAND_COLORS[slug] ?? "#002C5F";
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}
