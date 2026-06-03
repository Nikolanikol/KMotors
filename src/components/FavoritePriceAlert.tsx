"use client";

import { useFavoritesSync } from "@/hooks/useFavoritesSync";
import { TrendingDown, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const convertNumber = (n: string | number) =>
  Number(n).toLocaleString("ru-RU");

export default function FavoritePriceAlert() {
  const { priceChanges, dismissed, dismiss } = useFavoritesSync();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  if (dismissed || priceChanges.length === 0) return null;

  const drops = priceChanges.filter(c => c.diff < 0);
  const rises = priceChanges.filter(c => c.diff > 0);

  return (
    <div
      className="fixed top-[72px] left-0 right-0 z-40 mx-4 sm:mx-auto sm:max-w-md rounded-2xl p-4 shadow-2xl"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1.5px solid rgba(255,69,0,0.4)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(74,74,74,0.4)", color: "var(--axis-gray)" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <p className="text-sm font-bold mb-3 pr-6" style={{ color: "var(--axis-white)" }}>
        🔔 Изменение цен в избранном
      </p>

      <div className="space-y-2">
        {drops.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <TrendingDown className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--axis-white)" }}>{c.name}</p>
              <p className="text-xs" style={{ color: "#22c55e" }}>
                ↓ {convertNumber(Math.abs(c.diff))} вон · было {convertNumber(c.oldPrice)}
              </p>
            </div>
          </div>
        ))}
        {rises.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,69,0,0.08)", border: "1px solid rgba(255,69,0,0.2)" }}>
            <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--axis-orange)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--axis-white)" }}>{c.name}</p>
              <p className="text-xs" style={{ color: "var(--axis-orange)" }}>
                ↑ {convertNumber(Math.abs(c.diff))} вон · было {convertNumber(c.oldPrice)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/${lang}/favorites`}
        onClick={dismiss}
        className="block text-center text-xs mt-3 py-2 rounded-xl font-semibold transition-all"
        style={{ backgroundColor: "var(--axis-orange)", color: "white" }}
      >
        Открыть избранное →
      </Link>
    </div>
  );
}
