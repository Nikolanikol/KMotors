import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Казахстана.
 *
 * Месяц выпуска нужен ТОЛЬКО порогу 7 лет по таможенной пошлине. На
 * регистрационный сбор он не влияет: ст. 830 НК РК считает его по календарному
 * году выпуска. Раньше здесь стояло обратное — сверка 11.08.2026 это опровергла.
 */
export const kazakhstanFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("kazakhstan.fields.priceCurrency"),
    hint: txt("kazakhstan.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("kazakhstan.currency.USD") },
      { value: "KRW", label: txt("kazakhstan.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("kazakhstan.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("kazakhstan.fields.volumeCc"),
    hint: txt("kazakhstan.fields.volumeCcHint"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "number",
    id: "year",
    label: txt("kazakhstan.fields.year"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "select",
    id: "month",
    label: txt("kazakhstan.fields.month"),
    hint: txt("kazakhstan.fields.monthHint"),
    options: Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: txt(`ui.month.${i + 1}`),
    })),
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("kazakhstan.fields.fuel"),
    hint: txt("kazakhstan.fields.fuelHint"),
    options: [
      { value: "ice", label: txt("kazakhstan.fuel.ice") },
      { value: "hybrid", label: txt("kazakhstan.fuel.hybrid") },
      { value: "erev", label: txt("kazakhstan.fuel.erev") },
      { value: "electric", label: txt("kazakhstan.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "kztPerUnit",
    label: txt("kazakhstan.fields.kztPerUnit"),
    hint: txt("kazakhstan.fields.kztPerUnitHint"),
    min: 0.000001,
    step: 0.000001,
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "KZT" }),
  },
  {
    kind: "number",
    id: "kztPerEur",
    label: txt("kazakhstan.fields.kztPerEur"),
    hint: txt("kazakhstan.fields.kztPerEurHint"),
    min: 0.01,
    step: 0.01,
    ratePair: () => ({ from: "EUR", to: "KZT" }),
  },
];
