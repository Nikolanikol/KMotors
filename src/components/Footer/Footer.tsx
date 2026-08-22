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
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.38.896.42.42.679.82.896 1.38.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.56-.477.96-.896 1.38-.42.42-.82.679-1.38.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413-.56-.217-.96-.477-1.38-.896-.42-.42-.679-.82-.896-1.38-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.413-2.227.217-.56.477-.96.896-1.38.42-.42.82-.679 1.38-.896.422-.166 1.057-.362 2.227-.415 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.132 4.903.335 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.335 4.903.131 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.263 2.149.558 2.912a5.88 5.88 0 001.384 2.126 5.88 5.88 0 002.126 1.384c.763.295 1.635.499 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.149-.263 2.912-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.295-.763.499-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.263-2.149-.558-2.912a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63c-.763-.295-1.635-.498-2.912-.558C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
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

/** Ссылка без хвоста igsh/utm — это одноразовый токен шаринга из QR-кода. */
const INSTAGRAM_URL = "https://www.instagram.com/axiskoreancar";

/** #RRGGBB → rgba(), чтобы плитка тонировалась цветом своей сети. */
const tint = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** Фирменные цвета сетей — серые плитки на тёмном подвале не читались. */
const SOCIAL_COLORS = {
  telegram: "#229ED9",
  whatsapp: "#25D366",
  instagram: "#E1306C",
  tiktok: "#25F4EE",
} as const;

// Четыре одинаковых плитки со своими onMouseEnter/Leave расходились по стилям
// при каждой правке — вынесено в один компонент.
function SocialLink({
  href,
  label,
  color,
  children,
}: {
  href: string;
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: tint(color, 0.14),
        border: `1px solid ${tint(color, 0.28)}`,
        color,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = tint(color, 0.26);
        el.style.borderColor = tint(color, 0.55);
        el.style.boxShadow = `0 10px 22px -10px ${tint(color, 0.8)}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = tint(color, 0.14);
        el.style.borderColor = tint(color, 0.28);
        el.style.boxShadow = "none";
      }}
    >
      {children}
    </a>
  );
}

// ⚠️ role="img" обязателен и это не украшение. Иконка внутри помечена aria-hidden,
// поэтому единственное имя карточки — aria-label на контейнере. На голом <div>
// (неявная роль generic) спецификация ARIA запрещает aria-label, и скринридер его
// ИГНОРИРУЕТ: блок платёжных систем оказывался безымянным целиком. Ошибка нашлась
// аудитом Lighthouse 23.08.2026 («Elements must only use permitted ARIA attributes»).
// role="img" делает карточку изображением с текстовой альтернативой — тогда ярлык
// разрешён и читается, а декоративное содержимое не озвучивается.
function PayCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="img"
      title={label}
      aria-label={label}
      className="h-16 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(74,74,74,0.35)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(182,119,73,0.5)";
        e.currentTarget.style.backgroundColor = "rgba(182,119,73,0.06)";
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

// Название рядом идёт текстом, поэтому знак декоративный — alt пустой,
// иначе скринридер прочитает бренд дважды.
const KAxisLogo = () => (
  // eslint-disable-next-line @next/next/no-img-element -- статичный SVG в 533 B, next/image для векторов ничего не оптимизирует
  <img
    src="/logo/logo-mark.svg"
    alt=""
    width={40}
    height={28}
    style={{ height: 28 }}
    className="w-auto flex-shrink-0"
  />
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
    { href: `/${lang}/tracking`, labelKey: "nav.tracking" },
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
              href={`/${lang}`}
              className="flex items-center gap-2.5 mb-4 group"
            >
              <KAxisLogo />
              <span
                className="font-heading text-lg"
                style={{ color: "var(--axis-white)" }}
              >
                K<span style={{ color: "var(--axis-bronze)" }}>-Axis</span>
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
            {/* Contacts + Social.
                Было `space-y-8 flex`: flex переводит контейнер в РЯД, а
                space-y-* вешает margin-top на второго ребёнка — блок соцсетей
                вставал сбоку и одновременно сползал на 32px вниз. Колонка. */}
            <div className="flex flex-col gap-8">
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
                        backgroundColor: "rgba(182,119,73,0.1)",
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
                        backgroundColor: "rgba(182,119,73,0.08)",
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
                <div className="flex flex-wrap gap-3">
                  <SocialLink
                    href="https://t.me/avto_korea_nikolai"
                    label="Telegram"
                    color={SOCIAL_COLORS.telegram}
                  >
                    <TelegramIcon />
                  </SocialLink>
                  <SocialLink
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_NUMBER_PHONE || "").replace(/\D/g, "")}`}
                    label="WhatsApp"
                    color={SOCIAL_COLORS.whatsapp}
                  >
                    <WhatsAppIcon />
                  </SocialLink>
                  <SocialLink
                    href={INSTAGRAM_URL}
                    label="Instagram"
                    color={SOCIAL_COLORS.instagram}
                  >
                    <InstagramIcon />
                  </SocialLink>
                  <SocialLink
                    href="https://www.tiktok.com/@kmotors121"
                    label="TikTok"
                    color={SOCIAL_COLORS.tiktok}
                  >
                    <TikTokIcon />
                  </SocialLink>
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
              backgroundColor: "rgba(182,119,73,0.1)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(182,119,73,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--axis-orange)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--axis-white)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(182,119,73,0.1)";
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
