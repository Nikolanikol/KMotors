import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/lib/customs/core/registry";
import type { CalcResult, I18nText } from "@/lib/customs/core/types";
import ru from "@/locales/ru/customs.json";

/**
 * Ядра больше не возвращают текст — они возвращают ключи. Значит опечатка в
 * ключе перестала быть ошибкой компиляции и превратилась в сырой ключ на
 * странице у клиента. Ровно это уже случалось на главной (коммит 29f224d).
 *
 * Тест закрывает дыру с двух сторон: ключ обязан существовать в словаре, и
 * шаблон обязан получить все параметры, которые в нём упомянуты.
 */

function lookup(key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      ru,
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

      it(`все ключи найдены в словаре (${unique.size} шт.)`, () => {
        const missing = [...unique.keys()].filter((key) => !lookup(key));
        expect(missing, `нет в ru/customs.json: ${missing.join(", ")}`).toEqual(
          [],
        );
      });

      it("каждый шаблон получает все свои параметры", () => {
        const broken: string[] = [];
        for (const text of unique.values()) {
          const template = lookup(text.key);
          if (!template) continue;
          const provided = new Set(Object.keys(text.params ?? {}));
          for (const match of template.matchAll(/\{\{-?\s*(\w+)\s*\}\}/g)) {
            if (!provided.has(match[1])) {
              broken.push(`${text.key} → {{${match[1]}}}`);
            }
          }
        }
        expect(broken, `параметр не передан: ${broken.join(", ")}`).toEqual([]);
      });
    });
  }
});
