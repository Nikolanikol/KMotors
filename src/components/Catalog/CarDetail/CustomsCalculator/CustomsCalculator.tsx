"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import CarRequestForm from "../CarRequestForm";
import { getCountry, type RuntimeInputs } from "@/lib/customs/core/registry";
import { formatAmount } from "@/lib/customs/core/format";
import type { Flag } from "@/lib/customs/core/types";
import { resolveDate, resolveText } from "@/lib/customs/i18nText";
import {
  WIDGET_COUNTRIES,
  WIDGET_CURRENCY,
  carCustomsInput,
  type WidgetCountryId,
} from "@/lib/customs/fromCar";
import { rateBetween, type Rates } from "@/lib/fx/types";

/**
 * Виджет «Расчёт растаможки» в карточке авто.
 *
 * Считает ЯДРОМ `src/lib/customs` — тем же, что `/calculator` (решение
 * владельца 26.11.2026), — со входом из данных машины (`fromCar.ts`). Курс
 * приходит пропсом с сервера (`getFx("customs")`); своих запросов за курсом у
 * виджета нет. Тексты — неймспейс `customs`: строки чека называет ядро, подписи
 * самого виджета лежат в `customs.widget.*`. Словарь на страницу ставит
 * `<CustomsDictionary/>`.
 */
interface Props {
  /** Цена сделки в вонах, БЕЗ стояночного сбора — база таможни. */
  priceKRW: number;
  /** Encar «YYYYMM». */
  yearMonth: string;
  engineVolume: number;
  /** Encar `spec.fuelName`, корейское название. */
  fuelType?: string;
  rates: Rates;
  carId?: string;
  carName?: string;
  lang?: string;
}

const FLAG_STYLES: Record<Flag["level"], string> = {
  info: "border-white/10 bg-white/[0.03] text-[var(--axis-silver)]",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
};

const FLAG_EMOJI: Record<WidgetCountryId, string> = {
  russia: "🇷🇺",
  kazakhstan: "🇰🇿",
  uzbekistan: "🇺🇿",
};

