"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogList from "@/components/Blog/BlogList";
import { BlogPost, BlogListResponse } from "@/types/blog";
import { Tag, ArrowLeft } from "lucide-react";
import BlogPagination from "@/components/Blog/BlogPagination";
import Breadcrumb from "@/components/Breadcrumb";

const LIMIT = 12;

interface Props {
  tag: string;
  initialPosts?: BlogPost[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export default function BlogTagClientPage({
  tag,
  initialPosts = [],
  initialTotal = 0,
  initialTotalPages = 1,
}: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language as "ru" | "en" | "ko";

  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const skipFirstFetch = useRef(initialPosts.length > 0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lang,
        limit: String(LIMIT),
        page: String(page),
        tag,
      });
      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: BlogListResponse = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [lang, page, tag]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    fetchPosts();
  }, [fetchPosts]);

  return (
    <main className="min-h-screen bg-[var(--axis-black)] text-[var(--axis-white)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[300px] rounded-full bg-[var(--axis-bronze)]/15 blur-[120px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 space-y-6">
          <Breadcrumb items={[
            { label: "K-Axis", href: `/${lang}/` },
            { label: t("blog.title"), href: `/${lang}/blog` },
            { label: `#${tag}` },
          ]} />
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-3 rounded-lg text-sm text-[var(--axis-gray)] transition hover:text-[var(--axis-white)] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("blog.back", "Назад")}
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--axis-bronze)]/10 border border-[var(--axis-bronze)]/30 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-[var(--axis-bronze)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--axis-bronze)] mb-1">
                {t("blog.tag", "Тег")}
              </p>
              <h1 className="font-heading text-3xl md:text-4xl break-words">#{tag}</h1>
            </div>
          </div>
          {!loading && (
            <p className="text-sm text-[var(--axis-gray)]">{t("blog.found", { count: total })}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
        <BlogList posts={posts} loading={loading} />

        <BlogPagination page={page} totalPages={totalPages} onChange={setPage} />

        {!loading && posts.length === 0 && (
          <div className="text-center">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--axis-bronze)] transition hover:bg-[var(--axis-bronze)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            >
              ← {t("blog.allPosts", "Все статьи")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
