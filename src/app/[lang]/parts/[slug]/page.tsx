import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { ProductDetailClient } from "@/app/parts/sections/ProductDetailClient";
import { parsePartSlug, generatePartSlug } from "@/utils/partSlug";
import type {
  ProductDetail,
  CompatibleBrand,
  ProductLogistics,
} from "@/app/parts/sections/ProductDetailClient";

// Страницы продуктов рендерятся по требованию и кэшируются навсегда.
// generateStaticParams убран: 50k × 5 langs = 250k страниц при сборке — неприемлемо.
// dynamicParams = true (дефолт) — неизвестные [slug] рендерятся при первом визите.
export const revalidate = false;
export const dynamicParams = true;

const BRAND_ORDER: Record<string, number> = {
  hyundai: 0,
  kia: 1,
  genesis: 2,
};

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchProduct(slug: string) {
  const { partNumber, productId } = parsePartSlug(slug);

  const supabase = createServerClient();

  let query = supabase
    .from("parts_products")
    .select(
      "id, product_no, part_number, name_ru, name_en, name_ko, official_name_ko, manufacturer, price_krw, is_new, image_url, detail_url, category_id, subcategory_id, weight_kg"
    );

  // Ищем по part_number или по ID
  if (productId !== null) {
    query = query.eq("id", productId);
  } else if (partNumber) {
    query = query.eq("part_number", partNumber);
  } else {
    return null;
  }

  const { data: product, error } = await query.single();

  if (error || !product) return null;

  // Теперь ищем fitment по product.id
  const { data: fitmentRows } = await supabase
    .from("parts_fitment")
    .select("vehicle_model_id")
    .eq("product_id", product.id);

  const modelIds = (fitmentRows ?? []).map((f) => f.vehicle_model_id);
  const catIds = [product.category_id, product.subcategory_id].filter(
    (x): x is number => !!x
  );

  // Fetch logistics: subcategory_id (L2/L3) has priority over category_id (L1)
  const logisticsCatId = product.subcategory_id ?? product.category_id;

  const logisticsResult = logisticsCatId
    ? await supabase
        .from("v_category_logistics")
        .select("weight_avg_kg, packed_weight_kg, vol_weight_kg, billed_weight_kg, ship_method, size_formula_cm, logistics_notes, length_cm, width_cm, height_cm, name_ru")
        .eq("id", logisticsCatId)
        .single()
    : null;

  const catLogistics = logisticsResult?.data ?? null;

  // Per-product weight (from price interpolation) overrides category avg
  const logistics: ProductLogistics | null = catLogistics
    ? {
        ...catLogistics,
        weight_avg_kg: product.weight_kg ?? catLogistics.weight_avg_kg,
      }
    : null;

  // Fetch models, brands, categories in parallel
  const [modelsResult, brandsResult, catsResult] = await Promise.all([
    modelIds.length > 0
      ? supabase
          .from("parts_vehicle_models")
          .select("id, brand_id, name_en, name_ko")
          .in("id", modelIds)
          .order("name_en")
      : Promise.resolve({ data: [] as { id: number; brand_id: number; name_en: string; name_ko: string | null }[] }),
    supabase.from("parts_brands").select("id, name, slug"),
    catIds.length > 0
      ? supabase
          .from("parts_categories")
          .select("id, name_ru, name_en, slug, parent_id")
          .in("id", catIds)
      : Promise.resolve({ data: [] as { id: number; name_ru: string; name_en: string; slug: string; parent_id: number | null }[] }),
  ]);

  const models = modelsResult.data ?? [];
  const brands = brandsResult.data ?? [];
  const cats = catsResult.data ?? [];

  // Build compatibleBrands: group models by brand, sort Hyundai→Kia→Genesis
  const brandMap: Record<number, CompatibleBrand> = {};
  brands.forEach((b) => {
    brandMap[b.id] = { id: b.id, name: b.name, slug: b.slug, models: [] };
  });
  models.forEach((m) => {
    if (brandMap[m.brand_id]) {
      brandMap[m.brand_id].models.push({
        id: m.id,
        name_en: m.name_en,
        name_ko: m.name_ko,
      });
    }
  });
  const compatibleBrands = Object.values(brandMap)
    .filter((b) => b.models.length > 0)
    .sort(
      (a, b) => (BRAND_ORDER[a.slug] ?? 99) - (BRAND_ORDER[b.slug] ?? 99)
    );

  // Resolve category / subcategory names
  const catInfo = cats.find(
    (c) => c.id === product.category_id && c.parent_id === null
  );
  const subInfo = cats.find((c) => c.id === product.subcategory_id);

  const categoryName = catInfo
    ? { ru: catInfo.name_ru, en: catInfo.name_en, slug: catInfo.slug }
    : null;
  const subcategoryName = subInfo
    ? { ru: subInfo.name_ru, en: subInfo.name_en }
    : null;

  return {
    product: product as ProductDetail,
    categoryName,
    subcategoryName,
    compatibleBrands,
    logistics,
    logisticsCatId: logisticsCatId ?? null,
  };
}

