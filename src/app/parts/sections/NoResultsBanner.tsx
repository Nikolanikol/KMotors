"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchX, Clock, ShieldCheck, Truck } from "lucide-react";
import { trackEvent } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";
import { OrderModal } from "./OrderModal";

const WA_PHONE = "821058654344";
const TG_MANAGER = "axiskorea";

/**
 * Пустая выдача каталога — самый дорогой момент: клиент решает, что детали нет, и уходит.
 * Поэтому вместо «ничего не найдено» ведём в личку: заявка менеджеру + прямые мессенджеры.
 */
export function NoResultsBanner({
  query,
  onReset,
}: {
  /** Поисковый запрос (артикул), если он был — попадает в заявку и в текст сообщения. */
  query: string;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const [orderOpen, setOrderOpen] = useState(false);

  // Один трек на запрос, а не на каждый ре-рендер
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (tracked.current === query) return;
    tracked.current = query;
    trackEvent("search_no_results", { search_term: query || "(filters)", section: "parts" });
    clarityEvent("parts_no_results");
  }, [query]);

  const waText = query
    ? t("parts.catalog.miss.msgQuery", { q: query })
    : t("parts.catalog.miss.msg");
  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(waText)}`;
  const tgUrl = `https://t.me/${TG_MANAGER}?text=${encodeURIComponent(waText)}`;

  const openOrder = () => {
    trackEvent("no_results_request", { search_term: query || "(filters)" });
    setOrderOpen(true);
  };

  const onMessenger = (channel: "whatsapp" | "telegram") => {
    trackEvent("no_results_messenger", { channel, search_term: query || "(filters)" });
    clarityEvent(`parts_no_results_${channel}`);
  };

  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--pn-orange)]/30 bg-[var(--pn-surface)] overflow-hidden shadow-xl">
        {/* Шапка */}
        <div className="px-6 sm:px-8 pt-8 pb-6 text-center bg-gradient-to-b from-[var(--pn-orange)]/10 to-transparent">
          <div className="w-14 h-14 rounded-full bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)]/15 border border-[var(--pn-orange)]/30 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-7 h-7 text-[var(--pn-orange)]" />
          </div>

          {query && (
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--pn-text-dim)] mb-2 break-all">
              {t("parts.catalog.miss.queryLabel")}:{" "}
              <span className="text-[var(--pn-orange-soft)]">{query}</span>
            </p>
          )}

          <h2 className="text-xl sm:text-2xl font-bold text-[var(--pn-text)] leading-snug mb-2">
            {t("parts.catalog.miss.title")}
          </h2>
          <p className="text-sm sm:text-base text-[var(--pn-text-muted)] leading-relaxed">
            {t("parts.catalog.miss.text")}
          </p>
        </div>

        {/* Кнопки */}
        <div className="px-6 sm:px-8 pb-6 space-y-3">
          <button
            onClick={openOrder}
            className="w-full h-12 rounded-xl bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)] text-white font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-[var(--pn-orange)]/20"
          >
            {t("parts.catalog.miss.cta")}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onMessenger("whatsapp")}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--pn-border)] bg-[var(--pn-surface-2)] text-sm font-medium text-[var(--pn-text)] hover:border-[#25D366]/60 transition-colors"
            >
              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-[#25D366]" aria-hidden="true">
                <path d="M16.004 3.2C9.054 3.2 3.404 8.85 3.404 15.8c0 2.22.58 4.39 1.68 6.3L3.2 28.8l6.93-1.82a12.56 12.56 0 006.87 1.02h.004c6.95 0 12.6-5.65 12.6-12.6s-5.65-12.2-12.6-12.2zm0 23.04a10.4 10.4 0 01-5.31-1.46l-.38-.23-3.95 1.04 1.05-3.85-.25-.39A10.39 10.39 0 015.56 15.8c0-5.76 4.69-10.44 10.45-10.44 5.76 0 10.44 4.68 10.44 10.44 0 5.77-4.68 10.44-10.44 10.44zm5.73-7.83c-.32-.16-1.87-.92-2.16-1.03-.29-.1-.5-.16-.71.16s-.82 1.03-1 1.24c-.19.2-.37.23-.69.08-.32-.16-1.34-.5-2.56-1.58-.94-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64 0 1.56 1.14 3.06 1.3 3.27.16.21 2.24 3.42 5.43 4.79.76.33 1.35.52 1.81.67.76.24 1.46.2 2.01.13.61-.09 1.87-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onMessenger("telegram")}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--pn-border)] bg-[var(--pn-surface-2)] text-sm font-medium text-[var(--pn-text)] hover:border-[#0088cc]/60 transition-colors"
            >
              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-[#0088cc]" aria-hidden="true">
                <path d="M26.07 5.26l-3.75 19.32c-.27 1.3-.99 1.62-2.02 1.01l-5.6-4.13-2.7 2.6c-.3.3-.55.55-1.13.55l.4-5.73L22.1 8.93c.47-.42-.1-.65-.73-.23L8.46 17.6l-5.53-1.73c-1.2-.37-1.22-1.2.25-1.78L24.6 3.53c1-.37 1.87.23 1.47 1.73z" />
              </svg>
              Telegram
            </a>
          </div>
        </div>

        {/* Аргументы доверия */}
        <div className="border-t border-[var(--pn-border)] px-6 sm:px-8 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Perk icon={<Clock className="w-4 h-4" />} label={t("parts.catalog.miss.perk1")} />
          <Perk icon={<ShieldCheck className="w-4 h-4" />} label={t("parts.catalog.miss.perk2")} />
          <Perk icon={<Truck className="w-4 h-4" />} label={t("parts.catalog.miss.perk3")} />
        </div>
      </div>

      <div className="text-center mt-5">
        <button
          onClick={onReset}
          className="text-sm text-[var(--pn-text-muted)] underline underline-offset-4 hover:text-[var(--pn-orange)] transition-colors"
        >
          {t("parts.catalog.resetFilters")}
        </button>
      </div>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        productName={t("parts.catalog.miss.requestName")}
        partNumber={query || "—"}
        productUrl={typeof window !== "undefined" ? window.location.href : ""}
        source="parts_no_results"
        title={t("parts.catalog.miss.modalTitle")}
        subtitle={t("parts.catalog.miss.modalSubtitle")}
      />
    </div>
  );
}

function Perk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--pn-text-muted)]">
      <span className="text-[var(--pn-orange)] shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
