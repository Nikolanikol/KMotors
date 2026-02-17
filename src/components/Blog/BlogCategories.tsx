"use client";

import { useTranslation } from "react-i18next";
import { BlogCategory } from "@/types/blog";

const CATEGORIES: { value: BlogCategory | "all"; labelKey: string }[] = [
  { value: "all", labelKey: "blog.all" },
  { value: "news", labelKey: "blog.news" },
  { value: "guide", labelKey: "blog.guides" },
  { value: "review", labelKey: "blog.reviews" },
  { value: "other", labelKey: "blog.other" },
];

interface BlogCategoriesProps {
  active: string;
  onChange: (category: string) => void;
}

export default function BlogCategories({ active, onChange }: BlogCategoriesProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ value, labelKey }) => {
        const isActive = active === value || (value === "all" && !active);
        return (
          <button
            key={value}
            onClick={() => onChange(value === "all" ? "" : value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-[#BB162B] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
