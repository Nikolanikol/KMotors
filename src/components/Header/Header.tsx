"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "./ContactFormModal";
import LanguageSwitcher from "@/components/LanguageSwitcher/LanguageSwitcher";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Menu, X, Phone, Mail } from "lucide-react";

export interface NavLink {
  href: string;
  labelKey: string;
}

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    { href: "/", labelKey: "nav.home" },
    { href: "/catalog", labelKey: "nav.catalog" },

    { href: "/buy", labelKey: "nav.buy" },
    { href: "/contact", labelKey: "nav.contact" },
    { href: "/parts", labelKey: "nav.parts" },
    { href: "/blog", labelKey: "nav.blog" },
  ];

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Top bar - Contact info */}
          <div className="hidden lg:flex items-center justify-end gap-6 py-2 border-b border-gray-100 text-sm text-gray-600">
            <a
              href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
              className="flex items-center gap-2 hover:text-orange-500 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{process.env.NEXT_PUBLIC_NUMBER_PHONE}</span>
            </a>
            <a
              href="mailto:info@kmotors.shop"
              className="flex items-center gap-2 hover:text-orange-500 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>{process.env.NEXT_PUBLIC_EMAIL}</span>
            </a>
            <LanguageSwitcher />
          </div>

          {/* Main header */}
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="group">
              <h1 className="text-3xl font-bold flex items-center gap-1 transition-transform group-hover:scale-105">
                <span className="text-orange-500">K</span>
                <span className="text-gray-900">Motors</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                    pathname === link.href
                      ? "text-orange-600 bg-orange-50"
                      : "text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {t(link.labelKey)}
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-orange-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </nav>

            {/* CTA Button + Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <LanguageSwitcher />
              </div>
              <ContactForm isVisible={false} />

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={t("common.menu")}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-900" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-900" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 border-t border-gray-100 ${
            isMobileMenuOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  pathname === link.href
                    ? "bg-orange-500 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Mobile contact info */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <a
                href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">
                  {process.env.NEXT_PUBLIC_NUMBER_PHONE}
                </span>
              </a>
              <a
                href="mailto:info@kmotors.shop"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{process.env.NEXT_PUBLIC_EMAIL}</span>
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation (альтернатива) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <ToggleGroup
          type="single"
          value={pathname}
          className="grid grid-cols-5 w-full"
        >
          {navLinks.map((link) => (
            <ToggleGroupItem
              key={link.href}
              value={link.href}
              className={`py-3 px-2 transition-all border-none rounded-none ${
                pathname === link.href
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
              asChild
            >
              <Link href={link.href} className="text-xs font-medium">
                {t(link.labelKey)}
              </Link>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </>
  );
}
