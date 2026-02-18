import type { Metadata } from "next";
import Script from "next/script";
import { createServerClient } from "@/lib/supabase";
import BlogPostClient from "./BlogPostClient";

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
      title: "Статья не найдена | KMotors",
    };
  }

  return {
    title: `${post.title_ru} | KMotors`,
    description: post.excerpt_ru || post.title_ru,
    openGraph: {
      title: post.title_ru,
      description: post.excerpt_ru || post.title_ru,
      url: `https://kmotors.shop/blog/${slug}`,
      images: post.cover_url
        ? [{ url: post.cover_url, alt: post.title_ru }]
        : [{ url: "https://kmotors.shop/preview/preview.png" }],
      type: "article",
      publishedTime: post.published_at,
      siteName: "KMotors",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title_ru,
      description: post.excerpt_ru || post.title_ru,
      images: post.cover_url ? [post.cover_url] : ["https://kmotors.shop/preview/preview.png"],
    },
    alternates: {
      canonical: `https://kmotors.shop/blog/${slug}`,
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
        image: post.cover_url || "https://kmotors.shop/preview/preview.png",
        datePublished: post.published_at,
        dateModified: post.published_at,
        author: {
          "@type": "Organization",
          name: "KMotors",
          url: "https://kmotors.shop/",
        },
        publisher: {
          "@type": "Organization",
          name: "KMotors",
          logo: {
            "@type": "ImageObject",
            url: "https://kmotors.shop/favicon_io/android-chrome-192x192.png",
          },
        },
        description: post.excerpt_ru || post.title_ru,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://kmotors.shop/blog/${slug}`,
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
