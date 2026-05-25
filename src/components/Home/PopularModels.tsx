"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const MODELS = [
  {
    slug: "kia-sorento",
    brand: "KIA",
    model: "Sorento",
    emoji: "🚙",
    priceFrom: { ru: "от 2 200 000 ₽", en: "from $24,000" },
    years: "2020–2024",
  },
  {
    slug: "kia-sportage",
    brand: "KIA",
    model: "Sportage",
    emoji: "🚗",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
  },
  {
    slug: "kia-carnival",
    brand: "KIA",
    model: "Carnival",
    emoji: "🚐",
    priceFrom: { ru: "от 3 000 000 ₽", en: "from $33,000" },
    years: "2020–2024",
  },
  {
    slug: "hyundai-tucson",
    brand: "Hyundai",
    model: "Tucson",
    emoji: "🚘",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
  },
  {
    slug: "hyundai-palisade",
    brand: "Hyundai",
    model: "Palisade",
    emoji: "🛻",
    priceFrom: { ru: "от 3 500 000 ₽", en: "from $38,000" },
    years: "2019–2024",
  },
];

const TITLE: Record<string, string> = {
  ru: "Популярные модели из Кореи",
  en: "Popular Models from Korea",
  ko: "인기 한국 자동차 모델",
  ka: "პოპულარული მოდელები კორეიდან",
  ar: "الموديلات الأكثر شعبية من كوريا",
};

const SUBTITLE: Record<string, string> = {
  ru: "Страницы с ценами, характеристиками и живыми авто из каталога",
  en: "Pages with prices, specs and live cars from our catalog",
  ko: "가격, 사양 및 카탈로그 실시간 차량이 있는 페이지",
  ka: "გვერდები ფასებით, სპეციფიკაციებით და კატალოგის მანქანებით",
  ar: "صفحات بالأسعار والمواصفات والسيارات المتاحة من كتالوجنا",
};

const ALL_LINK: Record<string, string> = {
  ru: "Весь каталог →",
  en: "Full catalog →",
  ko: "전체 카탈로그 →",
  ka: "სრული კატალოგი →",
  ar: "الكتالوج الكامل →",
};

const PRICE_LABEL: Record<string, string> = {
  ru: "Под ключ",
  en: "All-in",
  ko: "총 비용",
  ka: "გასაღებამდე",
  ar: "السعر الكامل",
};

const DETAILS_LABEL: Record<string, string> = {
  ru: "Подробнее →",
  en: "Learn more →",
  ko: "자세히 보기 →",
  ka: "დეტალურად →",
  ar: "المزيد →",
};

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

export default function PopularModels() {
  const { i18n } = useTranslation();
  const pathname = usePathname();

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : i18n.language || "ru";

  const isRu = lang === "ru";

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl mb-3" style={{ color: "var(--axis-white)" }}>
            {TITLE[lang] || TITLE.ru}
          </h2>
          <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
            {SUBTITLE[lang] || SUBTITLE.ru}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {MODELS.map((m) => (
            <Link
              key={m.slug}
              href={`/${lang}/models/${m.slug}`}
              className="group flex flex-col rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--axis-charcoal)",
                border: "1px solid rgba(74,74,74,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--axis-orange)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)";
              }}
            >
              <span className="text-2xl mb-3">{m.emoji}</span>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--axis-orange)" }}>
                {m.brand}
              </p>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--axis-white)" }}>
                {m.model}
              </p>
              <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>
                {m.years}
              </p>
              <p className="text-xs mt-auto" style={{ color: "var(--axis-gray)" }}>
                {PRICE_LABEL[lang] || PRICE_LABEL.ru}:{" "}
                <span style={{ color: "var(--axis-white)" }}>
                  {isRu ? m.priceFrom.ru : m.priceFrom.en}
                </span>
              </p>
              <p className="text-xs mt-2 font-semibold group-hover:underline" style={{ color: "var(--axis-orange)" }}>
                {DETAILS_LABEL[lang] || DETAILS_LABEL.ru}
              </p>
            </Link>
          ))}
        </div>

        {/* All catalog link */}
        <div className="text-center">
          <Link
            href={`/${lang}/catalog`}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "var(--axis-gray)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
          >
            {ALL_LINK[lang] || ALL_LINK.ru}
          </Link>
        </div>
      </div>
    </section>
  );
}
