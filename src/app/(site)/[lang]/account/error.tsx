"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Account error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[var(--axis-black)]">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5484D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--axis-white)] mb-1">Ошибка в личном кабинете</h2>
          <p className="text-sm text-[var(--axis-gray)]">Попробуйте обновить страницу или войдите заново.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] text-white rounded-xl text-sm font-semibold hover:brightness-115 transition">
            Обновить
          </button>
          <Link href="/" className="px-5 py-2.5 border border-white/10 text-[var(--axis-silver)] rounded-xl text-sm font-semibold hover:bg-white/[0.06] hover:text-[var(--axis-white)] hover:border-white/20 transition">
            На главную
          </Link>
        </div>
        {error.digest && <p className="text-xs text-[var(--axis-gray)]">Код: {error.digest}</p>}
      </div>
    </div>
  );
}
