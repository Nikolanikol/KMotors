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
  const g = { backgroundColor: "var(--axis-graphite)" };
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="w-full h-48" style={g} />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full" style={g} />
          <div className="h-5 w-20 rounded-full ml-auto" style={g} />
        </div>
        <div className="h-4 w-4/5 rounded" style={g} />
        <div className="h-4 w-3/5 rounded" style={g} />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded" style={g} />
          <div className="h-3 w-5/6 rounded" style={g} />
          <div className="h-3 w-4/6 rounded" style={g} />
        </div>
      </div>
    </div>
  );
}

export default function BlogList({ posts, loading }: BlogListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--axis-graphite)" }}>
          <FileText className="w-8 h-8" style={{ color: "var(--axis-gray)" }} />
        </div>
        <p className="text-base" style={{ color: "var(--axis-gray)" }}>{t("blog.empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
