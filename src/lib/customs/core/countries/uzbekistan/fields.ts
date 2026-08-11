import type { FieldDef } from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";

/**
 * Схема формы для Узбекистана.
 *
 * Курсов два, и они про разное. `usdPerUnit` переводит цену сделки в доллары —
 * пошлина задана в долларах и там же считается, и по долларовой стоимости
 * берётся ступень таможенного сбора. `uzsPerUsd` переводит всё остальное в сумы.
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
  /**
   * Фрахт — не строка чека, а часть БАЗЫ: таможенная стоимость = цена сделки
   * плюс доставка до границы, и от неё считаются ступень сбора, процентная
   * часть пошлины и НДС. Поэтому поле стоит сразу за ценой.
   *
   * Всегда в долларах, независимо от валюты сделки: фрахт из Кореи так и
   * котируется. По этой же причине у него нет `ratePair`.
   */
  {
    kind: "number",
    id: "freightUsd",
    label: txt("uzbekistan.fields.freightUsd"),
    hint: txt("uzbekistan.fields.freightUsdHint"),
    min: 0,
    step: 50,
  },
  /**
   * ⚠️ Отдельное поле, а не вывод из года выпуска: тариф делит машины по факту
   * регистрации, а не по возрасту. Корейская машина с аукциона зарегистрирована
   * и потому «бывшая в эксплуатации» при любом годе — 40% + $3,0/см³ против
   * 15% + доплата у новой. Ставим его выше года, чтобы порядок полей повторял
   * порядок решений: сначала статус, потом уже возраст для утильсбора.
   */
  {
    kind: "segmented",
    id: "condition",
    label: txt("uzbekistan.fields.condition"),
    hint: txt("uzbekistan.fields.conditionHint"),
    options: [
      { value: "used", label: txt("uzbekistan.condition.used") },
      { value: "new", label: txt("uzbekistan.condition.new") },
    ],
  },
  {
    kind: "segmented",
    id: "fuel",
    label: txt("uzbekistan.fields.fuel"),
    options: [
      { value: "petrol", label: txt("uzbekistan.fuel.petrol") },
      { value: "diesel", label: txt("uzbekistan.fuel.diesel") },
      { value: "hybrid", label: txt("uzbekistan.fuel.hybrid") },
      { value: "electric", label: txt("uzbekistan.fuel.electric") },
    ],
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
