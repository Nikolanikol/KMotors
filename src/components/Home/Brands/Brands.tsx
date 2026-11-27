"use client";

import Image from "next/image";
import hyundai from "./logo/hyundai.webp";
import kia from "./logo/kia.webp";
import genesis from "./logo/genesis.webp";
import ssangyong from "./logo/ssangyong.webp";
import renaultSamsung from "./logo/renault-samsung.webp";

// Настоящие логотипы вместо нарисованных вручную SVG (27.11.2026): прежние «логотипы»
// читались как «NIN HINH RINF», Kia стояла дважды. Файлы цветные на прозрачном фоне, а на
// чёрной полосе синий Hyundai не читается, поэтому каждый лежит на светлой плашке.
const BRANDS = [
  { name: "Hyundai", src: hyundai },
  { name: "Kia", src: kia },
  { name: "Genesis", src: genesis },
  { name: "SsangYong", src: ssangyong },
  { name: "Renault Korea", src: renaultSamsung },
];

export default function Brands() {
  // Три одинаковые копии: анимация сдвигает ленту ровно на треть.
  const tripled = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <div className="py-6 overflow-hidden relative" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to right, var(--axis-charcoal), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to left, var(--axis-charcoal), transparent)" }} />

      <div className="brands-track flex items-center gap-8 md:gap-12 whitespace-nowrap" style={{ width: "max-content" }}>
        {tripled.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="flex items-center justify-center rounded-xl px-4 h-16 md:h-20 w-28 md:w-36 opacity-80 transition-opacity duration-300 hover:opacity-100"
            style={{ backgroundColor: "#F5F0EB" }}
          >
            <Image
              src={brand.src}
              alt={i < BRANDS.length ? brand.name : ""}
              aria-hidden={i < BRANDS.length ? undefined : true}
              className="h-12 md:h-14 w-auto object-contain"
              sizes="144px"
            />
          </div>
        ))}
      </div>

      <style>{`
        .brands-track { animation: marqueeScroll 30s linear infinite; }
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brands-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
