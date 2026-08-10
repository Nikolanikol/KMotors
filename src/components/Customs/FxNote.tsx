"use client";

import { useTranslation } from "react-i18next";
import type { FieldDef, RatePair } from "@/lib/customs/core/types";
import {
  SOURCE_LABELS,
  type CurrencyCode,
  type Rates,
} from "@/lib/customs/fx/types";
import { resolveDate } from "@/lib/customs/i18nText";

interface FxNoteProps {
  rates: Rates;
  /** Поля формы страны — из них берутся валюты, которые реально нужны. */
  fields: FieldDef[];
  /** Текущие значения формы, чтобы вычислить зависимые пары. */
  input: Record<string, unknown>;
}

/**
 * Подпись под калькулятором: откуда взят курс и на какое число.
 *
 * Показывает источник только тех валют, которые участвуют в расчёте текущей
 * страны — иначе пришлось бы перечислять весь набор. Если хоть одна валюта
 * пришла из вшитого снимка, строка меняет тон и говорит об этом прямо:
 * выдавать снимок за живой курс нельзя.
 */
export default function FxNote({ rates, fields, input }: FxNoteProps) {
  const { t } = useTranslation("customs");

  const pairs: RatePair[] = [];
  for (const field of fields) {
    if (field.kind !== "number" || !field.ratePair) continue;
    pairs.push(field.ratePair(input));
  }
  if (pairs.length === 0) return null;

  const used = new Set<CurrencyCode>();
  for (const pair of pairs) {
    used.add(pair.from as CurrencyCode);
    used.add(pair.to as CurrencyCode);
  }

  const sources = new Set(
    [...used].map((code) => rates.sources[code]).filter(Boolean),
  );
  const onFallback = sources.has("fallback");
  const label = [...sources].map((source) => SOURCE_LABELS[source]).join(" + ");
  const date = resolveDate(t, rates.asOf);

  return (
    <p
      className={[
        "m-0 mt-2 text-[11px] leading-relaxed",
        onFallback ? "text-calc-red-bright" : "text-calc-fg-faint",
      ].join(" ")}
    >
      {onFallback ? t("ui.fxFallback", { date }) : t("ui.fxLive", { label, date })}
    </p>
  );
}
