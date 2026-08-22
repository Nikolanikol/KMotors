import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";
import { ProductDetailClient } from "@/app/parts/sections/ProductDetailClient";
import { parsePartSlug, generatePartSlug } from "@/utils/partSlug";
import type {
  ProductDetail,
  CompatibleBrand,
  ProductLogistics,
} from "@/app/parts/sections/ProductDetailClient";
import type { Product } from "@/app/parts/sections/PartsCatalogClient";
import { makeAlternates } from "@/lib/seo";
import SectionDictionary from "@/components/I18nProvider/SectionDictionary";

// Страницы продуктов рендерятся по требованию: generateStaticParams убран,
// 50k × 4 langs при сборке неприемлемо. dynamicParams = true (дефолт) —
// неизвестные [slug] рендерятся при первом визите. Сборку это и обеспечивает;
// revalidate тут отдельная ручка и на объём сборки не влияет.
//
// 24 часа, а не false: цена в HTML считается от krwToUsd (getCurrencyRates,
// кеш 24ч). При revalidate = false страница не перерендеривается никогда, и
// этот кеш курса не может сработать — курс замерзает на момент первого визита,
// а /api/parts/checkout (POST, не кешируется) считает по свежему. Витрина и
// чекаут расходятся тем сильнее, чем дольше страница лежит. TTL совпадает с
// кешем самого курса: чаще смысла нет, реже — снова копим расхождение.
export const revalidate = 86400;
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
      "id, product_no, part_number, name_ru, name_en, name_ko, official_name_ko, manufacturer, price_krw, is_new, image_url, image_storage_url, detail_url, category_id, subcategory_id, weight_kg, billed_weight_kg, ship_method, seo_title_ru, seo_title_en, seo_desc_ru, seo_desc_en, seo_body_ru, seo_body_en, cross_refs"
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
  const rawProduct = rows?.[0];

  if (error || !rawProduct) return null;
  const product = withCleanImage(rawProduct);

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
        .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new")
        .in("id", ids).eq("category_id", product.category_id).limit(8);
      similarProducts = (sim ?? []).map(withCleanImage) as Product[];
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
    ? { ru: subInfo.name_ru, en: subInfo.name_en, slug: subInfo.slug }
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

// ── Сниппет ───────────────────────────────────────────────────────────────────
//
// Бюджет заголовка Google меряет в ПИКСЕЛЯХ (~600px десктоп), что для кириллицы
// даёт примерно 60 символов. Суффикс "| K-Axis" из глобального шаблона подавлен
// через title: { absolute } — те же 9 символов, что экономит карточка авто.
const TITLE_BUDGET = 60;
const DESC_BUDGET = 170;

// Обрезка по границе слова. Символьный срез посреди слова
// ("Головка блока цилиндров в сборе, лев…") читается в выдаче как поломка.
function clip(s: string, budget: number): string {
  if (s.length <= budget) return s;
  const cut = s.slice(0, budget - 1);
  const space = cut.lastIndexOf(" ");
  let base = space > budget * 0.6 ? cut.slice(0, space) : cut;
  // Висящий предлог/союз в конце ("…рулевого механизма с…") читается хуже,
  // чем обрыв на знаменательном слове — отбрасываем хвостовое короткое слово.
  base = base.replace(/\s+\S{1,2}$/, "");
  return base.replace(/[\s,;:.–—-]+$/, "") + "…";
}

// Артикул идёт ПЕРВЫМ: 93% запросов, по которым ранжируются эти страницы, —
// это ввод OEM-номера в поиск (GSC, 90 дней: 472 из 505 запросов, 94% показов).
// Точное совпадение в начале строки Google подсвечивает жирным; раньше номер
// стоял за родовым существительным и его съедала обрезка.
function buildTitle(name: string, pn: string): string {
  if (!pn) return clip(name, TITLE_BUDGET);
  const head = `${pn} — `;
  return head + clip(name, TITLE_BUDGET - head.length);
}

/** Список совместимых моделей для сниппета: до `max` штук + счётчик остальных. */
function fitmentSample(brands: CompatibleBrand[], max: number) {
  const total = brands.reduce((n, b) => n + b.models.length, 0);
  const shown: string[] = [];
  for (const b of brands) {
    for (const m of b.models) {
      if (shown.length >= max) break;
      const nm = m.name_en.startsWith(b.name) ? m.name_en : `${b.name} ${m.name_en}`;
      shown.push(m.years ? `${nm} (${m.years})` : nm);
    }
    if (shown.length >= max) break;
  }
  return { list: shown.join(", "), rest: total - shown.length };
}

