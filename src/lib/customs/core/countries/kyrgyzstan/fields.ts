import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Кыргызстана.
 *
 * Полей больше, чем у соседей, и на то две причины. Первая — режимов два,
 * и они считаются по разным сводам: физлицо по ЕЭК №107, юрлицо по ЕТТ.
 * Вторая — расчёт ведётся в евро, а цена приходит в валюте сделки, поэтому
 * курсов нужно два: до евро и от евро до сома.
 *
 * Тип топлива показывается в обоих режимах, хотя в личном бензин и дизель
 * считаются одинаково: выбор всё равно нужен, чтобы отделить электромобиль
 * и последовательный гибрид от двигательных авто.
 */
export const kyrgyzstanFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "mode",
    label: txt("kyrgyzstan.fields.mode"),
    hint: txt("kyrgyzstan.fields.modeHint"),
    options: [
      { value: "personal", label: txt("kyrgyzstan.mode.personal") },
      { value: "commercial", label: txt("kyrgyzstan.mode.commercial") },
    ],
  },
  {
    kind: "select",
    id: "fuel",
    label: txt("kyrgyzstan.fields.fuel"),
    hint: txt("kyrgyzstan.fields.fuelHint"),
    options: [
      { value: "petrol", label: txt("kyrgyzstan.fuel.petrol") },
      { value: "diesel", label: txt("kyrgyzstan.fuel.diesel") },
      { value: "seriesHybrid", label: txt("kyrgyzstan.fuel.seriesHybrid") },
      { value: "electric", label: txt("kyrgyzstan.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("kyrgyzstan.fields.volumeCc"),
    hint: txt("kyrgyzstan.fields.volumeCcHint"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel === "petrol" || input.fuel === "diesel",
  },
  {
    kind: "number",
    id: "year",
    label: txt("kyrgyzstan.fields.year"),
    hint: txt("kyrgyzstan.fields.yearHint"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("kyrgyzstan.fields.priceCurrency"),
    hint: txt("kyrgyzstan.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("kyrgyzstan.currency.USD") },
      { value: "KRW", label: txt("kyrgyzstan.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("kyrgyzstan.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "freight",
    label: txt("kyrgyzstan.fields.freight"),
    hint: txt("kyrgyzstan.fields.freightHint"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "eurPerUnit",
    label: txt("kyrgyzstan.fields.eurPerUnit"),
    hint: txt("kyrgyzstan.fields.eurPerUnitHint"),
    min: 0.000001,
    step: 0.000001,
    // Курс едет за валютой сделки: переключил доллар на вону — подставится
    // EUR/KRW, а не остался прежний EUR/USD.
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "EUR" }),
  },
  {
    kind: "number",
    id: "kgsPerEur",
    label: txt("kyrgyzstan.fields.kgsPerEur"),
    hint: txt("kyrgyzstan.fields.kgsPerEurHint"),
    min: 0.01,
    step: 0.01,
    ratePair: () => ({ from: "EUR", to: "KGS" }),
  },
];
