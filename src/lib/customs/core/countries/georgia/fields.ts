import type { FieldDef } from "@/lib/customs/core/types";

/** Схема формы для Грузии. Порядок полей повторяет демо-калькулятор. */
export const georgiaFields: FieldDef[] = [
  {
    kind: "number",
    id: "year",
    label: "Год выпуска",
    min: 1970,
    max: 2026,
    step: 1,
  },
  {
    kind: "number",
    id: "volumeCc",
    label: "Объём двигателя, см³",
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
  {
    kind: "segmented",
    id: "fuel",
    label: "Тип топлива",
    options: [
      { value: "petrol", label: "Бензин / дизель" },
      { value: "hybrid", label: "Гибрид" },
      { value: "electric", label: "Электро" },
    ],
  },
  {
    kind: "segmented",
    id: "steering",
    label: "Расположение руля",
    options: [
      { value: "left", label: "Левый" },
      { value: "right", label: "Правый" },
    ],
  },
  {
    kind: "number",
    id: "gelPerUsd",
    label: "Курс GEL за 1 USD",
    hint: "Влияет только на пересчёт итога в доллары.",
    min: 0.1,
    step: 0.01,
    ratePair: () => ({ from: "USD", to: "GEL" }),
  },
];
