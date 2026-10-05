"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ContactForm from "./ContactFormModal";
import LanguageSwitcher from "@/components/LanguageSwitcher/LanguageSwitcher";
import { X, Menu, Heart, ShoppingCart, Instagram, ChevronDown } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { useFavorites } from "@/hooks/useFavorites";
import { usePartsFavorites } from "@/hooks/usePartsFavorites";
import { useCartCount } from "@/hooks/useCartCount";
import { CartDrawer, CART_OPEN_EVENT } from "@/components/Cart/CartDrawer";
import { FavoritesDrawer } from "@/components/Favorites/FavoritesDrawer";
import { FAVORITES_OPEN_EVENT, favText } from "@/components/Favorites/favText";
import { useAuctionFavorites } from "@/hooks/useAuctionFavorites";
import { useCountry } from "@/hooks/useCountry";

import AuthModalHost from "./AuthModalHost";
import ProfileButton from "./ProfileButton";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

/** Ссылка без хвоста igsh/utm — это одноразовый токен шаринга из QR-кода. */
const INSTAGRAM_URL = "https://www.instagram.com/axiskoreancar";

/**
 * Иконка Instagram — с 05.10.2026 только в мобильном меню (и в подвале). Из
 * верхней строки шапки убрана при пересборке: единственная кнопка, которая
 * уводит с сайта, а не к заявке; её место заняла иконка профиля.
 */
