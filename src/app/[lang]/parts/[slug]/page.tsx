import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { ProductDetailClient } from "@/app/parts/sections/ProductDetailClient";
import { parsePartSlug, generatePartSlug } from "@/utils/partSlug";
import type {
  ProductDetail,
  CompatibleBrand,
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
      "id, product_no, part_number, name_ru, name_en, name_ko, official_name_ko, manufacturer, price_krw, is_new, image_url, detail_url, category_id, subcategory_id"
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
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

// Заголовки и описания для каждого языка
function buildMeta(
  lang: string,
  p: { part_number: string; name_ru: string; name_en: string; name_ko: string | null }
) {
  const ru = p.name_ru;
  const en = p.name_en || p.name_ru;
  const ko = p.name_ko || p.name_en || p.name_ru;
  const pn = p.part_number;

  const map: Record<string, { title: string; description: string }> = {
    ru: {
      title: `${ru} — ${pn} | K-Axis`,
      description: `Оригинальная запчасть Hyundai Mobis — ${ru}. Артикул: ${pn}. Прямые поставки из Кореи, гарантия качества.`,
    },
    en: {
      title: `${en} — ${pn} | K-Axis`,
      description: `Original Hyundai Mobis spare part — ${en}. Part number: ${pn}. Direct supply from Korea, quality guarantee.`,
    },
    ko: {
      title: `${ko} — ${pn} | K-Axis`,
      description: `현대모비스 정품 부품 — ${ko}. 부품 번호: ${pn}. 한국에서 직접 공급, 품질 보증.`,
    },
    ka: {
      title: `${en} — ${pn} | K-Axis`,
      description: `Hyundai Mobis-ის ორიგინალი სათადარიგო ნაწილი — ${en}. ნომერი: ${pn}. პირდაპირი მიწოდება კორეიდან.`,
    },
    ar: {
      title: `${en} — ${pn} | K-Axis`,
      description: `قطعة غيار أصلية من Hyundai Mobis — ${en}. رقم القطعة: ${pn}. توريد مباشر من كوريا.`,
    },
  };
  return map[lang] ?? map.ru;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const { partNumber, productId } = parsePartSlug(slug);

  const supabase = createServerClient();

  let query = supabase
    .from("parts_products")
    .select("id, part_number, name_ru, name_en, name_ko, image_url");

  if (productId !== null) {
    query = query.eq("id", productId);
  } else if (partNumber) {
    query = query.eq("part_number", partNumber);
  } else {
    return {};
  }

  const { data: p } = await query.single();

  if (!p) return {};

  const { title, description } = buildMeta(lang, p);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

  // Генерируем правильный slug для каждого языка
  const ru = p.name_ru;
  const en = p.name_en || p.name_ru;
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
      images: p.image_url ? [{ url: p.image_url, width: 800, height: 600, alt: title }] : [],
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
    fetchProduct(slug),
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
      ? product.name_ru
      : product.name_en || product.name_ru;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailClient {...data} lang={lang} krwToUsd={krwToUsd} />
    </>
  );
}
