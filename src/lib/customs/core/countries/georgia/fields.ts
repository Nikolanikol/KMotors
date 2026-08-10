import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/** Схема формы для Грузии. Порядок полей повторяет демо-калькулятор. */
export const georgiaFields: FieldDef[] = [
  {
    kind: "number",
    id: "year",
    label: txt("georgia.fields.year"),
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "number",
    id: "volumeCc",
    label: txt("georgia.fields.volumeCc"),
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("georgia.fields.fuel"),
    options: [
      { value: "petrol", label: txt("georgia.fuel.petrol") },
      { value: "hybrid", label: txt("georgia.fuel.hybrid") },
      { value: "electric", label: txt("georgia.fuel.electric") },
    ],
  },
  {
    kind: "segmented",
    id: "steering",
    label: txt("georgia.fields.steering"),
    options: [
      { value: "left", label: txt("georgia.steering.left") },
      { value: "right", label: txt("georgia.steering.right") },
    ],
  },
  {
    kind: "number",
    id: "gelPerUsd",
    label: txt("georgia.fields.gelPerUsd"),
    hint: txt("georgia.fields.gelPerUsdHint"),
    min: 0.1,
    step: 0.01,
    ratePair: () => ({ from: "USD", to: "GEL" }),
  },
];
