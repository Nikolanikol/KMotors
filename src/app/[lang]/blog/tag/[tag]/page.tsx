import type { Metadata } from "next";
import BlogTagClientPage from "./BlogTagClientPage";
import { createServerClient } from "@/lib/supabase";
import { BlogPost } from "@/types/blog";

export const revalidate = 3600;

const LIMIT = 12;

async function fetchTagPosts(tag: string, lang: string): Promise<{ posts: BlogPost[]; total: number; totalPages: number }> {
  try {
    const supabase = createServerClient();
    const { data, count } = await supabase
      .from("blog_posts")
      .select("id, slug, category, source, published_at, cover_url, tags, title_ru, title_en, title_ko, title_ka, title_ar, excerpt_ru, excerpt_en, excerpt_ko, excerpt_ka, excerpt_ar", { count: "exact" })
      .eq("published", true)
      .contains("tags", [tag])
      .order("published_at", { ascending: false })
      .range(0, LIMIT - 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: BlogPost[] = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      category: row.category,
      source: row.source,
      published_at: row.published_at,
      cover_url: row.cover_url,
      tags: row.tags,
      title: row[`title_${lang}`] || row.title_ru || "",
      excerpt: row[`excerpt_${lang}`] || row.excerpt_ru || "",
    }));

    const total = count ?? 0;
    return { posts, total, totalPages: Math.ceil(total / LIMIT) };
  } catch {
    return { posts: [], total: 0, totalPages: 1 };
  }
}

interface Props {
  params: Promise<{ lang: string; tag: string }>;
}

const TAG_META: Record<string, (tag: string) => { title: string; description: string }> = {
  ru: (tag) => ({
    title: `${tag} — статьи и обзоры`,
    description: `Все статьи по теме «${tag}»: сравнения, обзоры, гайды по корейским автомобилям.`,
  }),
  en: (tag) => ({
    title: `${tag} — Articles & Reviews`,
    description: `All articles on "${tag}": comparisons, reviews, guides on Korean cars.`,
  }),
  ko: (tag) => ({
    title: `${tag} — 기사 및 리뷰`,
    description: `"${tag}" 관련 모든 기사: 비교, 리뷰, 한국 자동차 가이드.`,
  }),
  ka: (tag) => ({
    title: `${tag} — სტატიები და მიმოხილვები`,
    description: `ყველა სტატია თემაზე "${tag}": შედარებები, მიმოხილვები, კორეული ავტომობილების გზამკვლევები.`,
  }),
  ar: (tag) => ({
    title: `${tag} — مقالات ومراجعات`,
    description: `جميع المقالات حول "${tag}": مقارنات، مراجعات، أدلة حول السيارات الكورية.`,
  }),
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const getMeta = TAG_META[lang] || TAG_META.ru;
  const { title, description } = getMeta(decodedTag);

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `https://www.kmotors.shop/${lang}/blog/tag/${tag}`,
      images: [{ url: "https://www.kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical: `https://www.kmotors.shop/${lang}/blog/tag/${tag}`,
      languages: {
        ru: `https://www.kmotors.shop/ru/blog/tag/${tag}`,
        en: `https://www.kmotors.shop/en/blog/tag/${tag}`,
        ka: `https://www.kmotors.shop/ka/blog/tag/${tag}`,
        ar: `https://www.kmotors.shop/ar/blog/tag/${tag}`,
        "x-default": `https://www.kmotors.shop/ru/blog/tag/${tag}`,
      },
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { lang, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const { posts, total, totalPages } = await fetchTagPosts(decodedTag, lang);

  return (
    <BlogTagClientPage
      tag={decodedTag}
      initialPosts={posts}
      initialTotal={total}
      initialTotalPages={totalPages}
    />
  );
}
