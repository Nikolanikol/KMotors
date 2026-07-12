import { notFound, permanentRedirect } from "next/navigation";
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
import type { Product } from "@/app/parts/sections/PartsCatalogClient";
import { makeAlternates } from "@/lib/seo";

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
      "id, product_no, part_number, name_ru, name_en, name_ko, official_name_ko, manufacturer, price_krw, is_new, image_url, detail_url, category_id, subcategory_id, weight_kg, billed_weight_kg, ship_method, seo_title_ru, seo_title_en, seo_desc_ru, seo_desc_en, seo_body_ru, seo_body_en, cross_refs"
    );

  // Ищем по part_number или по ID
  if (productId !== null) {
    query = query.eq("id", productId);
  } else if (partNumber) {
    query = query.eq("part_number", partNumber);
  } else {
    return null;
  }

  // Не .single(): при дубле артикула в базе он падает с ошибкой,
  // а страница должна открыть первый товар, а не отдать 404
  const { data: rows, error } = await query.limit(1);
  const product = rows?.[0];

  if (error || !product) return null;

  // Совместимость из vehicles/part_vehicles (213k связей, поколения с годами)
  const { data: pvRows } = await supabase
    .from("part_vehicles")
    .select("vehicles(id, name_en, brand, year_from, year_to, open_ended, slug, parts_count)")
    .eq("part_id", product.id);

  const compatVehicles = (pvRows ?? [])
    .map((row) => row.vehicles as unknown as {
      id: number; name_en: string; brand: string; year_from: string | null;
      year_to: string | null; open_ended: boolean; slug: string; parts_count: number;
    } | null)
    .filter((v): v is NonNullable<typeof v> => !!v);

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

  // Per-product fields override category-level logistics
  const logistics: ProductLogistics | null = catLogistics
    ? {
        ...catLogistics,
        weight_avg_kg: product.weight_kg ?? catLogistics.weight_avg_kg,
        billed_weight_kg: product.billed_weight_kg ?? catLogistics.billed_weight_kg,
        ship_method: product.ship_method ?? catLogistics.ship_method,
      }
    : product.billed_weight_kg
      ? {
          weight_avg_kg: product.weight_kg,
          packed_weight_kg: null,
          vol_weight_kg: null,
          billed_weight_kg: product.billed_weight_kg,
          ship_method: product.ship_method as ProductLogistics["ship_method"],
          size_formula_cm: null,
          logistics_notes: null,
          length_cm: null,
          width_cm: null,
          height_cm: null,
          name_ru: null,
        }
      : null;

  const catsResult = catIds.length > 0
    ? await supabase
        .from("parts_categories")
        .select("id, name_ru, name_en, slug, parent_id")
        .in("id", catIds)
    : { data: [] as { id: number; name_ru: string; name_en: string; slug: string; parent_id: number | null }[] };
  const cats = catsResult.data ?? [];

  // Build compatibleBrands from vehicle generations, grouped by brand.
  const BRAND_META: Record<string, { id: number; name: string }> = {
    hyundai: { id: 1, name: "Hyundai" },
    kia: { id: 2, name: "Kia" },
    genesis: { id: 3, name: "Genesis" },
    ssangyong: { id: 4, name: "SsangYong" },
    audi: { id: 5, name: "Audi" },
  };
  const yearsOf = (v: { year_from: string | null; year_to: string | null; open_ended: boolean }) => {
    const yf = v.year_from ? String(v.year_from).split(".")[0] : "";
    const yt = v.year_to ? String(v.year_to).split(".")[0] : v.open_ended ? "…" : "";
    return yf || yt ? `${yf}${yt ? "–" + yt : ""}` : "";
  };
  const brandMap: Record<string, CompatibleBrand> = {};
  for (const v of compatVehicles) {
    const meta = BRAND_META[v.brand] ?? { id: 99, name: v.brand };
    if (!brandMap[v.brand]) brandMap[v.brand] = { id: meta.id, name: meta.name, slug: v.brand, models: [] };
    brandMap[v.brand].models.push({
      id: v.id, name_en: v.name_en, name_ko: null,
      years: yearsOf(v), brand: v.brand, vehicleSlug: v.slug,
    });
  }
  const compatibleBrands = Object.values(brandMap)
    .map((b) => ({
      ...b,
      models: b.models.sort((a, z) => (z.years || "").localeCompare(a.years || "")),
    }))
    .sort((a, b) => (BRAND_ORDER[a.slug] ?? 99) - (BRAND_ORDER[b.slug] ?? 99));

  // Similar parts: same category, from the vehicle this part fits most broadly
  let similarProducts: Product[] = [];
  if (compatVehicles.length && product.category_id) {
    const topVehicle = [...compatVehicles].sort((a, b) => b.parts_count - a.parts_count)[0];
    const { data: sameVehicle } = await supabase
      .from("part_vehicles").select("part_id").eq("vehicle_id", topVehicle.id).neq("part_id", product.id).limit(400);
    const ids = (sameVehicle ?? []).map((r) => r.part_id);
    if (ids.length) {
      const { data: sim } = await supabase
        .from("parts_products")
        .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, is_new")
        .in("id", ids).eq("category_id", product.category_id).limit(8);
      similarProducts = (sim ?? []) as Product[];
    }
  }

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
    similarProducts,
    logistics,
    logisticsCatId: logisticsCatId ?? null,
  };
}

