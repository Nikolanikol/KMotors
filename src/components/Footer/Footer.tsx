"use client";
import { type ReactNode } from "react";
import { Mail, Phone, MapPin, ArrowUp, CreditCard } from "lucide-react";

// Inline SVG иконки вместо react-icons (~80KB saved)
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
  </svg>
);
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCountry } from "@/hooks/useCountry";
import { FaCcPaypal, FaCcVisa } from "react-icons/fa";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

// Payment is arranged via the manager (e.g. PayPal invoice) — these badges are a trust signal.
const PAY_HEADING: Record<string, string> = {
  ru: "Оплата",
  en: "Payment",
  ko: "결제",
  ka: "გადახდა",
  ar: "الدفع",
};
const PAY_CAPTION: Record<string, string> = {
  ru: "Принимаем PayPal, банковские карты и прямые переводы",
  en: "We accept PayPal, bank cards and direct transfers",
  ko: "PayPal, 은행 카드 및 직접 송금을 받습니다",
  ka: "ვიღებთ PayPal-ს, საბანკო ბარათებს და პირდაპირ გადარიცხვებს",
  ar: "نقبل PayPal والبطاقات المصرفية والتحويلات المباشرة",
};

// Iconic Mastercard two-circle mark (react-icons is monochrome, so drawn inline for full colour)
const MastercardMark = () => (
  <svg viewBox="0 0 48 30" width="42" height="26" aria-hidden role="img">
    <circle cx="19" cy="15" r="9.5" fill="#EB001B" />
    <circle cx="29" cy="15" r="9.5" fill="#F79E1B" />
    <path
      d="M24 7.7a9.5 9.5 0 0 1 0 14.6 9.5 9.5 0 0 1 0-14.6z"
      fill="#FF5F00"
    />
  </svg>
);

function PayCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      title={label}
      aria-label={label}
      className="h-16 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(74,74,74,0.35)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,69,0,0.5)";
        e.currentTarget.style.backgroundColor = "rgba(255,69,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(74,74,74,0.35)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
      }}
    >
      {children}
    </div>
  );
}

const KAxisLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 36 36"
    fill="none"
    className="flex-shrink-0"
  >
    <defs>
      <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="36" y2="36">
        <stop offset="0%" stopColor="#FF4500" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <path
      d="M4 32L16 4H22L14 20L28 4H32L18 20L28 32H22L12 20L8 32H4Z"
      fill="url(#footerLogoGrad)"
      strokeWidth="0.5"
    />
    <path d="M20 4L32 4L24 14L20 4Z" fill="#FF6B1A" opacity="0.6" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isCatalogBlocked } = useCountry();

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const navLinks = [
    { href: `/${lang}/`, labelKey: "nav.home" },
    ...(!isCatalogBlocked
      ? [{ href: `/${lang}/catalog`, labelKey: "nav.catalog" }]
      : []),
    { href: `/${lang}/buy`, labelKey: "nav.buy" },
    { href: `/${lang}/parts`, labelKey: "nav.parts" },
    { href: `/${lang}/blog`, labelKey: "nav.blog" },
    { href: `/${lang}/about`, labelKey: "nav.about" },
    { href: `/${lang}/partners`, labelKey: "nav.partners" },
    { href: `/${lang}/contact`, labelKey: "nav.contact" },
  ];

  return (
    <footer
      className="relative border-t mt-0"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        borderColor: "rgba(74,74,74,0.3)",
      }}
    >
      {/* Top orange line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--axis-orange)] to-transparent opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link
              href={`/${lang}/`}
              className="flex items-center gap-2.5 mb-4 group"
            >
              <KAxisLogo />
              <span
                className="font-heading text-lg"
                style={{ color: "var(--axis-white)" }}
              >
                K<span style={{ color: "var(--axis-orange)" }}>-Axis</span>
              </span>
            </Link>
            <p
              className="text-xs leading-relaxed mb-4"
              style={{ color: "var(--axis-gray)" }}
            >
              {t("footer.tagline")}
            </p>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "var(--axis-gray)" }}
            >
              <MapPin
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "var(--axis-orange)" }}
              />
              <span>{t("footer.location")}</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="text-sm font-semibold mb-4 tracking-wide"
              style={{ color: "var(--axis-white)" }}
            >
              {t("footer.navigation")}
            </h4>
            <nav className="space-y-2.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm transition-colors duration-200"
                  style={{ color: "var(--axis-gray)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--axis-orange)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--axis-gray)";
                  }}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Contacts + Social, then Payment */}
          <div className="space-y-10">
            {/* Contacts + Social */}
            <div className="space-y-8 flex">
              {/* Contacts */}
              <div>
                <h4
                  className="text-sm font-semibold mb-4 tracking-wide"
                  style={{ color: "var(--axis-white)" }}
                >
                  {t("footer.contacts")}
                </h4>
                <div className="space-y-3">
                  <a
                    href={`tel:${process.env.NEXT_PUBLIC_NUMBER_PHONE}`}
                    className="flex items-center gap-3 text-sm transition-colors group"
                    style={{ color: "var(--axis-white)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-orange)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-white)";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        backgroundColor: "rgba(255,69,0,0.1)",
                        color: "var(--axis-orange)",
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </div>
                    {process.env.NEXT_PUBLIC_NUMBER_PHONE}
                  </a>
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
                    className="flex items-center gap-3 text-sm transition-colors"
                    style={{ color: "var(--axis-gray)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-orange)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-gray)";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: "rgba(255,69,0,0.08)",
                        color: "var(--axis-orange)",
                      }}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    {process.env.NEXT_PUBLIC_EMAIL}
                  </a>
                </div>
              </div>

              {/* Social */}
              <div>
                <h4
                  className="text-sm font-semibold mb-4 tracking-wide"
                  style={{ color: "var(--axis-white)" }}
                >
                  {t("footer.socialMedia")}
                </h4>
                <div className="flex gap-3">
                  <a
                    href="https://t.me/avto_korea_nikolai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(255,69,0,0.08)",
                      color: "var(--axis-gray)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-orange)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-gray)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.08)";
                    }}
                    aria-label="Telegram"
                  >
                    <TelegramIcon />
                  </a>
                  <a
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_NUMBER_PHONE || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(255,69,0,0.08)",
                      color: "var(--axis-gray)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-orange)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-gray)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.08)";
                    }}
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon />
                  </a>
                  <a
                    href="https://www.tiktok.com/@kmotors121"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(255,69,0,0.08)",
                      color: "var(--axis-gray)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-orange)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--axis-gray)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,69,0,0.08)";
                    }}
                    aria-label="TikTok"
                  >
                    <TikTokIcon />
                  </a>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h4
                className="text-sm font-semibold mb-4 tracking-wide"
                style={{ color: "var(--axis-white)" }}
              >
                {PAY_HEADING[lang] ?? PAY_HEADING.en}
              </h4>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <PayCard label="PayPal">
                  <FaCcPaypal
                    className="w-11 h-7"
                    style={{ color: "#0070E0" }}
                    aria-hidden
                  />
                </PayCard>
                <PayCard label="Visa">
                  <FaCcVisa
                    className="w-11 h-7"
                    style={{ color: "#2A5BE0" }}
                    aria-hidden
                  />
                </PayCard>
                <PayCard label="Mastercard">
                  <MastercardMark />
                </PayCard>
                <PayCard label="Bank card">
                  <CreditCard
                    className="w-7 h-7"
                    strokeWidth={1.6}
                    style={{ color: "var(--axis-silver)" }}
                    aria-hidden
                  />
                </PayCard>
              </div>
              <p
                className="text-xs leading-relaxed mt-3"
                style={{ color: "var(--axis-gray)" }}
              >
                {PAY_CAPTION[lang] ?? PAY_CAPTION.en}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t"
          style={{ borderColor: "rgba(74,74,74,0.2)" }}
        >
          <p
            className="text-xs tracking-wide"
            style={{ color: "var(--axis-gray-dim)" }}
          >
            © {new Date().getFullYear()} K-Axis Motors. {t("footer.copyright")}.{" "}
            <Link
              href={`/${lang}/privacy`}
              className="ml-1 transition-colors hover:underline"
              style={{ color: "var(--axis-gray-dim)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--axis-orange)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--axis-gray-dim)";
              }}
            >
              {t("footer.privacy")}
            </Link>
            <span style={{ color: "var(--axis-gray-dim)" }}> · </span>
            <Link
              href={`/${lang}/terms`}
              className="transition-colors hover:underline"
              style={{ color: "var(--axis-gray-dim)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--axis-orange)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--axis-gray-dim)";
              }}
            >
              {t("footer.terms")}
            </Link>
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,69,0,0.1)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(255,69,0,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--axis-orange)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--axis-white)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255,69,0,0.1)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--axis-orange)";
            }}
          >
            {t("footer.scrollToTop")}
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
