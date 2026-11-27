import { CarSearchParams } from "./Types";
import { CAR_STORAGE_FEE_KRW } from "@/lib/carPricing";

/**
 * Стояночный сбор в 만원 — единице, в которой Encar считает `Price`.
 *
 * ⚠️ Клиент видит на карточке цену Encar + сбор (`carPriceKrw`), а `Price.range` в
 * запросе сравнивает ГОЛУЮ цену Encar. Без сдвига фильтр «до 15 000 000 вон» отдавал
 * машины за 15 440 000 (сбор 440 000) — на проде видно по первой же выдаче. Границы
 * сдвигаем на сбор, чтобы фильтр резал ту цену, которую человек видит.
 */
const FEE_MANWON = CAR_STORAGE_FEE_KRW / 10_000;

/**
 * Числовой параметр из URL: только цифры, иначе пусто. Encar на `abc`, `-5`, `1.5` отвечает
 * 400, а наш getCars воспринимает не-404 как сбой и показывал «каталог временно
 * недоступен» вместо обычного листинга. Заодно значение не может нести `&sr=…`/`#`.
 */
function digitsOnly(value: number | string | undefined): string {
  const s = typeof value === "number" ? String(value) : value;
  return typeof s === "string" && /^\d{1,9}$/.test(s) ? s : "";
}

/** Граница цены из «цены на карточке» в «цену Encar»; пусто/мусор → пусто. */
function toEncarPrice(value: number | string, round: (n: number) => number): string {
  if (value === "" || value == null) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return String(Math.max(0, round(n - FEE_MANWON)));
}

const generateFilterQuery = ({
  minPrice = "",
  maxPrice = "",
  minMileage = "",
  maxMileage = "",
  minYear = "",
  maxYear = "",
}: {
  minPrice?: number | string;
  maxPrice?: number | string;
  minMileage?: number | string;
  maxMileage?: number | string;
  minYear?: number | string;
  maxYear?: number | string;
}) => {
  minPrice = digitsOnly(minPrice);
  maxPrice = digitsOnly(maxPrice);
  minMileage = digitsOnly(minMileage);
  maxMileage = digitsOnly(maxMileage);
  minYear = digitsOnly(minYear);
  maxYear = digitsOnly(maxYear);

  let price = "";
  const encarMin = toEncarPrice(minPrice, Math.ceil);
  const encarMax = toEncarPrice(maxPrice, Math.floor);
  if (!encarMax && !encarMin) price = "";
  else price = `_.Price.range(${encarMin}..${encarMax}).`;

  let mileage = "";
  if (!maxMileage && !minMileage) mileage = "";
  else mileage = `_.Mileage.range(${minMileage}..${maxMileage}).`;

  let year = "";
  if (!minYear && !maxYear) year = "";
  else
    year = `_.Year.range(${minYear + "00"}..${maxYear ? maxYear + "99" : ""}).`;

  return mileage + price + year + "";
};


function getString(params: CarSearchParams) {
  if (params.carNo && params.carNo.trim()) {
    const encoded = encodeURIComponent(params.carNo.trim());
    return `(And.Hidden.N._.Simple.keyword(${encoded}).)`;
  }

    const action =
    params.action ? params.action : "(And.Hidden.N._.CarType.Y.)";
  /*************  ✨ Windsurf Command 🌟  *************/

  const filters = {
    minPrice: params.priceMin ?? "0",
    maxPrice: params.priceMax ?? "1000000",
    minMileage: params.mileageMin ?? "0",
    maxMileage: params.mileageMax ?? "1000000",
    minYear: params.yearMin ?? "",
    maxYear: params.yearMax ?? "2030",
  };

  const string = generateFilterQuery(filters);

  return action.slice(0, action.length - 1) +
    string +
    action.slice(action.length - 1);
}

export {getString}