import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";
import { getFx } from "@/lib/fx";
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";
import { ProductDetailClient } from "@/app/parts/sections/ProductDetailClient";
import { PartExpertContent } from "@/app/parts/sections/PartExpertContent";
import { getPartContent } from "@/lib/partContent";
import { parsePartSlug, generatePartSlug } from "@/utils/partSlug";
import type {
  ProductDetail,
  CompatibleBrand,
} from "@/app/parts/sections/ProductDetailClient";
import type { Product } from "@/app/parts/sections/PartsCatalogClient";
import { makeAlternates } from "@/lib/seo";
import SectionDictionary from "@/components/I18nProvider/SectionDictionary";
import { SITE_URL } from "@/lib/site";
import { getServerT } from "@/lib/serverT";
import {
  hasPrice,
  isPlausiblePartKey,
  jsonLd,
  manufacturerLabel,
  normalizePartKey,
  partKeyLikePattern,
} from "@/lib/partsSeo";

// Страницы продуктов рендерятся по требованию: generateStaticParams убран,
// 50k × 4 langs при сборке неприемлемо. dynamicParams = true (дефолт) —
// неизвестные [slug] рендерятся при первом визите. Сборку это и обеспечивает;
// revalidate тут отдельная ручка и на объём сборки не влияет.
//
// 24 часа, а не false: цена в HTML считается от krwToUsd (getFx("market"),
// кеш 24ч). При revalidate = false страница не перерендеривается никогда, и
// этот кеш курса не может сработать — курс замерзает на момент первого визита,
// а /api/parts/checkout (POST, не кешируется) считает по свежему. Витрина и
// чекаут расходятся тем сильнее, чем дольше страница лежит. TTL совпадает с
// кешем самого курса: чаще смысла нет, реже — снова копим расхождение.
export const revalidate = 86400;
export const dynamicParams = true;

/**
 * ⚠️ ПУСТОЙ список — и это не заглушка, а способ включить ISR.
 *
 * Без экспорта generateStaticParams Next считает маршрут полностью
 * динамическим: он не попадает в dynamicRoutes манифеста, и `revalidate`
 * выше становится декоративным — кешировать отрендеренную страницу некому.
 * Именно так 48 тысяч карточек рендерились заново на каждый запрос.
 *
 * Пустой массив + dynamicParams: true даёт ровно то, что нужно: на сборке НЕ
 * генерится ни одной страницы (иначе это 50k × 4 языка), а первый заход на
 * адрес рендерит и КЛАДЁТ В КЕШ на revalidate.
 */
export async function generateStaticParams() {
  return [];
}

const BRAND_ORDER: Record<string, number> = {
  hyundai: 0,
  kia: 1,
  genesis: 2,
};

// ─── Data fetching ─────────────────────────────────────────────────────────────

/**
 * Строка parts_products в том виде, в каком её читает страница. Серверные поля
 * (seo_*) наружу, в клиентский компонент, НЕ уходят — туда идёт узкий DTO (toDetail).
 */
interface ProductRow {
  id: number;
  part_number: string | null;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  official_name_ko: string | null;
  manufacturer: string | null;
  price_krw: number;
  is_new: boolean;
  image_url: string | null;
  image_storage_url?: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  seo_title_ru: string | null;
  seo_title_en: string | null;
  seo_desc_ru: string | null;
  seo_desc_en: string | null;
  seo_body_ru: string | null;
  seo_body_en: string | null;
  cross_refs: string[] | null;
}

const PRODUCT_COLUMNS =
  "id, part_number, name_ru, name_en, name_ko, official_name_ko, manufacturer, price_krw, is_new, image_url, image_storage_url, category_id, subcategory_id, seo_title_ru, seo_title_en, seo_desc_ru, seo_desc_en, seo_body_ru, seo_body_en, cross_refs";

type CategoryRow = { id: number; name_ru: string; name_en: string; slug: string; parent_id: number | null };

/** Сбой БД — исключение, а не «нет данных»: unstable_cache запоминает только возвращённое. */
function dbFail(what: string, message: string): never {
  throw new Error(`[parts/slug] ${what}: ${message}`);
}

/** Узкий DTO для клиентского компонента: только то, что он реально рисует. */
function toDetail(p: ProductRow): ProductDetail {
  return {
    id: p.id,
    part_number: p.part_number ?? "",
    name_ru: p.name_ru,
    name_en: p.name_en,
    name_ko: p.name_ko,
    official_name_ko: p.official_name_ko,
    manufacturer: p.manufacturer,
    price_krw: p.price_krw,
    is_new: p.is_new,
    image_url: p.image_url,
    cross_refs: p.cross_refs,
  };
}

