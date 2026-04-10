"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogList from "@/components/Blog/BlogList";
import { BlogPost, BlogListResponse } from "@/types/blog";
import { ChevronLeft, ChevronRight, Tag, ArrowLeft } from "lucide-react";

const LIMIT = 12;

interface Props {
  tag: string;
}

export default function BlogTagClientPage({ tag }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language as "ru" | "en" | "ko";

  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
    fetchPosts();
  }, [fetchPosts]);

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002C5F] to-[#001f45] py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("blog.back", "Назад")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">
                {t("blog.tag", "Тег")}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {tag}
              </h1>
            </div>
          </div>
          {!loading && (
            <p className="text-white/50 text-sm">
              {t("blog.found", { count: total })}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <BlogList posts={posts} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#BB162B] hover:text-[#BB162B] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                  page === p
                    ? "bg-[#BB162B] text-white"
                    : "border border-gray-200 text-gray-600 hover:border-[#BB162B] hover:text-[#BB162B]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#BB162B] hover:text-[#BB162B] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back to blog link */}
        {!loading && posts.length === 0 && (
          <div className="text-center">
            <Link
              href={`/${lang}/blog`}
              className="text-[#BB162B] hover:underline text-sm font-medium"
            >
              ← {t("blog.allPosts", "Все статьи")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
