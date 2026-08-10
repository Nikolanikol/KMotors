import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Армении.
 *
 * Режим один: физлицо и юрлицо в Армении платят по одному и тому же своду —
 * пошлина ЕТТ, НДС 20%, экологический налог. Переключателя «кто ввозит»,
 * как в Кыргызстане, здесь нет и не нужно.
 *
 * Курсов два, и они про разное. `amdPerUnit` переводит цену сделки в драмы —
 * от него зависят все процентные статьи. `amdPerEur` нужен только там, где
 * ставка задана в евро за 1 см³, то есть для авто от 3 лет и старше.
 * У новых машин он на результат не влияет вовсе.
 */
export const armeniaFields: FieldDef[] = [
  {
    kind: "select",
    id: "fuel",
    label: txt("armenia.fields.fuel"),
    hint: txt("armenia.fields.fuelHint"),
    options: [
      { value: "petrol", label: txt("armenia.fuel.petrol") },
      { value: "diesel", label: txt("armenia.fuel.diesel") },
      { value: "hybrid", label: txt("armenia.fuel.hybrid") },
      { value: "electric", label: txt("armenia.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("armenia.fields.volumeCc"),
    hint: txt("armenia.fields.volumeCcHint"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "number",
    id: "year",
    label: txt("armenia.fields.year"),
    hint: txt("armenia.fields.yearHint"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("armenia.fields.priceCurrency"),
    hint: txt("armenia.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("armenia.currency.USD") },
      { value: "KRW", label: txt("armenia.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("armenia.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "freight",
    label: txt("armenia.fields.freight"),
    hint: txt("armenia.fields.freightHint"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "amdPerUnit",
    label: txt("armenia.fields.amdPerUnit"),
    hint: txt("armenia.fields.amdPerUnitHint"),
    min: 0.000001,
    step: 0.000001,
    // Курс едет за валютой сделки: переключил доллар на вону — подставится
    // AMD/KRW, а не остался прежний AMD/USD.
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "AMD" }),
  },
  {
    kind: "number",
    id: "amdPerEur",
    label: txt("armenia.fields.amdPerEur"),
    hint: txt("armenia.fields.amdPerEurHint"),
    min: 0.01,
    step: 0.01,
    ratePair: () => ({ from: "EUR", to: "AMD" }),
  },
];