const getCachedProduct = unstable_cache(
  (slug: string) => fetchProduct(slug),
  ["parts-product"],
  { revalidate: 3600, tags: ["parts-product"] }
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
  p: {
    part_number: string | null; name_ru: string; name_en: string; name_ko: string | null;
    seo_title_ru?: string | null; seo_title_en?: string | null;
    seo_desc_ru?: string | null; seo_desc_en?: string | null;
  }
) {
  const ru = truncateName(p.name_ru || p.name_en || p.name_ko || "Запчасть", p.part_number || "");
  const en = truncateName(p.name_en || p.name_ru || p.name_ko || "Part", p.part_number || "");
  const ko = truncateName(p.name_ko || p.name_en || p.name_ru || "부품", p.part_number || "");
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
  // Override шаблона утверждённым SEO-контентом (ru/en — приоритетные языки)
  const base = map[lang] ?? map.ru;
  if (lang === "ru" && p.seo_title_ru) {
    return { title: p.seo_title_ru, description: p.seo_desc_ru || base.description };
  }
  if (lang === "en" && p.seo_title_en) {
    return { title: p.seo_title_en, description: p.seo_desc_en || base.description };
  }
  return base;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;

  const data = await getCachedProduct(slug);
  if (!data) return {};

  const p = data.product;
  const { title, description } = buildMeta(lang, p);
  // Canonical всегда указывает на чистый URL по артикулу — независимо от того,
  // по какому slug-варианту открыли страницу
  const canonicalSlug = generatePartSlug(p.part_number, null, "ru", p.id);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE}/${lang}/parts/${canonicalSlug}`,
    },
    alternates: makeAlternates(lang, `/parts/${canonicalSlug}`),
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

  const { product } = data;

  // 301 со старых URL "PN--name" (и любых slug-вариантов) на канонический "PN".
  // Сравниваем и декодированный slug, чтобы не зациклить редирект на кодированных символах.
  const canonicalSlug = generatePartSlug(product.part_number, null, "ru", product.id);
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}
  if (slug !== canonicalSlug && decodedSlug !== canonicalSlug) {
    permanentRedirect(`/${lang}/parts/${canonicalSlug}`);
  }

  // ── Product JSON-LD (Google Rich Results) ──────────────────────────────────
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
      url: `${BASE}/${lang}/parts/${canonicalSlug}`,
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
      { "@type": "ListItem", position: data.categoryName ? 4 : 3, name: productName, item: `${BASE}/${lang}/parts/${canonicalSlug}` },
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

  // Утверждённый seo_body (ru/en) заменяет авто-шаблон описания
  const seoBody = lang === "ru" ? product.seo_body_ru : lang === "en" ? product.seo_body_en : null;
  const description = seoBody || descriptionMap[lang] || descriptionMap.ru;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailClient {...data} lang={lang} krwToUsd={krwToUsd} description={description} logistics={data.logistics} />
    </>
  );
}
