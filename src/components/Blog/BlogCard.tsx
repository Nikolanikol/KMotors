"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BlogPost } from "@/types/blog";
import { clarityEvent } from "@/utils/clarity";
import { navStart } from "@/lib/navStatus";
import { langOrDefault } from "@/lib/lang";

interface BlogCardProps {
  post: BlogPost;
}

function formatDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(
      lang === "en" ? "en-US" : lang === "ka" ? "ka-GE" : lang === "ar" ? "ar" : "ru-RU",
      { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

// Ключи словаря во множественном числе (blog.guides), а category в базе — в единственном
// (guide). Раньше карточка звала t(`blog.${category}`) и показывала сырое «guide».
const CATEGORY_LABELS: Record<string, string> = {
  news: "blog.news",
  guide: "blog.guides",
  review: "blog.reviews",
  other: "blog.other",
};

export default function BlogCard({ post }: BlogCardProps) {
  const { t, i18n } = useTranslation();
  const lang = langOrDefault(i18n.language);
  const router = useRouter();

  return (
    // Ссылка сразу с языком: адрес без него (/blog/<slug>) проходил через редирект 307.
    <Link
      href={`/${lang}/blog/${post.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
      onClick={() => clarityEvent("blog_article_click")}
    >
      <article className="flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--axis-charcoal)] border border-white/[0.06] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--axis-bronze)]/50 group-hover:shadow-[0_20px_40px_rgba(182,119,73,0.12)]">
        {/* Обложка */}
        <div className="relative w-full aspect-[1200/630] overflow-hidden flex-shrink-0 bg-[var(--axis-graphite)]">
          {post.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_url}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(182,119,73,0.25),transparent_60%)]">
              <span className="font-heading text-3xl tracking-[0.3em] text-[var(--axis-bronze)]/40">AXIS</span>
            </div>
          )}
          <span className="absolute left-3 top-3 text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full bg-[var(--axis-black)]/75 text-[var(--axis-bronze)] border border-[var(--axis-bronze)]/30 backdrop-blur-sm">
            {t(CATEGORY_LABELS[post.category] ?? "blog.other")}
          </span>
        </div>

        {/* Текст */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          <time className="text-xs text-[var(--axis-gray)]">{formatDate(post.published_at, lang)}</time>

          <h2 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 text-[var(--axis-white)] transition-colors group-hover:text-[var(--axis-bronze)]">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-[var(--axis-gray)] leading-relaxed line-clamp-3">{post.excerpt}</p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const href = `/${lang}/blog/tag/${encodeURIComponent(tag)}`;
                    navStart(href);
                    router.push(href);
                  }}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[var(--axis-gray)] border border-white/[0.06] transition-colors hover:bg-[var(--axis-bronze)]/15 hover:text-[var(--axis-bronze)] hover:border-[var(--axis-bronze)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-white/[0.06]">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--axis-bronze)] transition-all group-hover:gap-2.5">
              {t("blog.readMore")} <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
