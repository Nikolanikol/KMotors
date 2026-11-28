"use client";

import { useTranslation } from "react-i18next";
import { BlogPost } from "@/types/blog";
import BlogCard from "./BlogCard";
import { FileText } from "lucide-react";

interface BlogListProps {
  posts: BlogPost[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--axis-charcoal)] border border-white/[0.06] animate-pulse">
      <div className="w-full aspect-[1200/630] bg-[var(--axis-graphite)]" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-24 bg-white/[0.06] rounded-full" />
        <div className="h-4 bg-white/[0.08] rounded w-4/5" />
        <div className="h-4 bg-white/[0.08] rounded w-3/5" />
        <div className="space-y-2 pt-1">
          <div className="h-3 bg-white/[0.05] rounded w-full" />
          <div className="h-3 bg-white/[0.05] rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default function BlogList({ posts, loading }: BlogListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--axis-bronze)]/10 border border-[var(--axis-bronze)]/30 flex items-center justify-center">
          <FileText className="w-8 h-8 text-[var(--axis-bronze)]" />
        </div>
        <p className="text-[var(--axis-gray)] text-base">{t("blog.empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