/**
 * null — строки НЕТ (страница 404). Ошибка БД — исключение: так её не запомнит
 * unstable_cache и посетитель не получит 404 на живой товар из-за секундного сбоя.
 */
async function fetchProduct(slug: string) {
  const { partNumber, productId } = parsePartSlug(slug);

  const supabase = createServerClient();

  // ~130 артикулов занимают несколько строк (по строке на совместимый автомобиль,
  // см. src/app/parts/CLAUDE.md). Это одна деталь: совместимость собирается по ВСЕМ
  // её строкам, а цена/название/фото берутся от первой по id — стабильно от запроса
  // к запросу (.limit(1) без порядка отдавал произвольную строку).
  let pn = partNumber;
  let rows: ProductRow[] = [];

  if (productId !== null) {
    const { data, error } = await supabase
      .from("parts_products")
      .select(PRODUCT_COLUMNS)
      .eq("id", productId)
      .limit(1);
    if (error) dbFail("товар по id", error.message);
    const byId = (data as unknown as ProductRow[] | null)?.[0];
    if (!byId) return null;
    if (byId.part_number) pn = byId.part_number;
    else rows = [byId];
  } else if (!partNumber) {
    return null;
  }

  if (!rows.length && pn) {
    const { data, error } = await supabase
      .from("parts_products")
      .select(PRODUCT_COLUMNS)
      .eq("part_number", pn)
      .order("id", { ascending: true })
      .limit(200);
    if (error) dbFail("товар по артикулу", error.message);
    rows = (data as unknown as ProductRow[] | null) ?? [];
  }

  if (!rows.length) return null;

  const product = withCleanImage(rows[0]);
  const partIds = rows.map((r) => r.id);

  const catIds = [product.category_id, product.subcategory_id].filter(
    (x): x is number => !!x
  );

  // Независимые запросы — параллельно.
  const [pvRes, catsRes] = await Promise.all([
    // Совместимость из vehicles/part_vehicles (213k связей, поколения с годами)
    supabase
      .from("part_vehicles")
      .select("vehicles(id, name_en, brand, year_from, year_to, open_ended, slug, parts_count)")
      .in("part_id", partIds),
    catIds.length > 0
      ? supabase
          .from("parts_categories")
          .select("id, name_ru, name_en, slug, parent_id")
          .in("id", catIds)
      : Promise.resolve({ data: [] as CategoryRow[], error: null }),
  ]);
  if (pvRes.error) dbFail("совместимость", pvRes.error.message);
  if (catsRes.error) dbFail("категории", catsRes.error.message);

  const cats = (catsRes.data ?? []) as CategoryRow[];

  // Одно и то же поколение может прийти от нескольких строк артикула — дедупликация по id.
  const seenVehicles = new Set<number>();
  const compatVehicles = (pvRes.data ?? [])
    .map((row) => row.vehicles as unknown as {
      id: number; name_en: string; brand: string; year_from: string | null;
      year_to: string | null; open_ended: boolean; slug: string; parts_count: number;
    } | null)
    .filter((v): v is NonNullable<typeof v> => {
      if (!v || seenVehicles.has(v.id)) return false;
      seenVehicles.add(v.id);
      return true;
    });

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
    const { data: sameVehicle, error: sameErr } = await supabase
      .from("part_vehicles")
      .select("part_id")
      .eq("vehicle_id", topVehicle.id)
      .not("part_id", "in", `(${partIds.join(",")})`)
      .order("part_id", { ascending: true })
      .limit(400);
    if (sameErr) dbFail("похожие (связи)", sameErr.message);
    const ids = (sameVehicle ?? []).map((r) => r.part_id);
    if (ids.length) {
      const { data: sim, error: simErr } = await supabase
        .from("parts_products")
        .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new")
        .in("id", ids)
        .eq("category_id", product.category_id)
        .order("id", { ascending: true })
        .limit(8);
      if (simErr) dbFail("похожие (товары)", simErr.message);
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
    product,
    categoryName,
    subcategoryName,
    compatibleBrands,
    similarProducts,
  };
}

// Версия в ключе: форма возвращаемого объекта изменилась (логистика убрана) — старые
// записи кеша с прежней формой не должны попасть в новый код.
const getCachedProduct = unstable_cache(
  (slug: string) => fetchProduct(slug),
  ["parts-product-v2"],
  { revalidate: 3600, tags: ["parts-product"] }
);