const InstagramLink = ({ position }: { position: "desktop" | "mobile" }) => (
  <a
    href={INSTAGRAM_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    onClick={() => trackEvent("contact", { method: "instagram_header", position })}
    className={`flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
      position === "mobile" ? "w-9 h-9" : "w-10 h-10"
    }`}
    style={{
      backgroundColor: "rgba(225,48,108,0.16)",
      color: "#F05C8E",
      border: "1.5px solid rgba(225,48,108,0.4)",
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.color = "#FFFFFF";
      el.style.backgroundImage =
        "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";
      el.style.borderColor = "rgba(225,48,108,0.75)";
      el.style.boxShadow = "0 8px 20px -8px rgba(225,48,108,0.9)";
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.color = "#F05C8E";
      el.style.backgroundImage = "none";
      el.style.borderColor = "rgba(225,48,108,0.4)";
      el.style.boxShadow = "none";
    }}
  >
    <Instagram
      className={position === "mobile" ? "w-[18px] h-[18px]" : "w-5 h-5"}
      strokeWidth={2}
    />
  </a>
);

/**
 * Логотип адаптируется КОМПОНОВКОЙ, а не размером: у горизонтального лок-апа
 * штрих букв — 5.8% высоты, ниже ~32px слово превращается в кашу. Поэтому на
 * узких экранах остаётся знак плюс название текстом, с sm — цельный лок-ап.
 * width/height проставлены под соотношения файлов (1.42 и 4.23), чтобы не
 * дёргалась вёрстка до загрузки.
 */
const BrandMark = ({ size = 30, className = "" }: { size?: number; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- статичный SVG в 533 B, next/image для векторов ничего не оптимизирует
  <img
    src="/logo/logo-mark.svg"
    alt=""
    width={Math.round(size * 1.4167)}
    height={size}
    style={{ height: size }}
    className={`w-auto flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${className}`}
  />
);

const BrandName = ({ className = "" }: { className?: string }) => (
  <span className={`font-heading tracking-tight ${className}`} style={{ color: "var(--axis-white)" }}>
    K<span style={{ color: "var(--axis-bronze)" }}>-Axis</span>
  </span>
);

/**
 * `krwToUsd` приходит пропсом из серверного layout: курс запрашивает ТОЛЬКО
 * сервер (`getCurrencyRates`), клиентские компоненты своих запросов не делают.
 * Нужен он выдвижной корзине — она показывает цены позиций и сумму.
 */
/**
 * Кнопка избранного в шапке — близнец кнопки корзины рядом: тот же круг,
 * та же бронза при непустом списке, тот же счётчик. Открывает FavoritesDrawer.
 */
function FavButton({
  count,
  open,
  onClick,
  label,
  small = false,
}: {
  count: number;
  open: boolean;
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  const on = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="favorites-drawer"
      aria-label={label}
      className={`relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
        small ? "w-9 h-9" : "w-10 h-10 hover:scale-110 hover:shadow-[0_0_12px_rgba(182,119,73,0.4)]"
      }`}
      style={{
        backgroundColor: on ? "rgba(182,119,73,0.18)" : "rgba(255,255,255,0.08)",
        color: on ? "var(--axis-orange)" : "var(--axis-silver)",
        border: on ? "1.5px solid rgba(182,119,73,0.4)" : "1.5px solid rgba(255,255,255,0.12)",
      }}
    >
      <Heart className={small ? "w-[18px] h-[18px]" : "w-5 h-5"} strokeWidth={2.2} fill={on ? "currentColor" : "none"} />
      {on && (
        <span
          className={`absolute flex items-center justify-center px-1 font-bold rounded-full ${
            small ? "-top-1 -right-1 min-w-[18px] h-[18px] text-[10px]" : "-top-1.5 -right-1.5 min-w-[20px] h-[20px] text-[11px] shadow-lg"
          }`}
          style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "white", boxShadow: "0 2px 8px rgba(182,119,73,0.5)" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export default function Header({ krwToUsd }: { krwToUsd: number }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { favorites: favCars } = useFavorites();
  const { favorites: favParts } = usePartsFavorites();
  const { favorites: favLots } = useAuctionFavorites();
  const favTotal = favCars.length + favParts.length + favLots.length;
  const [isFavOpen, setIsFavOpen] = useState(false);
  const closeFav = useCallback(() => setIsFavOpen(false), []);
  const { isCatalogBlocked } = useCountry();
  const cartCount = useCartCount();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Кнопки со страниц («Купить сейчас», «Перейти в корзину») открывают панель
  // событием, чтобы не тянуть к себе состояние шапки.
  useEffect(() => {
    const open = () => setIsCartOpen(true);
    const openFav = () => setIsFavOpen(true);
    window.addEventListener(CART_OPEN_EVENT, open);
    window.addEventListener(FAVORITES_OPEN_EVENT, openFav);
    return () => {
      window.removeEventListener(CART_OPEN_EVENT, open);
      window.removeEventListener(FAVORITES_OPEN_EVENT, openFav);
    };
  }, []);

  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  // ─── Навигация (пересобрана 05.10.2026, решение владельца) ───────────────
  // Было 7 пунктов в строку, стало 4: «Авто ▾», «Запчасти ▾», «Калькулятор»,
  // «Блог». «Главная» убрана — на неё ведёт логотип. Калькулятор и блог —
  // отдельными пунктами: это страницы с самым большим входящим трафиком.
  //
  // ⚠️ Каталог Encar и аукцион — под гейтом isCatalogBlocked (Корея): это те
  // же корейские машины, для Кореи они закрыты и на сервере (middleware).
  // Забыть здесь — оставить корейскому посетителю ссылку на 403. Если из
  // «Авто» остаётся один пункт («Как купить»), группа сворачивается в него.
  const carLinks = [
    ...(!isCatalogBlocked
      ? [
          { href: `/${lang}/catalog`, labelKey: "nav.catalog" },
          { href: `/${lang}/auction`, labelKey: "nav.auction" },
        ]
      : []),
    { href: `/${lang}/buy`, labelKey: "nav.buy" },
  ];
  const navLinks: { href: string; labelKey: string; children?: { href: string; labelKey: string }[] }[] = [
    carLinks.length > 1
      ? { href: carLinks[0].href, labelKey: "nav.cars", children: carLinks }
      : carLinks[0],
    {
      href: `/${lang}/parts`,
      labelKey: "nav.parts",
      // Отслеживание живёт под запчастями, а не отдельным пунктом: трек-номер
      // нужен ровно тем, кто уже что-то заказал, а шапка и так плотная.
      children: [
        { href: `/${lang}/parts`, labelKey: "nav.partsCatalog" },
        { href: `/${lang}/tracking`, labelKey: "nav.tracking" },
      ],
    },
    { href: `/${lang}/calculator`, labelKey: "nav.calculator" },
    { href: `/${lang}/blog`, labelKey: "nav.blog" },
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
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group" aria-label="K-Axis">
            {/* < sm: знак + название текстом */}
            <BrandMark className="sm:hidden" />
            <BrandName className="text-xl sm:hidden" />
            {/* ≥ sm: горизонтальный лок-ап, слово уже внутри картинки */}
            {/* eslint-disable-next-line @next/next/no-img-element -- статичный SVG, см. BrandMark */}
            <img
              src="/logo/logo-horizontal.svg"
              alt=""
              width={152}
              height={36}
              className="hidden sm:block h-9 w-auto flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                /* Выпадашка открывается по наведению и по фокусу с клавиатуры;
                   отступ pt-3 держит мост между пунктом и панелью, иначе меню
                   схлопывается, пока курсор идёт по зазору. */
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-200"
                    style={{
                      color: isActive(link.href) ? "var(--axis-orange)" : "var(--axis-gray)",
                    }}
                    onMouseEnter={(e) => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
                    onMouseLeave={(e) => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
                  >
                    {t(link.labelKey)}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  </Link>

                  <div className="absolute left-0 top-full pt-3 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
                    <div
                      className="min-w-[220px] rounded-xl border border-white/10 py-2 shadow-2xl"
                      style={{ backgroundColor: "var(--axis-charcoal)" }}
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm font-medium transition-colors duration-200"
                          style={{ color: isActive(child.href) ? "var(--axis-orange)" : "var(--axis-gray)" }}
                          onMouseEnter={(e) => { if (!isActive(child.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-white)"; }}
                          onMouseLeave={(e) => { if (!isActive(child.href)) (e.currentTarget as HTMLElement).style.color = "var(--axis-gray)"; }}
                        >
                          {t(child.labelKey)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
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
              )
            )}
          </nav>

          {/* Right side */}
          {/* Справа — только действия: язык, профиль, избранное, корзина, заявка.
              Телефон и Instagram — в подвале и мобильном меню (05.10.2026):
              номер корейский (+82), из СНГ по нему почти не звонят, а занимал
              он больше любой иконки. */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />

            {/* Profile + Favorites + Cart — grouped together */}
            <div className="flex items-center gap-2">
                <ProfileButton lang={lang} />
                <FavButton count={favTotal} open={isFavOpen} onClick={() => setIsFavOpen((v) => !v)} label={favText(lang).title} />
                <button
                  type="button"
                  onClick={() => setIsCartOpen((v) => !v)}
                  aria-expanded={isCartOpen}
                  aria-controls="cart-drawer"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_rgba(182,119,73,0.4)] cursor-pointer"
                  style={{
                    backgroundColor: cartCount > 0 ? "rgba(182,119,73,0.18)" : "rgba(255,255,255,0.08)",
                    color: cartCount > 0 ? "var(--axis-orange)" : "var(--axis-silver)",
                    border: cartCount > 0 ? "1.5px solid rgba(182,119,73,0.4)" : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[11px] font-bold rounded-full shadow-lg"
                      style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "white", boxShadow: "0 2px 8px rgba(182,119,73,0.5)" }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>
            </div>
            {/* Заявка — прямой кнопкой, а не пунктом меню: это конверсия, лишний
                клик до формы стоит заявок. WhatsApp/Telegram — в плавающей
                кнопке внизу справа на всех страницах. */}
            <ContactForm isVisible={false} />
          </div>

          {/* Mobile right: профиль, избранное, корзина, меню. Язык, Instagram,
              телефон и заявка — внутри меню ☰. */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-1.5">
                <ProfileButton lang={lang} small />
                <FavButton count={favTotal} open={isFavOpen} onClick={() => setIsFavOpen((v) => !v)} label={favText(lang).title} small />
                <button
                  type="button"
                  onClick={() => setIsCartOpen((v) => !v)}
                  aria-expanded={isCartOpen}
                  aria-controls="cart-drawer"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full cursor-pointer"
                  style={{
                    backgroundColor: cartCount > 0 ? "rgba(182,119,73,0.18)" : "rgba(255,255,255,0.08)",
                    color: cartCount > 0 ? "var(--axis-orange)" : "var(--axis-silver)",
                    border: cartCount > 0 ? "1.5px solid rgba(182,119,73,0.4)" : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full"
                      style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "white", boxShadow: "0 2px 6px rgba(182,119,73,0.5)" }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>
            </div>
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
            <Link href={`/${lang}`} className="flex items-center gap-2.5 group" onClick={() => setIsMobileMenuOpen(false)}>
              <BrandMark />
              <BrandName className="text-xl" />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
              <X className="w-6 h-6" style={{ color: "var(--axis-white)" }} />
            </button>
          </div>

          <nav className="flex flex-col items-center justify-center flex-1 gap-6">
            {navLinks.map((link) => (
              <div key={link.href} className="flex flex-col items-center gap-2.5">
                {/* У группы заголовок — просто подпись, а все подпункты видны
                    целиком: по слову «Авто» не догадаться, что оно ведёт в
                    каталог Encar, поэтому «Каталог» обязан стоять пунктом. */}
                {link.children ? (
                  <span className="text-2xl font-heading" style={{ color: "var(--axis-white)" }}>
                    {t(link.labelKey)}
                  </span>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-heading transition-colors"
                    style={{ color: isActive(link.href) ? "var(--axis-orange)" : "var(--axis-white)" }}
                  >
                    {t(link.labelKey)}
                  </Link>
                )}
                {/* Выпадашки на мобильном нет — подпункты идут следом помельче. */}
                {link.children
                  ?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base transition-colors"
                      style={{ color: isActive(child.href) ? "var(--axis-orange)" : "var(--axis-gray)" }}
                    >
                      {t(child.labelKey)}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-4 pb-8">
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <InstagramLink position="mobile" />
            </div>
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

      <FavoritesDrawer open={isFavOpen} onClose={closeFav} lang={lang} krwToUsd={krwToUsd} />
      {/* Окно входа: грузится лениво при первом openAuthModal (замок цены, иконка профиля). */}
      <AuthModalHost />
      <CartDrawer
        open={isCartOpen}
        onClose={closeCart}
        lang={lang}
        krwToUsd={krwToUsd}
      />
    </>
  );
}
