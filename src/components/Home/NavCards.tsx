"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useCountry } from "@/hooks/useCountry";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const CARDS = [
  {
    icon: "🚗",
    titleKey: "nav.catalog",
    descKey: "navCards.catalogDesc",
    href: "/catalog",
    color: "var(--axis-orange)",
    bg: "rgba(255,69,0,0.08)",
    border: "rgba(255,69,0,0.2)",
  },
  {
    icon: "🔧",
    titleKey: "nav.parts",
    descKey: "navCards.partsDesc",
    href: "/parts",
    color: "#229ED9",
    bg: "rgba(34,158,217,0.08)",
    border: "rgba(34,158,217,0.2)",
  },
  {
    icon: "🧮",
    titleKey: "nav.calculator",
    descKey: "navCards.calcDesc",
    href: "/calculator",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
  },
];

const FALLBACK: Record<string, { title: string; desc: string }[]> = {
  ru: [
    { title: "Каталог авто", desc: "1 200+ авто из Кореи" },
    { title: "Запчасти", desc: "Оригинальные запчасти" },
    { title: "Калькулятор", desc: "Растаможка онлайн" },
  ],
  en: [
    { title: "Car Catalog", desc: "1 200+ cars from Korea" },
    { title: "Parts", desc: "Original spare parts" },
    { title: "Calculator", desc: "Customs duty online" },
  ],
  ko: [
    { title: "자동차 카탈로그", desc: "한국산 자동차 1,200+" },
    { title: "부품", desc: "정품 부품" },
    { title: "계산기", desc: "관세 계산" },
  ],
  ka: [
    { title: "კატალოგი", desc: "1 200+ ავტო კორეიდან" },
    { title: "ნაწილები", desc: "ორიგინალი ნაწილები" },
    { title: "კალკულატორი", desc: "გაბაჟება ონლაინ" },
  ],
  ar: [
    { title: "كتالوج السيارات", desc: "أكثر من 1200 سيارة" },
    { title: "قطع الغيار", desc: "قطع غيار أصلية" },
    { title: "الآلة الحاسبة", desc: "الجمارك أونلاين" },
  ],
};

export default function NavCards() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";
  const labels = FALLBACK[lang] ?? FALLBACK.ru;
  const { isCatalogBlocked } = useCountry();

  const visibleCards = isCatalogBlocked
    ? CARDS.filter((c) => c.href !== "/catalog")
    : CARDS;
  const visibleLabels = isCatalogBlocked
    ? labels.filter((_, i) => CARDS[i].href !== "/catalog")
    : labels;

  return (
    <section className="py-6 px-4 sm:px-6" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className={`max-w-7xl mx-auto grid gap-3 sm:gap-4 ${visibleCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {visibleCards.map((card, i) => (
          <Link
            key={card.href}
            href={`/${lang}${card.href}`}
            className="group flex flex-col gap-2 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 active:scale-95"
            style={{
              backgroundColor: card.bg,
              border: `1px solid ${card.border}`,
            }}
          >
            <span className="text-2xl sm:text-3xl">{card.icon}</span>
            <div className="flex-1">
              <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: "var(--axis-white)" }}>
                {visibleLabels[i].title}
              </p>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: "var(--axis-gray)" }}>
                {visibleLabels[i].desc}
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: card.color }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
