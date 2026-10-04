"use client";

// Таймер торгов лота carnect — на плитке каталога и в блоке цены.
//
// Режимы — по тому, что известно о лоте, и выдумывать недостающее нельзя:
//   • точное время (`at`): HeyDealer — конец торгов (end_at), лоты аукционов с
//     startAt (K Car и др.) — время выхода лота. Живой отсчёт;
//   • только день торгов (`date`): у части площадок carnect не отдаёт час, и
//     отсчёт до выдуманного часа был бы враньём. Показываем «сегодня /
//     завтра / через N дней» по корейскому календарю.
//
// ⚠️ Прежний AuctionCountdown для этих лотов НЕ годится: он досчитывает дату до
// 04:00 UTC — это дедлайн витрины dokanmazad, снятый с её счётчика, а не
// время торгов площадок.
//
// Как и AuctionCountdown: первый кадр — фолбэк с сервера (иначе разошлась бы
// гидрация), отсчёт включается после монтирования, интервал один на
// компонент и снимается при размонтировании — на странице плиток 24.
// Больше суток показываем днями и часами («2d 5h»): «109h» не читается.

import { useEffect, useState, type CSSProperties } from "react";

import type { CardLang } from "@/lib/carnect/lang";
import { kstDaysUntil, kstIso } from "@/lib/carnect/time";

import { tx } from "./text";

function countdown(lang: CardLang, ms: number): string {
  const t = (k: Parameters<typeof tx>[1]) => tx(lang, k);
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return days > 0
    ? `${days}${t("d")} ${hours}${t("h")}`
    : `${hours}${t("h")} ${minutes}${t("m")} ${seconds}${t("s")}`;
}

function dayText(lang: CardLang, days: number): string {
  if (days < 0) return tx(lang, "auctionOver");
  if (days === 0) return tx(lang, "auctionToday");
  if (days === 1) return tx(lang, "auctionTomorrow");
  return tx(lang, "auctionInDays").replace("{n}", String(days));
}

export default function LotTimer({
  at,
  date,
  kind,
  lang,
  fallback,
  className,
  style,
}: {
  /** Точное время торгов (ISO, с зоной или без — тогда корейское). */
  at?: string | null;
  /** День торгов YYYY-MM-DD, если точного времени нет. */
  date?: string | null;
  /** ends — конец торгов (HeyDealer), starts — выход лота на торги. */
  kind: "ends" | "starts";
  lang: CardLang;
  /** Что показать на сервере и до монтирования. */
  fallback: string;
  className?: string;
  style?: CSSProperties;
}) {
  const atMs = at ? Date.parse(kstIso(at) ?? "") : NaN;
  const exact = Number.isFinite(atMs) ? atMs : null;
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (exact == null) {
      const days = kstDaysUntil(date);
      if (days != null) setText(dayText(lang, days));
      return;
    }
    const tick = () => {
      const left = exact - Date.now();
      if (left <= 0) return setText(tx(lang, kind === "ends" ? "biddingOver" : "auctionOver"));
      setText(`${tx(lang, kind === "ends" ? "endsIn" : "startsIn")} ${countdown(lang, left)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [exact, date, kind, lang]);

  return (
    // tabular-nums — как у AuctionCountdown: иначе строка дёргает соседей раз в секунду.
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {text ?? fallback}
    </span>
  );
}
