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
    <div className="flex flex-wrap justify-center gap-2">
      {CATEGORIES.map(({ value, labelKey }) => {
        const isActive = active === value || (value === "all" && !active);
        return (
          <button
            key={value}
            onClick={() => onChange(value === "all" ? "" : value)}
            type="button"
            aria-pressed={isActive}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)] ${
              isActive
                ? "text-white border-transparent bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_6px_18px_rgba(157,94,52,0.35)] hover:brightness-115"
                : "bg-[var(--axis-charcoal)] text-[var(--axis-silver)] border-white/[0.08] hover:bg-white/[0.06] hover:text-[var(--axis-white)] hover:border-[var(--axis-bronze)]/40"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