/**
 * Слаг не нашёл артикул точно — ищем тот же артикул без учёта регистра и дефисов
 * («51712b4000» → «51712-B4000»). Нашли — отдаём канонический артикул для 301.
 *
 * Запрос по ILIKE без индекса, поэтому он идёт только по правдоподобному ключу
 * (6–24 знака, есть цифра) и только после промаха точного поиска; результат
 * кешируется так же, как сама карточка. Сбой БД — исключение (не кешируется).
 */
async function fetchCanonicalPartNumber(slug: string): Promise<string | null> {
  const { partNumber } = parsePartSlug(slug);
  if (!partNumber) return null;
  const key = normalizePartKey(partNumber);
  if (!isPlausiblePartKey(key)) return null;

  const { data, error } = await createServerClient()
    .from("parts_products")
    .select("id, part_number")
    .ilike("part_number", partKeyLikePattern(key))
    .order("id", { ascending: true })
    .limit(50);
  if (error) dbFail("вариант артикула", error.message);

  const hit = (data ?? []).find((r) => r.part_number && normalizePartKey(r.part_number) === key);
  return hit?.part_number ?? null;
}

const getCachedCanonicalPartNumber = unstable_cache(
  (slug: string) => fetchCanonicalPartNumber(slug),
  ["parts-product-variant-v1"],
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

/**
 * Хвост сниппета «оригинал, отправка из Кореи». Название производителя берётся из
 * базы; нет его — нейтральная формулировка БЕЗ бренда (раньше всем деталям подряд
 * писали «Hyundai Mobis», в том числе чужим).
 */
const GENUINE_TAIL: Record<string, (m: string | null, raw: string | null) => string> = {
  ru: (m) => (m ? `Оригинал ${m}, отправка из Кореи.` : "Оригинальная запчасть, отправка из Кореи."),
  en: (m) => (m ? `Genuine ${m}, shipped from Korea.` : "Genuine part, shipped from Korea."),
  ko: (_m, raw) => (raw ? `${raw} 정품, 한국에서 발송.` : "정품 부품, 한국에서 발송."),
  ka: (m) => (m ? `ორიგინალი ${m}, იგზავნება კორეიდან.` : "ორიგინალი ნაწილი, იგზავნება კორეიდან."),
  ar: (m) => (m ? `أصلية من ${m}، تشحن من كوريا.` : "قطعة أصلية، تشحن من كوريا."),
};

function buildMeta(
  lang: string,
  p: {
    part_number: string | null; name_ru: string; name_en: string; name_ko: string | null;
    manufacturer: string | null;
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
  const mfr = manufacturerLabel(p.manufacturer);
  const rawMfr = p.manufacturer?.trim() || null;
  const tail = (GENUINE_TAIL[lang] ?? GENUINE_TAIL.ru)(mfr, rawMfr);

  // Описание собирается из сегментов: имя+артикул, цена+наличие, применимость,
  // хвост. Применимость — единственный сегмент переменной длины, поэтому под
  // бюджет ужимается именно она: две модели → одна → совсем без списка. Цена
  // не выпадает никогда — она и есть то, ради чего кликают. Нет цены (деталь «по
  // запросу») — сегмент пуст: цену, которой нет, в сниппет не пишем.
  const compose = (
    head: string,
    priceSeg: string,
    fit: (n: number) => string,
    tailSeg: string
  ) => {
    let out = "";
    for (const n of [2, 1, 0]) {
      out = [head, priceSeg, fit(n), tailSeg].filter(Boolean).join(" ");
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
        tail
      ),
    },
    en: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}, part number ${pn}.` : `${en}.`,
        price ? `Price ${price}, in stock.` : "",
        fitSeg("Fits", (rest) => ` and ${rest} more`),
        tail
      ),
    },
    ko: {
      title: buildTitle(ko, pn),
      description: compose(
        pn ? `${ko}, 부품 번호 ${pn}.` : `${ko}.`,
        price ? `가격 ${price}, 재고 보유.` : "",
        fitSeg("적용 차종", (rest) => ` 외 ${rest}종`),
        tail
      ),
    },
    ka: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}, ნომერი ${pn}.` : `${en}.`,
        price ? `ფასი ${price}, მარაგშია.` : "",
        fitSeg("შეესაბამება", (rest) => ` და კიდევ ${rest}`),
        tail
      ),
    },
    ar: {
      title: buildTitle(en, pn),
      description: compose(
        pn ? `${en}، رقم القطعة ${pn}.` : `${en}.`,
        price ? `السعر ${price}، متوفر.` : "",
        fitSeg("يناسب", (rest) => ` و${rest} أخرى`),
        tail
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

  const [data, { krwToUsd }] = await Promise.all([getCachedProduct(slug), getFx("market")]);
  if (!data) return {};

  const p = data.product;
  const priced = hasPrice(p.price_krw);
  // Цена в сниппете обязана совпадать с ценой, которую видит посетитель, —
  // тот же formatUsd, что и в CarDetailSidebar/ProductDetailClient, а не своя
  // арифметика. Курс живой (getFx("market"), кеш 24ч), константы в коде нет —
  // но «живой» он ровно настолько, насколько часто перерендеривается страница:
  // держать revalidate этого маршрута не выше 24ч обязательно, иначе курс
  // запекается в HTML намертво и превращается в ту самую константу.
  const { title, description } = buildMeta(lang, p, {
    price: priced ? formatUsd(p.price_krw, krwToUsd) : "",
    brands: data.compatibleBrands,
  });
  // Canonical всегда указывает на чистый URL по артикулу — независимо от того,
  // по какому slug-варианту открыли страницу
  const canonicalSlug = encodeURIComponent(generatePartSlug(p.part_number, null, "ru", p.id));
  return {
    // absolute — глушит суффикс "| K-Axis" из шаблона в layout.tsx,
    // освобождая 9 символов пиксельного бюджета под название детали.
    title: { absolute: title },
    description,
    // Деталь без цены («по запросу») в индекс не идёт: без цены карточка не
    // отвечает на запрос, а Offer без price невалиден для rich results.
    ...(!priced && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/${lang}/parts/${canonicalSlug}`,
    },
    alternates: makeAlternates(lang, `/parts/${canonicalSlug}`),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: Props) {
  const { lang, slug } = await params;

  const [data, { krwToUsd }] = await Promise.all([
    getCachedProduct(slug),
    getFx("market"),
  ]);
  if (!data) {
    // Не нашли точно — может, это тот же артикул в другом регистре/без дефисов.
    const canonicalPn = await getCachedCanonicalPartNumber(slug);
    if (canonicalPn) permanentRedirect(`/${lang}/parts/${encodeURIComponent(canonicalPn)}`);
    notFound();
  }

  const { product } = data;

  // Экспертный текст (kmotors_part_content). Только published; сбой чтения = нет блока.
  const expertContent = await getPartContent(product.part_number);

  // 301 со старых URL "PN--name" (и любых slug-вариантов) на канонический "PN".
  // Сравниваем и декодированный slug, чтобы не зациклить редирект на кодированных символах.
  const canonicalRaw = generatePartSlug(product.part_number, null, "ru", product.id);
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}
  // В адресах (редирект, JSON-LD) слаг кодируется: артикул с «&» или пробелом иначе даёт невалидный URL.
  const canonicalSlug = encodeURIComponent(canonicalRaw);
  if (slug !== canonicalRaw && slug !== canonicalSlug && decodedSlug !== canonicalRaw) {
    permanentRedirect(`/${lang}/parts/${canonicalSlug}`);
  }

  const priced = hasPrice(product.price_krw);
  const mfr = manufacturerLabel(product.manufacturer);

  // ── Product JSON-LD (Google Rich Results) ──────────────────────────────────
  // Цена ОБЯЗАНА совпадать с ценой в карточке. Раньше здесь стоял свой
  // множитель ×1.23, тогда как витрина считает по тиерам маржи из pricing.ts, —
  // расхождение доходило до 5% и делало Offer невалидным для rich results.
  // Нет цены — нет и Offer: Google требует price, а «0» был бы ложью.
  const priceUsd = krwToDisplayUsd(product.price_krw, krwToUsd);
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
    ...(mfr && { brand: { "@type": "Brand", name: mfr } }),
    ...(priced && {
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/${lang}/parts/${canonicalSlug}`,
        priceCurrency: "USD",
        price: priceUsd,
        // InStock — решение владельца: все карточки каталога считаются доступными под заказ.
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "K-Axis",
          url: SITE_URL,
        },
      },
    }),
    ...(data.categoryName && {
      category: lang === "ru" ? data.categoryName.ru : data.categoryName.en,
    }),
  };

  // Название раздела — из словаря (ru/en/ka/ar), а не «Parts» для всех, кроме ru.
  const partsLabel = getServerT(lang)("parts.detail.breadcrumbParts");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      // Корень языка без хвостового слэша: trailingSlash = false, «/ru/» отдаёт 308.
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: partsLabel, item: `${SITE_URL}/${lang}/parts` },
      ...(data.categoryName
        ? [{ "@type": "ListItem", position: 3, name: lang === "ru" ? data.categoryName.ru : data.categoryName.en, item: `${SITE_URL}/${lang}/parts/category/${data.categoryName.slug}` }]
        : []),
      { "@type": "ListItem", position: data.categoryName ? 4 : 3, name: productName, item: `${SITE_URL}/${lang}/parts/${canonicalSlug}` },
    ],
  };

  // ── Auto-generated description ────────────────────────────────────────────
  // Производитель — из базы; нет его — формулировка без названия бренда.
  const brandNames = data.compatibleBrands.map((b) => b.name).join(", ");
  const catRu = data.categoryName?.ru ?? "";
  const catEn = data.categoryName?.en ?? "";
  const rawMfr = product.manufacturer?.trim() || null;

  const descriptionMap: Record<string, string> = {
    ru: [
      `${product.name_ru || product.name_en || product.name_ko}${product.part_number ? ` (артикул ${product.part_number})` : ""} — оригинальная запчасть${mfr ? ` ${mfr}` : ""}.`,
      catRu ? `Категория: ${catRu}.` : "",
      brandNames ? `Подходит для автомобилей ${brandNames}.` : "",
      `Прямые поставки из Южной Кореи. Доставка по всему миру. Гарантия качества${mfr ? ` ${mfr}` : ""}.`,
    ].filter(Boolean).join(" "),

    en: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (part number ${product.part_number})` : ""} — genuine ${mfr ? `${mfr} ` : ""}spare part.`,
      catEn ? `Category: ${catEn}.` : "",
      brandNames ? `Compatible with ${brandNames} vehicles.` : "",
      `Direct supply from South Korea. Worldwide delivery. ${mfr ? `${mfr} quality` : "Quality"} guarantee.`,
    ].filter(Boolean).join(" "),

    ko: [
      `${product.name_ko || product.name_en || product.name_ru || ""}${product.part_number ? ` (부품 번호 ${product.part_number})` : ""} — ${rawMfr ? `${rawMfr} ` : ""}정품 부품입니다.`,
      catEn ? `카테고리: ${catEn}.` : "",
      brandNames ? `${brandNames} 차량에 적합합니다.` : "",
      `한국에서 직접 공급. 전 세계 배송. ${rawMfr ? `${rawMfr} ` : ""}품질 보증.`,
    ].filter(Boolean).join(" "),

    ka: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (ნომერი ${product.part_number})` : ""} — ${mfr ? `${mfr}-ის ` : ""}ორიგინალი სათადარიგო ნაწილი.`,
      catEn ? `კატეგორია: ${catEn}.` : "",
      brandNames ? `შესაფერისია ${brandNames} მანქანებისთვის.` : "",
      `პირდაპირი მიწოდება სამხრეთ კორეიდან. მიტანა მსოფლიოს ნებისმიერ ქვეყანაში. ${mfr ? `${mfr}-ის ` : ""}ხარისხის გარანტია.`,
    ].filter(Boolean).join(" "),

    ar: [
      `${product.name_en || product.name_ru || product.name_ko}${product.part_number ? ` (رقم القطعة ${product.part_number})` : ""} — قطعة غيار أصلية${mfr ? ` من ${mfr}` : ""}.`,
      catEn ? `الفئة: ${catEn}.` : "",
      brandNames ? `متوافقة مع سيارات ${brandNames}.` : "",
      `توريد مباشر من كوريا الجنوبية. توصيل إلى جميع أنحاء العالم. ${mfr ? `ضمان جودة ${mfr}` : "ضمان الجودة"}.`,
    ].filter(Boolean).join(" "),
  };

  // Утверждённый seo_body (ru/en) заменяет авто-шаблон описания
  const seoBody = lang === "ru" ? product.seo_body_ru : lang === "en" ? product.seo_body_en : null;
  const description = seoBody || descriptionMap[lang] || descriptionMap.ru;

  return (
    <>
      <SectionDictionary lang={lang} sections={["parts"]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <ProductDetailClient
        product={toDetail(product)}
        categoryName={data.categoryName}
        subcategoryName={data.subcategoryName}
        compatibleBrands={data.compatibleBrands}
        similarProducts={data.similarProducts}
        lang={lang}
        krwToUsd={krwToUsd}
        description={description}
      />
      {expertContent && product.part_number && (
        <PartExpertContent lang={lang} partNumber={product.part_number} content={expertContent} />
      )}
    </>
  );
}
