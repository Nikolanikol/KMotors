"use client";

import { useTranslation } from "react-i18next";
import { isVerificationStale, type CountryMeta } from "@/lib/customs/core/registry";
import { resolveDate, resolveText } from "@/lib/customs/i18nText";

interface VerificationNoteProps {
  verification: NonNullable<CountryMeta["verification"]>;
  /** Расчётный год, тот же, что уходит в ядро. */
  currentYear: number;
}

/**
 * Строка актуальности под калькулятором.
 *
 * Ставки и сборы пересматриваются, как правило, с начала календарного года,
 * поэтому дата сверки должна стоять рядом с расчётом, а не только в общей
 * сноске внизу страницы. Если год сверки уже прошлый — строка меняет тон
 * на предупреждающий и говорит об этом прямо.
 */
export default function VerificationNote({
  verification,
  currentYear,
}: VerificationNoteProps) {
  const { t } = useTranslation("customs");
  const isStale = isVerificationStale(verification.verifiedAt, currentYear);
  const sourceName = resolveText(t, verification.sourceName);

  return (
    <p
      className={[
        "m-0 mt-3.5 rounded-md border px-3 py-2.5 text-[11.5px] leading-relaxed",
        isStale
          ? "border-calc-red/40 bg-calc-red/10 text-calc-fg-dim"
          : "border-calc-line bg-calc-panel/60 text-calc-fg-faint",
      ].join(" ")}
    >
      <b className={isStale ? "text-calc-red-bright" : "text-calc-gold"}>
        {t("ui.ratesAsOf", {
          date: resolveDate(t, verification.verifiedAt),
        })}
      </b>
      {t("ui.verifiedWith")}
      {verification.sourceUrl ? (
        <a
          href={verification.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-calc-gold underline underline-offset-2 hover:text-calc-red-bright"
        >
          {sourceName}
        </a>
      ) : (
        <span className="text-calc-fg-dim">{sourceName}</span>
      )}
      {isStale ? (
        <>
          {". "}
          <b className="text-calc-fg-dim">
            {t("ui.staleWarning", { year: currentYear })}
          </b>{" "}
          {t("ui.staleAdvice")}
        </>
      ) : (
        t("ui.freshAdvice")
      )}
    </p>
  );
}
