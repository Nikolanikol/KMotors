"use client";

import { useTranslation } from "react-i18next";
import { formatAmount, formatMoney } from "@/lib/customs/core/format";
import type { CalcResult, Flag, Line } from "@/lib/customs/core/types";
import { resolveText } from "@/lib/customs/i18nText";

function ReceiptRow({ line }: { line: Line }) {
  const { t } = useTranslation("customs");

  return (
    <div className="calc-receipt-row flex justify-between gap-2.5 py-2 text-[13.5px]">
      <div className={line.muted ? "opacity-45" : undefined}>
        <div>{resolveText(t, line.label)}</div>
        {line.note && (
          <div className="mt-0.5 text-[10.5px] leading-snug text-calc-ink-soft">
            {resolveText(t, line.note)}
          </div>
        )}
      </div>
      <div
        className={[
          "font-calc-mono font-medium whitespace-nowrap",
          line.muted ? "opacity-45" : "",
        ].join(" ")}
      >
        {formatMoney(line.amount, line.currency)}
      </div>
    </div>
  );
}

const FLAG_STYLES: Record<Flag["level"], string> = {
  info: "border-calc-ink-soft/35 bg-calc-ink-soft/10 text-calc-ink-soft",
  warn: "border-calc-gold/50 bg-calc-gold/15 text-[#8a6a2a]",
  critical: "border-calc-red/40 bg-calc-red/10 text-calc-red",
};

interface ReceiptProps {
  result: CalcResult;
  /** Верхняя строка на печати — страна латиницей. */
  stampTop: string;
}

export default function Receipt({ result, stampTop }: ReceiptProps) {
  const { t } = useTranslation("customs");

  return (
    <section className="calc-paper-texture relative overflow-hidden rounded-[10px] bg-calc-paper px-6 pt-[26px] pb-6 text-calc-ink">
      <div className="mb-3.5 flex items-start justify-between gap-3 border-b-[1.5px] border-calc-ink pb-3">
        <div>
          <div className="font-calc-display text-[15px] font-bold tracking-[0.02em]">
            {t("ui.receiptTitle")}
          </div>
          <div className="mt-1 font-calc-mono text-[10.5px] text-calc-ink-soft">
            {result.subtitle.map((part) => resolveText(t, part)).join(" · ")}
          </div>
        </div>

        <div
          aria-hidden
          className="relative flex h-[74px] w-[74px] shrink-0 rotate-[-13deg] items-center justify-center rounded-full border-2 border-calc-red opacity-80"
        >
          <span className="absolute inset-[5px] rounded-full border border-calc-red" />
          <div className="font-calc-display px-1 text-center leading-[1.15] font-bold text-calc-red">
            <div className="text-[7px] tracking-[0.12em]">{stampTop}</div>
            <div className="my-px text-[11px] tracking-[0.02em]">
              {resolveText(t, result.stampLabel)}
            </div>
            <div className="text-[6px] tracking-[0.1em]">CUSTOMS EST.</div>
          </div>
        </div>
      </div>

      {result.lines.map((line) => (
        <ReceiptRow key={line.id} line={line} />
      ))}

      <div className="mt-4 flex items-end justify-between border-t-2 border-calc-ink pt-3.5">
        <div className="font-calc-display text-[13px] tracking-[0.06em] text-calc-ink-soft uppercase">
          {t("ui.total")}
        </div>
        <div className="text-right">
          <div className="font-calc-mono text-[28px] leading-none font-bold text-calc-red">
            {formatMoney(result.total.amount, result.total.currency)}
          </div>
          {result.alt.map((alt) => (
            <div
              key={alt.currency}
              className="mt-1 font-calc-mono text-[13px] text-calc-ink-soft"
            >
              ≈ {formatAmount(alt.amount)} {alt.currency}
            </div>
          ))}
        </div>
      </div>

      {result.extra && result.extra.length > 0 && (
        <div className="mt-4 border-t border-dashed border-calc-ink/25 pt-1.5">
          <div className="font-calc-mono text-[10px] tracking-[0.1em] text-calc-ink-soft uppercase">
            {t("ui.notInTotal")}
          </div>
          {result.extra.map((line) => (
            <ReceiptRow key={line.id} line={line} />
          ))}
        </div>
      )}

      {result.flags.length > 0 && (
        <ul className="mt-4 flex list-none flex-col gap-1.5 p-0">
          {result.flags.map((flag, index) => (
            <li
              key={index}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] leading-snug ${FLAG_STYLES[flag.level]}`}
            >
              {resolveText(t, flag.text)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