export default function CustomsCalculator({
  priceKRW,
  yearMonth,
  engineVolume,
  fuelType,
  rates,
  carId,
  carName,
  lang = "ru",
}: Props) {
  const { t } = useTranslation("customs");
  const [countryId, setCountryId] = useState<WidgetCountryId>("russia");
  const [horsePower, setHorsePower] = useState("");

  // Расчётный момент подставляет интерфейс: ядро дату не берёт. Тип
  // RuntimeInputs обязывает подать каждый ключ RUNTIME_INPUT_IDS.
  const [runtime] = useState<RuntimeInputs>(() => {
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 };
  });

  const country = getCountry(countryId);
  const currency = WIDGET_CURRENCY[countryId];

  const input = useMemo(
    () =>
      carCustomsInput(
        countryId,
        { priceKrw: priceKRW, yearMonth, volumeCc: engineVolume, fuelName: fuelType },
        rates,
        runtime,
        { horsePower: Number(horsePower) || 0 },
      ),
    [countryId, priceKRW, yearMonth, engineVolume, fuelType, rates, runtime, horsePower],
  );

  const result = useMemo(
    () => (input && country.calculator ? country.calculator.calculate(input) : null),
    [input, country.calculator],
  );

  const unit = currency === "RUB" ? "₽" : currency === "KZT" ? "₸" : t("widget.sum");
  const money = (n: number) => `${formatAmount(n)} ${unit}`;
  const toUsd = rateBetween(rates, currency, "USD");
  const usd = (n: number) => (toUsd ? `≈ $${formatAmount(n * toUsd)}` : null);
  const krwToLocal = rateBetween(rates, "KRW", currency) ?? 0;
  const carLocal = priceKRW * krwToLocal;
  const ratesDate = resolveDate(t, rates.asOf);
  const usesSnapshot = rates.sources.KRW === "fallback" || rates.sources[currency] === "fallback";

  const calcHref = `/${lang}/calculator${countryId === "russia" ? "" : `/${countryId}`}`;

  const tabs = WIDGET_COUNTRIES.map((id) => ({
    id,
    label: resolveText(t, getCountry(id).tabLabel),
  }));

  return (
    <div
      className="mt-0 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1.5px solid rgba(182,119,73,0.35)",
        boxShadow: "0 0 20px rgba(182,119,73,0.08)",
      }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: "var(--axis-bronze-deep)" }} />
      <div className="px-6 pt-4 pb-0" style={{ background: "linear-gradient(to right, var(--axis-graphite), #1a1a1a)" }}>
        <div className="mb-3">
          <h3 className="text-lg font-bold text-[var(--axis-white)]">🧮 {t("widget.title")}</h3>
          <p className="mt-0.5 text-sm text-[var(--axis-silver)]">{t("widget.subtitle")}</p>
        </div>
        <div className="flex gap-1" role="group" aria-label={t("widget.tabsLabel")}>
          {tabs.map((tab) => {
            const active = tab.id === countryId;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCountryId(tab.id)}
                className={[
                  "rounded-t-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]",
                  active
                    ? "bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] text-white hover:brightness-115"
                    : "text-[var(--axis-gray)] hover:bg-white/[0.06] hover:text-[var(--axis-white)]",
                ].join(" ")}
              >
                {FLAG_EMOJI[tab.id]} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <p className="flex items-center gap-2 text-xs text-[var(--axis-gray)]">
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${usesSnapshot ? "bg-amber-400" : "bg-green-500"}`}
          />
          <span>
            {usesSnapshot
              ? t("widget.rateFallback", { date: ratesDate })
              : t("widget.rate", {
                  date: ratesDate,
                  amount: formatAmount(1_000_000 * krwToLocal),
                  currency: unit,
                })}
          </span>
        </p>

        {countryId === "russia" && (
          <div className="space-y-1.5 rounded-xl px-4 py-4" style={{ backgroundColor: "var(--axis-graphite)" }}>
            <label htmlFor="customs-widget-hp" className="block text-sm font-medium text-[var(--axis-silver)]">
              {t("widget.hpLabel")}
            </label>
            <input
              id="customs-widget-hp"
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              placeholder={t("widget.hpPlaceholder")}
              value={horsePower}
              onChange={(e) => setHorsePower(e.target.value)}
              className="w-40 rounded-lg border border-white/10 bg-[var(--axis-charcoal)] px-3 py-2 text-sm text-[var(--axis-white)] outline-none transition-colors [color-scheme:dark] placeholder:text-[var(--axis-gray)] hover:border-white/25 focus-visible:border-[var(--axis-bronze)] focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
            />
            <p className="text-xs leading-relaxed text-[var(--axis-gray)]">{t("widget.hpHint")}</p>
          </div>
        )}

        {countryId === "uzbekistan" && input && (
          <p className="text-xs leading-relaxed text-[var(--axis-gray)]">
            {t("widget.uzBase", { freight: formatAmount(Number(input.freightUsd) || 0) })}
          </p>
        )}

        {!result ? (
          <p className="text-sm text-red-300">{t("widget.unavailable")}</p>
        ) : (
          <>
            <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "var(--axis-graphite)" }}>
              <div className="mb-1 text-sm text-[var(--axis-gray)]">{t("widget.total")}</div>
              <div className="text-3xl font-bold tabular-nums text-[var(--axis-bronze)]">
                {money(result.total.amount)}
              </div>
              {usd(result.total.amount) && (
                <div className="mt-0.5 text-sm tabular-nums text-[var(--axis-silver)]">
                  {usd(result.total.amount)}
                </div>
              )}
              <div className="mt-1 text-xs text-[var(--axis-gray)]">
                {result.subtitle.map((part) => resolveText(t, part)).join(" · ")}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-[var(--axis-silver)]">{t("widget.breakdown")}</div>
              {result.lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex justify-between gap-3 border-b border-white/[0.06] py-2 text-sm ${line.muted ? "opacity-50" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="text-[var(--axis-silver)]">{resolveText(t, line.label)}</div>
                    {line.note && (
                      <div className="mt-0.5 text-[11px] leading-snug text-[var(--axis-gray)]">
                        {resolveText(t, line.note)}
                      </div>
                    )}
                  </div>
                  <span className="whitespace-nowrap font-medium tabular-nums text-[var(--axis-white)]">
                    {money(line.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm font-semibold text-[var(--axis-white)]">
                <span>{t("ui.total")}</span>
                <span className="tabular-nums text-[var(--axis-bronze)]">{money(result.total.amount)}</span>
              </div>
            </div>

            {krwToLocal > 0 && (
              <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-5 py-4">
                <div className="mb-1 text-sm text-[var(--axis-silver)]">{t("widget.finalCost")}</div>
                <div className="text-2xl font-bold tabular-nums text-green-300">
                  {money(carLocal + result.total.amount)}
                </div>
                {usd(carLocal + result.total.amount) && (
                  <div className="mt-0.5 text-sm font-medium tabular-nums text-green-300/80">
                    {usd(carLocal + result.total.amount)}
                  </div>
                )}
                <div className="mt-1 text-xs text-[var(--axis-gray)]">
                  {t("widget.finalCostNote", {
                    car: money(carLocal),
                    customs: money(result.total.amount),
                  })}
                </div>
              </div>
            )}

            {result.flags.length > 0 && (
              <ul className="flex list-none flex-col gap-1.5 p-0">
                {result.flags.map((flag, index) => (
                  <li
                    key={index}
                    className={`rounded-lg border px-3 py-2 text-xs leading-snug ${FLAG_STYLES[flag.level]}`}
                  >
                    {resolveText(t, flag.text)}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs font-medium text-[var(--axis-bronze)]">🚢 {t("widget.shippingNote")}</p>

            <p
              className="rounded-lg p-3 text-xs leading-relaxed text-[var(--axis-gray)]"
              style={{ backgroundColor: "var(--axis-graphite)" }}
            >
              {t("widget.disclaimer")}{" "}
              <Link
                href={calcHref}
                className="rounded font-medium text-[var(--axis-bronze)] underline-offset-2 outline-none hover:underline hover:brightness-115 focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
              >
                {t("widget.fullCalc")} →
              </Link>
            </p>

            {carId && carName && (
              <div className="mt-3 rounded-xl border border-[rgba(182,119,73,0.3)] bg-[rgba(182,119,73,0.08)] p-4">
                <p className="mb-2 text-sm font-semibold text-[var(--axis-white)]">{t("widget.ctaTitle")}</p>
                <CarRequestForm carId={carId} carName={carName} source="car_calculator" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
