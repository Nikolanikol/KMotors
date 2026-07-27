import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";

// Дерево категорий запчастей: 6 корней, 93 узла второго уровня, 77 третьего.
//
// ВАЖНО про две классификации в parts_products. Товар несёт и category_id, и
// subcategory_id, и они НЕ согласованы: по category_id раскладка дырявая
// (у "Кузов" 1174 товара против 2733 в поддереве его подкатегорий, а корень
// "Крепёж" не содержит по нему ни одного товара при 12 222 в поддереве), тогда
// как сумма по subcategory_id даёт 48 663 из 48 689 — то есть покрывает каталог
// целиком. Поэтому выборка товаров категории идёт ТОЛЬКО по subcategory_id,
// включая сам узел и всех его потомков. Фасеты каталога (?cat=) исторически
// считают по category_id — расхождение известное, чинить его здесь не место.

export interface PartsCategory {
  id: number;
  name_ru: string;
  name_en: string;
  slug: string;
  parent_id: number | null;
}

export interface CategoryNode extends PartsCategory {
  depth: number;
  children: CategoryNode[];
}

async function fetchCategories(): Promise<PartsCategory[]> {
  const { data } = await createServerClient()
    .from("parts_categories")
    .select("id, name_ru, name_en, slug, parent_id")
    .order("sort_order", { nullsFirst: false })
    .order("id");
  return (data ?? []) as PartsCategory[];
}

export const getPartsCategories = unstable_cache(fetchCategories, ["parts-category-tree"], {
  revalidate: 3600,
  tags: ["parts-categories"],
});

/** Индекс по id и по slug + вычисленная глубина и дети. */
export function indexCategories(rows: PartsCategory[]) {
  const byId = new Map<number, CategoryNode>();
  for (const row of rows) byId.set(row.id, { ...row, depth: 0, children: [] });

  for (const node of byId.values()) {
    if (node.parent_id !== null) byId.get(node.parent_id)?.children.push(node);
  }
  // Глубина считается после сборки связей — порядок строк из БД произвольный.
  const setDepth = (node: CategoryNode, depth: number) => {
    node.depth = depth;
    for (const child of node.children) setDepth(child, depth + 1);
  };
  for (const node of byId.values()) if (node.parent_id === null) setDepth(node, 0);

  const bySlug = new Map<string, CategoryNode>();
  for (const node of byId.values()) bySlug.set(node.slug, node);

  return { byId, bySlug, roots: [...byId.values()].filter((n) => n.parent_id === null) };
}

/** id узла и всех его потомков — то, по чему фильтруются товары. */
export function subtreeIds(node: CategoryNode): number[] {
  const out: number[] = [node.id];
  for (const child of node.children) out.push(...subtreeIds(child));
  return out;
}

/** Количество товаров в поддереве категории. */
export const getCategoryCount = unstable_cache(
  async (ids: number[]): Promise<number> => {
    const { count } = await createServerClient()
      .from("parts_products")
      .select("*", { count: "exact", head: true })
      .in("subcategory_id", ids);
    return count ?? 0;
  },
  ["parts-category-count"],
  { revalidate: 3600, tags: ["parts-categories"] }
);

export const localizedName = (node: PartsCategory, lang: string) =>
  lang === "ru" ? node.name_ru : node.name_en || node.name_ru;

/**
 * Порог тонкого контента: категории меньше рендерятся, но отдают noindex
 * и не попадают в sitemap. Значение согласовано со страницей категории.
 */
export const CAT_MIN_PARTS = 30;

// Категории-корзины: «Прочее двигатель», «Мелкие детали АКПП», «Кронштейны
// мелкие» и т.п. Это внутренние вёдра, под которые никто не ищет, — как
// посадочные они бесполезны. Плюс small-parts-staging, служебное название,
// которому вообще не место в публичном интерфейсе.
//
// Правило по слагу, а не по названию: колонки-флага в parts_categories нет,
// а эти три шаблона покрывают ровно 25 таких категорий из 176 и ни одной
// лишней (проверено по выгрузке дерева).
const BUCKET_SLUG = /(^small-|-small-|-other$|staging)/;

/**
 * Служебная/мусорная категория: не показываем в навигации, не индексируем,
 * не кладём в sitemap. Из дерева при этом НЕ вырезаем — иначе её товары
 * выпали бы из поддерева родителя и потеряли единственный путь обхода
 * (у одной только small-parts-staging таких 247).
 */
export const isBucketCategory = (slug: string) => BUCKET_SLUG.test(slug);

/** Категории, которые показываем человеку в навигации. */
export const visibleChildren = (node: CategoryNode) =>
  node.children.filter((c) => !isBucketCategory(c.slug));

/**
 * Слаги категорий, которые заслуживают индексации. Нужны сайтмапу: класть
 * туда noindex-страницы — противоречивый сигнал, Google на него ругается.
 *
 * Считается раз в сутки: это ~176 HEAD-запросов (count без выборки строк),
 * поэтому обёрнуто в кэш с большим окном, а не считается на каждый запрос.
 */
export const getIndexableCategorySlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await fetchCategories();
    const { byId } = indexCategories(rows);
    const supabase = createServerClient();

    const nodes = [...byId.values()];
    const out: string[] = [];
    // Небольшими партиями, чтобы не открывать 176 соединений разом.
    for (let i = 0; i < nodes.length; i += 12) {
      const batch = nodes.slice(i, i + 12);
      const counts = await Promise.all(
        batch.map(async (node) => {
          const { count } = await supabase
            .from("parts_products")
            .select("*", { count: "exact", head: true })
            .in("subcategory_id", subtreeIds(node));
          return { slug: node.slug, count: count ?? 0 };
        })
      );
      for (const c of counts) {
        if (c.count >= CAT_MIN_PARTS && !isBucketCategory(c.slug)) out.push(c.slug);
      }
    }
    return out;
  },
  ["parts-indexable-categories"],
  { revalidate: 86400, tags: ["parts-categories"] }
);
