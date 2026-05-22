"use client";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill={i < count ? "var(--axis-orange)" : "var(--axis-gray-dim)"}>
          <path d="M6 0l1.5 3.8H12L8.2 6.2l1.5 3.8L6 9.5 2.3 10l1.5-3.8L0 3.8h4.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const testimonials = [
    { quote: t("home.reviews.t1quote"), author: t("home.reviews.t1author"), car: t("home.reviews.t1car"), rating: 5 },
    { quote: t("home.reviews.t2quote"), author: t("home.reviews.t2author"), car: t("home.reviews.t2car"), rating: 5 },
    { quote: t("home.reviews.t3quote"), author: t("home.reviews.t3author"), car: t("home.reviews.t3car"), rating: 5 },
  ];

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-heading text-3xl md:text-4xl" style={{ color: "var(--axis-white)" }}>
            {t("home.reviews.title")}
          </h2>
          <div className="flex gap-3">
            {(["left", "right"] as const).map((dir) => (
              <button key={dir} onClick={() => scroll(dir)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: "var(--axis-graphite)", color: "var(--axis-orange)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-graphite)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
          {testimonials.map((item, i) => (
            <div key={i} className="snap-start min-w-[320px] max-w-[380px] flex-shrink-0 rounded-2xl p-6 relative"
              style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
              <svg className="absolute top-4 right-4 opacity-10" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" fill="var(--axis-orange)" />
                <circle cx="10" cy="12" r="5" fill="var(--axis-amber)" />
                <circle cx="32" cy="28" r="4" fill="var(--axis-orange-bright)" />
              </svg>
              <p className="italic leading-relaxed mb-6 text-sm" style={{ color: "var(--axis-white)" }}>
                "{item.quote}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>{item.author}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--axis-gray)" }}>{t("home.reviews.bought")} {item.car}</div>
                </div>
                <Stars count={item.rating} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
