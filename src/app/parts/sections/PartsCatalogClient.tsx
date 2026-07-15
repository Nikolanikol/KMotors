"use client";
import { useState, useCallback, useEffect, useRef, useMemo, useReducer, useTransition } from "react";
import { trackEvent } from "@/utils/gtag";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { generatePartSlug } from "@/utils/partSlug";
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
  Search,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { clarityEvent } from "@/utils/clarity";
import { displayUsdToKrw } from "@/lib/pricing";
import { addToPartsCart, useCartProductIds } from "@/hooks/useCartCount";
import { QuickViewModal } from "./QuickViewModal";
import { ProductCard } from "./ProductCard";
import { FilterSidebar, type PendingFilters } from "./FilterSidebar";

const PAGE_SIZE_DESKTOP = 24;
const PAGE_SIZE_MOBILE = 10;
const MOBILE_BREAKPOINT = 640;
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
  initialProducts: Product[];
  initialTotal: number;
  initialBrandCounts: Record<number, number>;
  initialCatCounts: Record<number, number>;
}

// ─── Pending filter reducer ──────────────────────────────────────────────────

type PendingAction =
  | { type: "TOGGLE_BRAND"; slug: string }
  | { type: "TOGGLE_CATEGORY"; slug: string }
  | { type: "SET_PRICE_MIN"; value: string }
  | { type: "SET_PRICE_MAX"; value: string }
  | { type: "RESET" }
  | { type: "SYNC_FROM_URL"; state: PendingFilters };

