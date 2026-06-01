// PartsTopLinks — server component, renders static HTML links for Google crawling
// Visually hidden but accessible to search engines
import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { generatePartSlug } from "@/utils/partSlug";
import Link from "next/link";

type TopPart = {
  id: number;
  part_number: string | null;
  name_ru: string;
  name_en: string;
  category_id: number | null;
};

type Category = {
  id: number;
  name_ru: string;
  name_en: string;
  slug: string;
};

const fetchTopParts = unstable_cache(
  async () => {
    const supabase = createServerClient();

    const [partsResult, catsResult] = await Promise.all([
      supabase
        .from("parts_products")
        .select("id, part_number, name_ru, name_en, category_id")
        .not("part_number", "is", null)
        .not("name_ru", "is", null)
        .order("id", { ascending: true })
        .limit(200),
      supabase
        .from("parts_categories")
        .select("id, name_ru, name_en, slug")
        .is("parent_id", null),
    ]);

    const parts = (partsResult.data ?? []) as TopPart[];
    const cats = (catsResult.data ?? []) as Category[];

    // Group by category
    const catMap: Record<number, Category> = {};
    cats.forEach((c) => { catMap[c.id] = c; });

    const grouped: Record<string, { cat: Category; parts: TopPart[] }> = {};
    for (const p of parts) {
      const cat = p.category_id ? catMap[p.category_id] : null;
      if (!cat) continue;
      if (!grouped[cat.id]) grouped[cat.id] = { cat, parts: [] };
      if (grouped[cat.id].parts.length < 20) {
        grouped[cat.id].parts.push(p);
      }
    }

    return Object.values(grouped).slice(0, 10);
  },
  ["parts-top-links"],
  { revalidate: 86400 }
);

interface Props {
  lang: string;
}

export async function PartsTopLinks({ lang }: Props) {
  const groups = await fetchTopParts();
  if (!groups.length) return null;

  return (
    <nav
      aria-label="Популярные запчасти"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {groups.map(({ cat, parts }) => (
        <div key={cat.id}>
          <h2>{lang === "ru" ? cat.name_ru : cat.name_en}</h2>
          <ul>
            {parts.map((p) => {
              const slug = generatePartSlug(p.part_number, p.name_ru, "ru", p.id);
              return (
                <li key={p.id}>
                  <Link href={`/${lang}/parts/${slug}`}>
                    {p.name_ru} {p.part_number}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
