"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "./ContactFormModal";
import LanguageSwitcher from "@/components/LanguageSwitcher/LanguageSwitcher";
import { X, Menu, Heart, User, LogOut, Package } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { useFavorites } from "@/hooks/useFavorites";
import { usePartsFavorites } from "@/hooks/usePartsFavorites";
import { useCountry } from "@/hooks/useCountry";
import { useAuth } from "@/providers/AuthProvider";

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
  const router = useRouter();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { favorites: favCars } = useFavorites();
  const { favorites: favParts } = usePartsFavorites();
  const favTotal = favCars.length + favParts.length;
  const { isCatalogBlocked } = useCountry();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const navLinks = [
    { href: `/${lang}/`, labelKey: "nav.home" },
    ...(!isCatalogBlocked ? [{ href: `/${lang}/catalog`, labelKey: "nav.catalog" }] : []),
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
            <Link
              href={`/${lang}/favorites`}
              className="relative flex items-center gap-2 px-3 h-9 rounded-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{
                backgroundColor: favTotal > 0 ? "rgba(255,69,0,0.15)" : "rgba(255,69,0,0.08)",
                color: "var(--axis-orange)",
                border: favTotal > 0 ? "1px solid rgba(255,69,0,0.3)" : "1px solid transparent",
              }}
              aria-label={t("nav.favorites")}
            >
              <Heart className="w-4 h-4 shrink-0" fill={favTotal > 0 ? "currentColor" : "none"} />
              <span className="text-sm font-medium">{t("nav.favorites")}</span>
              {favTotal > 0 && (
                <span
                  className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full"
                  style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
                >
                  {favTotal > 9 ? "9+" : favTotal}
                </span>
              )}
            </Link>
            <LanguageSwitcher />
            <a
              href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
              className="text-sm transition-colors"
              style={{ color: "var(--axis-gray)" }}
              onClick={() => trackEvent("contact", { method: "phone_header", position: "desktop" })}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
            >
              {process.env.NEXT_PUBLIC_NUMBER_PHONE}
            </a>
            <ContactForm isVisible={false} />

            {/* Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.25)" }}
                >
                  <User className="w-4 h-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border py-1 z-50"
                    style={{ backgroundColor: "rgba(20,20,20,0.98)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <Link href={`/${lang}/account`} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "var(--axis-gray)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"}
                    >
                      <Package className="w-4 h-4" />
                      Личный кабинет
                    </Link>
                    <div className="my-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                    <button
                      onClick={async () => { setUserMenuOpen(false); await signOut(); router.push(`/${lang}/parts`); router.refresh(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "#FF4444" }}
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${lang}/auth?mode=login`}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.25)" }}
                aria-label="Войти"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-3">
            {user ? (
              <Link
                href={`/${lang}/account`}
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.25)" }}
                aria-label="Личный кабинет"
              >
                <User className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/${lang}/auth?mode=login`}
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)", border: "1px solid rgba(255,69,0,0.25)" }}
                aria-label="Войти"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
            <Link
              href={`/${lang}/favorites`}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
              style={{
                backgroundColor: favTotal > 0 ? "rgba(255,69,0,0.15)" : "rgba(255,69,0,0.08)",
                color: "var(--axis-orange)",
                border: favTotal > 0 ? "1px solid rgba(255,69,0,0.3)" : "1px solid transparent",
              }}
              aria-label={t("nav.favorites")}
            >
              <Heart className="w-4 h-4" fill={favTotal > 0 ? "currentColor" : "none"} />
              {favTotal > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full"
                  style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
                >
                  {favTotal > 9 ? "9+" : favTotal}
                </span>
              )}
            </Link>
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
              onClick={() => trackEvent("contact", { method: "phone_header", position: "mobile" })}
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
