"use client";

import { useTranslation } from "react-i18next";
import type { FieldDef } from "@/lib/customs/core/types";
import { resolveText } from "@/lib/customs/i18nText";

/** Значения формы: числовые поля живут строками, чтобы поле можно было очистить. */
export type FormValue = string | boolean;
export type FormValues = Record<string, FormValue>;

interface FieldRendererProps {
  field: FieldDef;
  value: FormValue | undefined;
  onChange: (id: string, value: FormValue) => void;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
}: FieldRendererProps) {
  const { t } = useTranslation("customs");

  return (
    <div className="mb-4">
      <label
        htmlFor={field.id}
        className="mb-1.5 block text-[12.5px] font-medium text-calc-fg-dim"
      >
        {resolveText(t, field.label)}
      </label>

      {field.kind === "number" && (
        <input
          id={field.id}
          type="number"
          inputMode="decimal"
          value={typeof value === "string" ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-md border border-calc-line bg-calc-panel-2 px-3 py-2.5 font-calc-mono text-[15px] text-calc-fg outline-none transition-colors focus:border-calc-red"
        />
      )}

      {field.kind === "segmented" && (
        <div className="flex overflow-hidden rounded-md border border-calc-line">
          {field.options.map((option) => {
            const isActive = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(field.id, option.value)}
                className={[
                  "flex-1 cursor-pointer border-r border-calc-line px-1.5 py-2.5 text-[13px] font-medium",
                  "transition-colors last:border-r-0",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-calc-gold",
                  isActive
                    ? "bg-calc-red text-white"
                    : "bg-calc-panel-2 text-calc-fg-dim hover:text-calc-fg",
                ].join(" ")}
              >
                {resolveText(t, option.label)}
              </button>
            );
          })}
        </div>
      )}

      {field.kind === "select" && (
        <select
          id={field.id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-md border border-calc-line bg-calc-panel-2 px-3 py-2.5 text-[14px] text-calc-fg outline-none transition-colors focus:border-calc-red"
        >
          {field.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-calc-panel-2"
            >
              {resolveText(t, option.label)}
            </option>
          ))}
        </select>
      )}

      {field.kind === "switch" && (
        <button
          id={field.id}
          type="button"
          role="switch"
          aria-checked={value === true}
          onClick={() => onChange(field.id, value !== true)}
          className={[
            "relative h-6 w-11 cursor-pointer rounded-full transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calc-gold",
            value === true ? "bg-calc-gold" : "bg-calc-line",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              value === true ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      )}

      {field.hint && (
        <p className="mt-1.5 text-[11px] leading-snug text-calc-fg-faint">
          {resolveText(t, field.hint)}
        </p>
      )}
    </div>
  );
}
