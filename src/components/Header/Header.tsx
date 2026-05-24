"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "./ContactFormModal";
import LanguageSwitcher from "@/components/LanguageSwitcher/LanguageSwitcher";
import { X, Menu } from "lucide-react";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const KAxisLogo = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" className="transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
        <stop offset="0%" stopColor="#FF4500" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <path d="M4 32L16 4H22L14 20L28 4H32L18 20L28 32H22L12 20L8 32H4Z" fill="url(#logoGrad)" strokeWidth="0.5" />
    <path d="M20 4L32 4L24 14L20 4Z" fill="#FF6B1A" opacity="0.6" />
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const navLinks = [
    { href: `/${lang}/`, labelKey: "nav.home" },
    { href: `/${lang}/catalog`, labelKey: "nav.catalog" },
    { href: `/${lang}/buy`, labelKey: "nav.buy" },
    { href: `/${lang}/parts`, labelKey: "nav.parts" },
    { href: `/${lang}/blog`, labelKey: "nav.blog" },
    { href: `/${lang}/calculator`, labelKey: "nav.calculator" },
    { href: `/${lang}/contact`, labelKey: "nav.contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => pathname === href || (href !== `/${lang}/` && pathname.startsWith(href));

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center transition-all duration-300 ${
          isScrolled ? "glass-effect border-b border-white/5" : "bg-transparent"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href={`/${lang}/`} className="flex items-center gap-2.5 group">
            <KAxisLogo />
            <span className="font-heading text-xl tracking-tight" style={{ color: "var(--axis-white)" }}>
              K<span style={{ color: "var(--axis-orange)" }}>-Axis</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{
                  color: isActive(link.href) ? "var(--axis-orange)" : "var(--axis-gray)",
                }}
                onMouseEnter={(e) => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
                onMouseLeave={(e) => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
              className="text-sm transition-colors"
              style={{ color: "var(--axis-gray)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
            >
              {process.env.NEXT_PUBLIC_NUMBER_PHONE}
            </a>
            <ContactForm isVisible={false} />
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" style={{ color: "var(--axis-white)" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen overlay */}
      <div
        className={`fixed inset-0 z-[60] backdrop-blur-xl transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "rgba(10,10,10,0.97)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between">
            <Link href={`/${lang}/`} className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
              <KAxisLogo />
              <span className="font-heading text-xl" style={{ color: "var(--axis-white)" }}>
                K<span style={{ color: "var(--axis-orange)" }}>-Axis</span>
              </span>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
              <X className="w-6 h-6" style={{ color: "var(--axis-white)" }} />
            </button>
          </div>

          <nav className="flex flex-col items-center justify-center flex-1 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-heading transition-colors"
                style={{ color: isActive(link.href) ? "var(--axis-orange)" : "var(--axis-white)" }}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-4 pb-8">
            <a
              href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
              className="text-sm"
              style={{ color: "var(--axis-gray)" }}
            >
              {process.env.NEXT_PUBLIC_NUMBER_PHONE}
            </a>
            <ContactForm isVisible={false} />
          </div>
        </div>
      </div>

    </>
  );
}
