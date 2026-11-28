"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";
const ARROW = `p-2.5 rounded-xl border border-white/[0.08] bg-[var(--axis-charcoal)] text-[var(--axis-silver)] transition enabled:hover:bg-white/[0.06] enabled:hover:text-[var(--axis-white)] enabled:hover:border-[var(--axis-bronze)]/40 disabled:opacity-30 disabled:cursor-not-allowed ${FOCUS}`;

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Номера страниц: первая, последняя и ±2 от текущей, промежутки — «…». */
function pageItems(page: number, totalPages: number): (number | "…")[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);
}

export default function BlogPagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="pagination" className="flex items-center justify-center gap-2 pt-6">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className={ARROW} aria-label="Previous">
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageItems(page, totalPages).map((item, idx) =>
        item === "…" ? (
          <span key={`gap-${idx}`} className="px-1.5 text-[var(--axis-gray)]">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={page === item ? "page" : undefined}
            className={`w-10 h-10 rounded-xl text-sm font-medium transition ${FOCUS} ${
              page === item
                ? "text-white bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_6px_18px_rgba(157,94,52,0.35)] hover:brightness-115"
                : "border border-white/[0.08] bg-[var(--axis-charcoal)] text-[var(--axis-silver)] hover:bg-white/[0.06] hover:text-[var(--axis-white)] hover:border-[var(--axis-bronze)]/40"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className={ARROW} aria-label="Next">
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
