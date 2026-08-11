import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/lib/customs/core/registry";
import type { CalcResult, I18nText } from "@/lib/customs/core/types";
import ru from "@/locales/ru/customs.json";
import en from "@/locales/en/customs.json";

/**
 * Ядра больше не возвращают текст — они возвращают ключи. Значит опечатка в
 * ключе перестала быть ошибкой компиляции и превратилась в сырой ключ на
 * странице у клиента. Ровно это уже случалось на главной (коммит 29f224d).
 *
 * Тест закрывает дыру с двух сторон: ключ обязан существовать в словаре, и
 * шаблон обязан получить все параметры, которые в нём упомянуты.
 *
 * Гоняется по КАЖДОМУ заполненному словарю, а не по одному русскому: заполненный
 * язык открывает индексацию и попадает в сайтмап (`hasCustomsDictionary`), так
 * что недостающий ключ в нём — такая же дыра, как в ru. ka/ar сюда не входят
 * намеренно: они пустые и живут на en-фолбэке.
 */
const DICTS = { ru, en } as const;

function lookup(key: string, dict: unknown): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}

/** Собирает ключ и все вложенные в параметры — вложенность разворачивается. */
function collect(text: I18nText, into: I18nText[]): void {
  into.push(text);
  for (const value of Object.values(text.params ?? {})) {
    if (value && typeof value === "object") collect(value, into);
  }
}

function fromResult(result: CalcResult): I18nText[] {
  const found: I18nText[] = [];
  for (const line of [...result.lines, ...(result.extra ?? [])]) {
    collect(line.label, found);
    if (line.note) collect(line.note, found);
  }
  for (const flag of result.flags) collect(flag.text, found);
  for (const part of result.subtitle) collect(part, found);
  collect(result.stampLabel, found);
  return found;
}

/**
 * Прогон по сетке: перебираем все значения перечислимых полей (топливо, режим,
 * валюта) и несколько чисел, чтобы задеть каждую ветку ставок и каждый флаг.
 * Годы подобраны так, чтобы попасть во все возрастные бракеты всех стран.
 */
function gridInputs(
  defaults: Record<string, unknown>,
  fields: (typeof COUNTRIES)[number]["calculator"] extends undefined
    ? never
    : NonNullable<(typeof COUNTRIES)[number]["calculator"]>["fields"],
): Record<string, unknown>[] {
  const variants: Record<string, unknown>[] = [{ ...defaults }];

  for (const field of fields) {
    if (field.kind !== "segmented" && field.kind !== "select") continue;
    for (const option of field.options) {
      variants.push({ ...defaults, [field.id]: option.value });
    }
  }

  const grid: Record<string, unknown>[] = [];
  for (const variant of variants) {
    for (const year of [2026, 2024, 2023, 2020, 2019, 2015, 2005]) {
      for (const volumeCc of [999, 1500, 1998, 2801, 3500]) {
        for (const price of [800, 9000, 60_000]) {
          grid.push({ ...variant, year, volumeCc, price });
        }
      }
    }
  }
  return grid;
}

describe("Словарь customs покрывает всё, что называют ядра", () => {
  for (const country of COUNTRIES) {
    const calculator = country.calculator;
    if (!calculator) continue;

    describe(country.id, () => {
      const texts: I18nText[] = [];

      collect(country.tabLabel, texts);
      collect(country.title, texts);
      collect(country.titleAccent, texts);
      collect(calculator.title, texts);
      if (country.verification) {
        collect(country.verification.sourceName, texts);
      }
      for (const field of calculator.fields) {
        collect(field.label, texts);
        if (field.hint) collect(field.hint, texts);
        if (field.kind === "segmented" || field.kind === "select") {
          for (const option of field.options) collect(option.label, texts);
        }
      }
      for (const input of gridInputs(calculator.defaults, calculator.fields)) {
        texts.push(...fromResult(calculator.calculate(input)));
      }

      const unique = new Map<string, I18nText>();
      for (const text of texts) unique.set(text.key, text);

      for (const [lang, dict] of Object.entries(DICTS)) {
        it(`${lang}: все ключи найдены в словаре (${unique.size} шт.)`, () => {
          const missing = [...unique.keys()].filter(
            (key) => !lookup(key, dict),
          );
          expect(
            missing,
            `нет в ${lang}/customs.json: ${missing.join(", ")}`,
          ).toEqual([]);
        });

        it(`${lang}: каждый шаблон получает все свои параметры`, () => {
          const broken: string[] = [];
          for (const text of unique.values()) {
            const template = lookup(text.key, dict);
            if (!template) continue;
            const provided = new Set(Object.keys(text.params ?? {}));
            for (const match of template.matchAll(/\{\{-?\s*(\w+)\s*\}\}/g)) {
              if (!provided.has(match[1])) {
                broken.push(`${text.key} → {{${match[1]}}}`);
              }
            }
          }
          expect(broken, `параметр не передан: ${broken.join(", ")}`).toEqual(
            [],
          );
        });
      }
    });
  }
});

/**
 * Паритет словарей. Прогон по ядрам выше не видит ключей, которых ядра не
 * называют: `ui.*`, `hub.*`, `*.meta.*`, подписи полей. Между тем заполненность
 * словаря — это то, что открывает языку индексацию, поэтому неполный en хуже
 * пустого: страница уйдёт в индекс с дырами.
 */
describe("Словари ru и en совпадают по составу", () => {
  const flatten = (node: unknown, prefix = "", out = new Map<string, string>()) => {
    if (typeof node === "string") out.set(prefix, node);
    else if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        flatten(value, prefix ? `${prefix}.${key}` : key, out);
      }
    }
    return out;
  };

  const flatRu = flatten(ru);
  const flatEn = flatten(en);
  const params = (text: string) =>
    [...text.matchAll(/\{\{-?\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

  it("в en есть каждый ключ из ru", () => {
    const missing = [...flatRu.keys()].filter((key) => !flatEn.has(key));
    expect(missing, `нет в en: ${missing.join(", ")}`).toEqual([]);
  });

  it("в en нет ключей сверх ru", () => {
    const extra = [...flatEn.keys()].filter((key) => !flatRu.has(key));
    expect(extra, `лишние в en: ${extra.join(", ")}`).toEqual([]);
  });

  it("параметры шаблонов совпадают", () => {
    const broken: string[] = [];
    for (const [key, value] of flatRu) {
      const other = flatEn.get(key);
      if (other === undefined) continue;
      const a = params(value);
      const b = params(other);
      if (a.join() !== b.join()) broken.push(`${key}: ru {${a}} ≠ en {${b}}`);
    }
    expect(broken, broken.join("; ")).toEqual([]);
  });
});
