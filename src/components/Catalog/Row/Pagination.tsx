"use client";
import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const Pagination = ({ count }: { count: number }) => {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(count / 20);

  useEffect(() => { setCurrentPage(1); }, [count]);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    const newParams = new URLSearchParams(params.toString());
    newParams.set("page", page.toString());
    startTransition(() => {
      router.push(`?${newParams.toString()}`);
    });
  };

  if (totalPages <= 1) return null;

  const pages = () => {
    const items: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) items.push(i);
      if (currentPage < totalPages - 2) items.push("...");
      items.push(totalPages);
    }
    return items;
  };

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    border: "1px solid rgba(74,74,74,0.3)",
    transition: "all 0.2s",
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${isPending ? "opacity-40 pointer-events-none" : ""}`}>
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...btnBase, backgroundColor: "var(--axis-charcoal)", color: currentPage === 1 ? "var(--axis-gray-dim)" : "var(--axis-gray)" }}
      >
        ←
      </button>

      {pages().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ color: "var(--axis-gray-dim)", padding: "0 4px" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            style={{
              ...btnBase,
              backgroundColor: currentPage === p ? "var(--axis-orange)" : "var(--axis-charcoal)",
              color: currentPage === p ? "white" : "var(--axis-gray)",
              borderColor: currentPage === p ? "var(--axis-orange)" : "rgba(74,74,74,0.3)",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...btnBase, backgroundColor: "var(--axis-charcoal)", color: currentPage === totalPages ? "var(--axis-gray-dim)" : "var(--axis-gray)" }}
      >
        →
      </button>

      <span className="ml-2 text-xs" style={{ color: "var(--axis-gray)" }}>
        {currentPage} / {totalPages}
      </span>
    </div>
  );
};
