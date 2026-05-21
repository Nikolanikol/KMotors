"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

interface BlogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogSearch({ value, onChange }: BlogSearchProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState(value);

  const debounced = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (v: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onChange(v), 300);
      };
    })(),
    [onChange]
  );

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    debounced(v);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("blog.search")}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#BB162B] focus:ring-1 focus:ring-[#BB162B]/30 transition"
      />
      {local && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
