// PopularModels — horizontal strip of the most-stocked vehicle generations,
// linking into the /fitment/[brand]/[slug] SEO pages. Server component so the
// links are crawlable (internal linking → fitment pages) and cached daily.
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { BrandLogo } from "./BrandLogo";

const MIN_PARTS = 10;
const LIMIT = 15;

const BRAND_NAMES: Record<string, string> = {
  hyundai: "Hyundai", kia: "Kia", genesis: "Genesis", ssangyong: "SsangYong", audi: "Audi",
};

const LABELS: Record<string, string> = {
  ru: "Популярные модели", en: "Popular Models", ko: "인기 모델",
  ka: "პოპულარული მოდელები", ar: "الطرازات الشائعة",
};

interface VehicleRow {
  id: number;
  brand: string;
  name_en: string;
  year_from: string | null;
  year_to: string | null;
  open_ended: boolean;
  parts_count: number;
  slug: string;
  model_ko: string | null;
}

const fetchPopular = unstable_cache(
  async (): Promise<VehicleRow[]> => {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("vehicles")
      .select("id, brand, name_en, year_from, year_to, open_ended, parts_count, slug, model_ko")
      .gte("parts_count", MIN_PARTS)
      .order("parts_count", { ascending: false })
      .limit(60);

    const rows = (data ?? []) as VehicleRow[];
    // Dedupe by model so the strip shows variety (not 3 Sonata generations in a row);
    // the highest-parts generation per model wins since rows are sorted desc.
    const seen = new Set<string>();
    const out: VehicleRow[] = [];
    for (const v of rows) {
      const key = v.model_ko || `${v.brand}:${v.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
      if (out.length >= LIMIT) break;
    }
    return out;
  },
  ["popular-models-strip"],
  { revalidate: 86400 }
);

function years(v: VehicleRow): string {
  const yf = v.year_from ? String(v.year_from).split(".")[0] : "";
  const yt = v.year_to ? String(v.year_to).split(".")[0] : v.open_ended ? "…" : "";
  if (!yf && !yt) return "";
  return `${yf}${yt ? "–" + yt : ""}`;
}

function displayName(v: VehicleRow): string {
  const brandName = BRAND_NAMES[v.brand] ?? v.brand;
  // Genesis models already carry "Genesis" in name_en — avoid "Genesis Genesis"
  const withBrand = v.name_en.startsWith(brandName) ? v.name_en : `${brandName} ${v.name_en}`;
  const y = years(v);
  return `${withBrand}${y ? ` (${y})` : ""}`;
}

export async function PopularModels({ lang }: { lang: string }) {
  const rows = await fetchPopular();
  if (!rows.length) return null;

  return (
    <section aria-label={LABELS[lang] ?? LABELS.ru} className="relative -mt-2 pb-4">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--pn-text-dim)] mb-3">
          {LABELS[lang] ?? LABELS.ru}
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {rows.map((v) => (
            <Link
              key={v.id}
              href={`/${lang}/fitment/${v.brand}/${v.slug}`}
              className="group flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-xl bg-[var(--pn-surface)] border border-[var(--pn-border)] hover:border-[var(--pn-orange)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="w-9 h-9 rounded-lg bg-[var(--pn-surface-3)] flex items-center justify-center text-[var(--pn-text-muted)] group-hover:text-[var(--pn-orange)] transition-colors shrink-0">
                <BrandLogo brand={v.brand} className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-[var(--pn-text)] whitespace-nowrap">
                {displayName(v)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
