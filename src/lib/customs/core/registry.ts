/**
 * Реестр стран. Из него строятся табы и, позже, отдельные страницы.
 *
 * Калькулятор у страны появляется, когда её ядро сверено с эталоном.
 * Пока ядра нет — таб рисует заглушку вместо формы и чека.
 */

import type {
  CalcResult,
  CountryCalculator,
  FieldDef,
  I18nText,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
import { georgiaCalculator } from "@/lib/customs/core/countries/georgia";
import { albaniaCalculator } from "@/lib/customs/core/countries/albania";
import { kyrgyzstanCalculator } from "@/lib/customs/core/countries/kyrgyzstan";
import { armeniaCalculator } from "@/lib/customs/core/countries/armenia";
import { russiaCalculator } from "@/lib/customs/core/countries/russia";
import { kazakhstanCalculator } from "@/lib/customs/core/countries/kazakhstan";
import { uzbekistanCalculator } from "@/lib/customs/core/countries/uzbekistan";

export type CountryId =
  | "russia"
  | "kazakhstan"
  | "uzbekistan"
  | "georgia"
  | "armenia"
  | "kyrgyzstan"
  | "albania";

/**
 * Калькулятор со стёртым типом входа — в таком виде его держит реестр
 * и потребляет интерфейс. Приведение типа собрано в одном месте, в `erase`,
 * чтобы не расползаться по компонентам.
 */
export interface ErasedCalculator {
  id: string;
  title: I18nText;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  calculate(input: Record<string, unknown>): CalcResult;
}

function erase<TInput>(calculator: CountryCalculator<TInput>): ErasedCalculator {
  return {
    id: calculator.id,
    title: calculator.title,
    fields: calculator.fields,
    defaults: calculator.defaults as Record<string, unknown>,
    calculate: (input) => calculator.calculate(input as TInput),
  };
}

export interface CountryMeta {
  id: CountryId;
  /** Подпись на табе. */
  tabLabel: I18nText;
  /** Заголовок над калькулятором. */
  title: I18nText;
  /** Выделенное слово в заголовке — рисуется акцентным цветом. */
  titleAccent: I18nText;
  /** Моноширинная надстрочная строка в стиле грузинского калькулятора. */
  eyebrow: string;
  /** Верхняя строка на печати в чеке — латиницей, как штамп таможни. */
  stampTop: string;
  /** Код валюты, в которой страна показывает итог. */
  currency: string;
  /** Ядро расчёта. Отсутствует, пока страна не сверена с эталоном. */
  calculator?: ErasedCalculator;
  /** Откуда снят эталон и когда сверялся. Отсутствует, пока сверки не было. */
  verification?: {
    sourceName: I18nText;
    /**
     * Ссылка на источник. Необязательна: источник называем всегда, но ссылку
     * ставим не на всякий. Решение принимается здесь, в реестре, а не в
     * разметке — интерфейс просто рисует название без ссылки, если её нет.
     */
    sourceUrl?: string;
    /** ISO-дата сверки, «2026-08-09». */
    verifiedAt: string;
  };
}

export const COUNTRIES: CountryMeta[] = [
  // Порядок табов — по значимости направления для трафика, а не по алфавиту.
  // Россия, Казахстан и Узбекистан пришли из прежнего калькулятора сайта:
  // их формулы перенесены дословно, но эталоном ещё не сверены, поэтому
  // блока `verification` у них нет и дата актуальности не показывается.
  {
    id: "russia",
    tabLabel: txt("russia.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("russia.titleAccent"),
    eyebrow: "ROSSIYA / CUSTOMS ESTIMATE",
    stampTop: "RUSSIA",
    currency: "RUB",
    calculator: erase(russiaCalculator),
  },
  {
    id: "kazakhstan",
    tabLabel: txt("kazakhstan.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("kazakhstan.titleAccent"),
    eyebrow: "QAZAQSTAN / CUSTOMS ESTIMATE",
    stampTop: "KAZAKHSTAN",
    currency: "KZT",
    calculator: erase(kazakhstanCalculator),
  },
  {
    id: "uzbekistan",
    tabLabel: txt("uzbekistan.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("uzbekistan.titleAccent"),
    eyebrow: "OʻZBEKISTON / CUSTOMS ESTIMATE",
    stampTop: "UZBEKISTAN",
    currency: "UZS",
    calculator: erase(uzbekistanCalculator),
  },
  {
    id: "georgia",
    tabLabel: txt("georgia.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("georgia.titleAccent"),
    eyebrow: "SAKARTVELO / CUSTOMS ESTIMATE",
    stampTop: "GEORGIA",
    currency: "GEL",
    calculator: erase(georgiaCalculator),
    verification: {
      sourceName: txt("georgia.source"),
      sourceUrl: "https://myauto.ge/ru/calculator",
      verifiedAt: "2026-08-09",
    },
  },
  {
    id: "armenia",
    tabLabel: txt("armenia.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("armenia.titleAccent"),
    eyebrow: "HAYASTAN / CUSTOMS ESTIMATE",
    stampTop: "ARMENIA",
    currency: "AMD",
    calculator: erase(armeniaCalculator),
    verification: {
      // Ссылки здесь сознательно нет: источник сверки — калькулятор компании,
      // которая возит авто с аукционов в Ереван, то есть прямой конкурент.
      // Называем его честно, но трафик ему не отдаём. Полный адрес и разбор
      // прогона лежат в tests/customs/golden/armenia.golden.json и в CLAUDE.md.
      sourceName: txt("armenia.source"),
      verifiedAt: "2026-08-10",
    },
  },
  {
    id: "kyrgyzstan",
    tabLabel: txt("kyrgyzstan.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("kyrgyzstan.titleAccent"),
    eyebrow: "KYRGYZ REPUBLIC / CUSTOMS ESTIMATE",
    stampTop: "KYRGYZSTAN",
    currency: "KGS",
    calculator: erase(kyrgyzstanCalculator),
    verification: {
      sourceName: txt("kyrgyzstan.source"),
      sourceUrl:
        "https://www.customs.gov.kg/site/ru/master/customskg/kalkuljator-ats",
      verifiedAt: "2026-08-09",
    },
  },
  {
    id: "albania",
    tabLabel: txt("albania.tabLabel"),
    title: txt("common.titlePrefix"),
    titleAccent: txt("albania.titleAccent"),
    eyebrow: "SHQIPËRIA / CUSTOMS ESTIMATE",
    stampTop: "SHQIPËRIA",
    currency: "ALL",
    calculator: erase(albaniaCalculator),
    verification: {
      sourceName: txt("albania.source"),
      sourceUrl: "https://www.vinauto.al/kalkulator-dogane",
      verifiedAt: "2026-08-09",
    },
  },
];

/**
 * Страна на `/[lang]/calculator` без сегмента. Россия — самое ёмкое
 * направление, и этот URL уже накоплен в индексе, поэтому он и остаётся
 * главным. `/calculator/russia` редиректится сюда, чтобы не плодить дубль.
 */
export const DEFAULT_COUNTRY: CountryId = "russia";

/**
 * Устарела ли сверка. Ставки и сборы пересматриваются с начала календарного
 * года, поэтому признаком считаем смену года, а не количество прошедших дней.
 *
 * Функция чистая и текущую дату не берёт: год приходит снаружи, как и в ядрах.
 */
export function isVerificationStale(
  verifiedAt: string,
  currentYear: number,
): boolean {
  const verifiedYear = Number(verifiedAt.slice(0, 4));
  if (!Number.isFinite(verifiedYear) || verifiedYear === 0) return false;
  return currentYear > verifiedYear;
}

export function getCountry(id: CountryId): CountryMeta {
  const found = COUNTRIES.find((c) => c.id === id);
  if (!found) throw new Error(`Неизвестная страна: ${id}`);
  return found;
}
