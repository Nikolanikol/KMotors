import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для России.
 *
 * Месяц выпуска здесь есть, в отличие от соседей: возраст участвует в двух
 * переломах ставки (3 и 5 лет), и прежний калькулятор считал его по месяцу,
 * а не по календарному году. Точность сохранена.
 *
 * Мощность необязательна. Без неё утилизационный сбор считается прикидкой
 * по одному объёму, и ядро ставит об этом флаг — так было и раньше.
 */
export const russiaFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("russia.fields.priceCurrency"),
    hint: txt("russia.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("russia.currency.USD") },
      { value: "KRW", label: txt("russia.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("russia.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("russia.fields.volumeCc"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "number",
    id: "horsePower",
    label: txt("russia.fields.horsePower"),
    hint: txt("russia.fields.horsePowerHint"),
    min: 0,
    step: 1,
  },
  {
    kind: "number",
    id: "year",
    label: txt("russia.fields.year"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "select",
    id: "month",
    label: txt("russia.fields.month"),
    hint: txt("russia.fields.monthHint"),
    options: Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: txt(`ui.month.${i + 1}`),
    })),
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("russia.fields.fuel"),
    options: [
      { value: "ice", label: txt("russia.fuel.ice") },
      { value: "hybrid", label: txt("russia.fuel.hybrid") },
      { value: "electric", label: txt("russia.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "rubPerUnit",
    label: txt("russia.fields.rubPerUnit"),
    hint: txt("russia.fields.rubPerUnitHint"),
    min: 0.000001,
    step: 0.000001,
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "RUB" }),
  },
  {
    kind: "number",
    id: "rubPerEur",
    label: txt("russia.fields.rubPerEur"),
    hint: txt("russia.fields.rubPerEurHint"),
    min: 0.01,
    step: 0.01,
    ratePair: () => ({ from: "EUR", to: "RUB" }),
  },
];
