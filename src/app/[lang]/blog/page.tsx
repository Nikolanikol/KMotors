import type { Metadata } from "next";
import BlogClientPage from "@/app/blog/BlogClientPage";
import { createServerClient } from "@/lib/supabase";
import { BlogPost } from "@/types/blog";

export const revalidate = 3600;

const LIMIT = 12;

async function fetchInitialPosts(lang: string): Promise<{ posts: BlogPost[]; total: number; totalPages: number }> {
  try {
    const supabase = createServerClient();
    const { data, count } = await supabase
      .from("blog_posts")
      .select("id, slug, category, source, published_at, cover_url, tags, title_ru, title_en, title_ko, title_ka, title_ar, excerpt_ru, excerpt_en, excerpt_ko, excerpt_ka, excerpt_ar", { count: "exact" })
      .eq("published", true)
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

const BLOG_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Блог K-Axis — авто из Кореи: советы, новости, обзоры",
    description: "Статьи от K-Axis: как купить авто из Кореи, растаможка, доставка. Обзоры Hyundai, Kia, Genesis.",
  },
  en: {
    title: "K-Axis Blog — Korean Cars: Tips, News, Reviews",
    description: "Articles from K-Axis: how to buy cars from Korea, customs, delivery. Reviews of Hyundai, Kia, Genesis.",
  },
  ko: {
    title: "K-Axis 블로그 — 한국 자동차: 팁, 뉴스, 리뷰",
    description: "K-Axis의 기사: 한국에서 자동차를 구매하는 방법, 세관, 배송. Hyundai, Kia, Genesis 리뷰.",
  },
  ka: {
    title: "K-Axis ბლოგი — კორეული ავტომობილები: რჩევები, სიახლეები",
    description: "K-Axis-ის სტატიები: კორეიდან ავტომობილის შეძენა, საბაჟო, მიტანა. Hyundai, Kia, Genesis-ის მიმოხილვები.",
  },
  ar: {
    title: "مدونة K-Axis — سيارات كورية: نصائح وأخبار ومراجعات",
    description: "مقالات K-Axis: كيفية شراء سيارات من كوريا، الجمارك، التوصيل. مراجعات Hyundai وKia وGenesis.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;

  // Блог только на русском — остальные языки не индексируем
  if (lang !== "ru") {
    return {
      title: BLOG_META[lang]?.title || BLOG_META.ru.title,
      robots: { index: false, follow: true },
      alternates: { canonical: "https://www.kmotors.shop/ru/blog" },
    };
  }

  const meta = BLOG_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: "https://www.kmotors.shop/ru/blog",
      images: [{ url: "https://www.kmotors.shop/preview/preview.png" }],
      type: "website",
    },
    alternates: {
      canonical: "https://www.kmotors.shop/ru/blog",
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { lang } = await params;

  const [{ posts, total, totalPages }] = await Promise.all([
    fetchInitialPosts(lang),
  ]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `https://www.kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: BLOG_META[lang]?.title.split("—")[0]?.trim() || "Blog", item: `https://www.kmotors.shop/${lang}/blog` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogClientPage
        initialPosts={posts}
        initialTotal={total}
        initialTotalPages={totalPages}
      />
    </>
  );
}
