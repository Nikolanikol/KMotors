"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

interface BlogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogSearch({ value, onChange }: BlogSearchProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState(value);

  // Таймер и актуальный onChange лежат в ref: перерисовка родителя (он отдаёт
  // onChange без useCallback) не сбрасывает дебаунс и не оставляет «осиротевший» таймер.
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const debounced = useCallback((v: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeRef.current(v), 300);
  }, []);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    debounced(v);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--axis-gray)] pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("blog.search")}
        className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/[0.08] bg-[var(--axis-graphite)] text-sm text-[var(--axis-white)] placeholder:text-[var(--axis-gray)] [color-scheme:dark] transition hover:border-white/20 focus:outline-none focus:border-[var(--axis-bronze)] focus:ring-2 focus:ring-[rgba(182,119,73,0.35)]"
      />
      {local && (
        <button
          onClick={() => handleChange("")}
          type="button"
          aria-label="Clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--axis-gray)] transition hover:text-[var(--axis-white)] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
