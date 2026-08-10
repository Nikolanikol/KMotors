import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Узбекистана.
 *
 * Курсов два, и они про разное. `usdPerUnit` переводит цену сделки в доллары —
 * пошлина задана в долларах и считается там. `uzsPerUsd` переводит всё
 * остальное в сумы.
 */
export const uzbekistanFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("uzbekistan.fields.priceCurrency"),
    hint: txt("uzbekistan.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("uzbekistan.currency.USD") },
      { value: "KRW", label: txt("uzbekistan.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("uzbekistan.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("uzbekistan.fields.volumeCc"),
    hint: txt("uzbekistan.fields.volumeCcHint"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "number",
    id: "year",
    label: txt("uzbekistan.fields.year"),
    hint: txt("uzbekistan.fields.yearHint"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "select",
    id: "month",
    label: txt("uzbekistan.fields.month"),
    options: Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: txt(`ui.month.${i + 1}`),
    })),
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("uzbekistan.fields.fuel"),
    options: [
      { value: "ice", label: txt("uzbekistan.fuel.ice") },
      { value: "hybrid", label: txt("uzbekistan.fuel.hybrid") },
      { value: "electric", label: txt("uzbekistan.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "usdPerUnit",
    label: txt("uzbekistan.fields.usdPerUnit"),
    hint: txt("uzbekistan.fields.usdPerUnitHint"),
    min: 0.000001,
    step: 0.000001,
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "USD" }),
  },
  {
    kind: "number",
    id: "uzsPerUsd",
    label: txt("uzbekistan.fields.uzsPerUsd"),
    hint: txt("uzbekistan.fields.uzsPerUsdHint"),
    min: 0.01,
    step: 0.01,
    ratePair: () => ({ from: "USD", to: "UZS" }),
  },
];
