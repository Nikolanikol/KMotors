import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { makeAlternates } from "@/lib/seo";
import {
  getPartsCategories,
  getCategoryCount,
  indexCategories,
  subtreeIds,
  localizedName,
  isBucketCategory,
  visibleChildren,
  type CategoryNode,
} from "@/lib/partsCategories";
import { FitmentProductsGrid } from "@/app/parts/sections/FitmentProductsGrid";
import type { Product } from "@/app/parts/sections/PartsCatalogClient";

export const revalidate = 3600;
export const dynamicParams = true;

const BASE = "https://www.kmotors.shop";
const PAGE_SIZE = 24;
// Порог тонкого контента: категории меньше — рендерим, но не индексируем.
// Тот же приём, что GEN_MIN_PARTS на fitment-страницах.
const CAT_MIN_PARTS = 30;

// ─── Copy ─────────────────────────────────────────────────────────────────────

// Название категории подставляется как самостоятельное словосочетание, а не
// внутрь согласуемой конструкции: в списке есть и «Тормозная система», и
// «Датчики», и «МКПП», поэтому «Оригинальные {name}» давало бы
// «Оригинальные тормозная система» и «Оригинальные мкпп». По той же причине
// нигде нет toLowerCase() — он ломает аббревиатуры.
function buildCopy(lang: string, name: string) {
  const map: Record<
    string,
    { h1: string; intro: string; title: string; desc: string; count: (n: number) => string;
      children: string; siblings: string; parts: string; home: string }
  > = {
    ru: {
      h1: `${name} — оригинальные запчасти из Кореи`,
      intro: `Каталог оригинальных запчастей Hyundai Mobis категории «${name}» для Hyundai, Kia и Genesis. Подбор по артикулу и по модели автомобиля, отправка напрямую со складов в Южной Корее.`,
      title: `${name} Hyundai, Kia, Genesis — оригинал из Кореи`,
      desc: `Оригинальные запчасти Hyundai Mobis, категория «${name}». Прямая поставка из Кореи, подбор по артикулу и модели, доставка по всему миру.`,
      count: (n) => `Позиций в каталоге: ${n}`,
      children: "Подкатегории",
      siblings: "Смотрите также",
      parts: "Запчасти",
      home: "Главная",
    },
    en: {
      h1: `${name} — Genuine Parts from Korea`,
      intro: `Genuine Hyundai Mobis parts catalog, ${name} category, for Hyundai, Kia and Genesis. Search by part number or vehicle model, shipped direct from warehouses in South Korea.`,
      title: `${name} for Hyundai, Kia, Genesis — Genuine OEM from Korea`,
      desc: `Genuine Hyundai Mobis parts: ${name}. Direct supply from Korea, search by part number and model, worldwide delivery.`,
      count: (n) => `Parts in catalog: ${n}`,
      children: "Subcategories",
      siblings: "See also",
      parts: "Parts",
      home: "Home",
    },
    ka: {
      h1: `${name} — ორიგინალი ნაწილები კორეიდან`,
      intro: `Hyundai Mobis-ის ორიგინალი ნაწილების კატალოგი, კატეგორია «${name}», Hyundai-სთვის, Kia-სთვის და Genesis-სთვის. შერჩევა ნომრით ან მოდელით, გზავნილი პირდაპირ სამხრეთ კორეის საწყობებიდან.`,
      title: `${name} Hyundai, Kia, Genesis — ორიგინალი კორეიდან`,
      desc: `Hyundai Mobis-ის ორიგინალი ნაწილები: ${name}. პირდაპირი მიწოდება კორეიდან, შერჩევა ნომრითა და მოდელით.`,
      count: (n) => `პოზიციები კატალოგში: ${n}`,
      children: "ქვეკატეგორიები",
      siblings: "იხილეთ ასევე",
      parts: "ნაწილები",
      home: "მთავარი",
    },
    ar: {
      h1: `${name} — قطع غيار أصلية من كوريا`,
      intro: `كتالوج قطع غيار Hyundai Mobis الأصلية، فئة «${name}»، لسيارات Hyundai وKia وGenesis. البحث برقم القطعة أو بموديل السيارة، والشحن مباشرة من مستودعات كوريا الجنوبية.`,
      title: `${name} لسيارات Hyundai وKia وGenesis — أصلية من كوريا`,
      desc: `قطع غيار Hyundai Mobis الأصلية: ${name}. توريد مباشر من كوريا، بحث برقم القطعة والموديل، شحن عالمي.`,
      count: (n) => `عدد القطع في الكتالوج: ${n}`,
      children: "الفئات الفرعية",
      siblings: "انظر أيضاً",
      parts: "قطع الغيار",
      home: "الرئيسية",
    },
  };
  return map[lang] ?? map.ru;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function resolve(slug: string) {
  const rows = await getPartsCategories();
  const { byId, bySlug } = indexCategories(rows);
  const node = bySlug.get(slug);
  if (!node) return null;

  const ancestors: CategoryNode[] = [];
  for (let p = node.parent_id; p !== null; ) {
    const parent = byId.get(p);
    if (!parent) break;
    ancestors.unshift(parent);
    p = parent.parent_id;
  }
  // Вёдра из навигации убираем: как посадочные они бесполезны, а их товары
  // всё равно достижимы через пагинацию родительской категории.
  const siblings = (
    node.parent_id !== null
      ? (byId.get(node.parent_id)?.children ?? [])
      : [...byId.values()].filter((c) => c.parent_id === null)
  ).filter((c) => c.id !== node.id && !isBucketCategory(c.slug));

  return { node, ancestors, siblings, ids: subtreeIds(node) };
}

interface Props {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const { page: pageParam } = await searchParams;
  const resolved = await resolve(slug);
  if (!resolved) return {};

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const name = localizedName(resolved.node, lang);
  const copy = buildCopy(lang, name);
  const total = await getCategoryCount(resolved.ids);

  // Страницы пагинации каноникалят САМИ НА СЕБЯ. Канонический адрес первой
  // страницы увёл бы вес и, главное, выбросил бы из индекса единственные
  // ссылки на товары со 2-й страницы и дальше — а других ссылок на них нет.
  const path = `/parts/category/${slug}${page > 1 ? `?page=${page}` : ""}`;

  // noindex, follow: для тонких категорий и для внутренних вёдер («Прочее …»,
  // «Мелкие детали …», staging). Follow обязателен — страница остаётся путём
  // обхода к товарам, просто сама в индекс не идёт.
  const noindex = total < CAT_MIN_PARTS || isBucketCategory(slug);

  return {
    // absolute — суффикс "| K-Axis" из шаблона в layout.tsx выводит заголовок
    // за пиксельный бюджет выдачи (68 символов против 59 без него).
    title: { absolute: page > 1 ? `${copy.title} — ${page}` : copy.title },
    description: copy.desc,
    ...(noindex && { robots: { index: false, follow: true } }),
    alternates: makeAlternates(lang, path),
    openGraph: { title: copy.title, description: copy.desc, url: `${BASE}/${lang}${path}`, type: "website" },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  const { page: pageParam } = await searchParams;

  const resolved = await resolve(slug);
  if (!resolved) notFound();
  const { node, ancestors, siblings, ids } = resolved;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = createServerClient();
  const [{ krwToUsd }, total, productsRes] = await Promise.all([
    getCurrencyRates(),
    getCategoryCount(ids),
    supabase
      .from("parts_products")
      .select(
        "id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new"
      )
      .in("subcategory_id", ids)
      // Порядок обязан быть детерминированным, иначе товар может попасть на две
      // страницы пагинации сразу или не попасть ни на одну.
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1),
  ]);

  const products = ((productsRes.data ?? []).map(withCleanImage) as Product[]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const name = localizedName(node, lang);
  const copy = buildCopy(lang, name);
  const path = `/parts/category/${slug}`;

  const trail = [
    { name: "K-Axis", item: `${BASE}/${lang}/` },
    { name: copy.parts, item: `${BASE}/${lang}/parts` },
    ...ancestors.map((a) => ({
      name: localizedName(a, lang),
      item: `${BASE}/${lang}/parts/category/${a.slug}`,
    })),
    { name, item: `${BASE}/${lang}${path}` },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: t.item,
    })),
  };

  // ItemList описывает ровно тот список, который видит посетитель на этой
  // странице пагинации — иначе разметка расходится с содержимым.
  const itemListSchema = products.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: copy.title,
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: from + i + 1,
          url: `${BASE}/${lang}/parts/${p.part_number}`,
          name: lang === "ru" ? p.name_ru || p.name_en : p.name_en || p.name_ru,
        })),
      }
    : null;

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <div className="parts-page min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-[var(--pn-text-dim)] mb-4 flex flex-wrap gap-1.5">
          <Link href={`/${lang}`} className="hover:text-[var(--pn-orange)] transition-colors">{copy.home}</Link>
          <span>/</span>
          <Link href={`/${lang}/parts`} className="hover:text-[var(--pn-orange)] transition-colors">{copy.parts}</Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex gap-1.5">
              <span>/</span>
              <Link href={`/${lang}/parts/category/${a.slug}`} className="hover:text-[var(--pn-orange)] transition-colors">
                {localizedName(a, lang)}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="text-[var(--pn-text-muted)]">{name}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--pn-text)] mb-3">{copy.h1}</h1>
        <p className="text-[15px] text-[var(--pn-text-muted)] max-w-3xl mb-3 leading-relaxed">{copy.intro}</p>
        <p className="text-sm font-medium text-[var(--pn-orange-soft)] mb-8">{copy.count(total)}</p>

        {visibleChildren(node).length > 0 && (
          <nav aria-label={copy.children} className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--pn-text)] mb-3">{copy.children}</h2>
            <div className="flex flex-wrap gap-2">
              {visibleChildren(node).map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/parts/category/${c.slug}`}
                  className="text-sm px-3 py-1.5 rounded-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                >
                  {localizedName(c, lang)}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <FitmentProductsGrid products={products} lang={lang} krwToUsd={krwToUsd} />

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination">
            {pageNums.map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-[var(--pn-text-dim)]">…</span>}
                {p === page ? (
                  <span className="px-3 py-1.5 rounded-lg bg-[var(--pn-orange-deep)] text-white text-sm font-semibold shadow-lg shadow-[rgba(182,119,73,0.25)]">{p}</span>
                ) : (
                  <Link
                    href={`/${lang}${path}${p > 1 ? `?page=${p}` : ""}`}
                    className="px-3 py-1.5 rounded-lg border border-[var(--pn-border)] bg-[var(--pn-surface)] text-sm text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                  >
                    {p}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}

        {siblings.length > 0 && (
          <nav aria-label={copy.siblings} className="mt-12">
            <h2 className="text-lg font-semibold text-[var(--pn-text)] mb-3">{copy.siblings}</h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/${lang}/parts/category/${s.slug}`}
                  className="text-sm px-3 py-1.5 rounded-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                >
                  {localizedName(s, lang)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
