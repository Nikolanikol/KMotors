import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Албании.
 *
 * Года выпуска здесь нет намеренно: он не влияет на расчёт ни одной статьёй.
 * Топливо влияет только через электромобиль — у него нет объёма, поэтому
 * к нему не применяется ни минимальная стоимость, ни порог роскоши по объёму.
 * Льгот по НДС для электромобилей в Албании нет.
 */
export const albaniaFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "priceCurrency",
    label: txt("albania.fields.priceCurrency"),
    hint: txt("albania.fields.priceCurrencyHint"),
    options: [
      { value: "USD", label: txt("albania.currency.USD") },
      { value: "KRW", label: txt("albania.currency.KRW") },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: txt("albania.fields.price"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "freight",
    label: txt("albania.fields.freight"),
    hint: txt("albania.fields.freightHint"),
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "allPerUnit",
    label: txt("albania.fields.allPerUnit"),
    hint: txt("albania.fields.allPerUnitHint"),
    min: 0.0001,
    step: 0.0001,
    // Курс едет за валютой сделки: переключил доллар на вону — подставится
    // ALL/KRW, а не остался прежний ALL/USD.
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "ALL" }),
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("albania.fields.fuel"),
    options: [
      { value: "petrol", label: txt("albania.fuel.petrol") },
      { value: "hybrid", label: txt("albania.fuel.hybrid") },
      { value: "electric", label: txt("albania.fuel.electric") },
    ],
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("albania.fields.volumeCc"),
    hint: txt("albania.fields.volumeCcHint"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
];
