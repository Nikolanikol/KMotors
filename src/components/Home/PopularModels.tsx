"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCountry } from "@/hooks/useCountry";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const MODELS = [
  {
    slug: "kia-sorento",
    brand: "KIA",
    model: "Sorento",
    image: "/models/kia-sorento/1.webp",
    priceFrom: { ru: "от 2 200 000 ₽", en: "from $24,000" },
    years: "2020–2024",
    desc: { ru: "7-местный кроссовер", en: "7-seat crossover" },
  },
  {
    slug: "kia-sportage",
    brand: "KIA",
    model: "Sportage",
    image: "/models/sportage.jpg",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
    desc: { ru: "Компактный кроссовер", en: "Compact crossover" },
  },
  {
    slug: "kia-carnival",
    brand: "KIA",
    model: "Carnival",
    image: "/models/carnival.jpg",
    priceFrom: { ru: "от 3 000 000 ₽", en: "from $33,000" },
    years: "2020–2024",
    desc: { ru: "Премиальный минивэн 7–9 мест", en: "Premium 7–9 seat minivan" },
  },
  {
    slug: "hyundai-tucson",
    brand: "Hyundai",
    model: "Tucson",
    image: "/models/tucson.jpg",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
    desc: { ru: "Лучшее соотношение цены и качества", en: "Best price-to-quality ratio" },
  },
  {
    slug: "hyundai-palisade",
    brand: "Hyundai",
    model: "Palisade",
    image: "/models/palisade.jpg",
    priceFrom: { ru: "от 3 500 000 ₽", en: "from $38,000" },
    years: "2019–2024",
    desc: { ru: "Флагманский полноразмерный кроссовер", en: "Flagship full-size crossover" },
  },
  {
    slug: "hyundai-santa-fe",
    brand: "Hyundai",
    model: "Santa Fe",
    image: "/models/santafe.jpg",
    priceFrom: { ru: "от 2 000 000 ₽", en: "from $22,000" },
    years: "2019–2024",
    desc: { ru: "Семейный 5–7-местный кроссовер", en: "Family 5–7 seat crossover" },
  },
  {
    slug: "genesis-gv80",
    brand: "Genesis",
    model: "GV80",
    image: "/models/genesis-gv80.jpg",
    priceFrom: { ru: "от 4 500 000 ₽", en: "from $49,000" },
    years: "2020–2024",
    desc: { ru: "Люксовый кроссовер — конкурент BMW X5", en: "Luxury crossover — BMW X5 rival" },
  },
  {
    slug: "kia-k5",
    brand: "KIA",
    model: "K5",
    image: "/models/k5.jpg",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
    desc: { ru: "Спортивный седан бизнес-класса", en: "Sporty business-class sedan" },
  },
  {
    slug: "hyundai-sonata",
    brand: "Hyundai",
    model: "Sonata",
    image: "/models/sonata.jpg",
    priceFrom: { ru: "от 1 500 000 ₽", en: "from $16,000" },
    years: "2019–2024",
    desc: { ru: "Комфортный седан — простор и надёжность", en: "Comfort sedan — space and reliability" },
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
  ru: "Цены, характеристики и живые авто в наличии",
  en: "Prices, specs and live cars in stock",
  ko: "가격, 사양 및 재고 차량",
  ka: "ფასები, სპეციფიკაციები და მარაგში მყოფი მანქანები",
  ar: "الأسعار والمواصفات والسيارات المتوفرة",
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
  const { isCatalogBlocked } = useCountry();

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : i18n.language || "ru";
  const isRu = lang === "ru";

  return (
    <section className="py-16" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl mb-1" style={{ color: "var(--axis-white)" }}>
              {TITLE[lang] || TITLE.ru}
            </h2>
            <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
              {SUBTITLE[lang] || SUBTITLE.ru}
            </p>
          </div>
          {!isCatalogBlocked && (
            <Link
              href={`/${lang}/catalog`}
              className="hidden sm:inline-flex text-sm font-semibold transition-colors whitespace-nowrap"
              style={{ color: "var(--axis-gray)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
            >
              {ALL_LINK[lang] || ALL_LINK.ru}
            </Link>
          )}
        </div>

        {/* Slider */}
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={20}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop
          breakpoints={{
            320:  { slidesPerView: 1 },
            640:  { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="popular-models-swiper !pb-10"
        >
          {MODELS.map((m) => (
            <SwiperSlide key={m.slug} style={{ height: "auto" }}>
              <Link
                href={`/${lang}/models/${m.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  height: "100%",
                  backgroundColor: "var(--axis-charcoal)",
                  border: "1px solid rgba(74,74,74,0.3)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--axis-orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,74,74,0.3)"; }}
              >
                {/* Photo */}
                <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image}
                    alt={`${m.brand} ${m.model}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--axis-orange)" }}>
                    {m.brand}
                  </p>
                  <p className="font-heading text-xl font-bold mb-1" style={{ color: "var(--axis-white)" }}>
                    {m.model}
                  </p>
                  <p className="text-sm mb-3" style={{ color: "var(--axis-gray)" }}>
                    {isRu ? m.desc.ru : m.desc.en}
                  </p>

                  <div className="mt-auto pt-3 flex items-end justify-between" style={{ borderTop: "1px solid rgba(74,74,74,0.3)" }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--axis-gray)" }}>
                        {PRICE_LABEL[lang] || PRICE_LABEL.ru}
                      </p>
                      <p className="text-sm font-bold" style={{ color: "var(--axis-white)" }}>
                        {isRu ? m.priceFrom.ru : m.priceFrom.en}
                      </p>
                    </div>
                    <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--axis-orange)" }}>
                      {DETAILS_LABEL[lang] || DETAILS_LABEL.ru}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Mobile catalog link */}
        <div className="text-center mt-2 sm:hidden">
          <Link
            href={`/${lang}/catalog`}
            className="text-sm font-semibold"
            style={{ color: "var(--axis-gray)" }}
          >
            {ALL_LINK[lang] || ALL_LINK.ru}
          </Link>
        </div>
      </div>

      <style>{`
        .popular-models-swiper {
          overflow: hidden !important;
        }
        .popular-models-swiper .swiper-wrapper {
          align-items: stretch;
        }
        .popular-models-swiper .swiper-slide {
          height: auto !important;
        }
        .popular-models-swiper .swiper-pagination-bullet {
          background: var(--axis-gray);
          opacity: 0.4;
        }
        .popular-models-swiper .swiper-pagination-bullet-active {
          background: var(--axis-orange);
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
