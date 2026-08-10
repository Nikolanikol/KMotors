/**
 * Реестр стран. Из него строятся табы и, позже, отдельные страницы.
 *
 * Калькулятор у страны появляется, когда её ядро сверено с эталоном.
 * Пока ядра нет — таб рисует заглушку вместо формы и чека.
 */

import type { CalcResult, CountryCalculator, FieldDef } from "@/lib/customs/core/types";
import { georgiaCalculator } from "@/lib/customs/core/countries/georgia";
import { albaniaCalculator } from "@/lib/customs/core/countries/albania";
import { kyrgyzstanCalculator } from "@/lib/customs/core/countries/kyrgyzstan";
import { armeniaCalculator } from "@/lib/customs/core/countries/armenia";

export type CountryId = "georgia" | "armenia" | "kyrgyzstan" | "albania";

/**
 * Калькулятор со стёртым типом входа — в таком виде его держит реестр
 * и потребляет интерфейс. Приведение типа собрано в одном месте, в `erase`,
 * чтобы не расползаться по компонентам.
 */
export interface ErasedCalculator {
  id: string;
  title: string;
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
  tabLabel: string;
  /** Заголовок над калькулятором. */
  title: string;
  /** Выделенное слово в заголовке — рисуется акцентным цветом. */
  titleAccent: string;
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
    sourceName: string;
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
  {
    id: "georgia",
    tabLabel: "Грузия",
    title: "Растаможка авто в",
    titleAccent: "Грузии",
    eyebrow: "SAKARTVELO / CUSTOMS ESTIMATE",
    stampTop: "GEORGIA",
    currency: "GEL",
    calculator: erase(georgiaCalculator),
    verification: {
      sourceName: "myauto.ge",
      sourceUrl: "https://myauto.ge/ru/calculator",
      verifiedAt: "2026-08-09",
    },
  },
  {
    id: "armenia",
    tabLabel: "Армения",
    title: "Растаможка авто в",
    titleAccent: "Армению",
    eyebrow: "HAYASTAN / CUSTOMS ESTIMATE",
    stampTop: "ARMENIA",
    currency: "AMD",
    calculator: erase(armeniaCalculator),
    verification: {
      // Ссылки здесь сознательно нет: источник сверки — калькулятор компании,
      // которая возит авто с аукционов в Ереван, то есть прямой конкурент.
      // Называем его честно, но трафик ему не отдаём. Полный адрес и разбор
      // прогона лежат в tests/golden/armenia.golden.json и в CLAUDE.md.
      sourceName: "Platinum Motors",
      verifiedAt: "2026-08-10",
    },
  },
  {
    id: "kyrgyzstan",
    tabLabel: "Кыргызстан",
    title: "Растаможка авто в",
    titleAccent: "Кыргызстане",
    eyebrow: "KYRGYZ REPUBLIC / CUSTOMS ESTIMATE",
    stampTop: "KYRGYZSTAN",
    currency: "KGS",
    calculator: erase(kyrgyzstanCalculator),
    verification: {
      sourceName: "Калькулятор ГТС при Кабмине КР",
      sourceUrl:
        "https://www.customs.gov.kg/site/ru/master/customskg/kalkuljator-ats",
      verifiedAt: "2026-08-09",
    },
  },
  {
    id: "albania",
    tabLabel: "Албания",
    title: "Растаможка авто в",
    titleAccent: "Албанию",
    eyebrow: "SHQIPËRIA / CUSTOMS ESTIMATE",
    stampTop: "SHQIPËRIA",
    currency: "ALL",
    calculator: erase(albaniaCalculator),
    verification: {
      sourceName: "vinauto.al",
      sourceUrl: "https://www.vinauto.al/kalkulator-dogane",
      verifiedAt: "2026-08-09",
    },
  },
];

export const DEFAULT_COUNTRY: CountryId = "georgia";

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
