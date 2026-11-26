/**
 * Вход ядра растаможки из данных машины Encar — для виджета в карточке авто.
 *
 * Виджет считает ТЕМ ЖЕ ядром, что и `/calculator` (решение владельца
 * 26.11.2026): до этого у него была своя копия формул в
 * `src/utils/customsCalculator/`, и клиент в карточке видел другие числа, чем
 * на странице калькулятора. Здесь только перевод полей Encar во вход ядра —
 * ни одной ставки.
 *
 * Модуль чистый: без сети, без `new Date()`. Курс и расчётный момент приходят
 * аргументами, поэтому вход проверяется тестом без подмен.
 */
import type { CountryId, RuntimeInputs } from "@/lib/customs/core/registry";
import { getCountry } from "@/lib/customs/core/registry";
import { rateBetween, type CurrencyCode, type Rates } from "@/lib/fx/types";

/** Страны виджета — направления, с которыми работает карточка авто. */
export const WIDGET_COUNTRIES = ["russia", "kazakhstan", "uzbekistan"] as const;
export type WidgetCountryId = (typeof WIDGET_COUNTRIES)[number];

/** Валюта итога у страны виджета. */
export const WIDGET_CURRENCY: Record<WidgetCountryId, CurrencyCode> = {
  russia: "RUB",
  kazakhstan: "KZT",
  uzbekistan: "UZS",
};

export interface CarCustomsData {
  /**
   * Цена сделки в ВОНАХ, без нашего стояночного сбора: база таможни —
   * стоимость сделки (см. «Цены и курсы» в корневом CLAUDE.md).
   */
  priceKrw: number;
  /** Encar `category.yearMonth`, «YYYYMM». */
  yearMonth: string;
  /** Encar `spec.displacement`, см³. */
  volumeCc: number;
  /** Encar `spec.fuelName` — корейское название: 가솔린, 디젤, 가솔린+전기, 전기… */
  fuelName?: string;
}

/** Тип двигателя в общих терминах; каждая страна переводит его в свой. */
export type CarFuelKind = "petrol" | "diesel" | "hybrid" | "electric";

/**
 * Корейское название топлива Encar → тип двигателя.
 *
 * Гибрид Encar пишет через «+전기» (가솔린+전기, 디젤+전기, LPG+전기) либо
 * словом 하이브리드. Водород (수소) — топливный элемент, машина на
 * электродвигателе: таможня ЕАЭС и РУз ведут её по 8703 80, как электромобиль.
 * LPG, CNG и всё незнакомое считаются бензиновым ДВС — так их и облагают.
 */
export function carFuelKind(fuelName: string | undefined): CarFuelKind {
  const f = String(fuelName ?? "").toLowerCase();
  if (f.includes("+전기") || f.includes("하이브리드") || f.includes("hybrid")) {
    return "hybrid";
  }
  if (f.includes("전기") || f.includes("수소") || f.includes("electric")) {
    return "electric";
  }
  if (f.includes("디젤") || f.includes("diesel")) return "diesel";
  return "petrol";
}

/** «YYYYMM» → год и месяц; null, если строка не похожа на дату. */
export function parseYearMonth(
  yearMonth: string,
): { year: number; month: number } | null {
  const match = /^(\d{4})(\d{2})/.exec(String(yearMonth ?? ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1970 || month < 1 || month > 12) return null;
  return { year, month };
}

function rate(rates: Rates, from: CurrencyCode, to: CurrencyCode): number | null {
  const value = rateBetween(rates, from, to);
  return value && value > 0 ? value : null;
}

export interface WidgetOptions {
  /** Мощность, л.с. Нужна только России; 0 или пусто — «не указана». */
  horsePower?: number;
}

/**
 * Собирает вход ядра страны из данных машины.
 *
 * Затравка — `defaults` ядра плюс `runtime`: у ядра есть входы без поля в
 * форме (`RUNTIME_INPUT_IDS`), и без них возраст стал бы NaN. Тип
 * `RuntimeInputs` не даёт вызвать функцию, не подав каждый такой ключ.
 *
 * Возвращает null, если посчитать честно нельзя: нет года выпуска, цены или
 * курса. Подставлять нули нельзя — ядро выдало бы правдоподобный, но ложный чек.
 */
export function carCustomsInput(
  countryId: WidgetCountryId,
  car: CarCustomsData,
  rates: Rates,
  runtime: RuntimeInputs,
  options: WidgetOptions = {},
): Record<string, unknown> | null {
  const calculator = getCountry(countryId as CountryId).calculator;
  const date = parseYearMonth(car.yearMonth);
  const priceKrw = Number(car.priceKrw);
  if (!calculator || !date || !(priceKrw > 0)) return null;

  const fuel = carFuelKind(car.fuelName);
  const volumeCc = Math.max(0, Number(car.volumeCc) || 0);
  const base: Record<string, unknown> = {
    ...calculator.defaults,
    ...runtime,
    price: priceKrw,
    priceCurrency: "KRW",
    volumeCc,
    year: date.year,
    month: date.month,
  };

  switch (countryId) {
    case "russia": {
      const rubPerUnit = rate(rates, "KRW", "RUB");
      const rubPerEur = rate(rates, "EUR", "RUB");
      if (!rubPerUnit || !rubPerEur) return null;
      return {
        ...base,
        rubPerUnit,
        rubPerEur,
        horsePower: Math.max(0, Number(options.horsePower) || 0),
        fuel: fuel === "petrol" || fuel === "diesel" ? "ice" : fuel,
      };
    }
    case "kazakhstan": {
      const kztPerUnit = rate(rates, "KRW", "KZT");
      const kztPerEur = rate(rates, "EUR", "KZT");
      if (!kztPerUnit || !kztPerEur) return null;
      // Корейские гибриды — параллельные HEV/PHEV (у ДВС есть привод на ось),
      // поэтому `hybrid`, а не `erev`: последовательных гибридов на Encar нет.
      return {
        ...base,
        kztPerUnit,
        kztPerEur,
        fuel: fuel === "petrol" || fuel === "diesel" ? "ice" : fuel,
      };
    }
    case "uzbekistan": {
      const usdPerUnit = rate(rates, "KRW", "USD");
      const uzsPerUsd = rate(rates, "USD", "UZS");
      if (!usdPerUnit || !uzsPerUsd) return null;
      // ⚠️ Машина с Encar зарегистрирована в Корее — значит «бывшая в
      // эксплуатации» при любом годе выпуска (40% + $3/см³). Статус из возраста
      // НЕ выводить. Фрахт до границы — из `defaults` ядра, он часть базы.
      return {
        ...base,
        usdPerUnit,
        uzsPerUsd,
        fuel,
        condition: "used",
      };
    }
  }
}
