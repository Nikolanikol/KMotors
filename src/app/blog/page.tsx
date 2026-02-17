"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import BlogList from "@/components/Blog/BlogList";
import BlogSearch from "@/components/Blog/BlogSearch";
import BlogCategories from "@/components/Blog/BlogCategories";
import { BlogPost, BlogListResponse } from "@/types/blog";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT = 12;

// Inner component that uses useSearchParams — must be inside <Suspense>
function BlogContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lang = i18n.language as "ru" | "en" | "ko";
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialPage = parseInt(searchParams.get("page") || "1");

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
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
      });
      if (category) params.set("category", category);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: BlogListResponse = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [lang, category, search, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [category, search, page, pathname, router]);

  const handleCategory = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Search bar */}
      <div className="flex justify-center">
        <BlogSearch value={search} onChange={handleSearch} />
      </div>

      {/* Categories */}
      <BlogCategories active={category} onChange={handleCategory} />

      {/* Count */}
      {!loading && total > 0 && (
        <p className="text-sm text-gray-500">
          {t("blog.found", { count: total })}
        </p>
      )}

      {/* Posts grid */}
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

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) {
                acc.push("…");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "…" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                    page === item
                      ? "bg-[#BB162B] text-white"
                      : "border border-gray-200 text-gray-600 hover:border-[#BB162B] hover:text-[#BB162B]"
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#BB162B] hover:text-[#BB162B] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Outer page — Hero is outside Suspense so it renders immediately
export default function BlogPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Hero — outside Suspense, renders without useSearchParams */}
      <section className="bg-gradient-to-br from-[#002C5F] to-[#001f45] py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {t("blog.title")}
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto">
            {t("blog.subtitle")}
          </p>
        </div>
      </section>

      {/* Content with search params — must be in Suspense */}
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100"
                />
              ))}
            </div>
          </div>
        }
      >
        <BlogContent />
      </Suspense>
    </main>
  );
}
