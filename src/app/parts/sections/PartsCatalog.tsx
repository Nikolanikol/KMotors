import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";
import { getFx } from "@/lib/fx";
import { getIndexableCategorySlugs } from "@/lib/partsCategories";
import { PartsCatalogClient } from "./PartsCatalogClient";
import type { Brand, Category, VehicleModel, ModelChip, Product } from "./PartsCatalogClient";

type Fitment = { product_id: number; vehicle_model_id: number };

// ─── Parallel batch fetching ──────────────────────────────────────────────────
type DbError = { message: string } | null;

/**
 * Результат запроса или исключение. fetchCatalogData живёт внутри unstable_cache, а тот
 * кеширует любое возвращённое значение на час: `data ?? []` при сбое базы закрепил бы
 * пустой каталог на час. Брошенное исключение не кешируется (ISR оставит прежнюю страницу).
 */
function must<T>(label: string, r: { data: T | null; error: DbError }): T {
  if (r.error) throw new Error(`[PartsCatalog] ${label}: ${r.error.message}`);
  return r.data ?? ([] as unknown as T);
}

function mustCount(label: string, r: { count: number | null; error: DbError }): number {
  if (r.error) throw new Error(`[PartsCatalog] ${label}: ${r.error.message}`);
  return r.count ?? 0;
}

async function fetchAllRows<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: DbError }>,
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
  return results.flatMap((r) => must("batch", r));
}

async function fetchCatalogData() {
  const supabase = createServerClient();

  // Step 1: small tables + model count + exchange rate + initial products — all in parallel
  const [brands, categories, fitment, modelCount, { krwToUsd }, initialProducts, initialTotal] = await Promise.all([
    supabase.from("parts_brands").select("id, name, slug").order("name").order("id")
      .then((r) => must("parts_brands", r) as Brand[]),

    supabase
      .from("parts_categories")
      .select("id, name_ru, name_en, slug, parent_id")
      .order("sort_order", { nullsFirst: false })
      .order("id")
      .then((r) => must("parts_categories", r) as Category[]),

    // 945 rows — fits in one request, no pagination needed
    supabase
      .from("parts_fitment")
      .select("product_id, vehicle_model_id")
      .then((r) => must("parts_fitment", r) as Fitment[]),

    supabase
      .from("parts_vehicle_models")
      .select("*", { count: "exact", head: true })
      .then((r) => mustCount("parts_vehicle_models count", r)),

    getFx("market"),

    // SSR: first page of products for search engine indexing
    supabase
      .from("parts_products")
      .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new")
      .order("name_ru", { ascending: true })
      .order("id", { ascending: true })
      .range(0, 23)
      .then((r) => must("parts_products page 1", r).map(withCleanImage) as Product[]),

    supabase
      .from("parts_products")
      .select("*", { count: "exact", head: true })
      .then((r) => mustCount("parts_products count", r)),
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
          .order("id")
          .range(from, to),
      modelCount
    ),

    fitmentProductIds.length > 0
      ? supabase
          .from("parts_products")
          .select("id, brand_id")
          .in("id", fitmentProductIds)
          .then((r) => must("fitment products", r) as { id: number; brand_id: number | null }[])
      : Promise.resolve([] as { id: number; brand_id: number | null }[]),

    // SSR: unfiltered brand counts for sidebar
    Promise.all(
      brands.map(async (b) => {
        const r = await supabase
          .from("parts_products")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", b.id);
        return [b.id, mustCount(`brand ${b.id} count`, r)] as const;
      })
    ),

    // SSR: unfiltered parent-category counts for sidebar
    Promise.all(
      categories.filter((c) => c.parent_id === null).map(async (c) => {
        const r = await supabase
          .from("parts_products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id);
        return [c.id, mustCount(`category ${c.id} count`, r)] as const;
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

  // Категории для облака в сайдбаре: ровно тот же список, что уходит в
  // sitemap, — иначе в навигации всплывали бы пустые ветки («Зеркала» под
  // «Кузов» с нулём товаров) и внутренние вёдра.
  // Без `.catch(() => [])`: пустой список при сбое попал бы в кеш на час вместе со всем остальным.
  const indexableCategorySlugs = await getIndexableCategorySlugs();

  return { brands, categories, brandModelChipsMap, krwToUsd, initialProducts, initialTotal, initialBrandCounts, initialCatCounts, indexableCategorySlugs };
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
