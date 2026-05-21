"use client";
import { FaInstagram, FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { Mail, Phone, MapPin, ArrowUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const KAxisLogo = () => (
  <svg width="28" height="28" viewBox="0 0 36 36" fill="none" className="flex-shrink-0">
    <defs>
      <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="36" y2="36">
        <stop offset="0%" stopColor="#FF4500" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <path d="M4 32L16 4H22L14 20L28 4H32L18 20L28 32H22L12 20L8 32H4Z" fill="url(#footerLogoGrad)" strokeWidth="0.5" />
    <path d="M20 4L32 4L24 14L20 4Z" fill="#FF6B1A" opacity="0.6" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const navLinks = [
    { href: `/${lang}/`, labelKey: "nav.home" },
    { href: `/${lang}/catalog`, labelKey: "nav.catalog" },
    { href: `/${lang}/buy`, labelKey: "nav.buy" },
    { href: `/${lang}/parts`, labelKey: "nav.parts" },
    { href: `/${lang}/blog`, labelKey: "nav.blog" },
    { href: `/${lang}/contact`, labelKey: "nav.contact" },
  ];

  return (
    <footer
      className="relative border-t mt-0"
      style={{ backgroundColor: "var(--axis-charcoal)", borderColor: "rgba(74,74,74,0.3)" }}
    >
      {/* Top orange line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--axis-orange)] to-transparent opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div>
            <Link href={`/${lang}/`} className="flex items-center gap-2.5 mb-4 group">
              <KAxisLogo />
              <span className="font-heading text-lg" style={{ color: "var(--axis-white)" }}>
                K<span style={{ color: "var(--axis-orange)" }}>-Axis</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--axis-gray)" }}>
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--axis-gray)" }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--axis-orange)" }} />
              <span>{t("footer.location")}</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: "var(--axis-white)" }}>
              {t("footer.navigation")}
            </h4>
            <nav className="space-y-2.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm transition-colors duration-200"
                  style={{ color: "var(--axis-gray)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: "var(--axis-white)" }}>
              {t("footer.contacts")}
            </h4>
            <div className="space-y-3">
              <a
                href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
                className="flex items-center gap-3 text-sm transition-colors group"
                style={{ color: "var(--axis-white)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{ backgroundColor: "rgba(255,69,0,0.1)", color: "var(--axis-orange)" }}>
                  <Phone className="w-4 h-4" />
                </div>
                {process.env.NEXT_PUBLIC_NUMBER_PHONE}
              </a>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
                className="flex items-center gap-3 text-sm transition-colors"
                style={{ color: "var(--axis-gray)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-orange)" }}>
                  <Mail className="w-4 h-4" />
                </div>
                {process.env.NEXT_PUBLIC_EMAIL}
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: "var(--axis-white)" }}>
              {t("footer.socialMedia")}
            </h4>
            <div className="flex gap-3">
              <a
                href="https://t.me/avto_korea_nikolai"
                target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.08)"; }}
                aria-label="Telegram"
              >
                <FaTelegramPlane size={18} />
              </a>
              <a
                href={`https://wa.me/${(process.env.NEXT_PUBLIC_NUMBER_PHONE || "").replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.08)"; }}
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={18} />
              </a>
              <a
                href="https://www.instagram.com/kmotors.shop/"
                target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.08)"; }}
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
          style={{ borderColor: "rgba(74,74,74,0.2)" }}
        >
          <p className="text-xs tracking-wide" style={{ color: "var(--axis-gray-dim)" }}>
            © {new Date().getFullYear()} K-Axis Motors. {t("footer.copyright")}.{" "}
            <Link
              href={`/${lang}/privacy`}
              className="ml-1 transition-colors hover:underline"
              style={{ color: "var(--axis-gray-dim)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray-dim)"; }}
            >
              {t("footer.privacy")}
            </Link>
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{ backgroundColor: "rgba(255,69,0,0.1)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.2)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,69,0,0.1)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
          >
            {t("footer.scrollToTop")}
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
