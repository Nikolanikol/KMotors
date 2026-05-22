"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--axis-black)" }}
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "rgba(255,69,0,0.12)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--axis-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--axis-white)" }}>
            Что-то пошло не так
          </h1>
          <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернитесь на главную.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full font-semibold text-sm text-white transition-colors"
            style={{ backgroundColor: "var(--axis-orange)" }}
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-full font-semibold text-sm transition-colors"
            style={{ border: "1px solid rgba(74,74,74,0.5)", color: "var(--axis-gray)" }}
          >
            На главную
          </Link>
        </div>

        {/* Error digest for support */}
        {error.digest && (
          <p className="text-xs" style={{ color: "var(--axis-gray-dim)" }}>
            Код ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
