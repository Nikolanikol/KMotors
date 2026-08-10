import type { FieldDef } from "@/lib/customs/core/types";

/**
 * Схема формы для Албании.
 *
 * Года выпуска здесь нет намеренно: он не влияет на расчёт ни одной статьёй.
 * Топливо влияет только через электромобиль — у него нет объёма, поэтому
 * к нему не применяется ни минимальная стоимость, ни порог роскоши по объёму.
 * Никаких льгот по НДС для электромобилей эталон не показывает.
 */
export const albaniaFields: FieldDef[] = [
  {
    kind: "segmented",
    id: "priceCurrency",
    label: "Валюта сделки",
    hint: "Курс к леку подставляется автоматически.",
    options: [
      { value: "USD", label: "Доллар" },
      { value: "KRW", label: "Вона" },
    ],
  },
  {
    kind: "number",
    id: "price",
    label: "Стоимость авто",
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "freight",
    label: "Фрахт и страховка",
    hint: "Входит в таможенную стоимость наравне с ценой авто.",
    min: 0,
    step: 50,
  },
  {
    kind: "number",
    id: "allPerUnit",
    label: "Курс: леков за единицу валюты",
    hint: "Рыночный курс. Таможня применяет свой официальный — он может отличаться.",
    min: 0.0001,
    step: 0.0001,
    // Курс едет за валютой сделки: переключил доллар на вону — подставится
    // ALL/KRW, а не остался прежний ALL/USD.
    ratePair: (input) => ({ from: String(input.priceCurrency), to: "ALL" }),
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
    kind: "number",
    id: "volumeCc",
    label: "Объём двигателя, см³",
    hint: "Определяет минимальную таможенную стоимость и порог налога на роскошь.",
    min: 1,
    step: 1,
    visibleIf: (input) => input.fuel !== "electric",
  },
];
