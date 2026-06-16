import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { PartsCatalogClient } from "./PartsCatalogClient";
import type { Brand, Category, VehicleModel, ModelChip, Product } from "./PartsCatalogClient";

type Fitment = { product_id: number; vehicle_model_id: number };

// ─── Parallel batch fetching ──────────────────────────────────────────────────
async function fetchAllRows<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
  totalCount: number
): Promise<T[]> {
  if (totalCount === 0) return [];
  const BATCH = 1000;
  const batches = Math.ceil(totalCount / BATCH);
  const results = await Promise.all(
    Array.from({ length: batches }, (_, i) =>
      queryFactory(i * BATCH, (i + 1) * BATCH - 1)
    )
  );
  return results.flatMap((r) => r.data ?? []);
}

async function fetchCatalogData() {
  const supabase = createServerClient();

  // Step 1: small tables + model count + exchange rate + initial products — all in parallel
  const [brands, categories, fitment, modelCount, { krwToUsd }, initialProducts, initialTotal] = await Promise.all([
    supabase.from("parts_brands").select("id, name, slug").order("name")
      .then((r) => (r.data ?? []) as Brand[]),

    supabase
      .from("parts_categories")
      .select("id, name_ru, name_en, slug, parent_id")
      .order("sort_order", { nullsFirst: false })
      .order("id")
      .then((r) => (r.data ?? []) as Category[]),

    // 945 rows — fits in one request, no pagination needed
    supabase
      .from("parts_fitment")
      .select("product_id, vehicle_model_id")
      .then((r) => (r.data ?? []) as Fitment[]),

    supabase
      .from("parts_vehicle_models")
      .select("*", { count: "exact", head: true })
      .then((r) => r.count ?? 0),

    getCurrencyRates(),

    // SSR: first page of products for search engine indexing
    supabase
      .from("parts_products")
      .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new")
      .order("name_ru", { ascending: true })
      .range(0, 23)
      .then((r) => (r.data ?? []) as Product[]),

    supabase
      .from("parts_products")
      .select("*", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
  ]);

  // Step 2: all vehicle models + brand_id for fitment-linked products only (~230 rows)
  // Previously we loaded 50 000 full product rows just for chip computation.
  // Now we load only the ~230 products that appear in fitment — 200× smaller.
  const fitmentProductIds = [...new Set(fitment.map((f) => f.product_id))];

  const [models, fitmentProductBrands, brandCountEntries, catCountEntries] = await Promise.all([
    fetchAllRows<VehicleModel>(
      (from, to) =>
        supabase
          .from("parts_vehicle_models")
          .select("id, brand_id, name_en, name_ko")
          .order("name_en")
          .range(from, to),
      modelCount
    ),

    fitmentProductIds.length > 0
      ? supabase
          .from("parts_products")
          .select("id, brand_id")
          .in("id", fitmentProductIds)
          .then((r) => (r.data ?? []) as { id: number; brand_id: number | null }[])
      : Promise.resolve([] as { id: number; brand_id: number | null }[]),

    // SSR: unfiltered brand counts for sidebar
    Promise.all(
      brands.map(async (b) => {
        const { count } = await supabase
          .from("parts_products")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", b.id);
        return [b.id, count ?? 0] as const;
      })
    ),

    // SSR: unfiltered parent-category counts for sidebar
    Promise.all(
      categories.filter((c) => c.parent_id === null).map(async (c) => {
        const { count } = await supabase
          .from("parts_products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id);
        return [c.id, count ?? 0] as const;
      })
    ),
  ]);

  const initialBrandCounts = Object.fromEntries(brandCountEntries) as Record<number, number>;
  const initialCatCounts = Object.fromEntries(catCountEntries) as Record<number, number>;

  // ── Server-side pre-computation: brandModelChipsMap ───────────────────────
  // Build fitment index: model_id → Set<product_id>
  const fitmentByModelId = new Map<number, Set<number>>();
  fitment.forEach((f) => {
    if (!fitmentByModelId.has(f.vehicle_model_id))
      fitmentByModelId.set(f.vehicle_model_id, new Set());
    fitmentByModelId.get(f.vehicle_model_id)!.add(f.product_id);
  });

  const brandModelChipsMap: Record<string, ModelChip[]> = {};

  brands.forEach((brand) => {
    const bProductIds = new Set(
      fitmentProductBrands
        .filter((p) => p.brand_id === brand.id)
        .map((p) => p.id)
    );

    const bModels = models.filter((m) => m.brand_id === brand.id);
    const nameToIds = new Map<string, number[]>();
    bModels.forEach((m) => {
      if (!nameToIds.has(m.name_en)) nameToIds.set(m.name_en, []);
      nameToIds.get(m.name_en)!.push(m.id);
    });

    const chips: ModelChip[] = [];
    nameToIds.forEach((ids, name) => {
      const pids = new Set<number>();
      ids.forEach((id) =>
        fitmentByModelId.get(id)?.forEach((pid) => pids.add(pid))
      );
      const inBrand = [...pids].filter((pid) => bProductIds.has(pid));
      if (inBrand.length > 0) chips.push({ name, count: inBrand.length });
    });
    brandModelChipsMap[brand.slug] = chips.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  });

  return { brands, categories, brandModelChipsMap, krwToUsd, initialProducts, initialTotal, initialBrandCounts, initialCatCounts };
}

const getCachedCatalogData = unstable_cache(
  fetchCatalogData,
  ["parts-catalog-data"],
  { revalidate: 3600 }
);

export async function PartsCatalog() {
  const data = await getCachedCatalogData();

  return (
    <Suspense
      fallback={
        <section id="catalog" className="py-24 bg-[#F5F7FA]">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
              <div className="h-40 bg-gray-200 rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </section>
      }
    >
      <PartsCatalogClient {...data} />
    </Suspense>
  );
}
