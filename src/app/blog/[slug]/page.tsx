"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  news: "blog.news",
  guide: "blog.guides",
  review: "blog.reviews",
  other: "blog.other",
};

function formatDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(
      lang === "ko" ? "ko-KR" : lang === "en" ? "en-US" : "ru-RU",
      { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "ru" | "en" | "ko";

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${slug}?lang=${lang}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setPost(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, lang]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA]">
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl text-[#002C5F] font-semibold">404</p>
        <p className="text-gray-500">{t("blog.notFound", "Статья не найдена")}</p>
        <Link
          href="/blog"
          className="mt-2 inline-flex items-center gap-2 text-sm text-[#BB162B] hover:text-[#9B1220] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Cover */}
      {post.cover_url && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {!post.cover_url && (
        <div className="w-full h-32 bg-gradient-to-br from-[#002C5F] to-[#001f45]" />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[#BB162B] hover:text-[#9B1220] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>

        {/* Article header */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-10 space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#BB162B]" />
                {formatDate(post.published_at, lang)}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-[#BB162B]/10 text-[#BB162B] font-medium text-xs">
                {t(CATEGORY_LABELS[post.category] || "blog.other")}
              </span>
              {post.source && (
                <span className="text-gray-400 text-xs">
                  {t("blog.source", "Источник")}: {post.source}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#002C5F] leading-snug">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-gray-600 text-base leading-relaxed border-l-4 border-[#BB162B] pl-4 italic">
                {post.excerpt}
              </p>
            )}

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* Markdown content */}
            {post.content ? (
              <div className="prose prose-slate max-w-none prose-headings:text-[#002C5F] prose-a:text-[#BB162B] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#002C5F] prose-blockquote:border-l-[#BB162B] prose-blockquote:text-gray-600">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">
                {t("blog.noContent", "Содержимое статьи недоступно")}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#002C5F]/5 text-[#002C5F]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Back button bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#BB162B] text-white rounded-xl font-medium hover:bg-[#9B1220] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("blog.backToBlog")}
          </button>
        </div>
      </div>
    </main>
  );
}
