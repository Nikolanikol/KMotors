"use client";

import { isLang } from "@/lib/lang";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCountry } from "@/hooks/useCountry";
import { HOME_TOP_CARS, PRICES_AS_OF, PRICES_RATE_RU } from "@/data/home-top-cars";

const TITLE: Record<string, string> = {
  ru: "Популярные модели из Кореи",
  en: "Popular Models from Korea",
  ko: "인기 한국 자동차 모델",
  ka: "პოპულარული მოდელები კორეიდან",
  ar: "الموديلات الأكثر شعبية من كوريا",
};

const SUBTITLE: Record<string, string> = {
  ru: "Расчёт под ключ по реальным машинам с корейских площадок",
  en: "All-in price calculated on real cars from Korean marketplaces",
  ko: "한국 실제 매물 기준 총 비용 계산",
  ka: "სრული ფასი კორეული ბაზრის რეალური მანქანების მიხედვით",
  ar: "السعر الكامل محسوب على سيارات حقيقية من السوق الكوري",
};

const ALL_LINK: Record<string, string> = {
  ru: "Весь каталог →",
  en: "Full catalog →",
  ko: "전체 카탈로그 →",
  ka: "სრული კატალოგი →",
  ar: "الكتالوج الكامل →",
};

// Цена посчитана до Владивостока (таможня РФ), поэтому подпись это говорит прямо.
const PRICE_LABEL: Record<string, string> = {
  ru: "Под ключ до Владивостока",
  en: "All-in to Vladivostok",
  ko: "블라디보스토크까지 총 비용",
  ka: "ვლადივოსტოკამდე, გასაღებამდე",
  ar: "السعر الكامل حتى فلاديفوستوك",
};

const DETAILS_LABEL: Record<string, string> = {
  ru: "Подробнее →",
  en: "Learn more →",
  ko: "자세히 보기 →",
  ka: "დეტალურად →",
  ar: "المزيد →",
};

// Сноска повторяет оговорки роликов серии «Две цены»: цифра — не оферта.
const FOOTNOTE: Record<string, (d: string) => string> = {
  ru: (d) =>
    `Расчёт на ${d} по реальным объявлениям в Корее, курс ${PRICES_RATE_RU}. Цена до Владивостока, без доставки до вашего города. Не является офертой — точный расчёт под ваш бюджет сделаем по запросу.`,
  en: (d) =>
    `Calculated on ${d} from real listings in Korea. Price to Vladivostok with Russian customs, excluding delivery to your city. Not an offer — we will calculate exactly for your budget on request.`,
};

function formatPrice(lang: string, rub: number, rubToUsd: number): string {
  if (lang === "ru") return `≈ ${rub.toLocaleString("ru-RU").replace(/ /g, " ")} ₽`;
  const usd = Math.round((rub * rubToUsd) / 100) * 100;
  return `≈ $${usd.toLocaleString("en-US")}`;
}

export default function PopularModels({ rubToUsd }: { rubToUsd: number }) {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const { isCatalogBlocked } = useCountry();

  const segments = pathname.split("/");
  const lang = isLang(segments[1]) ? segments[1] : i18n.language || "ru";
  const isRu = lang === "ru";
  const footnote = (FOOTNOTE[lang] ?? FOOTNOTE.en)(PRICES_AS_OF);

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
              className="hidden sm:inline-flex rounded text-sm font-semibold whitespace-nowrap text-[var(--axis-gray)] transition-colors hover:text-[var(--axis-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            >
              {ALL_LINK[lang] || ALL_LINK.ru}
            </Link>
          )}
        </div>

        {/* Три карточки сеткой, без карусели: автопрокрутка на трёх каруселях подряд мешала читать. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOME_TOP_CARS.map((c) => {
            const href = c.slug
              ? `/${lang}/models/${c.slug}`
              : isCatalogBlocked
                ? `/${lang}/buy`
                : `/${lang}/catalog`;
            return (
              <Link
                key={`${c.brand}-${c.model}`}
                href={href}
                className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[var(--axis-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
                style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
              >
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <Image
                    src={c.image}
                    alt={`${c.brand} ${c.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--axis-orange)" }}>
                    {c.brand}
                  </p>
                  <p className="font-heading text-xl font-bold mb-1" style={{ color: "var(--axis-white)" }}>
                    {c.model} {c.engine}
                  </p>
                  <p className="text-sm mb-3" style={{ color: "var(--axis-gray)" }}>
                    {isRu
                      ? `Реальная машина: ${c.year} г., ${Math.round(c.km / 1000)} тыс. км`
                      : `Real car: ${c.year}, ${Math.round(c.km / 1000)}k km`}
                  </p>

                  <div className="mt-auto pt-3 flex items-end justify-between" style={{ borderTop: "1px solid rgba(74,74,74,0.3)" }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--axis-gray)" }}>
                        {PRICE_LABEL[lang] || PRICE_LABEL.ru}
                      </p>
                      <p className="text-lg font-bold" style={{ color: "var(--axis-white)" }}>
                        {formatPrice(lang, c.priceRub, rubToUsd)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--axis-orange)" }}>
                      {DETAILS_LABEL[lang] || DETAILS_LABEL.ru}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed max-w-3xl" style={{ color: "var(--axis-gray)" }}>
          {footnote}
        </p>

        {/* Mobile catalog link */}
        {!isCatalogBlocked && (
          <div className="text-center mt-4 sm:hidden">
            <Link
              href={`/${lang}/catalog`}
              className="rounded text-sm font-semibold text-[var(--axis-gray)] transition-colors hover:text-[var(--axis-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            >
              {ALL_LINK[lang] || ALL_LINK.ru}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
