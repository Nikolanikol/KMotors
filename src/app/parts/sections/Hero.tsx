"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="min-h-[calc(100vh-120px)] bg-[var(--pn-deep-navy)] flex items-center"
    >
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-12 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-4">
          {/* Left content */}
          <div className="flex-1 max-w-xl">
            <div
              className={`flex items-center gap-3 mb-6 transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              <span className="w-10 h-0.5 bg-[var(--pn-orange)]" />
              <span className="text-[11px] font-semibold text-[var(--pn-orange)] uppercase tracking-[0.1em]">
                {t("parts.hero.badge")}
              </span>
            </div>

            <h1
              className={`text-4xl sm:text-5xl lg:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
              }`}
            >
              {t("parts.hero.title1")}{" "}
              <span className="text-[var(--pn-orange)]">{t("parts.hero.titleHighlight")}</span>{" "}
              {t("parts.hero.title2")}
            </h1>

            <p
              className={`text-base text-white/70 leading-relaxed max-w-[440px] mb-8 transition-all duration-600 delay-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              {t("parts.hero.subtitle")}
            </p>

            <div
              className={`flex flex-wrap gap-3 mb-10 transition-all duration-600 delay-300 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              <button
                onClick={() => scrollTo("contact")}
                className="pn-btn-primary flex items-center gap-2 text-sm"
              >
                {t("parts.hero.ctaRequest")}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo("catalog")}
                className="pn-btn-outline text-sm"
              >
                {t("parts.hero.ctaCatalog")}
              </button>
            </div>

            <div
              className={`flex gap-8 sm:gap-12 transition-all duration-600 delay-[400ms] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              {[
                { value: "10+", label: t("parts.hero.statYears") },
                { value: "5000+", label: t("parts.hero.statParts") },
                { value: "100%", label: t("parts.hero.statOriginal") },
              ].map((stat) => (
                <div key={stat.value}>
                  <div className="text-[28px] font-bold text-[var(--pn-orange)] leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div
              className={`relative w-full max-w-[560px] transition-all duration-1000 delay-200 ${
                visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <img
                src="/hero-bg.jpg"
                alt="Original Korean auto parts"
                className="w-full h-auto rounded-lg shadow-2xl object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--pn-deep-navy)]/20 to-transparent rounded-lg pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
