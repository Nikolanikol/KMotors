"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PartsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Parts error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BB162B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#002C5F] mb-1">Не удалось загрузить каталог</h2>
          <p className="text-sm text-gray-500">Попробуйте обновить страницу или вернитесь позже.</p>
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
