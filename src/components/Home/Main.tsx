"use client";

import { langOrDefault } from "@/lib/lang";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCountry } from "@/hooks/useCountry";

// Фон — сгенерированная картинка (ChatGPT, 27.11.2026), лежит в public/images/hero-cars.jpg.
// Заголовок слева, машины справа: левая половина кадра тёмная намеренно (под текст).
// В RTL (арабский) кадр зеркалится, чтобы текст и машины не поменялись местами.
const Main = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = langOrDefault(segments[1]);
  const { isCatalogBlocked } = useCountry();

  return (
    <section className="relative min-h-[92vh] flex items-start md:items-center overflow-hidden -mt-[68px] w-full max-w-full"
      style={{ backgroundColor: "var(--axis-black)" }}>
      {/* Фон с машинами */}
      <Image
        src="/images/hero-cars.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-contain object-bottom md:object-cover md:object-center rtl:-scale-x-100"
      />
      {/* На телефоне картинка показана целиком внизу (object-contain), текст над ней на чёрном:
          с object-cover на узком экране видна увеличенная деталь одной машины. Верх картинки
          плавно уходит в чёрный. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[260px] md:hidden"
        style={{ background: "linear-gradient(to bottom, var(--axis-black) 0%, rgba(10,10,10,0.7) 30%, transparent 70%)" }}
      />
      {/* Затемнение: слева под текст (только широкий экран), снизу в цвет следующего блока, сверху под шапку */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.72) 38%, rgba(10,10,10,0.15) 75%, rgba(10,10,10,0.05) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-16 md:h-40"
        style={{ background: "linear-gradient(to top, var(--axis-black), transparent)" }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.7), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-[100px] md:pt-[68px] pb-24">
        <div className="max-w-2xl text-center md:text-start mx-auto md:mx-0">
          <h1
            className="font-display mb-6 leading-[1.05]"
            style={{
              color: "var(--axis-white)",
              textShadow: "0 2px 40px rgba(0,0,0,0.6)",
              fontSize: "clamp(2rem, 6.5vw, 4.5rem)",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {t("home.hero.title")}
          </h1>

          <p
            className="text-base md:text-lg max-w-xl mb-10 leading-relaxed mx-auto md:mx-0"
            style={{ color: "var(--axis-silver, #D4D0CC)" }}
          >
            {t("home.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
            {!isCatalogBlocked && (
              <Link
                href={`/${lang}/catalog`}
                className="inline-flex items-center justify-center px-9 py-4 rounded-full font-semibold text-white transition-all duration-200 hover:brightness-115 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
                style={{
                  backgroundColor: "var(--axis-bronze-deep)",
                  backgroundImage: "var(--axis-bronze-fill)",
                  boxShadow: "0 8px 28px rgba(182,119,73,0.35)",
                }}
              >
                {t("home.hero.catalogButton")}
              </Link>
            )}
            <Link
              href={`/${lang}/calculator`}
              className="inline-flex items-center justify-center px-9 py-4 rounded-full font-semibold border transition-all duration-200 text-[var(--axis-white)] border-white/25 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.1] hover:border-[var(--axis-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            >
              {t("nav.calculator")}
            </Link>
          </div>

          <div className="mt-6">
            <a
              href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
              className="inline-flex items-center gap-2 text-sm rounded transition-colors text-[var(--axis-gray)] hover:text-[var(--axis-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              {process.env.NEXT_PUBLIC_NUMBER_PHONE}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        aria-label={t("home.hero.scrollHint")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 z-10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" })}
      >
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--axis-gray)", animation: "fadeInOut 2s ease-in-out infinite" }}>
          {t("home.hero.scrollHint")}
        </span>
        <div className="flex flex-col items-center gap-0.5" style={{ animation: "arrowBounce 1.5s ease-in-out infinite" }}>
          <svg width="24" height="14" viewBox="0 0 24 14" fill="none" aria-hidden="true">
            <path d="M2 2L12 11L22 2" stroke="var(--axis-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <style>{`
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.7; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          section [style*="arrowBounce"], section [style*="fadeInOut"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
};

export default Main;
