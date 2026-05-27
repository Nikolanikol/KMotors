"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Cog,
  Settings,
  Disc,
  Car,
  Sofa,
  Wrench,
  Hash,
  Search,
  LayoutGrid,
  List,
  X,
} from "lucide-react";

const PAGE_SIZE = 24;
const BRAND_ORDER: Record<string, number> = { hyundai: 0, kia: 1, genesis: 2 };

// ─── Types ────────────────────────────────────────────────────────────────────

export type Brand = { id: number; name: string; slug: string };
export type Category = {
  id: number;
  name_ru: string;
  name_en: string;
  slug: string;
  parent_id: number | null;
};
export type Product = {
  id: number;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  part_number: string;
  price_krw: number;
  category_id: number | null;
  subcategory_id: number | null;
  image_url: string | null;
  is_new: boolean;
};
export type VehicleModel = {
  id: number;
  brand_id: number;
  name_en: string;
  name_ko: string;
};
export type Fitment = { product_id: number; vehicle_model_id: number };

interface Props {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  models: VehicleModel[];
  fitment: Fitment[];
  productModelsMap: Record<string, VehicleModel[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  engine: Cog,
  transmission: Settings,
  chassis: Disc,
  suspension: Disc,
  body: Car,
  interior: Sofa,
};

function getCatIcon(slug: string) {
  return CAT_ICONS[slug] ?? Wrench;
}

function formatKrw(price: number) {
  return "₩" + new Intl.NumberFormat("ko-KR").format(price);
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PartsCatalogClient({
  brands,
  categories,
  products,
  models,
  fitment,
  productModelsMap,
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Intersection observer for fade-in
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage((p) => p + 1); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset page when filters change
  const brandSlug = searchParams.get("brand") ?? "";
  useEffect(() => { setPage(1); }, [brandSlug, searchParams]);
  const modelId = searchParams.get("model") ?? "";   // vehicle_model id as string
  const catSlug = searchParams.get("cat") ?? "";
  const subSlug = searchParams.get("sub") ?? "";
  const urlMin = searchParams.get("min");
  const urlMax = searchParams.get("max");
  const priceMin = urlMin ? Number(urlMin) : undefined;
  const priceMax = urlMax ? Number(urlMax) : undefined;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      });
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // ── Search (debounced) ──────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [searchQ, setSearchQ] = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQ(searchInput);
      updateParams({ q: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Price inputs ─────────────────────────────────────────────────────────────
  const [priceMinInput, setPriceMinInput] = useState(urlMin ?? "");
  const [priceMaxInput, setPriceMaxInput] = useState(urlMax ?? "");
  const applyPrice = () =>
    updateParams({ min: priceMinInput || undefined, max: priceMaxInput || undefined });

  // ── Sort & view ─────────────────────────────────────────────────────────────
  const [sort, setSort] = useState("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  // ── Derived selections ──────────────────────────────────────────────────────

  // Sort brands: Hyundai → Kia → Genesis
  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => (BRAND_ORDER[a.slug] ?? 99) - (BRAND_ORDER[b.slug] ?? 99)),
    [brands]
  );

  const selectedBrand = useMemo(
    () => brands.find((b) => b.slug === brandSlug),
    [brands, brandSlug]
  );
  const selectedModelObj = useMemo(
    () => (modelId ? models.find((m) => m.id === Number(modelId)) : undefined),
    [models, modelId]
  );
  const parentCats = useMemo(() => categories.filter((c) => c.parent_id === null), [categories]);
  const allSubs = useMemo(() => categories.filter((c) => c.parent_id !== null), [categories]);
  const selectedCat = useMemo(() => parentCats.find((c) => c.slug === catSlug), [parentCats, catSlug]);
  const selectedSub = useMemo(() => allSubs.find((s) => s.slug === subSlug), [allSubs, subSlug]);

  // Brand → models mapping
  const brandModels = useMemo(
    () => (selectedBrand ? models.filter((m) => m.brand_id === selectedBrand.id) : []),
    [models, selectedBrand]
  );

  // Category → subcategories
  const catSubs = useMemo(
    () => (selectedCat ? allSubs.filter((s) => s.parent_id === selectedCat.id) : []),
    [allSubs, selectedCat]
  );

  // ── Brand filter via fitment ────────────────────────────────────────────────
  // product has no brand_id — derive via fitment → vehicle_model → brand
  const brandProductIds = useMemo(() => {
    if (!selectedBrand) return null;
    const brandModelIds = new Set(
      models.filter((m) => m.brand_id === selectedBrand.id).map((m) => m.id)
    );
    return new Set(
      fitment
        .filter((f) => brandModelIds.has(f.vehicle_model_id))
        .map((f) => f.product_id)
    );
  }, [fitment, models, selectedBrand]);

  // ── Model filter ────────────────────────────────────────────────────────────
  const modelProductIds = useMemo(() => {
    if (!selectedModelObj) return null;
    return new Set(
      fitment
        .filter((f) => f.vehicle_model_id === selectedModelObj.id)
        .map((f) => f.product_id)
    );
  }, [fitment, selectedModelObj]);

  // ── Base products (brand + model applied, used for counts) ─────────────────
  const baseProducts = useMemo(() => {
    let result = products;
    if (brandProductIds) result = result.filter((p) => brandProductIds.has(p.id));
    if (modelProductIds) result = result.filter((p) => modelProductIds.has(p.id));
    return result;
  }, [products, brandProductIds, modelProductIds]);

  // ── Category counts (based on base, not final filter) ──────────────────────
  const catCounts = useMemo(() => {
    const map: Record<number, number> = {};
    parentCats.forEach((c) => {
      map[c.id] = baseProducts.filter((p) => p.category_id === c.id).length;
    });
    return map;
  }, [baseProducts, parentCats]);

  // ── Subcategory counts ──────────────────────────────────────────────────────
  const subCounts = useMemo(() => {
    const baseCat = selectedCat
      ? baseProducts.filter((p) => p.category_id === selectedCat.id)
      : baseProducts;
    const map: Record<number, number> = {};
    catSubs.forEach((s) => {
      map[s.id] = baseCat.filter((p) => p.subcategory_id === s.id).length;
    });
    return map;
  }, [baseProducts, selectedCat, catSubs]);

  // ── Filtered products ───────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = baseProducts;
    if (selectedCat) result = result.filter((p) => p.category_id === selectedCat.id);
    if (selectedSub) result = result.filter((p) => p.subcategory_id === selectedSub.id);
    if (priceMin !== undefined) result = result.filter((p) => p.price_krw >= priceMin);
    if (priceMax !== undefined) result = result.filter((p) => p.price_krw <= priceMax);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter((p) => p.part_number.toLowerCase().includes(q));
    }
    if (sort === "price_asc") return [...result].sort((a, b) => a.price_krw - b.price_krw);
    if (sort === "price_desc") return [...result].sort((a, b) => b.price_krw - a.price_krw);
    if (sort === "name_asc") {
      const lang = i18n.language;
      return [...result].sort((a, b) => {
        const na = lang === "ru" ? a.name_ru : (a.name_en || a.name_ru);
        const nb = lang === "ru" ? b.name_ru : (b.name_en || b.name_ru);
        return na.localeCompare(nb);
      });
    }
    return result;
  }, [baseProducts, selectedCat, selectedSub, priceMin, priceMax, searchQ, sort, i18n.language]);

  // ── Visible slice (infinite scroll) ────────────────────────────────────────
  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, page * PAGE_SIZE),
    [filteredProducts, page]
  );
  const hasMore = visibleProducts.length < filteredProducts.length;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getLocalName = useCallback(
    (ru: string, en: string) => (i18n.language === "ru" ? ru : en || ru),
    [i18n.language]
  );

  const getProductName = (p: Product) => {
    if (i18n.language === "ru") return p.name_ru;
    if (i18n.language === "ko") return p.name_ko || p.name_en || p.name_ru;
    return p.name_en || p.name_ru;
  };

  const hasFilters = !!(
    brandSlug || modelId || catSlug || subSlug ||
    priceMin !== undefined || priceMax !== undefined || searchQ
  );

  const resetAll = () => {
    setSearchInput("");
    setSearchQ("");
    setPriceMinInput("");
    setPriceMaxInput("");
    router.push(pathname, { scroll: false });
  };

  const scrollToContact = (name: string, partNumber: string) => {
    sessionStorage.setItem("prefillMessage", `${name} (${partNumber})`);
    document.getElementById("contacts")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section id="catalog" ref={sectionRef} className="py-24 bg-[#F5F7FA]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Section header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#BB162B]" />
            <span className="text-[#BB162B] text-sm font-medium tracking-wider uppercase">
              {t("parts.catalog.badge")}
            </span>
            <div className="h-px w-12 bg-[#BB162B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#002C5F] mb-4">
            {t("parts.catalog.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t("parts.catalog.subtitle")}</p>
        </div>

        {/* Filter panel */}
        <div
          className={`bg-white rounded-2xl shadow-sm p-5 mb-8 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Row 1: brand chips + search */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap gap-2">
              {sortedBrands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() =>
                    updateParams({
                      brand: brandSlug === brand.slug ? undefined : brand.slug,
                      model: undefined,
                    })
                  }
                  className={cn(
                    "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                    brandSlug === brand.slug
                      ? "border-[#002C5F] bg-[#002C5F] text-white"
                      : "border-gray-200 text-gray-600 hover:border-[#002C5F] hover:text-[#002C5F]"
                  )}
                >
                  {brand.name}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("parts.catalog.filterSearchPlaceholder")}
                className="pl-9 text-gray-900 placeholder:text-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Row 2: model dropdown (only when brand selected and has models) */}
          {selectedBrand && brandModels.length > 0 && (
            <div className="mb-5">
              <select
                value={modelId}
                onChange={(e) => updateParams({ model: e.target.value || undefined })}
                className="h-9 w-full sm:w-72 rounded-md border border-input bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t("parts.catalog.filterModelPlaceholder")}</option>
                {brandModels.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {i18n.language === "ko" ? (m.name_ko || m.name_en) : m.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 3: category cards */}
          {parentCats.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mb-1">
              {parentCats.map((cat) => {
                const Icon = getCatIcon(cat.slug);
                const active = catSlug === cat.slug;
                const count = catCounts[cat.id] ?? 0;
                const empty = count === 0 && !active;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={empty}
                    onClick={() =>
                      updateParams({
                        cat: catSlug === cat.slug ? undefined : cat.slug,
                        sub: undefined,
                      })
                    }
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 text-xs font-medium transition-all",
                      empty
                        ? "border-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                        : active
                        ? "border-[#BB162B] bg-[#BB162B]/5 text-[#BB162B]"
                        : "border-gray-200 text-gray-500 hover:border-[#002C5F]/30 hover:text-[#002C5F]"
                    )}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-center leading-tight hidden sm:block">
                      {getLocalName(cat.name_ru, cat.name_en)}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        active ? "text-[#BB162B]" : empty ? "text-gray-300" : "text-gray-400"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 4: subcategory chips */}
          {selectedCat && catSubs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {catSubs.map((sub) => {
                const active = subSlug === sub.slug;
                const count = subCounts[sub.id] ?? 0;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      updateParams({ sub: subSlug === sub.slug ? undefined : sub.slug })
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      active
                        ? "bg-[#002C5F] text-white border-[#002C5F]"
                        : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
                    )}
                  >
                    {getLocalName(sub.name_ru, sub.name_en)}
                    <span className={active ? "opacity-60" : "opacity-50"}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 5: price range (₩) */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {t("parts.catalog.filterPrice")}:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t("parts.catalog.priceFrom")}</span>
              <Input
                type="number"
                min={0}
                value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                onBlur={applyPrice}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="0"
                className="w-24 h-8 text-sm text-center text-gray-900 placeholder:text-gray-400"
              />
              <span className="text-gray-400">—</span>
              <span className="text-xs text-gray-400">{t("parts.catalog.priceTo")}</span>
              <Input
                type="number"
                min={0}
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                onBlur={applyPrice}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="∞"
                className="w-24 h-8 text-sm text-center text-gray-900 placeholder:text-gray-400"
              />
              <span className="text-xs text-gray-400">₩</span>
            </div>
          </div>

          {/* Active filter tags */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              {selectedBrand && (
                <FilterTag
                  label={selectedBrand.name}
                  onRemove={() => updateParams({ brand: undefined, model: undefined })}
                />
              )}
              {selectedModelObj && (
                <FilterTag
                  label={selectedModelObj.name_en}
                  onRemove={() => updateParams({ model: undefined })}
                />
              )}
              {selectedCat && (
                <FilterTag
                  label={getLocalName(selectedCat.name_ru, selectedCat.name_en)}
                  onRemove={() => updateParams({ cat: undefined, sub: undefined })}
                />
              )}
              {selectedSub && (
                <FilterTag
                  label={getLocalName(selectedSub.name_ru, selectedSub.name_en)}
                  onRemove={() => updateParams({ sub: undefined })}
                />
              )}
              {(priceMin !== undefined || priceMax !== undefined) && (
                <FilterTag
                  label={`${priceMin ? formatKrw(priceMin) : "₩0"} — ${priceMax ? formatKrw(priceMax) : "∞"}`}
                  onRemove={() => {
                    setPriceMinInput("");
                    setPriceMaxInput("");
                    updateParams({ min: undefined, max: undefined });
                  }}
                />
              )}
              {searchQ && (
                <FilterTag
                  label={`"${searchQ}"`}
                  onRemove={() => {
                    setSearchInput("");
                    setSearchQ("");
                    updateParams({ q: undefined });
                  }}
                />
              )}
              <button
                onClick={resetAll}
                className="text-xs text-[#BB162B] underline ml-1 hover:text-[#9B1220] transition-colors"
              >
                {t("parts.catalog.resetFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Results bar */}
        <div
          className={`flex items-center justify-between mb-6 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm text-gray-500">
            {t("parts.catalog.resultsShown", {
              shown: filteredProducts.length,
              total: products.length,
            })}
          </span>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="default">{t("parts.catalog.sortDefault")}</option>
              <option value="price_asc">{t("parts.catalog.sortPriceAsc")}</option>
              <option value="price_desc">{t("parts.catalog.sortPriceDesc")}</option>
              <option value="name_asc">{t("parts.catalog.sortNameAsc")}</option>
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-2 transition-colors",
                  view === "grid"
                    ? "bg-[#002C5F] text-white"
                    : "bg-white text-gray-400 hover:text-[#002C5F]"
                )}
                title={t("parts.catalog.gridView")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 transition-colors",
                  view === "list"
                    ? "bg-[#002C5F] text-white"
                    : "bg-white text-gray-400 hover:text-[#002C5F]"
                )}
                title={t("parts.catalog.listView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <EmptyState onReset={resetAll} t={t} />
        ) : (
          <>
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "grid grid-cols-1 gap-3"
              )}
            >
              {visibleProducts.map((product, index) => {
                const compatibleModels = productModelsMap[String(product.id)] ?? [];
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    compatibleModels={compatibleModels}
                    productName={getProductName(product)}
                    view={view}
                    isVisible={isVisible}
                    index={index}
                    onOrder={() => scrollToContact(getProductName(product), product.part_number)}
                    t={t}
                  />
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-8">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#002C5F]/30 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── FilterTag ─────────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#002C5F]/10 text-[#002C5F] text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:text-[#BB162B] transition-colors"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  onReset,
  t,
}: {
  onReset: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 rounded-full bg-[#002C5F]/5 flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-[#002C5F]/30" />
      </div>
      <p className="text-gray-600 font-medium mb-1">{t("parts.catalog.noResults")}</p>
      <p className="text-sm text-gray-400 mb-4">{t("parts.catalog.noResultsHint")}</p>
      <button
        onClick={onReset}
        className="text-sm text-[#BB162B] underline hover:text-[#9B1220] transition-colors"
      >
        {t("parts.catalog.resetFilters")}
      </button>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  compatibleModels: VehicleModel[];
  productName: string;
  view: "grid" | "list";
  isVisible: boolean;
  index: number;
  onOrder: () => void;
  t: (key: string) => string;
}

function ProductCard({
  product,
  compatibleModels,
  productName,
  view,
  isVisible,
  index,
  onOrder,
  t,
}: ProductCardProps) {
  const shown = compatibleModels.slice(0, 3);
  const extra = compatibleModels.length - shown.length;
  const compatibleText =
    shown.map((m) => m.name_en).join(", ") + (extra > 0 ? ` +${extra}` : "");
  // model names for selected model tag use name_en (international car names)

  const delay = `${Math.min(index * 30, 600)}ms`;

  if (view === "list") {
    return (
      <div
        className={cn(
          "bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 p-4",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ transitionDelay: delay }}
      >
        <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={productName}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <Wrench className="w-7 h-7 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-mono mb-0.5">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[#002C5F] truncate">{productName}</h3>
          {compatibleText && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Car className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{compatibleText}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-[#BB162B]">{formatKrw(product.price_krw)}</span>
          <Button
            size="sm"
            onClick={onOrder}
            className="bg-[#002C5F] hover:bg-[#001f45] text-white text-xs h-8"
          >
            {t("parts.catalog.orderBtn")}
          </Button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={cn(
        "bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: delay }}
    >
      <div className="relative h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={productName}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <Wrench className="w-10 h-10" />
            <span className="text-xs">{t("parts.catalog.noPhoto")}</span>
          </div>
        )}
        {product.is_new && (
          <div className="absolute top-3 left-3 bg-[#BB162B] text-white text-xs px-2 py-1 rounded-full font-medium">
            {t("parts.catalog.newBadge")}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-gray-400 font-mono mb-1">{product.part_number}</div>
        {/* Fixed-height name block so all Order buttons align */}
        <h3 className="text-sm font-semibold text-[#002C5F] mb-2 line-clamp-2 min-h-[2.5rem]">
          {productName}
        </h3>
        {/* Fits row with Car icon */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3 min-h-[1rem] line-clamp-1">
          {compatibleText ? (
            <>
              <Car className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <span className="truncate">{compatibleText}</span>
            </>
          ) : (
            <span className="invisible">–</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <span className="text-lg font-bold text-[#BB162B]">{formatKrw(product.price_krw)}</span>
          <Button
            size="sm"
            onClick={onOrder}
            className="bg-[#002C5F] hover:bg-[#001f45] text-white text-xs h-8"
          >
            {t("parts.catalog.orderBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
