import type { I18nText } from "@/lib/customs/core/types";

/**
 * Короткая сборка локализуемого текста.
 *
 * Ядра вызывают её десятками раз, поэтому имя короткое: `txt("georgia.lines.excise")`.
 * Ключи задаются без неймспейса — неймспейс `customs` подставляет интерфейс.
 */
export function txt(
  key: string,
  params?: Record<string, string | number | I18nText>,
): I18nText {
  return params ? { key, params } : { key };
}
