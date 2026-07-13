"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
export function Hero() {
  const { t } = useTranslation();
  const [visible] = useState(true);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("parts:hero-search", { detail: query.trim() }));
    document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="pn-carbon relative overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--pn-bg)] pointer-events-none" />
      <div className="relative max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-16 pb-14 lg:pt-24 lg:pb-20 text-center">
        <span
          className={`inline-block text-[12px] font-bold text-[var(--pn-orange)] uppercase tracking-[0.18em] mb-4 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          {t("parts.hero.badge")}
        </span>

        <h1
          className={`text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[var(--pn-text)] leading-[1.08] tracking-tight mb-5 transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
          }`}
        >
          {t("parts.hero.title1")}{" "}
          <span className="text-[var(--pn-orange)]">{t("parts.hero.titleHighlight")}</span>{" "}
          {t("parts.hero.title2")}
        </h1>

        <p
          className={`text-base sm:text-lg text-[var(--pn-text-muted)] leading-relaxed max-w-2xl mx-auto mb-9 transition-all duration-600 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          {t("parts.hero.subtitle")}
        </p>

        {/* OEM pill search */}
        <form
          onSubmit={submitSearch}
          className={`relative max-w-2xl mx-auto mb-12 transition-all duration-600 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div className="pn-glow flex items-center bg-[var(--pn-surface-3)] border border-[var(--pn-border)] rounded-full pl-6 pr-2 py-2 transition-all">
            <Search className="w-5 h-5 text-[var(--pn-text-dim)] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("parts.hero.searchPlaceholder", { defaultValue: t("parts.catalog.filterSearchPlaceholder") })}
              className="flex-1 bg-transparent border-0 outline-none px-4 py-2.5 text-[var(--pn-text)] placeholder:text-[var(--pn-text-dim)] text-sm sm:text-base"
            />
            <button
              type="submit"
              className="shrink-0 px-6 sm:px-8 py-2.5 rounded-full bg-[var(--pn-orange)] text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
            >
              {t("parts.hero.searchButton")}
            </button>
          </div>
        </form>

        <div
          className={`flex justify-center gap-10 sm:gap-16 transition-all duration-600 delay-[400ms] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          {[
            { value: "10+", label: t("parts.hero.statYears") },
            { value: "5000+", label: t("parts.hero.statParts") },
            { value: "100%", label: t("parts.hero.statOriginal") },
          ].map((stat) => (
            <div key={stat.value}>
              <div className="text-[28px] sm:text-[32px] font-bold text-[var(--pn-orange)] leading-none">
                {stat.value}
              </div>
              <div className="text-xs text-[var(--pn-text-muted)] mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
