import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { withCleanImage } from "@/lib/partImage";
import { getCurrencyRates } from "@/utils/getCurrencyRates";
import { makeAlternates } from "@/lib/seo";
import { generatePartSlug } from "@/utils/partSlug";
import { FitmentProductsGrid } from "@/app/parts/sections/FitmentProductsGrid";
import type { Product } from "@/app/parts/sections/PartsCatalogClient";

export const revalidate = false;
export const dynamicParams = true;

const BASE = "https://www.kmotors.shop";
const PAGE_SIZE = 24;
// thin-content threshold: generation pages with fewer parts → noindex
const GEN_MIN_PARTS = 10;

const BRAND_NAMES: Record<string, string> = {
  hyundai: "Hyundai", kia: "Kia", genesis: "Genesis", ssangyong: "SsangYong", audi: "Audi",
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

const findVehicle = cache(async (brand: string, slug: string): Promise<VehicleRow | null> => {
  const { data } = await createServerClient()
    .from("vehicles")
    .select("id, brand, name_en, year_from, year_to, open_ended, parts_count, slug, model_ko")
    .eq("brand", brand)
    .eq("slug", slug)
    .maybeSingle();
  return (data as VehicleRow) ?? null;
});

function years(v: VehicleRow): string {
  const yf = v.year_from ? String(v.year_from).split(".")[0] : "";
  const yt = v.year_to ? String(v.year_to).split(".")[0] : v.open_ended ? "…" : "";
  if (!yf && !yt) return "";
  return `${yf}${yt ? "–" + yt : ""}`;
}

// K-Axis-specific copy — deliberately different wording from caranalizer to
// avoid cross-domain duplicate content on shared ru/en/ar. ko/ka are exclusive.
function buildCopy(lang: string, full: string, brandName: string) {
  const map: Record<string, { h1: string; intro: string; title: string; desc: string; count: (n: number) => string; others: string }> = {
    ru: {
      h1: `Запчасти для ${full}`,
      intro: `Каталог оригинальных запчастей Hyundai Mobis для ${full}. Двигатель, подвеска, кузов, электрика и салон — с подбором по вашему поколению. K-Axis отгружает напрямую со складов в Южной Корее.`,
      title: `Запчасти ${full} — оригинал из Кореи | K-Axis`,
      desc: `Оригинальные запчасти Hyundai Mobis для ${full}. Прямая отправка из Кореи, подбор по поколению и году выпуска.`,
      count: (n) => `Позиций в каталоге: ${n}`,
      others: `Другие поколения ${brandName}`,
    },
    en: {
      h1: `${full} Parts`,
      intro: `Genuine Hyundai Mobis parts catalog for the ${full}. Engine, suspension, body, electrical and interior — matched to your exact generation. K-Axis ships direct from warehouses in South Korea.`,
      title: `${full} Parts — Genuine OEM from Korea | K-Axis`,
      desc: `Genuine Hyundai Mobis parts for the ${full}. Direct shipping from Korea, matched by generation and model year.`,
      count: (n) => `Parts in catalog: ${n}`,
      others: `Other ${brandName} generations`,
    },
    ko: {
      h1: `${full} 부품`,
      intro: `${full}에 맞는 현대모비스 정품 부품 카탈로그입니다. 엔진, 서스펜션, 바디, 전장, 실내 부품을 세대별로 정확하게 확인하세요. K-Axis는 한국 창고에서 직접 발송합니다.`,
      title: `${full} 부품 — 한국 정품 | K-Axis`,
      desc: `${full}용 현대모비스 정품 부품. 한국에서 직접 배송, 세대·연식별 맞춤 조회.`,
      count: (n) => `카탈로그 품목: ${n}`,
      others: `다른 ${brandName} 세대`,
    },
    ka: {
      h1: `${full} ნაწილები`,
      intro: `Hyundai Mobis-ის ორიგინალი ნაწილების კატალოგი ${full}-სთვის. ძრავა, სავალი ნაწილი, ძარა, ელექტრო და სალონი — შერჩეული თქვენი თაობის მიხედვით. K-Axis აგზავნის პირდაპირ სამხრეთ კორეის საწყობებიდან.`,
      title: `${full} ნაწილები — ორიგინალი კორეიდან | K-Axis`,
      desc: `Hyundai Mobis-ის ორიგინალი ნაწილები ${full}-სთვის. პირდაპირი მიწოდება კორეიდან, შერჩევა თაობისა და წლის მიხედვით.`,
      count: (n) => `პოზიციები კატალოგში: ${n}`,
      others: `${brandName}-ის სხვა თაობები`,
    },
    ar: {
      h1: `قطع غيار ${full}`,
      intro: `كتالوج قطع غيار Hyundai Mobis الأصلية لسيارة ${full}. المحرك، التعليق، الهيكل، الكهرباء والمقصورة — مطابقة لجيل سيارتك بدقة. تشحن K-Axis مباشرة من مستودعات كوريا الجنوبية.`,
      title: `قطع غيار ${full} — أصلية من كوريا | K-Axis`,
      desc: `قطع غيار Hyundai Mobis الأصلية لسيارة ${full}. شحن مباشر من كوريا، مطابقة حسب الجيل وسنة الصنع.`,
      count: (n) => `عدد القطع في الكتالوج: ${n}`,
      others: `أجيال ${brandName} الأخرى`,
    },
  };
  return map[lang] ?? map.ru;
}

interface Props {
  params: Promise<{ lang: string; brand: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function displayName(v: VehicleRow): { full: string; brandName: string } {
  const brandName = BRAND_NAMES[v.brand] ?? v.brand;
  const y = years(v);
  // Genesis models already carry "Genesis" in name_en — avoid "Genesis Genesis"
  const withBrand = v.name_en.startsWith(brandName) ? v.name_en : `${brandName} ${v.name_en}`;
  return { full: `${withBrand}${y ? ` (${y})` : ""}`, brandName };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, brand, slug } = await params;
  const v = await findVehicle(brand, slug);
  if (!v) return {};
  const { full, brandName } = displayName(v);
  const copy = buildCopy(lang, full, brandName);
  const path = `/fitment/${brand}/${slug}`;

  return {
    title: copy.title,
    description: copy.desc,
    ...(v.parts_count < GEN_MIN_PARTS && { robots: { index: false, follow: true } }),
    alternates: makeAlternates(lang, path),
    openGraph: { title: copy.title, description: copy.desc, url: `${BASE}/${lang}${path}`, type: "website" },
  };
}

export default async function FitmentPage({ params, searchParams }: Props) {
  const { lang, brand, slug } = await params;
  const { page: pageParam } = await searchParams;

  const [v, { krwToUsd }] = await Promise.all([findVehicle(brand, slug), getCurrencyRates()]);
  if (!v) notFound();

  const supabase = createServerClient();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: pv, count: totalLinks } = await supabase
    .from("part_vehicles")
    .select("part_id", { count: "exact" })
    .eq("vehicle_id", v.id)
    .order("part_id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const partIds = (pv ?? []).map((r) => r.part_id);
  let products: Product[] = [];
  if (partIds.length) {
    const { data } = await supabase
      .from("parts_products")
      .select("id, name_ru, name_en, name_ko, part_number, price_krw, brand_id, category_id, subcategory_id, image_url, image_storage_url, is_new")
      .in("id", partIds);
    products = (data ?? []).map(withCleanImage) as Product[];
  }

  const totalPages = Math.max(1, Math.ceil((totalLinks ?? 0) / PAGE_SIZE));

  let siblings: VehicleRow[] = [];
  if (v.model_ko) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, brand, name_en, year_from, year_to, open_ended, parts_count, slug, model_ko")
      .eq("brand", v.brand)
      .eq("model_ko", v.model_ko)
      .neq("id", v.id)
      .gte("parts_count", GEN_MIN_PARTS)
      .order("year_from", { ascending: false })
      .limit(20);
    siblings = (data ?? []) as VehicleRow[];
  }

  const { full, brandName } = displayName(v);
  const copy = buildCopy(lang, full, brandName);
  const path = `/fitment/${brand}/${slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "K-Axis", item: `${BASE}/${lang}/` },
      { "@type": "ListItem", position: 2, name: lang === "ru" ? "Запчасти" : "Parts", item: `${BASE}/${lang}/parts` },
      { "@type": "ListItem", position: 3, name: full, item: `${BASE}/${lang}${path}` },
    ],
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  return (
    <div className="parts-page min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-[var(--pn-text-dim)] mb-4 flex flex-wrap gap-1.5">
          <Link href={`/${lang}`} className="hover:text-[var(--pn-orange)] transition-colors">K-Axis</Link>
          <span>/</span>
          <Link href={`/${lang}/parts`} className="hover:text-[var(--pn-orange)] transition-colors">{lang === "ru" ? "Запчасти" : "Parts"}</Link>
          <span>/</span>
          <span className="text-[var(--pn-text-muted)]">{full}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--pn-text)] mb-3">{copy.h1}</h1>
        <p className="text-[15px] text-[var(--pn-text-muted)] max-w-3xl mb-3 leading-relaxed">{copy.intro}</p>
        <p className="text-sm font-medium text-[var(--pn-orange-soft)] mb-8">{copy.count(totalLinks ?? 0)}</p>

        <FitmentProductsGrid products={products} lang={lang} krwToUsd={krwToUsd} />

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination">
            {pageNums.map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-[var(--pn-text-dim)]">…</span>}
                {p === page ? (
                  <span className="px-3 py-1.5 rounded-lg bg-[var(--pn-orange)] text-white text-sm font-semibold shadow-lg shadow-[rgba(255,122,0,0.25)]">{p}</span>
                ) : (
                  <Link
                    href={`/${lang}${path}${p > 1 ? `?page=${p}` : ""}`}
                    className="px-3 py-1.5 rounded-lg border border-[var(--pn-border)] bg-[var(--pn-surface)] text-sm text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                  >
                    {p}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}

        {siblings.length > 0 && (
          <nav aria-label={copy.others} className="mt-12">
            <h2 className="text-lg font-semibold text-[var(--pn-text)] mb-3">{copy.others}</h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/${lang}/fitment/${s.brand}/${s.slug}`}
                  className="text-sm px-3 py-1.5 rounded-full bg-[var(--pn-surface)] border border-[var(--pn-border)] text-[var(--pn-text-muted)] hover:border-[var(--pn-orange)] hover:text-[var(--pn-orange)] transition-colors"
                >
                  {s.name_en.startsWith(brandName) ? s.name_en : s.name_en}{years(s) ? ` (${years(s)})` : ""}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
