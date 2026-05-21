"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  news: "bg-blue-500/10 text-blue-400",
  guide: "bg-green-500/10 text-green-400",
  review: "bg-purple-500/10 text-purple-400",
  other: "bg-white/5 text-gray-400",
};

export default function BlogCard({ post }: BlogCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-200" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.4)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(255,69,0,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
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
            <time className="text-xs" style={{ color: "var(--axis-gray)" }}>
              {formatDate(post.published_at, lang)}
            </time>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold leading-snug line-clamp-2 transition-colors" style={{ color: "var(--axis-white)" }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: "var(--axis-gray)" }}>
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {post.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/${lang}/blog/tag/${encodeURIComponent(tag)}`);
                  }}
                  className="text-xs px-2 py-0.5 rounded-full transition-colors" style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Read more */}
          <div className="mt-auto pt-3 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
            <span className="text-sm font-medium transition-colors" style={{ color: "var(--axis-orange)" }}>
              {t("blog.readMore")} →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
