"use client";
import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  Car,
  Copy,
  Check,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import { usePartsFavorites } from "@/hooks/usePartsFavorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/utils/gtag";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { generatePartSlug } from "@/utils/partSlug";
import { FitmentProductsGrid } from "./FitmentProductsGrid";
import { OrderModal } from "./OrderModal";
import type { Product } from "./PartsCatalogClient";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { formatUsd } from "@/lib/pricing";
import { ShoppingCart } from "lucide-react";
import { notifyCartUpdate, useCartProductIds } from "@/hooks/useCartCount";
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
  // SEO-поля (заполняются автоматикой после апрува; могут быть null)
  seo_title_ru: string | null;
  seo_title_en: string | null;
  seo_desc_ru: string | null;
  seo_desc_en: string | null;
  seo_body_ru: string | null;
  seo_body_en: string | null;
  cross_refs: string[] | null;
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
  models: { id: number; name_en: string; name_ko: string | null; years: string; brand: string; vehicleSlug: string }[];
};

interface Props {
  product: ProductDetail;
  categoryName: { ru: string; en: string; slug: string } | null;
  subcategoryName: { ru: string; en: string; slug: string } | null;
  compatibleBrands: CompatibleBrand[];
  similarProducts?: Product[];
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

type Lang = "ru" | "en" | "ko" | "ka" | "ar";
const L = (m: Record<Lang, string>, lang: string) => m[(lang as Lang)] ?? m.en;
const DL = {
  partNoLabel: { ru: "Кат. номер", en: "Part No.", ko: "부품 번호", ka: "კატ. ნომერი", ar: "رقم القطعة" },
  genuine: { ru: "Оригинал OEM", en: "Genuine OEM", ko: "정품 OEM", ka: "ორიგინალი OEM", ar: "أصلي OEM" },
  inStock: { ru: "В наличии", en: "In Stock", ko: "재고 있음", ka: "მარაგშია", ar: "متوفر" },
  buyNow: { ru: "Купить сейчас", en: "Buy Now", ko: "바로 구매", ka: "ახლავე ყიდვა", ar: "اشترِ الآن" },
  wishlist: { ru: "В избранное", en: "Wishlist", ko: "위시리스트", ka: "სასურველი", ar: "المفضلة" },
  inWishlist: { ru: "В избранном", en: "Saved", ko: "저장됨", ka: "შენახული", ar: "محفوظ" },
  share: { ru: "Поделиться", en: "Share", ko: "공유", ka: "გაზიარება", ar: "مشاركة" },
  linkCopied: { ru: "Ссылка скопирована", en: "Link copied", ko: "링크 복사됨", ka: "ბმული დაკოპირდა", ar: "تم نسخ الرابط" },
  shippingTitle: { ru: "Прямая доставка из Кореи", en: "Korea Direct Shipping", ko: "한국 직배송", ka: "პირდაპირი მიწოდება კორეიდან", ar: "شحن مباشر من كوريا" },
  shippingDesc: { ru: "EMS / авиа со склада в Сеуле", en: "EMS / air from Seoul hub", ko: "서울 허브에서 EMS/항공", ka: "EMS / საჰაერო სეულიდან", ar: "EMS / جوي من مركز سيول" },
  warrantyTitle: { ru: "Гарантия оригинала", en: "Genuine Warranty", ko: "정품 보증", ka: "ორიგინალის გარანტია", ar: "ضمان أصلي" },
  warrantyDesc: { ru: "Официальные детали производителя", en: "Official manufacturer parts", ko: "제조사 정품 부품", ka: "მწარმოებლის ოფიციალური ნაწილები", ar: "قطع الشركة المصنعة الرسمية" },
  trustGenuineTitle: { ru: "Оригинал OEM", en: "Genuine OEM", ko: "정품 OEM", ka: "ორიგინალი OEM", ar: "أصلي OEM" },
  trustGenuineDesc: { ru: "Напрямую от Hyundai / Kia / Mobis из Кореи", en: "Direct from Hyundai / Kia / Mobis in Korea", ko: "한국 현대/기아/모비스 직공급", ka: "პირდაპირ Hyundai / Kia / Mobis-დან", ar: "مباشرة من هيونداي / كيا / موبيس" },
  trustKoreaTitle: { ru: "Прямо из Кореи", en: "Korea Direct", ko: "한국 직배송", ka: "პირდაპირ კორეიდან", ar: "مباشرة من كوريا" },
  trustKoreaDesc: { ru: "Отправка со склада в Сеуле", en: "Dispatched from Seoul warehouse", ko: "서울 창고에서 발송", ka: "იგზავნება სეულის საწყობიდან", ar: "يُشحن من مستودع سيول" },
  trustWarrantyTitle: { ru: "Гарантия качества", en: "Quality Guarantee", ko: "품질 보증", ka: "ხარისხის გარანტია", ar: "ضمان الجودة" },
  trustWarrantyDesc: { ru: "Только оригинальные детали производителя", en: "Only genuine manufacturer parts", ko: "제조사 정품 부품만", ka: "მხოლოდ ორიგინალი ნაწილები", ar: "قطع أصلية فقط" },
  trustFitmentTitle: { ru: "Подбор по авто", en: "Fitment Check", ko: "차량 적합성 확인", ka: "თავსებადობის შემოწმება", ar: "فحص التوافق" },
  trustFitmentDesc: { ru: "Поможем подобрать деталь под ваш автомобиль", en: "We help match the part to your car", ko: "차량에 맞는 부품을 찾아드립니다", ka: "დაგეხმარებით ნაწილის შერჩევაში", ar: "نساعدك في مطابقة القطعة لسيارتك" },
  fitmentBannerTitle: { ru: "Не уверены в совместимости?", en: "Not sure about fitment?", ko: "적합성이 궁금하신가요?", ka: "ეჭვი გაქვთ თავსებადობაში?", ar: "غير متأكد من التوافق؟" },
  fitmentBannerText: { ru: "Оставьте заявку — наши специалисты проверят, подходит ли деталь вашему автомобилю.", en: "Leave a request — our specialists will verify this part fits your car.", ko: "요청을 남겨주시면 전문가가 차량 적합성을 확인해 드립니다.", ka: "დატოვეთ განაცხადი — ჩვენი სპეციალისტები შეამოწმებენ თავსებადობას.", ar: "اترك طلبًا وسيتحقق مختصونا من ملاءمة القطعة لسيارتك." },
  fitmentBannerCta: { ru: "Оставить заявку", en: "Request a check", ko: "요청하기", ka: "განაცხადის დატოვება", ar: "اطلب فحصًا" },
} as const;

// ─── Main component ────────────────────────────────────────────────────────────

export function ProductDetailClient({
  product,
  categoryName,
  subcategoryName,
  compatibleBrands,
  similarProducts,
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
  const { cartProductIds, addOptimistic } = useCartProductIds();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartError, setCartError] = useState("");
  const [qty, setQty] = useState(1);
  const [backSearch, setBackSearch] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const { isFavorite, toggleFavorite } = usePartsFavorites();
  const faved = isFavorite(product.id);
  useScrollDepth(`part_${product.part_number}`);

  useEffect(() => {
    const saved = sessionStorage.getItem("parts:filters");
    if (saved) setBackSearch(saved);
    if (user) {
      supabase.from("profiles").select("country").eq("id", user.id).single()
        .then(({ data }) => { if (data?.country) setProfileCountry(data.country); });
    }
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

  const manufacturerName = MANUFACTURER_NAMES[product.manufacturer ?? ""] ?? product.manufacturer ?? "Hyundai Mobis";
  // Manufacturer → brand catalog filter (until dedicated SEO landing pages exist)
  const manufacturerBrandSlug = (() => {
    const m = (product.manufacturer ?? "").toLowerCase() + manufacturerName.toLowerCase();
    if (m.includes("kia") || m.includes("기아")) return "kia";
    if (m.includes("genesis")) return "genesis";
    if (m.includes("hyundai") || m.includes("현대") || m.includes("mobis") || m.includes("모비스")) return "hyundai";
    return null;
  })();
  const manufacturerHref = manufacturerBrandSlug
    ? `/${lang}/parts?brands=${manufacturerBrandSlug}`
    : `/${lang}/parts?q=${encodeURIComponent(manufacturerName)}`;

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

  const addToCartCore = async (): Promise<boolean> => {
    if (!user) {
      const returnUrl = window.location.pathname;
      router.push(`/${lang}/auth?mode=login&from=${encodeURIComponent(returnUrl)}`);
      return false;
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
      addOptimistic(product.id);
      notifyCartUpdate(qty);
      return true;
    } catch (err: unknown) {
      console.error("Add to cart failed:", err);
      setCartError(lang === "ru" ? "Не удалось добавить в корзину" : "Failed to add to cart");
      return false;
    }
  };

  const handleAddToCart = async () => {
    const ok = await addToCartCore();
    if (ok) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
    }
  };

  const handleBuyNow = async () => {
    const ok = await addToCartCore();
    if (ok) router.push(`/${lang}/checkout`);
  };

  const handleWishlist = () => {
    toggleFavorite({
      id: product.id,
      name_ru: product.name_ru,
      name_en: product.name_en,
      name_ko: product.name_ko,
      part_number: product.part_number,
      price_krw: product.price_krw,
      image_url: product.image_url,
      is_new: product.is_new,
    });
  };

  const handleShare = async () => {
    const shareData = { title: productName ?? product.part_number, url: productUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch { /* user cancelled */ }
    try {
      await navigator.clipboard.writeText(productUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
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

  const inCartNow = cartAdded || cartProductIds.has(product.id);

  return (
    <div className="parts-page min-h-screen bg-[var(--pn-bg)]">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--pn-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--pn-text-muted)] flex-wrap">
            <Link href={`/${lang}`} className="hover:text-[var(--pn-orange)] transition-colors">
              {t("parts.detail.breadcrumbHome")}
            </Link>
            <span className="text-[var(--pn-text-dim)]">/</span>
            <Link href={backHref} className="hover:text-[var(--pn-orange)] transition-colors">
              {t("parts.detail.breadcrumbParts")}
            </Link>
            {catName && (
              <>
                <span className="text-[var(--pn-text-dim)]">/</span>
                <Link href={`/${lang}/parts?cat=${categoryName?.slug}`} className="hover:text-[var(--pn-orange)] transition-colors">
                  {catName}
                </Link>
              </>
            )}
            <span className="text-[var(--pn-text-dim)]">/</span>
            <span className="text-[var(--pn-text)] font-medium truncate max-w-[220px]">
              {productName}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition-colors mb-7 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("parts.detail.backToCatalog")}
        </Link>

        {/* ── Hero grid ──────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">

          {/* Image card — framed spec plate */}
          <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl overflow-hidden self-start w-full">
            <div className="relative bg-white aspect-square flex items-center justify-center">
              {product.is_new && (
                <span className="absolute top-4 left-4 z-10 bg-[var(--pn-orange)] text-white text-[11px] px-2.5 py-1 rounded font-bold uppercase tracking-wide">
                  {t("parts.detail.newBadge")}
                </span>
              )}
              <span className="absolute top-4 right-4 z-10 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--pn-orange)] bg-[var(--pn-orange)]/10 border border-[var(--pn-orange)]/25 rounded px-2 py-1">
                <BadgeCheck className="w-3 h-3" />OEM
              </span>
              {product.image_url && !imgError ? (
                <Image
                  src={product.image_url}
                  alt={productName}
                  fill
                  unoptimized
                  priority
                  onError={() => setImgError(true)}
                  className="object-contain p-6 sm:p-8"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300 py-16">
                  <Package className="w-24 h-24" />
                  <span className="text-sm">{t("parts.detail.noPhoto")}</span>
                </div>
              )}
            </div>
            {/* Caption strip — brand / category */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[var(--pn-surface)]">
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--pn-text)] truncate">
                <BrandDot slug={(product.manufacturer || "").toLowerCase().includes("kia") ? "kia" : "hyundai"} />
                {MANUFACTURER_NAMES[product.manufacturer ?? ""] ?? product.manufacturer ?? "Hyundai Mobis"}
              </span>
              {catName && <span className="text-xs text-[var(--pn-text-dim)] uppercase tracking-wide shrink-0">{catName}</span>}
            </div>
          </div>

          {/* Info column */}
          <div className="flex flex-col">
            {/* Badges + REF */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--pn-orange)] border border-[var(--pn-orange)]/40 rounded px-2.5 py-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                {L(DL.genuine, lang)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--pn-success)] bg-[var(--pn-success)]/10 border border-[var(--pn-success)]/20 rounded px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pn-success)]" />
                {L(DL.inStock, lang)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-[40px] font-extrabold text-[var(--pn-text)] leading-[1.08] tracking-tight mb-4">
              {productName}
            </h1>

            {/* Part number — primary identity plate */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-3 bg-[var(--pn-surface)] border border-[var(--pn-orange)]/30 rounded-xl pl-4 pr-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--pn-text-dim)] leading-none">
                  {L(DL.partNoLabel, lang)}
                </span>
                <span className="text-lg sm:text-xl font-mono font-bold tracking-[0.08em] text-[var(--pn-orange)] leading-none">
                  {product.part_number || product.product_no || "—"}
                </span>
                {(product.part_number || product.product_no) && (
                  <button
                    onClick={copyPartNumber}
                    title={t("parts.detail.copySuccess")}
                    className="ml-1 p-1.5 rounded-lg text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] hover:bg-[var(--pn-surface-3)] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-[var(--pn-success)]" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {copied && <span className="text-xs text-[var(--pn-success)]">{t("parts.detail.copySuccess")}</span>}
            </div>

            {product.official_name_ko && (
              <p className="text-sm text-[var(--pn-text-dim)] mb-3 leading-relaxed">{product.official_name_ko}</p>
            )}

            {description && (
              <p className="text-[var(--pn-text-muted)] text-sm sm:text-base leading-relaxed mb-6">{description}</p>
            )}

            {/* Price + purchase card */}
            <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-5 sm:p-6 mb-5">
              <span className="text-[11px] text-[var(--pn-text-dim)] uppercase tracking-widest">
                {t("parts.detail.priceLabel")}
              </span>
              <div className="text-4xl font-bold text-[var(--pn-orange)] mt-1 mb-5">
                {fmtUsd(product.price_krw)}
              </div>

              <div className="flex gap-3">
                <div className="flex items-center border border-[var(--pn-border)] bg-[var(--pn-surface-2)] rounded-xl">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-12 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg">−</button>
                  <span className="w-10 text-center text-sm font-semibold text-[var(--pn-text)]">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-10 h-12 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg">+</button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  disabled={cartProductIds.has(product.id)}
                  className={cn(
                    "h-12 text-base font-semibold flex-1 flex items-center justify-center gap-2 transition-all",
                    inCartNow ? "bg-[var(--pn-success)] hover:bg-[var(--pn-success)] text-white" : "bg-[var(--pn-orange)] hover:brightness-110 text-white"
                  )}
                >
                  {inCartNow
                    ? <><Check className="w-5 h-5" />{cartAdded ? "✓" : t("parts.products.inCart")}</>
                    : <><ShoppingCart className="w-5 h-5" />{t("parts.detail.addToCart")}</>
                  }
                </Button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full mt-3 h-12 rounded-xl border border-[var(--pn-border)] text-[var(--pn-text)] font-semibold flex items-center justify-center gap-2 hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-all"
              >
                <Zap className="w-5 h-5" />
                {L(DL.buyNow, lang)}
              </button>

              {cartError && <p className="text-sm text-[var(--pn-error)] mt-3">{cartError}</p>}
            </div>

            {/* Info tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <InfoTile icon={<Truck className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.shippingTitle, lang)} desc={L(DL.shippingDesc, lang)} />
              <InfoTile icon={<ShieldCheck className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.warrantyTitle, lang)} desc={L(DL.warrantyDesc, lang)} />
            </div>

            {/* Real shipping calculator */}
            <div className="mb-5">
              <ShippingBadge logistics={logistics} lang={lang} krwToUsd={krwToUsd} profileCountry={profileCountry} />
            </div>

            {/* Wishlist + Share */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleWishlist}
                aria-pressed={faved}
                className={cn(
                  "group inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95",
                  faved
                    ? "border-[var(--pn-orange)]/50 bg-[var(--pn-orange)]/10 text-[var(--pn-orange)]"
                    : "border-[var(--pn-border)] bg-[var(--pn-surface)] text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)]"
                )}
              >
                <Heart className={cn("w-4 h-4 transition-transform group-hover:scale-110 group-active:scale-125", faved && "fill-[var(--pn-orange)] text-[var(--pn-orange)]")} />
                {faved ? L(DL.inWishlist, lang) : L(DL.wishlist, lang)}
              </button>
              <button
                onClick={handleShare}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--pn-border)] bg-[var(--pn-surface)] text-sm font-medium text-[var(--pn-text-muted)] cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)]"
              >
                <Share2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                {linkCopied ? L(DL.linkCopied, lang) : L(DL.share, lang)}
              </button>
            </div>

            {/* Specifications — clickable (future SEO landing pages) */}
            <div className="border-t border-[var(--pn-border)] pt-5 space-y-3">
              <SpecRow
                label={t("parts.detail.manufacturer")}
                value={manufacturerName}
                href={manufacturerHref}
              />
              {catName && (
                <SpecRow
                  label={t("parts.detail.category")}
                  value={catName}
                  href={categoryName?.slug ? `/${lang}/parts?cat=${categoryName.slug}` : undefined}
                />
              )}
              {subName && (
                <SpecRow
                  label={t("parts.detail.subcategory")}
                  value={subName}
                  href={subcategoryName?.slug ? `/${lang}/parts?${categoryName?.slug ? `cat=${categoryName.slug}&` : ""}sub=${subcategoryName.slug}` : undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Trust row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <TrustTile icon={<BadgeCheck className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.trustGenuineTitle, lang)} desc={L(DL.trustGenuineDesc, lang)} />
          <TrustTile icon={<Truck className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.trustKoreaTitle, lang)} desc={L(DL.trustKoreaDesc, lang)} />
          <TrustTile icon={<ShieldCheck className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.trustWarrantyTitle, lang)} desc={L(DL.trustWarrantyDesc, lang)} />
          <TrustTile icon={<Car className="w-5 h-5 text-[var(--pn-orange)]" />} title={L(DL.trustFitmentTitle, lang)} desc={L(DL.trustFitmentDesc, lang)} />
        </div>

        {/* ── Fitment CTA banner ─────────────────────────────────────────────── */}
        <div className="bg-[var(--pn-orange)] rounded-2xl p-6 sm:p-8 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#3a1500]">{L(DL.fitmentBannerTitle, lang)}</h3>
            <p className="text-[#5c2800] text-sm mt-1.5 max-w-xl leading-relaxed">{L(DL.fitmentBannerText, lang)}</p>
          </div>
          <button
            onClick={() => setOrderOpen(true)}
            className="shrink-0 px-8 py-3 rounded-full bg-[#141414] text-white font-bold hover:bg-black transition-colors"
          >
            {L(DL.fitmentBannerCta, lang)}
          </button>
        </div>

        {/* ── Cross-reference numbers (OEM-аналоги) ─────────────────────────── */}
        {Array.isArray(product.cross_refs) && product.cross_refs.length > 0 && (
          <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-6 sm:p-8 mb-10">
            <h2 className="text-base font-bold text-[var(--pn-text)] mb-3">
              {lang === "ru" ? "Кросс-номера (аналоги)" : "Cross-reference numbers"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.cross_refs.map((cr) => (
                <span key={cr} className="px-2.5 py-1 rounded-md bg-[var(--pn-surface-2)] border border-[var(--pn-border)] text-[var(--pn-text-muted)] text-sm font-mono">
                  {cr}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Compatible models ──────────────────────────────────────────────── */}
        {compatibleBrands.length > 0 && (
          <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-6 sm:p-8 mb-10">
            <h2 className="text-xl font-bold text-[var(--pn-text)] mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--pn-orange)]/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-[var(--pn-orange)]" />
              </div>
              {t("parts.detail.fitsTitle")}
            </h2>
            <div
              className={cn(
                "grid gap-6",
                compatibleBrands.length === 1 ? "grid-cols-1 max-w-sm" : compatibleBrands.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              )}
            >
              {compatibleBrands.map((brand) => (
                <div key={brand.id}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--pn-border)]">
                    <BrandDot slug={brand.slug} />
                    <span className="text-sm font-semibold text-[var(--pn-text)]">{brand.name}</span>
                    <span className="text-xs text-[var(--pn-text-dim)] ml-auto">{brand.models.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brand.models.map((m) => {
                      const modelName = i18n.language === "ko" ? m.name_ko || m.name_en : m.name_en;
                      return (
                        <Link
                          key={m.id}
                          href={`/${lang}/fitment/${m.brand}/${m.vehicleSlug}`}
                          className="group/chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--pn-surface-2)] text-sm font-semibold text-[var(--pn-text)] border border-[var(--pn-border)] hover:border-[var(--pn-orange)] transition-colors"
                        >
                          <span className="group-hover/chip:text-[var(--pn-orange)] transition-colors">{modelName}</span>
                          {m.years && <span className="text-xs font-bold text-[var(--pn-orange)] tabular-nums">{m.years}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Similar parts ──────────────────────────────────────────────────── */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[var(--pn-text)] mb-6">
              {t("parts.detail.similarTitle")}
            </h2>
            <FitmentProductsGrid products={similarProducts} lang={lang} krwToUsd={krwToUsd} />
          </div>
        )}
      </div>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        productName={productName ?? product.part_number}
        partNumber={product.part_number || product.product_no || "—"}
        productUrl={productUrl}
        priceText={fmtUsd(product.price_krw)}
        categoryName={catName ?? undefined}
        source="parts_fitment"
        title={L(DL.fitmentBannerCta, lang)}
        subtitle={L(DL.fitmentBannerText, lang)}
      />
    </div>
  );
}

// ─── Info / Trust tiles ──────────────────────────────────────────────────────

function InfoTile({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-4">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-[var(--pn-text)] leading-tight">{title}</div>
        <div className="text-xs text-[var(--pn-text-muted)] mt-0.5 leading-snug">{desc}</div>
      </div>
    </div>
  );
}

function TrustTile({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-[var(--pn-orange)]/10 flex items-center justify-center mb-3">{icon}</div>
      <div className="text-sm font-bold text-[var(--pn-text)] mb-1">{title}</div>
      <div className="text-xs text-[var(--pn-text-muted)] leading-relaxed">{desc}</div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function SpecRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-[var(--pn-text-muted)] min-w-[120px] shrink-0">{label}</span>
      {href ? (
        <Link
          href={href}
          className="group/spec inline-flex items-center gap-1 font-medium text-[var(--pn-text)] hover:text-[var(--pn-orange)] transition-colors underline decoration-[var(--pn-border)] decoration-dashed underline-offset-4 hover:decoration-[var(--pn-orange)] cursor-pointer"
        >
          {value}
          <ChevronRight className="w-3.5 h-3.5 text-[var(--pn-text-dim)] group-hover/spec:text-[var(--pn-orange)] group-hover/spec:translate-x-0.5 transition-all" />
        </Link>
      ) : (
        <span className="font-medium text-[var(--pn-text)]">{value}</span>
      )}
    </div>
  );
}

const BRAND_COLORS: Record<string, string> = {
  hyundai: "#5b8def",
  kia: "#ff5449",
  genesis: "#c9a227",
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
    label: { ru: "EMS Korea", en: "EMS Korea" },
    sublabel: { ru: "≤ 30 кг", en: "≤ 30 kg" },
    bg: "bg-green-500/10",
    border: "border-green-500/25",
    text: "text-green-400",
    dot: "bg-green-500",
  },
  EMS_PREMIUM: {
    label: { ru: "EMS Korea", en: "EMS Korea" },
    sublabel: { ru: "≤ 70 кг", en: "≤ 70 kg" },
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-400",
    dot: "bg-blue-500",
  },
  SEA: {
    label: { ru: "Только морем", en: "Sea freight only" },
    sublabel: { ru: "Крупногабаритный груз", en: "Oversized cargo" },
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    text: "text-red-400",
    dot: "bg-red-500",
  },
} as const;

function ShippingBadge({
  logistics,
  lang,
  krwToUsd,
  profileCountry,
}: {
  logistics: ProductLogistics | null;
  lang: string;
  krwToUsd: number;
  profileCountry?: string;
}) {
  const { t } = useTranslation();
  const isRu = lang === "ru";
  const [country, setCountry] = useState(profileCountry || "");

  useEffect(() => {
    if (profileCountry && !country) setCountry(profileCountry);
  }, [profileCountry]);

  if (!logistics?.ship_method) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--pn-surface-2)] border border-[var(--pn-border)]">
        <span className="w-2 h-2 rounded-full bg-[var(--pn-text-dim)] shrink-0" />
        <span className="text-xs text-[var(--pn-text-muted)]">
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
    country && emsPackedKg !== null
      ? calcEmsUsd(country, emsPackedKg, krwToUsd)
      : null;

  const emspPrice =
    country && emspBilledKg !== null
      ? calcEmspUsd(country, emspBilledKg, krwToUsd)
      : null;

  const bestPrice = emsPrice !== null && emspPrice !== null
    ? Math.min(emsPrice, emspPrice)
    : emsPrice ?? emspPrice;

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
        <div className="bg-[var(--pn-surface-2)] border border-[var(--pn-border)] rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-[var(--pn-text-muted)]">
            {t("parts.detail.shippingCalcTitle")}
          </p>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full text-sm border border-[var(--pn-border)] rounded-lg px-3 py-2 bg-[var(--pn-surface-3)] text-[var(--pn-text)] focus:outline-none focus:ring-2 focus:ring-[var(--pn-orange)]/40"
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
              {bestPrice !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--pn-text-muted)]">EMS Korea</span>
                  <span className="text-sm font-bold text-green-400">~${bestPrice}</span>
                </div>
              ) : (
                <p className="text-xs text-[var(--pn-error)]">
                  {t("parts.detail.shippingCalcUnavailable")}
                </p>
              )}
              <p className="text-xs text-[var(--pn-text-dim)]">{t("parts.detail.shippingCalcNote")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
