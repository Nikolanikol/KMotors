"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import BlogList from "@/components/Blog/BlogList";
import BlogSearch from "@/components/Blog/BlogSearch";
import BlogCategories from "@/components/Blog/BlogCategories";
import Breadcrumb from "@/components/Breadcrumb";
import { BlogPost, BlogListResponse } from "@/types/blog";
import BlogPagination from "@/components/Blog/BlogPagination";

const LIMIT = 12;

interface ServerProps {
  initialPosts?: BlogPost[];
  initialTotal?: number;
  initialTotalPages?: number;
}

// Inner component that uses useSearchParams — must be inside <Suspense>
function BlogContent({ initialPosts = [], initialTotal = 0, initialTotalPages = 1 }: ServerProps) {
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
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
      {/* Search bar */}
      <div className="flex justify-center">
        <BlogSearch value={search} onChange={handleSearch} />
      </div>

      {/* Categories */}
      <BlogCategories active={category} onChange={handleCategory} />

      {/* Count */}
      {!loading && total > 0 && (
        <p className="text-sm text-[var(--axis-gray)] text-center">
          {t("blog.found", { count: total })}
        </p>
      )}

      {/* Posts grid */}
      <BlogList posts={posts} loading={loading} />

      <BlogPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// Outer page — Hero is outside Suspense so it renders immediately
export default function BlogPage({ initialPosts, initialTotal, initialTotalPages }: ServerProps) {
  const { t, i18n } = useTranslation();

  return (
    <main className="min-h-screen bg-[var(--axis-black)] text-[var(--axis-white)]">
      {/* Hero — outside Suspense, renders without useSearchParams */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full bg-[var(--axis-bronze)]/15 blur-[120px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 sm:pb-12">
          <Breadcrumb items={[
            { label: "K-Axis", href: `/${i18n.language}/` },
            { label: t("blog.title") },
          ]} />
          <div className="text-center mt-10 sm:mt-14">
            <span className="block h-0.5 w-12 rounded-full bg-[var(--axis-bronze)] mx-auto mb-5" />
            <h1 className="font-heading text-4xl md:text-5xl">
              {t("blog.title")}
            </h1>
            <p className="text-[var(--axis-gray)] text-sm md:text-base max-w-xl mx-auto mt-4">
              {t("blog.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Content with search params — must be in Suspense */}
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl h-80 animate-pulse bg-[var(--axis-charcoal)] border border-white/[0.06]"
                />
              ))}
            </div>
          </div>
        }
      >
        <BlogContent
          initialPosts={initialPosts}
          initialTotal={initialTotal}
          initialTotalPages={initialTotalPages}
        />
      </Suspense>
    </main>
  );
}
