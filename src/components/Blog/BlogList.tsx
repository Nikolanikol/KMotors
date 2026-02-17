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
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-100 rounded-full ml-auto" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
        <div className="space-y-2 pt-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
          <div className="h-3 bg-gray-100 rounded w-4/6" />
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
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-base">{t("blog.empty")}</p>
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
