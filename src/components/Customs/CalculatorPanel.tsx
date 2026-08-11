"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FieldRenderer, { type FormValues } from "./FieldRenderer";
import Receipt from "./Receipt";
import VerificationNote from "./VerificationNote";
import FxNote from "./FxNote";
import { isSharedField, useCalcParams } from "./CalcParams";
import { getCountry, type CountryId } from "@/lib/customs/core/registry";
import type {
  ErasedCalculator,
  RuntimeInputs,
} from "@/lib/customs/core/registry";
import type { RatePair } from "@/lib/customs/core/types";
import { resolveText } from "@/lib/customs/i18nText";
import {
  formatRateValue,
  rateBetween,
  type CurrencyCode,
  type Rates,
} from "@/lib/customs/fx/types";

/** Курс пары строкой для поля формы, либо null, если пары нет в наборе. */
function liveRateValue(pair: RatePair, rates: Rates): string | null {
  const value = rateBetween(
    rates,
    pair.from as CurrencyCode,
    pair.to as CurrencyCode,
  );
  return value === null ? null : formatRateValue(value);
}

/** Ключ пары — по его смене понятно, что курс пора подставить заново. */
function pairKey(fieldId: string, pair: RatePair): string {
  return `${fieldId}:${pair.from}>${pair.to}`;
}

/**
 * Дефолты ядра → значения формы, поверх них — общие параметры, введённые на
 * соседней стране, и живые курсы. Подстановка идёт при инициализации, то есть
 * и на сервере тоже: курс попадает в HTML первого ответа и после гидратации
 * ничего не мигает.
 */
function toFormValues(
  calculator: ErasedCalculator,
  rates: Rates,
  shared: FormValues,
): FormValues {
  const values: FormValues = {};
  for (const field of calculator.fields) {
    const raw = calculator.defaults[field.id];
    values[field.id] =
      field.kind === "switch" ? Boolean(raw) : String(raw ?? "");
    const carried = shared[field.id];
    if (carried !== undefined && isSharedField(field.id)) {
      values[field.id] = carried;
    }
  }

  for (const field of calculator.fields) {
    if (field.kind !== "number" || !field.ratePair) continue;
    const live = liveRateValue(
      field.ratePair(values as Record<string, unknown>),
      rates,
    );
    if (live !== null) values[field.id] = live;
  }
  return values;
}

/**
 * Значения формы → вход ядра, с приведением типов по виду поля.
 *
 * ⚠️ Затравка идёт из `defaults`, а не из пустого объекта. У ядра есть входы,
 * которых НЕТ среди полей формы (`currentYear`, `currentMonth`), и без затравки
 * они приходят `undefined`: возраст становится NaN, все сравнения с ним ложны,
 * и машина молча падает в последний возрастной бракет. Ровно это и случилось —
 * калькулятор России полгода считал любую машину как «старше 5 лет».
 */
function toCalcInput(
  calculator: ErasedCalculator,
  values: FormValues,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const input: Record<string, unknown> = { ...calculator.defaults, ...extra };
  for (const field of calculator.fields) {
    const value = values[field.id];
    if (field.kind === "number") {
      input[field.id] = value === "" || value === undefined ? 0 : Number(value);
    } else if (field.kind === "switch") {
      input[field.id] = value === true;
    } else {
      input[field.id] = value;
    }
  }
  return input;
}

interface CalculatorPanelProps {
  countryId: CountryId;
  /** Курсы, полученные серверным слоем fx. */
  rates: Rates;
}

