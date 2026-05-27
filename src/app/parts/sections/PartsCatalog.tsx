import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase";
import { PartsCatalogClient } from "./PartsCatalogClient";
import type { Brand, Category, Product, VehicleModel, Fitment } from "./PartsCatalogClient";

async function fetchCatalogData() {
  const supabase = createServerClient();

  const [
    { data: brands },
    { data: categories },
    { data: products },
    { data: fitment },
    { data: models },
  ] = await Promise.all([
    supabase.from("parts_brands").select("id, name, slug").order("name"),

    supabase
      .from("parts_categories")
      .select("id, name_ru, name_en, slug, parent_id")
      .order("sort_order", { nullsFirst: false })
      .order("id"),

    supabase
      .from("parts_products")
      .select(
        "id, name_ru, name_en, part_number, price_krw, category_id, subcategory_id, image_url, is_new"
      )
      .order("name_ru"),

    supabase
      .from("parts_fitment")
      .select("product_id, vehicle_model_id"),

    supabase
      .from("parts_vehicle_models")
      .select("id, brand_id, name_en, name_ko")
      .order("name_en"),
  ]);

  // Build product → compatible models map
  const productModelsMap: Record<string, VehicleModel[]> = {};
  if (fitment && models) {
    const modelById: Record<number, VehicleModel> = {};
    (models as VehicleModel[]).forEach((m) => {
      modelById[m.id] = m;
    });
    (fitment as Fitment[]).forEach((f) => {
      const key = String(f.product_id);
      if (!productModelsMap[key]) productModelsMap[key] = [];
      const m = modelById[f.vehicle_model_id];
      if (m && !productModelsMap[key].find((x) => x.id === m.id)) {
        productModelsMap[key].push(m);
      }
    });
  }

  return {
    brands: (brands as Brand[]) ?? [],
    categories: (categories as Category[]) ?? [],
    products: (products as Product[]) ?? [],
    models: (models as VehicleModel[]) ?? [],
    fitment: (fitment as Fitment[]) ?? [],
    productModelsMap,
  };
}

export async function PartsCatalog() {
  const data = await fetchCatalogData();

  return (
    <Suspense
      fallback={
        <section id="catalog" className="py-24 bg-[#F5F7FA]">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
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
