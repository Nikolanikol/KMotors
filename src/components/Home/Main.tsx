"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import PaintSplashCanvas from "@/components/ui/PaintSplashCanvas";
import { useCountAnimation } from "@/hooks/useScrollAnimation";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const ref = useCountAnimation(end, suffix);
  return (
    <div className="flex flex-col items-center">
      <span ref={ref} className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--axis-orange)" }}>
        0{suffix}
      </span>
      <span className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--axis-gray)" }}>
        {label}
      </span>
    </div>
  );
}

const Main = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <PaintSplashCanvas />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight"
          style={{
            color: "var(--axis-white)",
            textShadow: "0 0 60px rgba(255,69,0,0.3)",
          }}
        >
          {t("home.hero.title")}
        </h1>

        <p className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--axis-gray)" }}>
          {t("home.hero.subtitle")}
        </p>

        <Link
          href={`/${lang}/catalog`}
          className="paint-splash-btn inline-block px-10 py-4 border-2 font-semibold rounded-full transition-all duration-300 relative z-10"
          style={{
            borderColor: "var(--axis-orange)",
            color: "var(--axis-orange)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)";
            (e.currentTarget as HTMLElement).style.color = "var(--axis-white)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)";
          }}
        >
          <span className="relative z-10">{t("home.hero.catalogButton")}</span>
        </Link>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mt-20">
          <StatCounter end={1240} suffix="+" label={t("home.hero.statCars")} />
          <div className="w-px h-12 opacity-30" style={{ backgroundColor: "var(--axis-gray-dim)" }} />
          <StatCounter end={850} suffix="+" label={t("home.hero.statClients")} />
          <div className="w-px h-12 opacity-30 hidden sm:block" style={{ backgroundColor: "var(--axis-gray-dim)" }} />
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--axis-orange)" }}>
              {t("home.hero.statYears")}
            </span>
            <span className="text-xs tracking-widest uppercase mt-1" style={{ color: "var(--axis-gray)" }}>
              {t("home.hero.statYearsLabel")}
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="w-px h-10 relative overflow-hidden opacity-30" style={{ backgroundColor: "var(--axis-gray-dim)" }}>
          <div
            className="w-2 h-2 rounded-full absolute left-1/2 -translate-x-1/2"
            style={{
              backgroundColor: "var(--axis-orange)",
              animation: "scrollBounce 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollBounce {
          0%, 100% { top: 0; opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
};

export default Main;
