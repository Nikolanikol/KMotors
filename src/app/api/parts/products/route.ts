import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";

const PAGE_SIZE = 24;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

// ── Cached slug lookups (revalidate every hour) ───────────────────────────────
const getBrands = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_brands")
      .select("id, slug");
    return data ?? [];
  },
  ["parts-brands"],
  { revalidate: 3600 }
);

const getCategories = unstable_cache(
  async () => {
    const { data } = await createServerClient()
      .from("parts_categories")
      .select("id, slug, parent_id");
    return data ?? [];
  },
  ["parts-categories"],
  { revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    // ── Parse params (multi-select + backward compat) ─────────────────────────
    const brandSlug  = sp.get("brand")  ?? "";
    const brandsParam = sp.get("brands") ?? "";
    const catSlug    = sp.get("cat")    ?? "";
    const catsParam  = sp.get("cats")   ?? "";
    const subSlug    = sp.get("sub")    ?? "";
    const modelName  = sp.get("model")  ?? "";
    const q          = sp.get("q")      ?? "";
    const minPrice   = sp.get("min") ? Number(sp.get("min")) : null;
    const maxPrice   = sp.get("max") ? Number(sp.get("max")) : null;
    const sort       = sp.get("sort")   ?? "default";
    const page       = Math.max(1, Number(sp.get("page") ?? "1"));

    const hasSearch = !!(q || minPrice || maxPrice);
    const hasFilters = !!(brandSlug || brandsParam || catSlug || catsParam || subSlug || modelName || sort !== "default");
    const cacheHeader = hasSearch
      ? "no-store"
      : hasFilters
      ? "s-maxage=30, stale-while-revalidate=120"
      : "s-maxage=60, stale-while-revalidate=300";

    // ── Step 1: resolve slugs → IDs ──────────────────────────────────────────
    const [brandsData, catsData] = await Promise.all([getBrands(), getCategories()]);

    // Multi-brand: merge "brands=hyundai,kia" with legacy "brand=hyundai"
    const brandSlugs = [
      ...(brandsParam ? brandsParam.split(",").filter(Boolean) : []),
      ...(brandSlug ? [brandSlug] : []),
    ];
    const brandIds = [...new Set(brandSlugs)]
      .map(s => brandsData.find(b => b.slug === s)?.id)
      .filter((id): id is number => id != null);

    // Multi-category: merge "cats=engine,body" with legacy "cat=engine"
    const catSlugs = [
      ...(catsParam ? catsParam.split(",").filter(Boolean) : []),
      ...(catSlug ? [catSlug] : []),
    ];
    const catIds = [...new Set(catSlugs)]
      .map(s => catsData.find(c => c.slug === s)?.id)
      .filter((id): id is number => id != null);

    const subId = catsData.find((c) => c.slug === subSlug)?.id ?? null;

    // If brand slug(s) provided but none resolved → 0 results
    if (brandSlugs.length > 0 && brandIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {}, brandCounts: {} });
    }

    const supabase = createServerClient();

    // ── Step 2: model name → product IDs via fitment ──────────────────────────
    let modelProductIds: number[] | null = null;

    if (modelName && brandIds.length === 1) {
      const { data: modelRows } = await supabase
        .from("parts_vehicle_models")
        .select("id")
        .eq("name_en", modelName)
        .eq("brand_id", brandIds[0]);

      const modelIds = modelRows?.map((m) => m.id) ?? [];

      if (modelIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {}, brandCounts: {} });
      }

      const { data: fitmentRows } = await supabase
        .from("parts_fitment")
        .select("product_id")
        .in("vehicle_model_id", modelIds);

      modelProductIds = [...new Set(fitmentRows?.map((f) => f.product_id) ?? [])];

      if (modelProductIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {}, brandCounts: {} });
      }
    }

    // ── Filter builders ───────────────────────────────────────────────────────
    // "base" = brand + model + price + search (NO cat/sub)
    function withBaseFilters(query: AnyQuery): AnyQuery {
      if (brandIds.length > 0) query = query.in("brand_id", brandIds);
      if (modelProductIds)     query = query.in("id", modelProductIds);
      if (minPrice !== null)   query = query.gte("price_krw", minPrice);
      if (maxPrice !== null)   query = query.lte("price_krw", maxPrice);
      if (q) query = query.or(
        `part_number.ilike.%${q}%,name_ru.ilike.%${q}%,name_en.ilike.%${q}%`
      );
      return query;
    }

    // "full" = base + cat + sub
    function withFullFilters(query: AnyQuery): AnyQuery {
      query = withBaseFilters(query);
      if (catIds.length > 0) query = query.in("category_id", catIds);
      if (subId !== null)    query = query.eq("subcategory_id", subId);
      return query;
    }

    // "noBrand" = everything except brand (for brandCounts facet)
    function withFiltersNoBrand(query: AnyQuery): AnyQuery {
      if (modelProductIds)   query = query.in("id", modelProductIds);
      if (minPrice !== null)  query = query.gte("price_krw", minPrice);
      if (maxPrice !== null)  query = query.lte("price_krw", maxPrice);
      if (q) query = query.or(
        `part_number.ilike.%${q}%,name_ru.ilike.%${q}%,name_en.ilike.%${q}%`
      );
      if (catIds.length > 0) query = query.in("category_id", catIds);
      if (subId !== null)     query = query.eq("subcategory_id", subId);
      return query;
    }

    // ── Step 3: queries in parallel ──────────────────────────────────────────
    const from = (page - 1) * PAGE_SIZE;

    // Main product query
    let productQuery = withFullFilters(
      supabase.from("parts_products").select(
        "id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new"
      )
    );
    switch (sort) {
      case "price_asc":  productQuery = productQuery.order("price_krw", { ascending: true });  break;
      case "price_desc": productQuery = productQuery.order("price_krw", { ascending: false }); break;
      default:           productQuery = productQuery.order("name_ru",   { ascending: true });  break;
    }
    productQuery = productQuery.range(from, from + PAGE_SIZE - 1);

    // Total count
    const countQuery = withFullFilters(
      supabase.from("parts_products").select("*", { count: "exact", head: true })
    );

    // ── Facet counts: per-item HEAD queries (exact counts, zero data) ────────
    // PostgREST caps .limit() at 1000, so the old grouping approach was wrong.
    // HEAD queries with count:"exact" are precise and transfer no row data.

    const [productsRes, countRes, brandCountEntries, catCountEntries, subCountEntries] =
      await Promise.all([
        productQuery,
        countQuery,

        // brandCounts: one HEAD per brand, all filters EXCEPT brand
        Promise.all(
          brandsData.map(async (b) => {
            const { count } = await withFiltersNoBrand(
              supabase.from("parts_products").select("*", { count: "exact", head: true })
            ).eq("brand_id", b.id);
            return [b.id, count ?? 0] as const;
          })
        ),

        // catCounts: one HEAD per parent category, base filters (no cat/sub)
        Promise.all(
          catsData.filter((c) => c.parent_id === null).map(async (c) => {
            const { count } = await withBaseFilters(
              supabase.from("parts_products").select("*", { count: "exact", head: true })
            ).eq("category_id", c.id);
            return [c.id, count ?? 0] as const;
          })
        ),

        // subCounts: only when exactly 1 parent category selected
        catIds.length === 1
          ? Promise.all(
              catsData.filter((c) => c.parent_id === catIds[0]).map(async (s) => {
                const { count } = await withBaseFilters(
                  supabase.from("parts_products").select("*", { count: "exact", head: true })
                ).eq("subcategory_id", s.id);
                return [s.id, count ?? 0] as const;
              })
            )
          : Promise.resolve([]),
      ]);

    const brandCounts = Object.fromEntries(brandCountEntries) as Record<number, number>;
    const catCounts = Object.fromEntries(catCountEntries) as Record<number, number>;
    const subCounts = Object.fromEntries(subCountEntries) as Record<number, number>;

    return NextResponse.json(
      { products: productsRes.data ?? [], total: countRes.count ?? 0, catCounts, subCounts, brandCounts },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    console.error("[/api/parts/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
