"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import hyundai from "./logo/trim/hyundai.webp";
import kia from "./logo/trim/kia.webp";
import genesis from "./logo/trim/genesis.webp";
import ssangyong from "./logo/trim/ssangyong.webp";
import renaultKorea from "./logo/trim/renault-samsung.webp";

// Переделано 27.11.2026. Было: бегущая лента из пяти логотипов, повторённых трижды, на серых
// плашках с затуханием по краям — выглядела обрезанной и «конечной». Теперь — спокойный
// статичный ряд с подписью: пять марок, у каждого логотипа обрезаны прозрачные поля (иначе
// Genesis выглядел крошечным рядом с Hyundai) и одинаковая светлая плашка, потому что синий
// Hyundai и тёмно-синий KGM на чёрном не читаются.
const BRANDS = [
  { name: "Hyundai", src: hyundai, h: "h-11 md:h-14" },
  { name: "Kia", src: kia, h: "h-9 md:h-11" },
  { name: "Genesis", src: genesis, h: "h-7 md:h-10" },
  { name: "KG Mobility (SsangYong)", src: ssangyong, h: "h-10 md:h-12" },
  { name: "Renault Korea", src: renaultKorea, h: "h-12 md:h-16" },
];

const LABEL: Record<string, string> = {
  ru: "Привозим автомобили корейских марок",
  en: "We bring in cars from every Korean brand",
  ko: "모든 한국 브랜드 차량을 수입합니다",
  ka: "მოგიყვანთ კორეული ბრენდების ავტომობილებს",
  ar: "نستورد سيارات جميع العلامات الكورية",
};

export default function Brands() {
  const { i18n } = useTranslation();
  const lang = i18n.language in LABEL ? i18n.language : "ru";

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="max-w-5xl mx-auto">
        <p
          className="text-center text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-8 md:mb-10"
          style={{ color: "var(--axis-gray)" }}
        >
          {LABEL[lang]}
        </p>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {BRANDS.map((b, i) => (
            <li
              key={b.name}
              // Пятая плитка на узком экране встаёт одна в последний ряд — центруем её.
              className={`flex items-center justify-center rounded-2xl h-24 md:h-28 px-5 transition-transform duration-300 hover:-translate-y-1 ${
                i === BRANDS.length - 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
              style={{
                background: "linear-gradient(160deg, #F7F3EF 0%, #E4DED8 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 10px 30px rgba(0,0,0,0.45)",
              }}
            >
              <Image src={b.src} alt={b.name} className={`${b.h} w-auto object-contain`} sizes="160px" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