function buildMeta(
  lang: string,
  p: {
    part_number: string | null; name_ru: string; name_en: string; name_ko: string | null;
    seo_title_ru?: string | null; seo_title_en?: string | null;
    seo_desc_ru?: string | null; seo_desc_en?: string | null;
  },
  ctx: { price: string; brands: CompatibleBrand[] }
) {
  const ru = p.name_ru || p.name_en || p.name_ko || "Запчасть";
  const en = p.name_en || p.name_ru || p.name_ko || "Part";
  const ko = p.name_ko || p.name_en || p.name_ru || "부품";
  const pn = p.part_number || "";
  const { price } = ctx;

  // Описание собирается из сегментов: имя+артикул, цена+наличие, применимость,
  // хвост. Применимость — единственный сегмент переменной длины, поэтому под
  // бюджет ужимается именно она: две модели → одна → совсем без списка. Цена
  // не выпадает никогда — она и есть то, ради чего кликают.
  const compose = (
    head: string,
    priceSeg: string,
    fit: (n: number) => string,
    tail: string
  ) => {
    let out = "";
    for (const n of [2, 1, 0]) {
      out = [head, priceSeg, fit(n), tail].filter(Boolean).join(" ");
      if (out.length <= DESC_BUDGET) break;
    }
    return out;
  };

  /** Локализованный сегмент применимости: `${label}: A, B${more(rest)}.` */
  const fitSeg =
    (label: string, more: (rest: number) => string) =>
    (n: number): string => {
      if (n === 0) return "";
      const { list, rest } = fitmentSample(ctx.brands, n);
      if (!list) return "";
      return `${label}: ${list}${rest > 0 ? more(rest) : ""}.`;
    };

  const map: Record<string, { title: string; description: string }> = {
    ru: {
      title: buildTitle(ru, pn),
      description: compose(
        pn ? `${ru}, артикул ${pn}.` : `${ru}.`,
        price ? `Цена ${price}, в наличии.` : "",
        fitSeg("Подходит", (rest) => ` и ещё ${rest}`),
        "Оригинал Hyundai Mobis, отправка из Кореи."
      ),
    },
    en: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}, part number ${pn}.` : `${en}.`,
        price ? `Price ${price}, in stock.` : "",
        fitSeg("Fits", (rest) => ` and ${rest} more`),
        "Genuine Hyundai Mobis, shipped from Korea."
      ),
    },
    ko: {
      title: buildTitle(ko, pn),
      description: compose(
        pn ? `${ko}, 부품 번호 ${pn}.` : `${ko}.`,
        price ? `가격 ${price}, 재고 보유.` : "",
        fitSeg("적용 차종", (rest) => ` 외 ${rest}종`),
        "현대모비스 정품, 한국에서 발송."
      ),
    },
    ka: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}, ნომერი ${pn}.` : `${en}.`,
        price ? `ფასი ${price}, მარაგშია.` : "",
        fitSeg("შეესაბამება", (rest) => ` და კიდევ ${rest}`),
        "ორიგინალი Hyundai Mobis, იგზავნება კორეიდან."
      ),
    },
    ar: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}، رقم القطعة ${pn}.` : `${en}.`,
        price ? `السعر ${price}، متوفر.` : "",
        fitSeg("يناسب", (rest) => ` و${rest} أخرى`),
        "أصلية من Hyundai Mobis، تشحن من كوريا."
      ),
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

  const [data, { krwToUsd }] = await Promise.all([getCachedProduct(slug), getCurrencyRates()]);
  if (!data) return {};

  const p = data.product;
  // Цена в сниппете обязана совпадать с ценой, которую видит посетитель, —
  // тот же formatUsd, что и в CarDetailSidebar/ProductDetailClient, а не своя
  // арифметика. Курс живой (getCurrencyRates, кеш 24ч), константы в коде нет —
  // но «живой» он ровно настолько, насколько часто перерендеривается страница:
  // держать revalidate этого маршрута не выше 24ч обязательно, иначе курс
  // запекается в HTML намертво и превращается в ту самую константу.
  const { title, description } = buildMeta(lang, p, {
    price: formatUsd(p.price_krw, krwToUsd),
    brands: data.compatibleBrands,
  });
  // Canonical всегда указывает на чистый URL по артикулу — независимо от того,
  // по какому slug-варианту открыли страницу
  const canonicalSlug = generatePartSlug(p.part_number, null, "ru", p.id);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL!;

  return {
    // absolute — глушит суффикс "| K-Axis" из шаблона в layout.tsx,
    // освобождая 9 символов пиксельного бюджета под название детали.
    title: { absolute: title },
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
  // Цена ОБЯЗАНА совпадать с ценой в карточке. Раньше здесь стоял свой
  // множитель ×1.23, тогда как витрина считает по тиерам маржи из pricing.ts, —
  // расхождение доходило до 5% и делало Offer невалидным для rich results.
  const priceUsd = krwToDisplayUsd(product.price_krw, krwToUsd);
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
      <SectionDictionary lang={lang} sections={["parts"]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailClient {...data} lang={lang} krwToUsd={krwToUsd} description={description} logistics={data.logistics} />
    </>
  );
}
