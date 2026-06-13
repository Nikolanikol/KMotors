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
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { formatUsd } from "@/lib/pricing";
import { ShoppingCart } from "lucide-react";
import { notifyCartUpdate } from "@/hooks/useCartCount";
import {
  calcEmsUsd,
  calcEmspUsd,
  isEmsAvailable,
  isEmspAvailable,
  COUNTRY_NAMES,
  COUNTRY_SELECTOR_ORDER,
} from "@/lib/ems-rates";

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
  weight_kg: number | null;
};

export type ProductLogistics = {
  weight_avg_kg: number | null;
  packed_weight_kg: number | null;
  vol_weight_kg: number | null;
  billed_weight_kg: number | null;
  ship_method: "EMS" | "EMS_PREMIUM" | "SEA" | null;
  size_formula_cm: number | null;
  logistics_notes: string | null;
  // debug fields
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  name_ru: string | null;
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
  logistics: ProductLogistics | null;
  lang: string;
  krwToUsd: number;
  description?: string;
  logisticsCatId?: number | null;
}

const MANUFACTURER_NAMES: Record<string, string> = {
  "현대모비스": "Hyundai Mobis",
  "기아모비스": "Kia Mobis",
  "현대자동차": "Hyundai Motor",
  "기아자동차": "Kia Motors",
  "만도": "Mando",
  "한온시스템": "Hanon Systems",
  "현대위아": "Hyundai Wia",
  "에스엘": "SL Corporation",
  "현대트랜시스": "Hyundai Transys",
  "현대케피코": "Hyundai Kefico",
};

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductDetailClient({
  product,
  categoryName,
  subcategoryName,
  compatibleBrands,
  logistics,
  lang,
  krwToUsd,
  description,
  logisticsCatId,
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartError, setCartError] = useState("");
  const [qty, setQty] = useState(1);
  const [backSearch, setBackSearch] = useState("");
  useScrollDepth(`part_${product.partNumber}`);

  useEffect(() => {
    const saved = sessionStorage.getItem("parts:filters");
    if (saved) setBackSearch(saved);
    // Track product view
    trackEvent("view_item", {
      item_id: String(product.id),
      item_name: product.name_en || product.name_ru || product.name_ko,
      part_number: product.part_number,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Localised product name
  const productName =
    i18n.language === "ru"
      ? product.name_ru || product.name_en || product.name_ko
      : i18n.language === "ko"
      ? product.name_ko || product.name_en || product.name_ru
      : product.name_en || product.name_ru || product.name_ko;

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

  const fmtUsd = (priceKrw: number) => formatUsd(priceKrw, krwToUsd);

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

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/${lang}/auth?mode=login&from=/${lang}/parts`);
      return;
    }
    setCartError("");
    try {
      let { data: cart, error: cartErr } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
      if (!cart && cartErr?.code === "PGRST116") {
        const { data: newCart, error: insertErr } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single();
        if (insertErr) throw insertErr;
        cart = newCart;
      } else if (cartErr && cartErr.code !== "PGRST116") {
        throw cartErr;
      }
      if (!cart) throw new Error("Cart not found");
      const { error: upsertErr } = await supabase.from("cart_items").upsert(
        { cart_id: cart.id, product_id: product.id, quantity: qty },
        { onConflict: "cart_id,product_id" }
      );
      if (upsertErr) throw upsertErr;
      notifyCartUpdate();
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
    } catch (err: unknown) {
      console.error("Add to cart failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setCartError(lang === "ru" ? "Не удалось добавить в корзину" : "Failed to add to cart");
    }
  };

  const partSlug = generatePartSlug(
    product.part_number,
    lang === "ko"
      ? product.name_ko || product.name_en || product.name_ru
      : lang === "ru"
      ? product.name_ru || product.name_en || product.name_ko
      : product.name_en || product.name_ru || product.name_ko,
    lang as "ru" | "en" | "ko",
    product.id
  );

  // Используем стабильный URL без window — предотвращает hydration mismatch #418
  const productUrl = `https://www.kmotors.shop/${lang}/parts/${partSlug}`;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
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
                {product.part_number || product.product_no || "—"}
              </code>
              {(product.part_number || product.product_no) && (
                <>
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
                </>
              )}
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-widest">
                {t("parts.detail.priceLabel")}
              </span>
              <div className="text-4xl font-bold text-[#BB162B] mt-1">
                {fmtUsd(product.price_krw)}
              </div>
            </div>

            {/* Shipping method badge + calculator */}
            <div className="mb-6">
              <ShippingBadge logistics={logistics} lang={lang} krwToUsd={krwToUsd} />
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex gap-3 mb-6">
              <div className="flex items-center border border-gray-200 rounded-xl">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-12 flex items-center justify-center text-gray-500 hover:text-[#002C5F] transition text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-10 h-12 flex items-center justify-center text-gray-500 hover:text-[#002C5F] transition text-lg"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className={`h-12 text-base font-semibold flex-1 flex items-center justify-center gap-2 transition-all ${
                  cartAdded
                    ? "bg-green-500 hover:bg-green-500 text-white"
                    : cartError
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#BB162B] hover:bg-[#9a1122] text-white"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartAdded ? "✓ Добавлено" : t("parts.detail.addToCart")}
              </Button>
            </div>
            {cartError && (
              <p className="text-sm text-red-500 -mt-4 mb-2">{cartError}</p>
            )}

            {/* Specifications */}
            <div className="border-t border-gray-100 pt-5 space-y-3 flex-1">
              <SpecRow
                label={t("parts.detail.manufacturer")}
                value={MANUFACTURER_NAMES[product.manufacturer ?? ""] ?? product.manufacturer ?? "Hyundai Mobis"}
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

        {/* ── Description ───────────────────────────────────────────────────── */}
        {description && (
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-10">
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
          </div>
        )}

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
            onClick={handleAddToCart}
            size="lg"
            className={`font-semibold shrink-0 h-12 px-8 flex items-center gap-2 transition-all ${cartAdded ? "bg-green-500 hover:bg-green-500 text-white" : "bg-[#BB162B] hover:bg-[#9B1220] text-white"}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartAdded ? "✓" : t("parts.detail.addToCart")}
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

const SHIP_CONFIG = {
  EMS: {
    label: { ru: "Авиа EMS", en: "Air EMS" },
    sublabel: { ru: "≤ 30 кг", en: "≤ 30 kg" },
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  EMS_PREMIUM: {
    label: { ru: "Авиа EMS Premium", en: "Air EMS Premium" },
    sublabel: { ru: "≤ 70 кг", en: "≤ 70 kg" },
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  SEA: {
    label: { ru: "Только морем", en: "Sea freight only" },
    sublabel: { ru: "Крупногабаритный груз", en: "Oversized cargo" },
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
} as const;

function ShippingBadge({
  logistics,
  lang,
  krwToUsd,
}: {
  logistics: ProductLogistics | null;
  lang: string;
  krwToUsd: number;
}) {
  const { t } = useTranslation();
  const isRu = lang === "ru";
  const [country, setCountry] = useState("");

  if (!logistics?.ship_method) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">
          {isRu ? "Доставка: уточнить у менеджера" : "Shipping: ask manager"}
        </span>
      </div>
    );
  }

  const cfg = SHIP_CONFIG[logistics.ship_method];
  const label = isRu ? cfg.label.ru : cfg.label.en;
  const sublabel = isRu ? cfg.sublabel.ru : cfg.sublabel.en;

  const avgKg = logistics.weight_avg_kg;
  const packedKg = avgKg !== null
    ? Math.round((avgKg > 30 ? avgKg + 15 : avgKg * 1.05 + 0.3) * 1000) / 1000
    : null;
  const volKg = (logistics.length_cm && logistics.width_cm && logistics.height_cm)
    ? Math.round((logistics.length_cm * logistics.width_cm * logistics.height_cm / 6000) * 1000) / 1000
    : null;

  const emsPackedKg = logistics.billed_weight_kg ?? packedKg;
  const emspBilledKg = logistics.billed_weight_kg
    ?? (packedKg !== null ? Math.max(packedKg, volKg ?? 0) : null);

  const showCalculator =
    (logistics.ship_method === "EMS" || logistics.ship_method === "EMS_PREMIUM") &&
    (emsPackedKg !== null || emspBilledKg !== null);

  const displayKg = logistics.billed_weight_kg
    ?? (logistics.ship_method === "EMS" ? emsPackedKg : emspBilledKg);

  const emsPrice =
    country && emsPackedKg !== null && logistics.ship_method === "EMS"
      ? calcEmsUsd(country, emsPackedKg, krwToUsd)
      : null;

  const emspPrice =
    country && emspBilledKg !== null
      ? calcEmspUsd(country, emspBilledKg, krwToUsd)
      : null;

  const countryName = (code: string) =>
    isRu
      ? COUNTRY_NAMES[code]?.ru ?? code
      : COUNTRY_NAMES[code]?.en ?? code;

  return (
    <div className="space-y-3">
      {/* Method badge */}
      <div className={cn("inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border", cfg.bg, cfg.border)}>
        <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
        <div>
          <span className={cn("text-xs font-semibold", cfg.text)}>{label}</span>
          <span className={cn("text-xs ml-1.5 opacity-70", cfg.text)}>{sublabel}</span>
          {displayKg && (
            <span className={cn("text-xs ml-1.5 opacity-60", cfg.text)}>
              · ~{displayKg} {isRu ? "кг" : "kg"}
            </span>
          )}
        </div>
      </div>

      {/* Shipping cost calculator */}
      {showCalculator && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">
            {t("parts.detail.shippingCalcTitle")}
          </p>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-[#002C5F] focus:outline-none focus:ring-2 focus:ring-[#002C5F]/20"
          >
            <option value="">{t("parts.detail.shippingCalcSelect")}</option>
            {COUNTRY_SELECTOR_ORDER.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>

          {country && (
            <div className="space-y-1.5">
              {/* EMS Standard row */}
              {emsPrice !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">EMS Standard</span>
                  <span className="text-sm font-bold text-green-700">~${emsPrice}</span>
                </div>
              )}
              {/* EMS Premium row */}
              {emspPrice !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">EMS Premium</span>
                  <span className="text-sm font-bold text-blue-700">~${emspPrice}</span>
                </div>
              )}
              {emsPrice === null && emspPrice === null && (
                <p className="text-xs text-red-500">
                  {t("parts.detail.shippingCalcUnavailable")}
                </p>
              )}
              <p className="text-xs text-gray-400">{t("parts.detail.shippingCalcNote")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
