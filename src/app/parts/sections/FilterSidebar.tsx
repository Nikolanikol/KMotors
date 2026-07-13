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
    <div className={cn("bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-[var(--pn-text)]">
          {t("parts.catalog.filtersTitle")}
        </h3>
        {hasAnyFilter && (
          <button
            onClick={onReset}
            className="text-xs text-[var(--pn-text-dim)] hover:text-[var(--pn-orange)] transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            {t("parts.catalog.resetFilters")}
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["brands", "categories", "price"]}>
        {/* Brand checkboxes */}
        <AccordionItem value="brands" className="border-b border-[var(--pn-border)]">
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
                    <span className={`text-sm flex-1 transition-colors ${empty ? "text-[var(--pn-text-dim)]" : "text-[var(--pn-text-muted)] group-hover:text-[var(--pn-text)]"}`}>
                      {brand.name}
                    </span>
                    <span className="text-xs text-[var(--pn-text-dim)] tabular-nums">{count}</span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category checkboxes */}
        <AccordionItem value="categories" className="border-b border-[var(--pn-border)]">
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
                    <span className={`text-sm flex-1 transition-colors ${empty ? "text-[var(--pn-text-dim)]" : "text-[var(--pn-text-muted)] group-hover:text-[var(--pn-text)]"}`}>
                      {getLocalName(cat.name_ru, cat.name_en)}
                    </span>
                    <span className="text-xs text-[var(--pn-text-dim)] tabular-nums">{count}</span>
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
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--pn-text-dim)]">$</span>
                <Input
                  type="number"
                  min={0}
                  value={pending.priceMin}
                  onChange={(e) => onPriceMinChange(e.target.value)}
                  placeholder="0"
                  className="pl-6 h-9 text-sm text-center bg-[var(--pn-surface-2)] border-[var(--pn-border)] text-[var(--pn-text)] placeholder:text-[var(--pn-text-dim)]"
                />
              </div>
              <span className="text-[var(--pn-text-dim)] text-sm">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--pn-text-dim)]">$</span>
                <Input
                  type="number"
                  min={0}
                  value={pending.priceMax}
                  onChange={(e) => onPriceMaxChange(e.target.value)}
                  placeholder="∞"
                  className="pl-6 h-9 text-sm text-center bg-[var(--pn-surface-2)] border-[var(--pn-border)] text-[var(--pn-text)] placeholder:text-[var(--pn-text-dim)]"
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
            : "bg-[var(--pn-surface-3)] text-[var(--pn-text-dim)] cursor-default"
        )}
        disabled={!isDirty}
      >
        {t("parts.catalog.filterApply")}
        {isDirty && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </Button>
    </div>
  );
}
