"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { trackEvent } from "@/utils/gtag";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { generatePartSlug } from "@/utils/partSlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Cog,
  Settings,
  Disc,
  Car,
  Sofa,
  Wrench,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BRAND_CHIP_COLORS: Record<string, { active: string; inactive: string }> = {
  hyundai: {
    active:   "border-[#002C5F] bg-[#002C5F] text-white shadow-[#002C5F]/20",
    inactive: "border-[#002C5F]/30 text-[#002C5F] hover:bg-[#002C5F]/5 hover:border-[#002C5F]",
  },
  kia: {
    active:   "border-[#BB162B] bg-[#BB162B] text-white shadow-[#BB162B]/20",
    inactive: "border-[#BB162B]/30 text-[#BB162B] hover:bg-[#BB162B]/5 hover:border-[#BB162B]",
  },
  genesis: {
    active:   "border-[#8B6914] bg-[#8B6914] text-white shadow-[#8B6914]/20",
    inactive: "border-[#8B6914]/30 text-[#8B6914] hover:bg-[#8B6914]/5 hover:border-[#8B6914]",
  },
  __default: {
    active:   "border-[#002C5F] bg-[#002C5F] text-white",
    inactive: "border-gray-300 text-gray-600 hover:border-[#002C5F] hover:text-[#002C5F]",
  },
};

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
  brand_id: number | null;
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
export type ModelChip = { name: string; count: number };

interface Props {
  brands: Brand[];
  categories: Category[];
  brandModelChipsMap: Record<string, ModelChip[]>;
  krwToUsd: number;
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

const usdFormatter = new Intl.NumberFormat("en-US");
function formatUsd(priceKrw: number, krwToUsd: number): string {
  return "$" + usdFormatter.format(Math.ceil(priceKrw * krwToUsd * 1.23));
}

// Returns page numbers with "…" for ellipsis gaps
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const show = new Set<number>([1, total, current]);
  if (current > 1) show.add(current - 1);
  if (current < total) show.add(current + 1);
  if (current > 2) show.add(current - 2);
  if (current < total - 1) show.add(current + 2);