const getCachedProduct = unstable_cache(
  (slug: string) => fetchProduct(slug),
  ["parts-product"],
  { revalidate: 3600 }
);

// ─── Metadata ─────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

// Заголовки и описания для каждого языка
// Truncate name so title stays under 65 chars (Bing/Google recommendation)
// Format: "{name} — {partNumber} | K-Axis" → max ~52 chars for name+pn
function truncateName(name: string, pn: string, maxTotal = 50): string {
  const suffix = pn ? ` — ${pn}` : "";
  const budget = maxTotal - suffix.length;
  if (name.length <= budget) return name;
  return name.slice(0, budget - 1).trimEnd() + "…";
}

function buildMeta(
  lang: string,
  p: { part_number: string | null; name_ru: string; name_en: string; name_ko: string | null }
) {
  const ru = truncateName(p.name_ru || p.name_en || "", p.part_number || "");
  const en = truncateName(p.name_en || p.name_ru || "", p.part_number || "");
  const ko = truncateName(p.name_ko || p.name_en || p.name_ru || "", p.part_number || "");
  const pn = p.part_number || "";

  const map: Record<string, { title: string; description: string }> = {
    ru: {
      title: pn ? `${ru} — ${pn}` : ru,
      description: pn
        ? `Оригинальная запчасть Hyundai Mobis — ${ru}. Артикул: ${pn}. Прямые поставки из Кореи, гарантия качества.`
        : `Оригинальная запчасть Hyundai Mobis — ${ru}. Прямые поставки из Кореи, гарантия качества.`,
    },
    en: {
      title: pn ? `${en} — ${pn}` : en,
      description: pn
        ? `Original Hyundai Mobis spare part — ${en}. Part number: ${pn}. Direct supply from Korea, quality guarantee.`
        : `Original Hyundai Mobis spare part — ${en}. Direct supply from Korea, quality guarantee.`,
    },
    ko: {
      title: pn ? `${ko} — ${pn}` : ko,
      description: pn
        ? `현대모비스 정품 부품 — ${ko}. 부품 번호: ${pn}. 한국에서 직접 공급, 품질 보증.`
        : `현대모비스 정품 부품 — ${ko}. 한국에서 직접 공급, 품질 보증.`,
    },
    ka: {
      title: pn ? `${en} — ${pn}` : en,
      description: pn
        ? `Hyundai Mobis-ის ორიგინალი სათადარიგო ნაწილი — ${en}. ნომერი: ${pn}. პირდაპირი მიწოდება კორეიდან.`
        : `Hyundai Mobis-ის ორიგინალი სათადარიგო ნაწილი — ${en}. პირდაპირი მიწოდება კორეიდან.`,
    },
    ar: {
      title: pn ? `${en} — ${pn}` : en,
      description: pn
        ? `قطعة غيار أصلية من Hyundai Mobis — ${en}. رقم القطعة: ${pn}. توريد مباشر من كوريا.`
        : `قطعة غيار أصلية من Hyundai Mobis — ${en}. توريد مباشر من كوريا.`,
    },
  };
  return map[lang] ?? map.ru;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;

  const data = await getCachedProduct(slug);
  if (!data) return {};

  const p = data.product;
  const { title, description } = buildMeta(lang, p);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

  // Генерируем правильный slug для каждого языка
  const ru = p.name_ru || p.name_en || p.name_ko;
  const en = p.name_en || p.name_ru || p.name_ko;
  const ko = p.name_ko || p.name_en || p.name_ru;

  const slugRu = generatePartSlug(p.part_number, ru, "ru", p.id);
  const slugEn = generatePartSlug(p.part_number, en, "en", p.id);
  const slugKo = generatePartSlug(p.part_number, ko, "ko", p.id);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE}/${lang}/parts/${slug}`,
    },
    alternates: {
      canonical: `${BASE}/${lang}/parts/${slug}`,
      languages: {
        ru: `${BASE}/ru/parts/${slugRu}`,
        en: `${BASE}/en/parts/${slugEn}`,
        ko: `${BASE}/ko/parts/${slugKo}`,
        ka: `${BASE}/ka/parts/${slug}`,
        ar: `${BASE}/ar/parts/${slug}`,
        "x-default": `${BASE}/ru/parts/${slugRu}`,
      },
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: Props) {
  const { lang, slug } = await params;

  const [data, { krwToUsd }] = await Promise.all([
    getCachedProduct(slug),
    getCurrencyRates(),
  ]);
  if (!data) notFound();

  // ── Product JSON-LD (Google Rich Results) ──────────────────────────────────
  const { product } = data;
  const priceUsd = Math.ceil(product.price_krw * krwToUsd * 1.23);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;
  const productName =
    lang === "ko"
      ? product.name_ko || product.name_en || product.name_ru
      : lang === "ru"
      ? product.name_ru || product.name_en || product.name_ko
      : product.name_en || product.name_ru || product.name_ko;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    sku: product.part_number,
    mpn: product.part_number,
    ...(product.image_url && { image: [product.image_url] }),
    ...(product.official_name_ko && { alternateName: product.official_name_ko }),
    brand: {
      "@type": "Brand",
      name: product.manufacturer || "Hyundai Mobis",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE}/${lang}/parts/${slug}`,
      priceCurrency: "USD",
      price: priceUsd,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "K-Axis",
        url: BASE,
      },
    },
    ...(data.categoryName && {
      category: lang === "ru" ? data.categoryName.ru : data.categoryName.en,
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${BASE}/${lang}/` },
      { "@type": "ListItem", position: 2, name: lang === "ru" ? "Запчасти" : "Parts", item: `${BASE}/${lang}/parts` },
      ...(data.categoryName
        ? [{ "@type": "ListItem", position: 3, name: lang === "ru" ? data.categoryName.ru : data.categoryName.en, item: `${BASE}/${lang}/parts?cat=${data.categoryName.slug}` }]
        : []),
      { "@type": "ListItem", position: data.categoryName ? 4 : 3, name: productName, item: `${BASE}/${lang}/parts/${slug}` },
    ],
  };

  // ── Auto-generated description ────────────────────────────────────────────
  const brandNames = data.compatibleBrands.map((b) => b.name).join(", ");
  const catRu = data.categoryName?.ru ?? "";
  const catEn = data.categoryName?.en ?? "";

  const descriptionMap: Record<string, string> = {
    ru: [
      `${product.name_ru || product.name_en || product.name_ko}${product.part_number ? ` (артикул ${product.part_number})` : ""} — оригинальная запчасть Hyundai Mobis.`,
      catRu ? `Категория: ${catRu}.` : "",
      brandNames ? `Подходит для автомобилей ${brandNames}.` : "",
      `Прямые поставки из Южной Кореи. Доставка по всему миру. Гарантия качества Hyundai Mobis.`,
    ].filter(Boolean).join(" "),

    en: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (part number ${product.part_number})` : ""} — genuine Hyundai Mobis spare part.`,
      catEn ? `Category: ${catEn}.` : "",
      brandNames ? `Compatible with ${brandNames} vehicles.` : "",
      `Direct supply from South Korea. Worldwide delivery. Hyundai Mobis quality guarantee.`,
    ].filter(Boolean).join(" "),

    ko: [
      `${product.name_ko || product.name_en || product.name_ru || ""}${product.part_number ? ` (부품 번호 ${product.part_number})` : ""} — 현대모비스 정품 부품입니다.`,
      catEn ? `카테고리: ${catEn}.` : "",
      brandNames ? `${brandNames} 차량에 적합합니다.` : "",
      `한국에서 직접 공급. 전 세계 배송. 현대모비스 품질 보증.`,
    ].filter(Boolean).join(" "),

    ka: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (ნომერი ${product.part_number})` : ""} — Hyundai Mobis-ის ორიგინალი სათადარიგო ნაწილი.`,
      catEn ? `კატეგორია: ${catEn}.` : "",
      brandNames ? `შესაფერისია ${brandNames} მანქანებისთვის.` : "",
      `პირდაპირი მიწოდება სამხრეთ კორეიდან. მიტანა მსოფლიოს ნებისმიერ ქვეყანაში. Hyundai Mobis-ის ხარისხის გარანტია.`,
    ].filter(Boolean).join(" "),

    ar: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (رقم القطعة ${product.part_number})` : ""} — قطعة غيار أصلية من Hyundai Mobis.`,
      catEn ? `الفئة: ${catEn}.` : "",
      brandNames ? `متوافقة مع سيارات ${brandNames}.` : "",
      `توريد مباشر من كوريا الجنوبية. توصيل إلى جميع أنحاء العالم. ضمان جودة Hyundai Mobis.`,
    ].filter(Boolean).join(" "),
  };

  const description = descriptionMap[lang] ?? descriptionMap.ru;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailClient {...data} lang={lang} krwToUsd={krwToUsd} description={description} logistics={data.logistics} />
    </>
  );
}