export default function CalculatorPanel({
  countryId,
  rates,
}: CalculatorPanelProps) {
  const { t } = useTranslation("customs");
  const country = getCountry(countryId);
  const calculator = country.calculator;
  const { shared, remember } = useCalcParams();

  // Расчётный момент подставляет интерфейс — ядро само дату не берёт.
  // Тип RuntimeInputs обязывает подать КАЖДЫЙ ключ из RUNTIME_INPUT_IDS: месяц
  // тут наравне с годом, у России переломы ставки приходятся на 3 и 5 лет, у
  // Казахстана — на порог 7 лет, и считается это в месяцах.
  const [runtime] = useState<RuntimeInputs>(() => {
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 };
  });
  const { currentYear } = runtime;

  const [values, setValues] = useState<FormValues>(() =>
    calculator ? toFormValues(calculator, rates, shared) : {},
  );

  /**
   * Какие пары уже подставлены. Инициализируется теми, что легли в форму при
   * первом рендере, иначе эффект перезаписал бы их сразу после гидратации.
   */
  const appliedPairs = useRef<Record<string, string>>(
    (() => {
      const applied: Record<string, string> = {};
      if (!calculator) return applied;
      const initial = toFormValues(calculator, rates, shared) as Record<
        string,
        unknown
      >;
      for (const field of calculator.fields) {
        if (field.kind !== "number" || !field.ratePair) continue;
        applied[field.id] = pairKey(field.id, field.ratePair(initial));
      }
      return applied;
    })(),
  );

  function handleChange(id: string, value: FormValues[string]) {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (isSharedField(id)) remember({ [id]: value });
  }

  const input = useMemo(
    () =>
      calculator ? toCalcInput(calculator, values, runtime) : null,
    [calculator, values, runtime],
  );

  const result = useMemo(
    () => (calculator && input ? calculator.calculate(input) : null),
    [calculator, input],
  );

  /**
   * Курс подставляется заново, когда меняется сама валютная пара — например,
   * пользователь переключил валюту сделки с доллара на вону. Пока пара та же,
   * поле не трогаем: введённое вручную значение должно оставаться.
   */
  useEffect(() => {
    if (!calculator || !input) return;

    const updates: FormValues = {};
    for (const field of calculator.fields) {
      if (field.kind !== "number" || !field.ratePair) continue;

      const key = pairKey(field.id, field.ratePair(input));
      if (appliedPairs.current[field.id] === key) continue;
      appliedPairs.current[field.id] = key;

      const live = liveRateValue(field.ratePair(input), rates);
      if (live !== null) updates[field.id] = live;
    }

    if (Object.keys(updates).length > 0) {
      setValues((prev) => ({ ...prev, ...updates }));
    }
  }, [calculator, input, rates]);

  if (!calculator || !input || !result) return null;

  return (
    <div className="w-full">
      <header className="mb-6">
        <div className="mb-2.5 flex items-center gap-2 font-calc-mono text-[11px] tracking-[0.14em] text-calc-gold uppercase">
          <span aria-hidden className="inline-block h-px w-4 bg-calc-gold" />
          {country.eyebrow}
        </div>
        <h1 className="font-calc-display m-0 text-[clamp(26px,4vw,38px)] leading-[1.08] font-bold tracking-[-0.01em] text-calc-fg">
          {resolveText(t, country.title)}{" "}
          <span className="text-calc-red-bright">
            {resolveText(t, country.titleAccent)}
          </span>
        </h1>
      </header>

      <div className="grid grid-cols-1 items-start gap-[18px] min-[780px]:grid-cols-2">
        <section className="rounded-[10px] border border-calc-line bg-calc-panel p-[22px]">
          <h2 className="font-calc-display m-0 mb-[18px] text-[13px] tracking-[0.09em] text-calc-fg-dim uppercase">
            {t("ui.carData")}
          </h2>

          {calculator.fields
            .filter((field) => !field.visibleIf || field.visibleIf(input))
            .map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={handleChange}
              />
            ))}
        </section>

        <Receipt result={result} stampTop={country.stampTop} />
      </div>

      {country.verification && (
        <VerificationNote
          verification={country.verification}
          currentYear={currentYear}
        />
      )}

      <FxNote rates={rates} fields={calculator.fields} input={input} />
    </div>
  );
}
