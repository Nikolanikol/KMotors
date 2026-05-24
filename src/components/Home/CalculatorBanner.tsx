"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Calculator } from "lucide-react";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const COUNTRIES = [
  { flag: "🇷🇺", label: "Россия / Russia" },
  { flag: "🇰🇿", label: "Казахстан / Kazakhstan" },
  { flag: "🇺🇿", label: "Узбекистан / Uzbekistan" },
];

export default function CalculatorBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  return (
    <section className="relative py-16 overflow-hidden" style={{ backgroundColor: "var(--axis-black)" }}>
      {/* subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--axis-gray) 1px, transparent 1px), linear-gradient(90deg, var(--axis-gray) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* orange glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, var(--axis-orange) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
          style={{
            background: "linear-gradient(135deg, rgba(255,69,0,0.08) 0%, rgba(255,140,0,0.05) 100%)",
            border: "1px solid rgba(255,69,0,0.2)",
          }}
        >
          {/* Icon */}
          <div
            className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))",
              boxShadow: "0 8px 24px rgba(255,69,0,0.3)",
            }}
          >
            <Calculator className="w-8 h-8 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--axis-orange)" }}>
              {t("home.calculatorBanner.badge")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-snug" style={{ color: "var(--axis-white)" }}>
              {t("home.calculatorBanner.title")}
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--axis-gray)" }}>
              {t("home.calculatorBanner.subtitle")}
            </p>
            {/* Country badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {COUNTRIES.map((c) => (
                <span
                  key={c.label}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--axis-gray)",
                  }}
                >
                  {c.flag} {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <Link
              href={`/${lang}/calculator`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap"
              style={{
                backgroundColor: "var(--axis-orange)",
                color: "white",
                boxShadow: "0 4px 16px rgba(255,69,0,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange-bright)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(255,69,0,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(255,69,0,0.3)";
              }}
            >
              <Calculator className="w-4 h-4" />
              {t("home.calculatorBanner.button")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