function pendingReducer(state: PendingFilters, action: PendingAction): PendingFilters {
  switch (action.type) {
    case "TOGGLE_BRAND": {
      const brands = state.brands.includes(action.slug)
        ? state.brands.filter(s => s !== action.slug)
        : [...state.brands, action.slug];
      return { ...state, brands };
    }
    case "TOGGLE_CATEGORY": {
      const categories = state.categories.includes(action.slug)
        ? state.categories.filter(s => s !== action.slug)
        : [...state.categories, action.slug];
      return { ...state, categories };
    }
    case "SET_PRICE_MIN": return { ...state, priceMin: action.value };
    case "SET_PRICE_MAX": return { ...state, priceMax: action.value };
    case "RESET": return { brands: [], categories: [], priceMin: "", priceMax: "" };
    case "SYNC_FROM_URL": return action.state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number, siblings = 3): (number | "…")[] {
  const threshold = siblings <= 1 ? 4 : 10;
  if (total <= threshold) return Array.from({ length: total }, (_, i) => i + 1);
  const show = new Set<number>([1, total, current]);
  for (let d = 1; d <= siblings; d++) {
    if (current - d >= 1) show.add(current - d);
    if (current + d <= total) show.add(current + d);
  }
  if (siblings >= 3) {
    if (current <= 5) for (let i = 2; i <= 8; i++) show.add(i);
    if (current >= total - 4) for (let i = total - 7; i < total; i++) if (i > 0) show.add(i);
  }
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

function mergeUrlParam(multi: string, single: string): string[] {
  const arr = multi ? multi.split(",").filter(Boolean) : [];
  if (single && !arr.includes(single)) arr.push(single);
  return arr;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/90" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-[var(--pn-surface-3)] rounded w-1/2" />
        <div className="h-4 bg-[var(--pn-surface-3)] rounded" />
        <div className="h-9 bg-[var(--pn-surface-3)] rounded mt-3" />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PartsCatalogClient({ brands, categories, krwToUsd, initialProducts, initialTotal, initialBrandCounts, initialCatCounts }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const lang = pathname.split("/")[1] || "ru";
  const { cartProductIds } = useCartProductIds();

  // ── Cart ──────────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (product: Product): Promise<boolean> => {
    return addToPartsCart({
      id: product.id,
      name_ru: product.name_ru,
      name_en: product.name_en,
      name_ko: product.name_ko,
      part_number: product.part_number,
      price_krw: product.price_krw,
      image_url: product.image_url,
      is_new: product.is_new,
    });
  }, []);

  // ── Fade-in observer ──────────────────────────────────────────────────────
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isVisible] = useState(true);

  // ── URL params (source of truth for what's fetched) ───────────────────────
  const brandsParam = searchParams.get("brands") ?? "";
  const brandParam  = searchParams.get("brand")  ?? "";
  const catsParam   = searchParams.get("cats")   ?? "";
  const catParam    = searchParams.get("cat")    ?? "";
  const subSlug     = searchParams.get("sub")    ?? "";
  const urlMinStr   = searchParams.get("min")    ?? "";
  const urlMaxStr   = searchParams.get("max")    ?? "";
  const priceMin    = urlMinStr ? Number(urlMinStr) : undefined;
  const priceMax    = urlMaxStr ? Number(urlMaxStr) : undefined;
  const sort        = searchParams.get("sort")   ?? "default";
  const apiPage     = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const urlBrands = useMemo(() => mergeUrlParam(brandsParam, brandParam), [brandsParam, brandParam]);
  const urlCats   = useMemo(() => mergeUrlParam(catsParam, catParam), [catsParam, catParam]);

  // ── URL updaters ──────────────────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      });
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [searchParams, router, pathname, startTransition]
  );

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      updateParams({ ...updates, page: undefined });
    },
    [updateParams]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage <= 1 ? undefined : String(newPage) });
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [updateParams]
  );

  // ── Pending filter state ──────────────────────────────────────────────────
  const [pending, dispatch] = useReducer(pendingReducer, {
    brands: urlBrands,
    categories: urlCats,
    priceMin: urlMinStr,
    priceMax: urlMaxStr,
  });

  // Sync pending ← URL when searchParams change (browser back/forward, chip clicks)
  useEffect(() => {
    dispatch({
      type: "SYNC_FROM_URL",
      state: {
        brands: mergeUrlParam(brandsParam, brandParam),
        categories: mergeUrlParam(catsParam, catParam),
        priceMin: urlMinStr,
        priceMax: urlMaxStr,
      },
    });
  }, [brandsParam, brandParam, catsParam, catParam, urlMinStr, urlMaxStr]);

  const isDirty = useMemo(() => {
    return JSON.stringify([...pending.brands].sort()) !== JSON.stringify([...urlBrands].sort()) ||
           JSON.stringify([...pending.categories].sort()) !== JSON.stringify([...urlCats].sort()) ||
           pending.priceMin !== urlMinStr ||
           pending.priceMax !== urlMaxStr;
  }, [pending, urlBrands, urlCats, urlMinStr, urlMaxStr]);

  const handleApply = useCallback(() => {
    updateFilters({
      brands: pending.brands.length > 0 ? pending.brands.join(",") : undefined,
      cats: pending.categories.length > 0 ? pending.categories.join(",") : undefined,
      min: pending.priceMin || undefined,
      max: pending.priceMax || undefined,
      brand: undefined, cat: undefined, sub: undefined, model: undefined,
    });
  }, [pending, updateFilters]);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    setSearchInput("");
    setSearchQ("");
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // ── Search (debounced 300ms) ──────────────────────────────────────────────
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

  // Hero pill-search → fill catalog search
  useEffect(() => {
    const handler = (e: Event) => setSearchInput((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("parts:hero-search", handler);
    return () => window.removeEventListener("parts:hero-search", handler);
  }, []);

  // ── Quick view modal ──────────────────────────────────────────────────────
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // ── Mobile page size ──────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const pageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  // ── Mobile drawer ─────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // ── Server-fetched state ──────────────────────────────────────────────────
  // Use SSR data when URL has no filters (products visible in initial HTML for SEO)
  const ssrReady = initialProducts.length > 0 && !brandsParam && !brandParam && !catsParam && !catParam && !subSlug && !searchParams.get("q") && !urlMinStr && !urlMaxStr && sort === "default" && apiPage === 1;

  const [products, setProducts]       = useState<Product[]>(ssrReady ? initialProducts : []);
  const [total, setTotal]             = useState(ssrReady ? initialTotal : 0);
  const [catCounts, setCatCounts]     = useState<Record<number, number>>(ssrReady ? initialCatCounts : {});
  const [subCounts, setSubCounts]     = useState<Record<number, number>>({});
  const [brandCounts, setBrandCounts] = useState<Record<number, number>>(ssrReady ? initialBrandCounts : {});
  const [isLoading, setIsLoading]     = useState(!ssrReady);

  type CacheEntry = {
    products: Product[];
    total: number;
    catCounts: Record<number, number>;
    subCounts: Record<number, number>;
    brandCounts: Record<number, number>;
  };
  const MAX_CACHE = 30;
  const fetchCache = useRef<Map<string, CacheEntry>>(new Map(
    ssrReady
      ? [[`page=1&limit=${PAGE_SIZE_DESKTOP}`, {
          products: initialProducts,
          total: initialTotal,
          catCounts: initialCatCounts,
          subCounts: {},
          brandCounts: initialBrandCounts,
        }]]
      : []
  ));
  const setCacheEntry = (key: string, value: CacheEntry) => {
    if (fetchCache.current.size >= MAX_CACHE) {
      const firstKey = fetchCache.current.keys().next().value;
      if (firstKey) fetchCache.current.delete(firstKey);
    }
    fetchCache.current.set(key, value);
  };

  // Fetch whenever URL filters or page changes
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    const fetchBrands = mergeUrlParam(brandsParam, brandParam);
    const fetchCats   = mergeUrlParam(catsParam, catParam);

    if (fetchBrands.length > 0) params.set("brands", [...fetchBrands].sort().join(","));
    if (fetchCats.length > 0)   params.set("cats", [...fetchCats].sort().join(","));
    if (subSlug)                 params.set("sub", subSlug);
    if (searchQ)                 params.set("q", searchQ);
    if (priceMin !== undefined)  params.set("min", String(displayUsdToKrw(priceMin, krwToUsd)));
    if (priceMax !== undefined)  params.set("max", String(displayUsdToKrw(priceMax, krwToUsd)));
    if (sort !== "default")      params.set("sort", sort);
    params.set("page", String(apiPage));
    params.set("limit", String(pageSize));

    const cacheKey = params.toString();
    const cached = fetchCache.current.get(cacheKey);
    if (cached) {
      setProducts(cached.products);
      setTotal(cached.total);
      setCatCounts(cached.catCounts);
      setSubCounts(cached.subCounts);
      setBrandCounts(cached.brandCounts);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/parts/products?${params}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(({ products: p, total: t, catCounts: cc, subCounts: sc, brandCounts: bc }) => {
        const entry: CacheEntry = {
          products: p ?? [],
          total: t ?? 0,
          catCounts: cc ?? {},
          subCounts: sc ?? {},
          brandCounts: bc ?? {},
        };
        setCacheEntry(cacheKey, entry);
        setProducts(entry.products);
        setTotal(entry.total);
        setCatCounts(entry.catCounts);
        setSubCounts(entry.subCounts);
        setBrandCounts(entry.brandCounts);
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
  }, [brandsParam, brandParam, catsParam, catParam, subSlug, searchQ, priceMin, priceMax, sort, apiPage, pageSize]);

  // ── Scroll to product after auth redirect ─────────────────────────────────
  useEffect(() => {
    if (isLoading || products.length === 0) return;
    const pendingId = sessionStorage.getItem("parts:pendingCartProduct");
    if (!pendingId) return;
    sessionStorage.removeItem("parts:pendingCartProduct");
    requestAnimationFrame(() => {
      const el = document.getElementById(`product-${pendingId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [isLoading, products]);

  // ── Derived UI state ──────────────────────────────────────────────────────
  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => (BRAND_ORDER[a.slug] ?? 99) - (BRAND_ORDER[b.slug] ?? 99)),
    [brands]
  );
  const parentCats = useMemo(() => categories.filter((c) => c.parent_id === null), [categories]);
  const allSubs    = useMemo(() => categories.filter((c) => c.parent_id !== null), [categories]);

  // Subcategory chips: only when exactly 1 parent category is selected
  const singleCatId = useMemo(() => {
    if (urlCats.length !== 1) return null;
    return parentCats.find((c) => c.slug === urlCats[0])?.id ?? null;
  }, [urlCats, parentCats]);
  const catSubs = useMemo(
    () => singleCatId ? allSubs.filter((s) => s.parent_id === singleCatId) : [],
    [allSubs, singleCatId]
  );
  const selectedSub = useMemo(() => allSubs.find((s) => s.slug === subSlug), [allSubs, subSlug]);

  const totalPages = Math.ceil(total / pageSize);
  const pageStart  = total > 0 ? (apiPage - 1) * pageSize + 1 : 0;
  const pageEnd    = Math.min(apiPage * pageSize, total);

  const getLocalName = useCallback(
    (ru: string, en: string) => (i18n.language === "ru" ? ru : en || ru),
    [i18n.language]
  );
  const getProductName = (p: Product, language = lang): string => {
    if (language === "ru") return p.name_ru || p.name_en || p.part_number;
    if (language === "ko") return p.name_ko || p.name_en || p.name_ru || p.part_number;
    return p.name_en || p.name_ru || p.part_number;
  };

  const hasFilters = !!(
    urlBrands.length > 0 || urlCats.length > 0 || subSlug ||
    priceMin !== undefined || priceMax !== undefined || searchQ
  );

  const scrollToContact = (name: string, partNumber: string) => {
    sessionStorage.setItem("prefillMessage", `${name} (${partNumber})`);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    clarityEvent("parts_order_click");
  };

  // Active filter tag data
  const activeTags = useMemo(() => {
    const tags: { label: string; onRemove: () => void }[] = [];
    urlBrands.forEach((slug) => {
      const brand = brands.find((b) => b.slug === slug);
      if (brand) tags.push({
        label: brand.name,
        onRemove: () => {
          const next = urlBrands.filter((s) => s !== slug);
          updateFilters({ brands: next.length > 0 ? next.join(",") : undefined, brand: undefined });
        },
      });
    });
    urlCats.forEach((slug) => {
      const cat = parentCats.find((c) => c.slug === slug);
      if (cat) tags.push({
        label: getLocalName(cat.name_ru, cat.name_en),
        onRemove: () => {
          const next = urlCats.filter((s) => s !== slug);
          updateFilters({ cats: next.length > 0 ? next.join(",") : undefined, cat: undefined, sub: undefined });
        },
      });
    });
    if (selectedSub) {
      tags.push({
        label: getLocalName(selectedSub.name_ru, selectedSub.name_en),
        onRemove: () => updateFilters({ sub: undefined }),
      });
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      tags.push({
        label: `$${priceMin ?? 0} — ${priceMax ? "$" + priceMax : "∞"}`,
        onRemove: () => updateFilters({ min: undefined, max: undefined }),
      });
    }
    if (searchQ) {
      tags.push({
        label: `"${searchQ}"`,
        onRemove: () => { setSearchInput(""); setSearchQ(""); updateFilters({ q: undefined }); },
      });
    }
    return tags;
  }, [urlBrands, urlCats, selectedSub, priceMin, priceMax, searchQ, brands, parentCats, getLocalName, updateFilters]);

  // ── Sidebar props (shared between desktop and mobile drawer) ──────────────
  const sidebarProps = {
    brands: sortedBrands,
    parentCats,
    brandCounts,
    catCounts,
    pending,
    onToggleBrand: (slug: string) => dispatch({ type: "TOGGLE_BRAND", slug }),
    onToggleCategory: (slug: string) => dispatch({ type: "TOGGLE_CATEGORY", slug }),
    onPriceMinChange: (val: string) => dispatch({ type: "SET_PRICE_MIN", value: val }),
    onPriceMaxChange: (val: string) => dispatch({ type: "SET_PRICE_MAX", value: val }),
    onReset: handleReset,
    isDirty,
    t,
    getLocalName,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section id="catalog" ref={sectionRef} className="py-16 lg:py-24 bg-[var(--pn-bg)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className={`text-center mb-8 lg:mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[var(--pn-orange)]" />
            <span className="text-[var(--pn-orange)] text-sm font-medium tracking-wider uppercase">
              {t("parts.catalog.badge")}
            </span>
            <div className="h-px w-12 bg-[var(--pn-orange)]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--pn-text)] mb-4">
            {t("parts.catalog.title")}
          </h2>
          <p className="text-[var(--pn-text-muted)] max-w-2xl mx-auto">{t("parts.catalog.subtitle")}</p>
        </div>

        {/* Search bar */}
        <div className={`relative mb-6 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {isLoading && searchQ ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pn-orange)] animate-spin pointer-events-none z-10" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--pn-text-dim)] pointer-events-none z-10" />
          )}
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("parts.catalog.filterSearchPlaceholder")}
            className="pn-glow pl-12 h-11 sm:h-[52px] text-sm sm:text-base text-[var(--pn-text)] placeholder:text-[var(--pn-text-dim)] border border-[var(--pn-border)] focus-visible:ring-0 rounded-xl bg-[var(--pn-surface-2)] shadow-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearchQ(""); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--pn-text-dim)] hover:text-[var(--pn-text)] transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block w-[260px] shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                {...sidebarProps}
                onApply={handleApply}
                className=""
              />
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex-1 min-w-0">

            {/* Mobile filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "lg:hidden flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl border text-sm font-medium transition-all w-full justify-center",
                hasFilters
                  ? "border-[var(--pn-orange)] bg-[var(--pn-orange)]/10 text-[var(--pn-orange)]"
                  : "border-[var(--pn-border)] bg-[var(--pn-surface)] text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)]/50"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("parts.catalog.filtersTitle")}
              {hasFilters && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[var(--pn-orange)] text-white text-xs flex items-center justify-center">
                  {urlBrands.length + urlCats.length + (priceMin !== undefined || priceMax !== undefined ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Subcategory chips (when exactly 1 parent category selected) */}
            {catSubs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {catSubs.map((sub) => {
                  const active = subSlug === sub.slug;
                  const count  = subCounts[sub.id];
                  const empty  = count !== undefined && count === 0 && !active;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={empty || isPending}
                      onClick={() => updateFilters({ sub: subSlug === sub.slug ? undefined : sub.slug })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                        empty
                          ? "bg-[var(--pn-surface)] text-[var(--pn-text-dim)] border-transparent cursor-not-allowed opacity-50"
                          : active
                          ? "bg-[var(--pn-orange)] text-white border-[var(--pn-orange)]"
                          : "bg-[var(--pn-surface)] text-[var(--pn-text-muted)] border-[var(--pn-border)] hover:border-[var(--pn-orange)]/50",
                        isPending && !empty && "opacity-60 cursor-wait"
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

            {/* Active filter tags */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeTags.map((tag, i) => (
                  <FilterTag key={i} label={tag.label} onRemove={tag.onRemove} />
                ))}
                <button
                  onClick={handleReset}
                  className="text-xs text-[var(--pn-orange)] underline ml-1 hover:brightness-110 transition-colors"
                >
                  {t("parts.catalog.resetFilters")}
                </button>
              </div>
            )}

            {/* Results bar */}
            <div
              ref={resultsRef}
              className={`flex flex-wrap items-center justify-between mb-4 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <span className="text-sm text-[var(--pn-text-muted)] w-full sm:w-auto mb-2 sm:mb-0">
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
                  disabled={isPending}
                  onValueChange={(val) => updateFilters({ sort: val === "default" ? undefined : val })}
                >
                  <SelectTrigger className={cn("h-9 w-44 bg-[var(--pn-surface-2)] text-[var(--pn-text)] border-[var(--pn-border)] text-sm shadow-none focus:ring-[var(--pn-orange)]", isPending && "opacity-60 cursor-wait")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--pn-surface-2)] text-[var(--pn-text)] border-[var(--pn-border)]">
                    <SelectItem value="default">{t("parts.catalog.sortDefault")}</SelectItem>
                    <SelectItem value="price_asc">{t("parts.catalog.sortPriceAsc")}</SelectItem>
                    <SelectItem value="price_desc">{t("parts.catalog.sortPriceDesc")}</SelectItem>
                    <SelectItem value="name_asc">{t("parts.catalog.sortNameAsc")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product grid / list */}
            <div style={{ minHeight: isLoading ? "600px" : undefined }}>
              {isLoading ? (
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: pageSize }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <EmptyState onReset={handleReset} t={t} />
              ) : (
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, index) => {
                    const productName = getProductName(product, lang);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        productName={productName}
                        isVisible={isVisible}
                        index={index}
                        href={`/${lang}/parts/${generatePartSlug(product.part_number, productName, lang as "ru" | "en" | "ko", product.id)}`}
                        onAddToCart={() => handleAddToCart(product)}
                        onQuickView={() => setQuickViewProduct(product)}
                        onNavigate={() => { sessionStorage.setItem("parts:filters", window.location.search); clarityEvent("part_card_click"); }}
                        lang={lang}
                        t={t}
                        krwToUsd={krwToUsd}
                        inCart={cartProductIds.has(product.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <Pagination page={apiPage} totalPages={totalPages} onPageChange={goToPage} isPending={isPending} isMobile={isMobile} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-[var(--pn-surface)] border-r border-[var(--pn-border)] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-[var(--pn-surface)] px-4 pt-4 pb-2 flex items-center justify-between border-b border-[var(--pn-border)]">
              <h3 className="text-lg font-bold text-[var(--pn-text)]">{t("parts.catalog.filtersTitle")}</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--pn-surface-3)] flex items-center justify-center hover:bg-[var(--pn-border)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--pn-text-muted)]" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                {...sidebarProps}
                onApply={() => { handleApply(); setDrawerOpen(false); }}
                className="shadow-none bg-transparent p-0"
              />
            </div>
          </div>
        </div>
      )}

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        krwToUsd={krwToUsd}
        lang={lang}
        inCart={!!quickViewProduct && cartProductIds.has(quickViewProduct.id)}
      />
    </section>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onPageChange, isPending, isMobile,
}: {
  page: number; totalPages: number; onPageChange: (page: number) => void; isPending: boolean; isMobile: boolean;
}) {
  const pages = getPageNumbers(page, totalPages, isMobile ? 1 : 3);
  return (
    <nav className={cn("flex items-center justify-center gap-1 mt-10", isPending && "opacity-60 pointer-events-none")} aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || isPending}
        className={cn(
          "flex items-center gap-1 px-3 h-9 rounded-lg text-sm font-medium transition-all border border-transparent",
          page === 1 ? "text-[var(--pn-text-dim)] cursor-not-allowed" : "text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)]"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-[var(--pn-text-dim)] text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            disabled={isPending}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-medium transition-all border",
              p === page ? "bg-[var(--pn-orange)] text-white border-[var(--pn-orange)] shadow-lg shadow-[var(--pn-orange)]/20" : "text-[var(--pn-text-muted)] border-[var(--pn-border)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)]"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || isPending}
        className={cn(
          "flex items-center gap-1 px-3 h-9 rounded-lg text-sm font-medium transition-all border border-transparent",
          page === totalPages ? "text-[var(--pn-text-dim)] cursor-not-allowed" : "text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)]"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// ─── FilterTag ───────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--pn-orange)]/10 border border-[var(--pn-orange)]/20 text-[var(--pn-orange)] text-xs font-semibold uppercase tracking-wide">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-white transition-colors" aria-label="Remove filter">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState({ onReset, t }: { onReset: () => void; t: (key: string) => string }) {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 rounded-full bg-[var(--pn-surface-2)] border border-[var(--pn-border)] flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-[var(--pn-text-dim)]" />
      </div>
      <p className="text-[var(--pn-text)] font-medium mb-1">{t("parts.catalog.noResults")}</p>
      <p className="text-sm text-[var(--pn-text-muted)] mb-4">{t("parts.catalog.noResultsHint")}</p>
      <button onClick={onReset} className="text-sm text-[var(--pn-orange)] underline hover:brightness-110 transition-colors">
        {t("parts.catalog.resetFilters")}
      </button>
    </div>
  );
}