  const sorted = Array.from(show).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 animate-pulse">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="bg-gray-200" style={{ paddingBottom: "62%" }} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded mt-2" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PartsCatalogClient({ brands, categories, brandModelChipsMap, krwToUsd }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lang = pathname.split("/")[1] || "ru";

  // ── Fade-in observer ────────────────────────────────────────────────────────
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ── URL params ───────────────────────────────────────────────────────────────
  const brandSlug = searchParams.get("brand") ?? "";
  const modelName = searchParams.get("model") ?? "";
  const catSlug   = searchParams.get("cat")   ?? "";
  const subSlug   = searchParams.get("sub")   ?? "";
  const urlMin    = searchParams.get("min");
  const urlMax    = searchParams.get("max");
  const priceMin  = urlMin ? Number(urlMin) : undefined;
  const priceMax  = urlMax ? Number(urlMax) : undefined;
  const sort      = searchParams.get("sort") ?? "default";
  // Page lives in the URL — preserved on refresh and shareable
  const apiPage   = Math.max(1, Number(searchParams.get("page") ?? "1"));

  // Base URL updater
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

  // Filter updater — always resets to page 1 when filters change
  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      updateParams({ ...updates, page: undefined });
    },
    [updateParams]
  );

  // Page change — updates URL and scrolls up to results area
  const goToPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage <= 1 ? undefined : String(newPage) });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [updateParams]
  );

  // ── Search (debounced 300ms) ─────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [searchQ, setSearchQ]         = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQ(searchInput);
      updateFilters({ q: searchInput || undefined });
      if (searchInput.length > 2) {
        trackEvent("search", { search_term: searchInput, section: "parts" });
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Price inputs ─────────────────────────────────────────────────────────────
  const [priceMinInput, setPriceMinInput] = useState(urlMin ?? "");
  const [priceMaxInput, setPriceMaxInput] = useState(urlMax ?? "");
  const applyPrice = () =>
    updateFilters({ min: priceMinInput || undefined, max: priceMaxInput || undefined });

  // ── View toggle ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<"grid" | "list">("grid");

  // ── Server-fetched products state ────────────────────────────────────────────
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [catCounts, setCatCounts] = useState<Record<number, number>>({});
  const [subCounts, setSubCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch whenever any filter or page changes
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    const params = new URLSearchParams();
    if (brandSlug)              params.set("brand",  brandSlug);
    if (catSlug)                params.set("cat",    catSlug);
    if (subSlug)                params.set("sub",    subSlug);
    if (modelName)              params.set("model",  modelName);
    if (searchQ)                params.set("q",      searchQ);
    // URL хранит цену в USD → конвертируем в KRW для API
    if (priceMin !== undefined) params.set("min", String(Math.round(priceMin / (krwToUsd * 1.23))));
    if (priceMax !== undefined) params.set("max", String(Math.round(priceMax / (krwToUsd * 1.23))));
    if (sort !== "default")     params.set("sort",   sort);
    params.set("page", String(apiPage));

    fetch(`/api/parts/products?${params}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(({ products: newProds, total: newTotal, catCounts: newCat, subCounts: newSub }) => {
        setProducts(newProds ?? []);
        setTotal(newTotal ?? 0);
        setCatCounts(newCat ?? {});
        setSubCounts(newSub ?? {});
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[PartsCatalog]", err);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug, catSlug, subSlug, modelName, searchQ, priceMin, priceMax, sort, apiPage]);

  // ── Derived UI state ─────────────────────────────────────────────────────────
  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => (BRAND_ORDER[a.slug] ?? 99) - (BRAND_ORDER[b.slug] ?? 99)),
    [brands]
  );
  const selectedBrand = useMemo(() => brands.find((b) => b.slug === brandSlug), [brands, brandSlug]);
  const parentCats    = useMemo(() => categories.filter((c) => c.parent_id === null), [categories]);
  const allSubs       = useMemo(() => categories.filter((c) => c.parent_id !== null), [categories]);
  const selectedCat   = useMemo(() => parentCats.find((c) => c.slug === catSlug), [parentCats, catSlug]);
  const selectedSub   = useMemo(() => allSubs.find((s) => s.slug === subSlug), [allSubs, subSlug]);
  const catSubs       = useMemo(
    () => selectedCat ? allSubs.filter((s) => s.parent_id === selectedCat.id) : [],
    [allSubs, selectedCat]
  );
  const brandModelChips = brandModelChipsMap[brandSlug] ?? [];

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageStart  = total > 0 ? (apiPage - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd    = Math.min(apiPage * PAGE_SIZE, total);

  // ── Misc helpers ─────────────────────────────────────────────────────────────
  const getLocalName = useCallback(
    (ru: string, en: string) => (i18n.language === "ru" ? ru : en || ru),
    [i18n.language]
  );
  const getProductName = (p: Product, language = lang) => {
    if (language === "ru") return p.name_ru;
    if (language === "ko") return p.name_ko || p.name_en || p.name_ru;
    return p.name_en || p.name_ru;
  };

  const hasFilters = !!(
    brandSlug || modelName || catSlug || subSlug ||
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section id="catalog" ref={sectionRef} className="py-24 bg-[#F5F7FA]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
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
        <div className={`bg-white rounded-2xl shadow-sm p-5 mb-8 transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

          {/* Row 1: part number / VIN search — main search tool */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#002C5F]/50 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("parts.catalog.filterSearchPlaceholder")}
              className="pl-12 h-13 text-base text-gray-900 placeholder:text-gray-400 border-2 border-[#002C5F]/20 focus-visible:border-[#002C5F] focus-visible:ring-[#002C5F]/20 focus-visible:ring-2 rounded-xl bg-[#002C5F]/[0.02] shadow-none"
              style={{ height: "52px" }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearchQ(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 2: brand chips — centered, brand colors */}
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {sortedBrands.map((brand) => {
              const active = brandSlug === brand.slug;
              const colors = BRAND_CHIP_COLORS[brand.slug] ?? BRAND_CHIP_COLORS.__default;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => updateFilters({ brand: active ? undefined : brand.slug, model: undefined })}
                  className={cn(
                    "px-7 py-2.5 rounded-full border-2 text-sm font-semibold tracking-wide transition-all shadow-sm",
                    active ? colors.active : colors.inactive
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>

          {/* Row 2: model chips */}
          {selectedBrand && brandModelChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5 pb-1">
              {brandModelChips.map(({ name, count }) => {
                const active = modelName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => updateFilters({ model: modelName === name ? undefined : name })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      active
                        ? "bg-[#BB162B] text-white border-[#BB162B]"
                        : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
                    )}
                  >
                    {name}
                    <span className={active ? "opacity-60" : "opacity-50"}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 3: category cards */}
          {parentCats.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mb-1">
              {parentCats.map((cat) => {
                const Icon  = getCatIcon(cat.slug);
                const active = catSlug === cat.slug;
                const count  = catCounts[cat.id];
                const empty  = count !== undefined && count === 0 && !active;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={empty}
                    onClick={() => updateFilters({ cat: catSlug === cat.slug ? undefined : cat.slug, sub: undefined })}
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
                    {count !== undefined && (
                      <span className={cn("text-xs font-bold tabular-nums", active ? "text-[#BB162B]" : empty ? "text-gray-300" : "text-gray-400")}>
                        {count}
                      </span>
                    )}
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
                const count  = subCounts[sub.id];
                const empty  = count !== undefined && count === 0 && !active;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={empty}
                    onClick={() => updateFilters({ sub: subSlug === sub.slug ? undefined : sub.slug })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      empty
                        ? "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed opacity-50"
                        : active
                        ? "bg-[#002C5F] text-white border-[#002C5F]"
                        : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
                    )}
                  >
                    {getLocalName(sub.name_ru, sub.name_en)}
                    {count !== undefined && (
                      <span className={active ? "opacity-60" : "opacity-50"}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 5: price range */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 whitespace-nowrap">{t("parts.catalog.filterPrice")}:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">$</span>
              <Input type="number" min={0} value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="0" className="w-24 h-8 text-sm text-center text-gray-900 placeholder:text-gray-400"
              />
              <span className="text-gray-400">—</span>
              <span className="text-xs text-gray-400">$</span>
              <Input type="number" min={0} value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                placeholder="∞" className="w-24 h-8 text-sm text-center text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Active filter tags */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              {selectedBrand && <FilterTag label={selectedBrand.name} onRemove={() => updateFilters({ brand: undefined, model: undefined })} />}
              {modelName && <FilterTag label={modelName} onRemove={() => updateFilters({ model: undefined })} />}
              {selectedCat && <FilterTag label={getLocalName(selectedCat.name_ru, selectedCat.name_en)} onRemove={() => updateFilters({ cat: undefined, sub: undefined })} />}
              {selectedSub && <FilterTag label={getLocalName(selectedSub.name_ru, selectedSub.name_en)} onRemove={() => updateFilters({ sub: undefined })} />}
              {(priceMin !== undefined || priceMax !== undefined) && (
                <FilterTag
                  label={`$${priceMin ?? 0} — ${priceMax ? "$" + priceMax : "∞"}`}
                  onRemove={() => { setPriceMinInput(""); setPriceMaxInput(""); updateFilters({ min: undefined, max: undefined }); }}
                />
              )}
              {searchQ && (
                <FilterTag label={`"${searchQ}"`} onRemove={() => { setSearchInput(""); setSearchQ(""); updateFilters({ q: undefined }); }} />
              )}
              <button onClick={resetAll} className="text-xs text-[#BB162B] underline ml-1 hover:text-[#9B1220] transition-colors">
                {t("parts.catalog.resetFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Results bar — anchor for scroll-to-top on page change */}
        <div
          ref={resultsRef}
          className={`flex items-center justify-between mb-6 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <span className="text-sm text-gray-500">
            {isLoading && products.length === 0
              ? "…"
              : total === 0
              ? t("parts.catalog.noResults")
              : t("parts.catalog.resultsShown", { shown: `${pageStart}–${pageEnd}`, total })
            }
          </span>
          <div className="flex items-center gap-3">
            <Select
              value={sort}
              onValueChange={(val) => updateFilters({ sort: val === "default" ? undefined : val })}
            >
              <SelectTrigger className="h-9 w-44 bg-white text-gray-700 border-gray-300 text-sm shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 border-gray-200">
                <SelectItem value="default">{t("parts.catalog.sortDefault")}</SelectItem>
                <SelectItem value="price_asc">{t("parts.catalog.sortPriceAsc")}</SelectItem>
                <SelectItem value="price_desc">{t("parts.catalog.sortPriceDesc")}</SelectItem>
                <SelectItem value="name_asc">{t("parts.catalog.sortNameAsc")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-[#002C5F] text-white" : "bg-white text-gray-400 hover:text-[#002C5F]")} title={t("parts.catalog.gridView")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-[#002C5F] text-white" : "bg-white text-gray-400 hover:text-[#002C5F]")} title={t("parts.catalog.listView")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className={cn(view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "grid grid-cols-1 gap-3")}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductSkeleton key={i} view={view} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState onReset={resetAll} t={t} />
        ) : (
          <div className={cn(view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "grid grid-cols-1 gap-3")}>
            {products.map((product, index) => {
              const productName = getProductName(product, lang);
              return (
              <ProductCard
                key={product.id}
                product={product}
                productName={productName}
                view={view}
                isVisible={isVisible}
                index={index}
                href={`/${lang}/parts/${generatePartSlug(product.part_number, productName, lang as "ru" | "en" | "ko", product.id)}`}
                onOrder={() => scrollToContact(productName, product.part_number)}
                onNavigate={() => sessionStorage.setItem("parts:filters", window.location.search)}
                t={t}
                krwToUsd={krwToUsd}
              />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <Pagination page={apiPage} totalPages={totalPages} onPageChange={goToPage} />
        )}

      </div>
    </section>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          "flex items-center gap-1 px-3 h-9 rounded-lg text-sm font-medium transition-all",
          page === 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-white hover:shadow-sm"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-medium transition-all",
              p === page
                ? "bg-[#002C5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-white hover:shadow-sm"
            )}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "flex items-center gap-1 px-3 h-9 rounded-lg text-sm font-medium transition-all",
          page === totalPages
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-white hover:shadow-sm"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// ─── FilterTag ─────────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#002C5F]/10 text-[#002C5F] text-xs font-medium">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-[#BB162B] transition-colors" aria-label="Remove filter">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onReset, t }: { onReset: () => void; t: (key: string) => string }) {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 rounded-full bg-[#002C5F]/5 flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-[#002C5F]/30" />
      </div>
      <p className="text-gray-600 font-medium mb-1">{t("parts.catalog.noResults")}</p>
      <p className="text-sm text-gray-400 mb-4">{t("parts.catalog.noResultsHint")}</p>
      <button onClick={onReset} className="text-sm text-[#BB162B] underline hover:text-[#9B1220] transition-colors">
        {t("parts.catalog.resetFilters")}
      </button>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  productName: string;
  view: "grid" | "list";
  isVisible: boolean;
  index: number;
  href: string;
  onOrder: () => void;
  onNavigate: () => void;
  t: (key: string) => string;
  krwToUsd: number;
}

function ProductCard({ product, productName, view, isVisible, index, href, onOrder, onNavigate, t, krwToUsd }: ProductCardProps) {
  const delay = `${Math.min(index * 20, 400)}ms`;

  if (view === "list") {
    return (
      <div
        className={cn("bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 p-4", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
        style={{ transitionDelay: delay }}
      >
        <Link href={href} onClick={onNavigate} className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
          {product.image_url
            ? <Image src={product.image_url} alt={productName} width={80} height={80} unoptimized className="object-contain p-2" />
            : <Wrench className="w-7 h-7 text-gray-300" />}
        </Link>
        <Link href={href} onClick={onNavigate} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="text-xs text-gray-400 font-mono mb-0.5">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[#002C5F] truncate">{productName}</h3>
        </Link>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-[#BB162B]">{formatUsd(product.price_krw, krwToUsd)}</span>
          <Button size="sm" onClick={onOrder} className="bg-[#002C5F] hover:bg-[#001f45] text-white text-xs h-8">
            {t("parts.catalog.orderBtn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
      style={{ transitionDelay: delay }}
    >
      <Link href={href} onClick={onNavigate} className="block relative bg-gray-50 overflow-hidden" style={{ paddingBottom: "62%" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {product.image_url
            ? <Image src={product.image_url} alt={productName} fill unoptimized className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
            : <div className="flex flex-col items-center gap-1.5 text-gray-300"><Wrench className="w-8 h-8" /><span className="text-xs">{t("parts.catalog.noPhoto")}</span></div>}
        </div>
        {product.is_new && (
          <div className="absolute top-2 left-2 bg-[#BB162B] text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {t("parts.catalog.newBadge")}
          </div>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <Link href={href} onClick={onNavigate} className="block">
          <div className="text-[11px] text-gray-400 font-mono leading-none mb-1">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[#002C5F] line-clamp-2 leading-snug min-h-[2.625rem] hover:text-[#002C5F]/80 transition-colors">
            {productName}
          </h3>
        </Link>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <span className="text-base font-bold text-[#BB162B]">{formatUsd(product.price_krw, krwToUsd)}</span>
          <Button size="sm" onClick={onOrder} className="bg-[#002C5F] hover:bg-[#001f45] text-white text-xs h-7 px-3">
            {t("parts.catalog.orderBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
