"use client";

// Живой отсчёт до конца торгов — как на витрине-источнике.
//
// ⚠️ Первый кадр рисует ФОЛБЭК, а не текущее значение, и это не перестраховка.
// Сервер и клиент считают время в разные моменты, поэтому тикающее значение в
// первом рендере гарантированно разошлось бы с серверной разметкой и React
// ругался бы на гидрацию. Поэтому: сервер отдаёт грубую подпись («торги
// завтра»), а посекундный счётчик включается после монтирования.
//
// ⚠️ Интервал ставится ОДИН на компонент и снимается при размонтировании. На
// странице каталога таких компонентов 24 — забытый таймер там превратился бы в
// 24 утечки на каждую смену страницы.

import { useEffect, useState } from "react";

import { auctionDeadline, remainingUntil } from "./auctionTime";

export default function AuctionCountdown({
  date,
  fallback,
  labels,
  className,
  style,
}: {
  /** Дата торгов лота, YYYY-MM-DD. Время добавляет auctionDeadline. */
  date: string | null | undefined;
  /** Что показать до монтирования и на сервере. */
  fallback: string;
  labels: { h: string; m: string; s: string; over: string };
  className?: string;
  style?: React.CSSProperties;
}) {
  // ⚠️ В зависимостях эффекта — ЧИСЛО, а не объект Date: тот пересоздаётся на
  // каждом рендере, и интервал пересоздавался бы бесконечно. Подписи тоже
  // разобраны по полям, иначе объект labels давал бы тот же эффект.
  const deadlineMs = auctionDeadline(date)?.getTime() ?? null;
  const { h, m, s: sec, over } = labels;
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (deadlineMs == null) return;
    const tick = () => {
      const r = remainingUntil(new Date(deadlineMs));
      setText(r.over ? over : `${r.hours}${h} ${r.minutes}${m} ${r.seconds}${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs, h, m, sec, over]);

  return (
    <span className={className} style={style}>
      {text ?? fallback}
    </span>
  );
}
