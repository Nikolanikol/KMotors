import type { Metadata } from "next";
import Script from "next/script";
import { createServerClient } from "@/lib/supabase";
import BlogPostClient from "./BlogPostClient";
import { SITE_URL } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPost(slug: string) {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title_ru, excerpt_ru, cover_url, published_at, category, tags")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return {
      title: "Статья не найдена | K-Axis",
    };
  }

  return {
    title: `${post.title_ru} | K-Axis`,
    description: post.excerpt_ru || post.title_ru,
    openGraph: {
      title: post.title_ru,
      description: post.excerpt_ru || post.title_ru,
      url: `${SITE_URL}/blog/${slug}`,
      // Обложка перекрывает файловую конвенцию — это и нужно. Без обложки
      // images остаётся undefined, и картинку даёт корневая opengraph-image.tsx.
      images: post.cover_url ? [{ url: post.cover_url, alt: post.title_ru }] : undefined,
      type: "article",
      publishedTime: post.published_at,
      siteName: "K-Axis",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title_ru,
      description: post.excerpt_ru || post.title_ru,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
      languages: {
        ru: `${SITE_URL}/blog/${slug}`,
        en: `${SITE_URL}/blog/${slug}`,
        ka: `${SITE_URL}/blog/${slug}`,
        ar: `${SITE_URL}/blog/${slug}`,
        "x-default": `${SITE_URL}/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title_ru,
        image: post.cover_url || `${SITE_URL}/opengraph-image`,
        datePublished: post.published_at,
        dateModified: post.published_at,
        author: {
          "@type": "Organization",
          name: "K-Axis",
          url: `${SITE_URL}/`,
        },
        publisher: {
          "@type": "Organization",
          name: "K-Axis",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon_io/android-chrome-192x192.png`,
          },
        },
        description: post.excerpt_ru || post.title_ru,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}/blog/${slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="article-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostClient />
    </>
  );
}
