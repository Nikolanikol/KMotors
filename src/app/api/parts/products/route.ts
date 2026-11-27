import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";

const PAGE_SIZE = 24;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

// ── Cached slug lookups (revalidate every hour) ───────────────────────────────
// ⚠️ При ошибке БРОСАЕМ, а не отдаём `data ?? []`: unstable_cache закеширует любое
// возвращённое значение на час, и один сбой базы превратился бы в час «нет брендов».
// Брошенное исключение не кешируется.
const getBrands = unstable_cache(
  async () => {
    const { data, error } = await createServerClient()
      .from("parts_brands")
      .select("id, slug");
    if (error) throw new Error(`parts_brands: ${error.message}`);
    return data ?? [];
  },
  ["parts-brands"],
  { revalidate: 3600 }
);

const getCategories = unstable_cache(
  async () => {
    const { data, error } = await createServerClient()
      .from("parts_categories")
      .select("id, slug, parent_id");
    if (error) throw new Error(`parts_categories: ${error.message}`);
    return data ?? [];
  },
  ["parts-categories"],
  { revalidate: 3600 }
);

/**
 * Текст поиска → слова, безопасные для фильтра `.or()`. Запятая, скобки, кавычки,
 * обратный слеш, `%`, `_`, `*`, `:` и управляющие символы ломают синтаксис PostgREST
 * или работают как маска ilike — заменяем пробелом. Слов не больше 6, каждое до 40 знаков.
 */
