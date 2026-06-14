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
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BB162B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#002C5F] mb-1">Ошибка в личном кабинете</h2>
          <p className="text-sm text-gray-500">Попробуйте обновить страницу или войдите заново.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-[#BB162B] text-white rounded-xl text-sm font-semibold hover:bg-[#9a1122] transition">
            Обновить
          </button>
          <Link href="/" className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            На главную
          </Link>
        </div>
        {error.digest && <p className="text-xs text-gray-400">Код: {error.digest}</p>}
      </div>
    </div>
  );
}
