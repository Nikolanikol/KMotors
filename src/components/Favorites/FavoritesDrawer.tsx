"use client";

// Выдвижная панель «Избранное» в шапке — по образцу корзины (CartDrawer):
// не уводит со страницы, выезжает справа, тот же затемняющий фон и та же
// анимация. Решение владельца 05.10.2026: избранное ОТДЕЛЬНО от корзины.
// Корзина — заказ запчастей с количеством и суммой; машину так не оформить,
// а лот аукциона живёт дни. В одной корзине сумма потеряла бы смысл.
//
// Три раздела, у каждого — источник, чтобы не путаться (запрос владельца):
//   • Машины Encar   — хранилище kmotors_favorites (useFavorites);
//   • Аукционы       — kaxis:auction_favorites (useAuctionFavorites), снимок
//                      лота; прошедшие торги помечены и ведут на похожие;
//   • Запчасти       — kmotors_parts_favorites (usePartsFavorites).
//
// ⚠️ Уведомлений о цене НЕТ: прежние FavoritePriceAlert + useFavoritesSync опрашивали
// api.encar.com из браузера каждого посетителя (снято 05.10.2026).
//
// Как и корзина, до первого открытия панель не рендерится вовсе: она висит на
// каждой странице сайта.

import { Heart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useAuctionFavorites, type FavoriteLot } from "@/hooks/useAuctionFavorites";
import { useCountry } from "@/hooks/useCountry";
import { useFavorites } from "@/hooks/useFavorites";
import { usePartsFavorites } from "@/hooks/usePartsFavorites";
import { formatCarKrw } from "@/lib/carPricing";
import { kstToday } from "@/lib/carnect/time";
import { resolvePartImage } from "@/lib/partImage";
import { resizedImage } from "@/lib/remoteImage";
import { formatUsd } from "@/lib/pricing";
import { encarThumbLoader } from "@/utils/encarLoader";

import { favText } from "./favText";

/** Лот уже отторговался: точное время в прошлом или день торгов прошёл (по Корее). */
function lotIsOver(f: FavoriteLot): boolean {
  if (f.endAt) return Date.parse(f.endAt) < Date.now();
  if (f.auctionDate) return f.auctionDate < kstToday();
  return false;
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
        {title} <span style={{ color: "var(--axis-bronze)" }}>{count}</span>
      </h3>
      {children}
    </section>
  );
}

