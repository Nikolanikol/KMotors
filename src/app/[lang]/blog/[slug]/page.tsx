import type { Metadata } from "next";
import Script from "next/script";
import { createServerClient } from "@/lib/supabase";
import BlogPostClient from "@/app/blog/[slug]/BlogPostClient";
import { BlogPost } from "@/types/blog";

export const revalidate = 3600;

const LANGS = ["ru", "en", "ko", "ka", "ar"];

export async function generateStaticParams() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("published", true);

    if (!data) return [];

    return data.flatMap(({ slug }) =>
      LANGS.map((lang) => ({ lang, slug }))
    );
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

async function fetchPost(slug: string, lang: string): Promise<BlogPost | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    if (!data) return null;
    return {
      id: data.id,
      slug: data.slug,
      category: data.category,
      source: data.source,
      published_at: data.published_at,
      cover_url: data.cover_url,
      tags: data.tags,
      title: data[`title_${lang}`] || data.title_ru || "",
      excerpt: data[`excerpt_${lang}`] || data.excerpt_ru || "",
      content: data[`content_${lang}`] || data.content_ru || "",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await fetchPost(slug, lang);

  if (!post) return { title: "Post not found | KMotors" };

  return {
    title: `${post.title} | KMotors`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `https://kmotors.shop/${lang}/blog/${slug}`,
      images: post.cover_url
        ? [{ url: post.cover_url, alt: post.title }]
        : [{ url: "https://kmotors.shop/preview/preview.png" }],
      type: "article",
      publishedTime: post.published_at,
      siteName: "KMotors",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      images: post.cover_url ? [post.cover_url] : ["https://kmotors.shop/preview/preview.png"],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/blog/${slug}`,
      languages: {
        ru: `https://kmotors.shop/ru/blog/${slug}`,
        en: `https://kmotors.shop/en/blog/${slug}`,
        ko: `https://kmotors.shop/ko/blog/${slug}`,
        ka: `https://kmotors.shop/ka/blog/${slug}`,
        ar: `https://kmotors.shop/ar/blog/${slug}`,
        "x-default": `https://kmotors.shop/ru/blog/${slug}`,
      },
    },
  };
}

const BLOG_LABEL: Record<string, string> = {
  ru: "Блог", en: "Blog", ko: "블로그", ka: "ბლოგი", ar: "المدونة",
};

export default async function BlogPostPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const post = await fetchPost(slug, lang);

  const breadcrumbSchema = post ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: BLOG_LABEL[lang] || "Blog", item: `https://kmotors.shop/${lang}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://kmotors.shop/${lang}/blog/${slug}` },
    ],
  } : null;

  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.cover_url || "https://kmotors.shop/preview/preview.png",
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { "@type": "Organization", name: "KMotors", url: "https://kmotors.shop/" },
    publisher: {
      "@type": "Organization",
      name: "KMotors",
      logo: { "@type": "ImageObject", url: "https://kmotors.shop/favicon_io/android-chrome-192x192.png" },
    },
    description: post.excerpt || post.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://kmotors.shop/${lang}/blog/${slug}` },
  } : null;

  return (
    <>
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {jsonLd && (
        <Script
          id="article-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostClient initialPost={post} />
    </>
  );
}
