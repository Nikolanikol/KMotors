"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BlogPost } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-blue-100 text-blue-700",
  guide: "bg-green-100 text-green-700",
  review: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

export default function BlogCard({ post }: BlogCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-200 group-hover:border-[#BB162B] group-hover:shadow-md">
        {/* Cover image */}
        {post.cover_url ? (
          <div className="relative w-full h-48 overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full h-48 flex-shrink-0 bg-gradient-to-br from-[#002C5F] to-[#001f45] flex items-center justify-center">
            <span className="text-5xl opacity-30">📰</span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Category badge */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                CATEGORY_COLORS[post.category] || CATEGORY_COLORS.other
              }`}
            >
              {t(`blog.${post.category}`, post.category)}
            </span>
            <time className="text-xs text-gray-400">
              {formatDate(post.published_at, lang)}
            </time>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold text-[#002C5F] leading-snug line-clamp-2 group-hover:text-[#BB162B] transition-colors">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#002C5F]/5 text-[#002C5F]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Read more */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-[#BB162B] group-hover:text-[#9B1220] transition-colors">
              {t("blog.readMore")} →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
