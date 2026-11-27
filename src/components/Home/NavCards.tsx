"use client";

import { langOrDefault } from "@/lib/lang";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCountry } from "@/hooks/useCountry";


// Иконки (бронза на чёрном) сгенерированы в ChatGPT 27.11.2026 одним набором, чтобы стиль
// совпал, и нарезаны в public/images/nav. Чёрный фон картинок гасится `mix-blend-screen`.
// Цвета карточек — только бронза бренда: прежние синяя и зелёная выбивались из палитры.
const CARDS = [
  { icon: "/images/nav/catalog.webp", titleKey: "nav.catalog", href: "/catalog" },
  { icon: "/images/nav/parts.webp", titleKey: "nav.parts", href: "/parts" },
  { icon: "/images/nav/calculator.webp", titleKey: "nav.calculator", href: "/calculator" },
];

const FALLBACK: Record<string, { title: string; desc: string }[]> = {
  ru: [
    { title: "Каталог авто", desc: "Авто из Кореи под ключ" },
    { title: "Запчасти", desc: "Оригинальные запчасти" },
    { title: "Калькулятор", desc: "Растаможка онлайн" },
  ],
  en: [
    { title: "Car Catalog", desc: "Cars from Korea, all-in" },
    { title: "Parts", desc: "Original spare parts" },
    { title: "Calculator", desc: "Customs duty online" },
  ],
  ko: [
    { title: "자동차 카탈로그", desc: "한국산 자동차" },
    { title: "부품", desc: "정품 부품" },
    { title: "계산기", desc: "관세 계산" },
  ],
  ka: [
    { title: "კატალოგი", desc: "ავტო კორეიდან" },
    { title: "ნაწილები", desc: "ორიგინალი ნაწილები" },
    { title: "კალკულატორი", desc: "გაბაჟება ონლაინ" },
  ],
  ar: [
    { title: "كتالوج السيارات", desc: "سيارات من كوريا" },
    { title: "قطع الغيار", desc: "قطع غيار أصلية" },
    { title: "الآلة الحاسبة", desc: "الجمارك أونلاين" },
  ],
};

export default function NavCards() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = langOrDefault(segments[1]);
  const labels = FALLBACK[lang] ?? FALLBACK.ru;
  const { isCatalogBlocked } = useCountry();

  const items = CARDS.map((card, i) => ({ ...card, label: labels[i] })).filter(
    (c) => !(isCatalogBlocked && c.href === "/catalog"),
  );

  return (
    <section className="py-8 px-4 sm:px-6" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className={`max-w-7xl mx-auto grid gap-3 sm:gap-5 ${items.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {items.map((card) => (
          <Link
            key={card.href}
            href={`/${lang}${card.href}`}
            className="group relative flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3 overflow-hidden rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(182,119,73,0.6)] hover:shadow-[0_18px_40px_rgba(182,119,73,0.18)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            style={{
              background: "linear-gradient(145deg, var(--axis-graphite) 0%, var(--axis-charcoal) 60%, var(--axis-black) 100%)",
              border: "1px solid rgba(182,119,73,0.22)",
            }}
          >
            <Image
              src={card.icon}
              alt=""
              width={96}
              height={96}
              aria-hidden="true"
              className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 object-contain mix-blend-screen transition-transform duration-300 group-hover:scale-110"
            />
            <div className="flex-1">
              <p className="text-lg sm:text-xl font-bold leading-tight" style={{ color: "var(--axis-white)" }}>
                {card.label.title}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--axis-gray)" }}>
                {card.label.desc}
              </p>
            </div>
            <ArrowRight
              className="w-5 h-5 shrink-0 sm:absolute sm:top-5 sm:right-5 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: "var(--axis-orange)" }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
