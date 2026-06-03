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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-[68px] w-full max-w-full">
      <PaintSplashCanvas />

      <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
        <h1
          className="font-display mb-6 leading-tight w-full"
          style={{
            color: "var(--axis-white)",
            textShadow: "0 0 60px rgba(255,69,0,0.3)",
            fontSize: "clamp(1.5rem, 7vw, 4.5rem)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
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

        {/* Phone link — mobile friendly */}
        <div className="mt-4">
          <a
            href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--axis-gray)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            {process.env.NEXT_PUBLIC_NUMBER_PHONE}
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mt-20">
          <StatCounter end={1240} suffix="+" label={t("home.hero.statCars")} />
          <div className="w-px h-12 opacity-30" style={{ backgroundColor: "var(--axis-gray-dim)" }} />
          <StatCounter end={850} suffix="+" label={t("home.hero.statClients")} />
          <div className="w-px h-12 opacity-30" style={{ backgroundColor: "var(--axis-gray-dim)" }} />
          <div className="flex flex-col items-center">
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
