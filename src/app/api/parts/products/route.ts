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

    const brandSlug = sp.get("brand") ?? "";
    const catSlug   = sp.get("cat")   ?? "";
    const subSlug   = sp.get("sub")   ?? "";
    const modelName = sp.get("model") ?? "";
    const q         = sp.get("q")     ?? "";
    const minPrice  = sp.get("min") ? Number(sp.get("min")) : null;
    const maxPrice  = sp.get("max") ? Number(sp.get("max")) : null;
    const sort      = sp.get("sort")  ?? "default";
    const page      = Math.max(1, Number(sp.get("page") ?? "1"));

    // Кэшируем только запросы без фильтров — одинаковые для всех пользователей
    const hasFilters = !!(brandSlug || catSlug || subSlug || modelName || q || minPrice || maxPrice || sort !== "default");
    const cacheHeader = hasFilters
      ? "no-store"
      : "s-maxage=60, stale-while-revalidate=300";

    // ── Step 1: resolve slugs → IDs (cached, no DB hit after first request) ──
    const [brandsData, catsData] = await Promise.all([getBrands(), getCategories()]);

    const brandId = brandsData.find((b) => b.slug === brandSlug)?.id ?? null;
    const catId   = catsData.find((c) => c.slug === catSlug)?.id   ?? null;
    const subId   = catsData.find((c) => c.slug === subSlug)?.id   ?? null;

    const parentCatIds = catsData.filter((c) => c.parent_id === null).map((c) => c.id);
    const subCatIds    = catId != null
      ? catsData.filter((c) => c.parent_id === catId).map((c) => c.id)
      : [];

    // Brand slug provided but not found → 0 results
    if (brandSlug && brandId === null) {
      return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {} });
    }

    const supabase = createServerClient();

    // ── Step 2: model name → product IDs via fitment ──────────────────────────
    let modelProductIds: number[] | null = null;

    if (modelName && brandId !== null) {
      const { data: modelRows } = await supabase
        .from("parts_vehicle_models")
        .select("id")
        .eq("name_en", modelName)
        .eq("brand_id", brandId);

      const modelIds = modelRows?.map((m) => m.id) ?? [];

      if (modelIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {} });
      }

      const { data: fitmentRows } = await supabase
        .from("parts_fitment")
        .select("product_id")
        .in("vehicle_model_id", modelIds);

      modelProductIds = [...new Set(fitmentRows?.map((f) => f.product_id) ?? [])];

      if (modelProductIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {} });
      }
    }

    // ── Filter builders ───────────────────────────────────────────────────────
    // "base" = brand + model + price + search  (NO cat/sub — used for catCounts)
    function withBaseFilters(query: AnyQuery): AnyQuery {
      if (brandId !== null)  query = query.eq("brand_id", brandId);
      if (modelProductIds)   query = query.in("id", modelProductIds);
      if (minPrice !== null) query = query.gte("price_krw", minPrice);
      if (maxPrice !== null) query = query.lte("price_krw", maxPrice);
      if (q) query = query.or(
        `part_number.ilike.%${q}%,name_ru.ilike.%${q}%,name_en.ilike.%${q}%`
      );
      return query;
    }

    // "full" = base + cat + sub  (used for product query & total count)
    function withFullFilters(query: AnyQuery): AnyQuery {
      query = withBaseFilters(query);
      if (catId !== null) query = query.eq("category_id", catId);
      if (subId !== null) query = query.eq("subcategory_id", subId);
      return query;
    }

    // ── Step 3: product page + total + catCounts + subCounts — all parallel ───
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

    // Total count (HEAD — zero data transferred)
    const countQuery = withFullFilters(
      supabase.from("parts_products").select("*", { count: "exact", head: true })
    );

    // catCounts + subCounts: one query fetching just two columns, grouped in JS.
    // Only when brand or model filter is active — otherwise all cats are full.
    const hasBrandOrModel = brandId !== null || modelProductIds !== null;

    const groupQuery = hasBrandOrModel
      ? withBaseFilters(
          supabase.from("parts_products")
            .select("category_id, subcategory_id")
            .limit(50000)
        )
      : Promise.resolve({ data: null as { category_id: number | null; subcategory_id: number | null }[] | null });

    // Fire everything in parallel — 3 queries instead of 2 + N
    const [productsRes, countRes, groupRes] = await Promise.all([
      productQuery,
      countQuery,
      groupQuery,
    ]);

    const catCounts: Record<number, number> = {};
    const subCounts: Record<number, number> = {};

    if (groupRes.data) {
      for (const row of groupRes.data) {
        if (row.category_id != null) {
          catCounts[row.category_id] = (catCounts[row.category_id] ?? 0) + 1;
        }
        if (catId !== null && row.category_id === catId && row.subcategory_id != null) {
          subCounts[row.subcategory_id] = (subCounts[row.subcategory_id] ?? 0) + 1;
        }
      }
    }

    return NextResponse.json(
      { products: productsRes.data ?? [], total: countRes.count ?? 0, catCounts, subCounts },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    console.error("[/api/parts/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
