"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import type { Brand, Category } from "./PartsCatalogClient";

export interface PendingFilters {
  brands: string[];
  categories: string[];
  priceMin: string;
  priceMax: string;
}

interface FilterSidebarProps {
  brands: Brand[];
  parentCats: Category[];
  brandCounts: Record<number, number>;
  catCounts: Record<number, number>;
  pending: PendingFilters;
  onToggleBrand: (slug: string) => void;
  onToggleCategory: (slug: string) => void;
  onPriceMinChange: (val: string) => void;
  onPriceMaxChange: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
  isDirty: boolean;
  t: (key: string) => string;
  getLocalName: (ru: string, en: string) => string;
  className?: string;
}

export function FilterSidebar({
  brands, parentCats, brandCounts, catCounts,
  pending, onToggleBrand, onToggleCategory,
  onPriceMinChange, onPriceMaxChange,
  onApply, onReset, isDirty,
  t, getLocalName, className,
}: FilterSidebarProps) {
  const hasAnyFilter = pending.brands.length > 0 || pending.categories.length > 0 || pending.priceMin || pending.priceMax;

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm p-5", className)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-[var(--pn-deep-navy)]">
          {t("parts.catalog.filtersTitle")}
        </h3>
        {hasAnyFilter && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-[var(--pn-orange)] transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            {t("parts.catalog.resetFilters")}
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["brands", "categories", "price"]}>
        {/* Brand checkboxes */}
        <AccordionItem value="brands" className="border-b border-gray-100">
          <AccordionTrigger className="py-3 text-sm font-semibold text-[var(--pn-deep-navy)] hover:no-underline">
            {t("parts.catalog.filterBrand")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5">
              {brands.map((brand) => {
                const checked = pending.brands.includes(brand.slug);
                const count = brandCounts[brand.id] ?? 0;
                const empty = count === 0 && !checked;
                return (
                  <label key={brand.id} className={`flex items-center gap-2.5 group ${empty ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    <Checkbox
                      checked={checked}
                      disabled={empty}
                      onCheckedChange={() => onToggleBrand(brand.slug)}
                    />
                    <span className={`text-sm flex-1 transition-colors ${empty ? "text-gray-400" : "text-gray-700 group-hover:text-[var(--pn-deep-navy)]"}`}>
                      {brand.name}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category checkboxes */}
        <AccordionItem value="categories" className="border-b border-gray-100">
          <AccordionTrigger className="py-3 text-sm font-semibold text-[var(--pn-deep-navy)] hover:no-underline">
            {t("parts.catalog.filterCategory")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5">
              {parentCats.map((cat) => {
                const checked = pending.categories.includes(cat.slug);
                const count = catCounts[cat.id] ?? 0;
                const empty = count === 0 && !checked;
                return (
                  <label key={cat.id} className={`flex items-center gap-2.5 group ${empty ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    <Checkbox
                      checked={checked}
                      disabled={empty}
                      onCheckedChange={() => onToggleCategory(cat.slug)}
                    />
                    <span className={`text-sm flex-1 transition-colors ${empty ? "text-gray-400" : "text-gray-700 group-hover:text-[var(--pn-deep-navy)]"}`}>
                      {getLocalName(cat.name_ru, cat.name_en)}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price range */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="py-3 text-sm font-semibold text-[var(--pn-deep-navy)] hover:no-underline">
            {t("parts.catalog.filterPrice")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <Input
                  type="number"
                  min={0}
                  value={pending.priceMin}
                  onChange={(e) => onPriceMinChange(e.target.value)}
                  placeholder="0"
                  className="pl-6 h-9 text-sm text-center text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <span className="text-gray-400 text-sm">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <Input
                  type="number"
                  min={0}
                  value={pending.priceMax}
                  onChange={(e) => onPriceMaxChange(e.target.value)}
                  placeholder="∞"
                  className="pl-6 h-9 text-sm text-center text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        onClick={onApply}
        className={cn(
          "w-full mt-4 font-semibold transition-all",
          isDirty
            ? "bg-[var(--pn-orange)] hover:brightness-110 text-white"
            : "bg-gray-200 text-gray-400 cursor-default"
        )}
        disabled={!isDirty}
      >
        {t("parts.catalog.filterApply")}
        {isDirty && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </Button>
    </div>
  );
}
