import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { CAT_MIN_PARTS, isBucketCategory, ownsSlug } from "./partsCategoryRules";

export { CAT_MIN_PARTS, isBucketCategory } from "./partsCategoryRules";

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
  for (const node of byId.values()) {
    const current = bySlug.get(node.slug);
    if (!current || node.id < current.id) bySlug.set(node.slug, node);
  }

  return { byId, bySlug, roots: [...byId.values()].filter((n) => n.parent_id === null) };
}

/** id узла и всех его потомков — то, по чему фильтруются товары. */
export function subtreeIds(node: CategoryNode): number[] {
  const out: number[] = [node.id];
  for (const child of node.children) out.push(...subtreeIds(child));
  return out;
}

/**
 * Сколько товаров в каждой подкатегории: { subcategory_id → количество }.
 *
 * Считается ОДНИМ проходом по колонке subcategory_id, а не запросом на
 * категорию. Замер на живой базе: один `count` по 48 689 строкам стоит
 * ~0.9 с сам по себе, то есть 176 категорий — это минуты, и на холодном
 * кэше от этого вставали и sitemap, и рендер /parts. Постраничная выборка
 * одной колонки: 49 параллельных запросов, 1.3 с суммарно.
 */
const getSubcategoryHistogram = unstable_cache(
  async (): Promise<Record<number, number>> => {
    const supabase = createServerClient();
    const PAGE = 1000;

    const first = await supabase
      .from("parts_products")
      .select("subcategory_id", { count: "exact" })
      .range(0, PAGE - 1);

    const total = first.count ?? 0;
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) =>
        supabase
          .from("parts_products")
          .select("subcategory_id")
          .range((i + 1) * PAGE, (i + 2) * PAGE - 1)
          .then((r) => r.data ?? [])
      )
    );

    const histogram: Record<number, number> = {};
    for (const row of [...(first.data ?? []), ...rest.flat()]) {
      const id = (row as { subcategory_id: number | null }).subcategory_id;
      if (id !== null) histogram[id] = (histogram[id] ?? 0) + 1;
    }
    return histogram;
  },
  ["parts-subcategory-histogram"],
  { revalidate: 3600, tags: ["parts-categories"] }
);

/** Количество товаров в поддереве категории — из гистограммы, без запросов. */
export async function getCategoryCount(ids: number[]): Promise<number> {
  const histogram = await getSubcategoryHistogram();
  return ids.reduce((sum, id) => sum + (histogram[id] ?? 0), 0);
}

export const localizedName = (node: PartsCategory, lang: string) =>
  lang === "ru" ? node.name_ru : node.name_en || node.name_ru;



/** Категории, которые показываем человеку в навигации. */
export const visibleChildren = (node: CategoryNode) =>
  node.children.filter((c) => !isBucketCategory(c.slug));

/**
 * Слаги категорий, которые заслуживают индексации. Нужны сайтмапу: класть
 * туда noindex-страницы — противоречивый сигнал. Тот же список получает
 * облако категорий в сайдбаре, чтобы навигация и сайтмап не разъезжались.
 *
 * Своего кэша не держит: считается из гистограммы и дерева, оба закэшированы.
 */
export async function getIndexableCategorySlugs(): Promise<string[]> {
  const [rows, histogram] = await Promise.all([
    getPartsCategories(),
    getSubcategoryHistogram(),
  ]);
  const { byId } = indexCategories(rows);

  const nodes = [...byId.values()];
  return nodes
    .filter((node) => {
      if (isBucketCategory(node.slug)) return false;
      // Слаг может принадлежать двум категориям — в sitemap нужен один <loc>.
      if (!ownsSlug(node, nodes)) return false;
      const count = subtreeIds(node).reduce((s, id) => s + (histogram[id] ?? 0), 0);
      return count >= CAT_MIN_PARTS;
    })
    .map((node) => node.slug);
}