/** Строка избранного: миниатюра, название, источник, цена, кнопка «убрать». */
function Row({
  href,
  photo,
  title,
  source,
  price,
  note,
  onRemove,
  removeLabel,
  onNavigate,
}: {
  href: string;
  photo: string | null;
  title: string;
  source: string;
  price: string | null;
  note?: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  onNavigate: () => void;
}) {
  return (
    <div
      className="flex gap-3 rounded-xl p-2.5"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
    >
      <Link href={href} onClick={onNavigate} className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#1E1E1E]">
        {photo && (
          // Фото на чужих CDN (Encar, площадки, Storage запчастей) — без оптимизатора Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
          style={{ color: "var(--axis-white)" }}
        >
          {title}
        </Link>
        <div className="mt-0.5 truncate text-[11px]" style={{ color: "var(--axis-gray)" }}>
          {source}
        </div>
        {price && (
          <div className="mt-1 text-sm font-semibold" style={{ color: "var(--axis-bronze)" }}>
            {price}
          </div>
        )}
        {note}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:text-[#E5484D]"
        style={{ color: "var(--axis-gray)" }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function FavoritesDrawer({
  open,
  onClose,
  lang,
  krwToUsd,
}: {
  open: boolean;
  onClose: () => void;
  lang: string;
  /** Курс запчастей (getCurrencyRates) — для цены запчасти в $, как в корзине. */
  krwToUsd: number;
}) {
  const l = favText(lang);
  // Из Кореи машины закрыты (middleware, KR_BLOCKED_*): ссылки туда не предлагаем.
  const { isCatalogBlocked } = useCountry();
  const cars = useFavorites();
  const lots = useAuctionFavorites();
  const parts = usePartsFavorites();
  const total = cars.favorites.length + lots.favorites.length + parts.favorites.length;
  const panelRef = useRef<HTMLDivElement>(null);

  // Те же два флага, что у корзины: mounted — не рендерить до первого открытия,
  // shown — кадр задержки, иначе в первый раз панели неоткуда выезжать.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    setMounted(true);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    panelRef.current?.focus();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, mounted, onClose]);

  if (!mounted) return null;

  const partName = (p: (typeof parts.favorites)[number]) =>
    (lang === "ru" ? p.name_ru || p.name_en : lang === "ko" ? p.name_ko || p.name_en : p.name_en || p.name_ru) ||
    p.part_number;

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={l.title}
        tabIndex={-1}
        id="favorites-drawer"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col shadow-2xl outline-none transition-transform duration-300 ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "var(--background, #0A0A0A)", borderLeft: "1px solid rgba(74,74,74,0.35)" }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-4"
          style={{ borderBottom: "1px solid rgba(74,74,74,0.35)" }}
        >
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--axis-white)" }}>
            <Heart className="h-5 w-5" style={{ color: "var(--axis-bronze)" }} fill="currentColor" />
            {l.title}
            {total > 0 && (
              <span className="text-base font-semibold" style={{ color: "var(--axis-gray)" }}>
                ({total})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            aria-label={l.close}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:text-[var(--axis-bronze)]"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--axis-gray)", border: "1px solid rgba(74,74,74,0.4)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {total === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(74,74,74,0.4)" }}
            >
              <Heart className="h-8 w-8" style={{ color: "var(--axis-gray)" }} />
            </div>
            <p className="font-semibold" style={{ color: "var(--axis-white)" }}>
              {l.empty}
            </p>
            <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
              {l.emptyDesc}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {[
                ...(isCatalogBlocked
                  ? []
                  : [
                      [`/${lang}/catalog`, l.toCars],
                      [`/${lang}/auction`, l.toAuction],
                    ]),
                [`/${lang}/parts`, l.toParts],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ border: "1px solid rgba(182,119,73,0.45)", color: "var(--axis-bronze)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <Section title={l.encar} count={cars.favorites.length}>
              {cars.favorites.map((c) => (
                <Row
                  key={`encar:${c.id}`}
                  href={`/${lang}/catalog/${c.id}`}
                  photo={c.photo ? encarThumbLoader({ src: `https://ci.encar.com${c.photo}`, width: 192 }) : null}
                  title={c.title ?? [String(c.year ?? "").slice(0, 4), c.manufacture, c.model].filter(Boolean).join(" ")}
                  source="Encar"
                  // Цена уже со стояночным сбором (carPricing.ts) — та же, что на карточке.
                  price={c.price ? `₩${formatCarKrw(c.price)}` : null}
                  onRemove={() => cars.removeFavorite(c.id)}
                  removeLabel={l.remove}
                  onNavigate={onClose}
                />
              ))}
            </Section>

            <Section title={l.auction} count={lots.favorites.length}>
              {lots.favorites.map((f) => {
                const over = lotIsOver(f);
                const similar =
                  f.make && f.modelGroup
                    ? `/${lang}/auction?${new URLSearchParams({ make: f.make, model: f.modelGroup }).toString()}`
                    : `/${lang}/auction`;
                return (
                  <Row
                    key={f.key}
                    href={`/${lang}/auction/lot/${f.house}/${encodeURIComponent(f.externalId)}`}
                    photo={resizedImage(f.photo, 256)}
                    title={f.title}
                    source={f.source}
                    price={f.priceKrw ? `₩${f.priceKrw.toLocaleString("en-US")}` : null}
                    note={
                      over && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px]">
                          <span style={{ color: "#E5484D" }}>{l.auctionOver}</span>
                          <Link href={similar} onClick={onClose} style={{ color: "var(--axis-bronze)" }}>
                            {l.similar}
                          </Link>
                        </div>
                      )
                    }
                    onRemove={() => lots.removeFavorite(f.key)}
                    removeLabel={l.remove}
                    onNavigate={onClose}
                  />
                );
              })}
            </Section>

            <Section title={l.parts} count={parts.favorites.length}>
              {parts.favorites.map((p) => (
                <Row
                  key={`part:${p.id}`}
                  href={`/${lang}/parts/${encodeURIComponent(p.part_number)}`}
                  photo={resolvePartImage(p)}
                  title={partName(p)}
                  source={`${p.part_number}`}
                  price={p.price_krw && krwToUsd ? formatUsd(p.price_krw, krwToUsd) : null}
                  onRemove={() => parts.removeFavorite(p.id)}
                  removeLabel={l.remove}
                  onNavigate={onClose}
                />
              ))}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