function searchWords(q: string): string[] {
  return q
    .replace(/[,()"'\\%_*:\u0000-\u001f\u007f]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((w) => w.slice(0, 40));
}

/** Целое в [min, max] или fallback; нечисло и дроби в запрос не попадают. */
function intParam(raw: string | null, min: number, max: number, fallback: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Цена: конечное неотрицательное число, иначе null (фильтр не применяется). */
function priceParam(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

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
    // Part numbers are stored uppercase, without spaces or hyphens (e.g.
    // "2630035505"), but users type the catalog format "26300-35505".
    // Ищем по словам: каждое слово — отдельное условие (название или артикул),
    // слова связаны через AND. В артикульном сравнении дефисы убираем; ilike
    // регистр сам не различает.
    const words      = searchWords(sp.get("q") ?? "");
    const minPrice   = priceParam(sp.get("min"));
    const maxPrice   = priceParam(sp.get("max"));
    const sort       = sp.get("sort")   ?? "default";
    const page       = intParam(sp.get("page"), 1, 1000, 1);
    const limit      = intParam(sp.get("limit"), 1, PAGE_SIZE, PAGE_SIZE);

    const hasSearch = !!(words.length || minPrice || maxPrice);
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
      const { data: modelRows, error: modelErr } = await supabase
        .from("parts_vehicle_models")
        .select("id")
        .eq("name_en", modelName)
        .eq("brand_id", brandIds[0]);
      if (modelErr) throw new Error(`parts_vehicle_models: ${modelErr.message}`);

      const modelIds = modelRows?.map((m) => m.id) ?? [];

      if (modelIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {}, brandCounts: {} });
      }

      const { data: fitmentRows, error: fitmentErr } = await supabase
        .from("parts_fitment")
        .select("product_id")
        .in("vehicle_model_id", modelIds);
      if (fitmentErr) throw new Error(`parts_fitment: ${fitmentErr.message}`);

      modelProductIds = [...new Set(fitmentRows?.map((f) => f.product_id) ?? [])];

      if (modelProductIds.length === 0) {
        return NextResponse.json({ products: [], total: 0, catCounts: {}, subCounts: {}, brandCounts: {} });
      }
    }

    // ── Filter builders ───────────────────────────────────────────────────────
    // "base" = brand + model + price + search (NO cat/sub)
    // Поиск: по одному .or() на слово. postgrest-js для каждого вызова делает
    // searchParams.append("or", …), а PostgREST склеивает все параметры через AND.
    function withSearch(query: AnyQuery): AnyQuery {
      for (const w of words) {
        const wPart = w.replace(/-+/g, "");
        query = query.or(
          `part_number.ilike.%${wPart || w}%,name_ru.ilike.%${w}%,name_en.ilike.%${w}%`
        );
      }
      return query;
    }

    function withBaseFilters(query: AnyQuery): AnyQuery {
      if (brandIds.length > 0) query = query.in("brand_id", brandIds);
      if (modelProductIds)     query = query.in("id", modelProductIds);
      if (minPrice !== null)   query = query.gte("price_krw", minPrice);
      if (maxPrice !== null)   query = query.lte("price_krw", maxPrice);
      return withSearch(query);
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
      query = withSearch(query);
      if (catIds.length > 0) query = query.in("category_id", catIds);
      if (subId !== null)     query = query.eq("subcategory_id", subId);
      return query;
    }

    // ── Step 3: queries in parallel ──────────────────────────────────────────
    const from = (page - 1) * limit;

    // Main product query
    let productQuery = withFullFilters(
      supabase.from("parts_products").select(
        "id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new"
      )
    );
    switch (sort) {
      case "price_asc":  productQuery = productQuery.order("price_krw", { ascending: true });  break;
      case "price_desc": productQuery = productQuery.order("price_krw", { ascending: false }); break;
      case "name_asc":   productQuery = productQuery.order("name_ru",   { ascending: true });  break;
      default:           productQuery = productQuery.order("name_ru",   { ascending: true });  break;
    }
    // Второй ключ по уникальному id: без него строки с равным ключом сортировки
    // «гуляют» между страницами .range() (пропуски и дубли).
    productQuery = productQuery.order("id", { ascending: true });
    productQuery = productQuery.range(from, from + limit - 1);

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
            const { count, error } = await withFiltersNoBrand(
              supabase.from("parts_products").select("*", { count: "exact", head: true })
            ).eq("brand_id", b.id);
            if (error) console.error("[/api/parts/products] brandCount", b.id, error.message);
            return [b.id, count ?? 0] as const;
          })
        ),

        // catCounts: one HEAD per parent category, base filters (no cat/sub)
        Promise.all(
          catsData.filter((c) => c.parent_id === null).map(async (c) => {
            const { count, error } = await withBaseFilters(
              supabase.from("parts_products").select("*", { count: "exact", head: true })
            ).eq("category_id", c.id);
            if (error) console.error("[/api/parts/products] catCount", c.id, error.message);
            return [c.id, count ?? 0] as const;
          })
        ),

        // subCounts: only when exactly 1 parent category selected
        catIds.length === 1
          ? Promise.all(
              catsData.filter((c) => c.parent_id === catIds[0]).map(async (s) => {
                const { count, error } = await withBaseFilters(
                  supabase.from("parts_products").select("*", { count: "exact", head: true })
                ).eq("subcategory_id", s.id);
                if (error) console.error("[/api/parts/products] subCount", s.id, error.message);
                return [s.id, count ?? 0] as const;
              })
            )
          : Promise.resolve([]),
      ]);

    // Сбой основного запроса или счётчика — это сбой, а не «пусто»: пустой успех с
    // кеш-заголовками закрепил бы ошибку в CDN, а клиент показал бы «ничего не найдено».
    if (productsRes.error || countRes.error) {
      console.error(
        "[/api/parts/products] query failed:",
        productsRes.error?.message,
        countRes.error?.message
      );
      return NextResponse.json({ error: "Catalog temporarily unavailable" }, { status: 500, headers: NO_STORE });
    }

    const brandCounts = Object.fromEntries(brandCountEntries) as Record<number, number>;
    const catCounts = Object.fromEntries(catCountEntries) as Record<number, number>;
    const subCounts = Object.fromEntries(subCountEntries) as Record<number, number>;

    return NextResponse.json(
      {
        products: (productsRes.data ?? []).map(withCleanImage),
        total: countRes.count ?? 0,
        catCounts, subCounts, brandCounts,
      },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    console.error("[/api/parts/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE });
  }
}
