import { TFunction } from "i18next";

export const translateGenerationRow = (string: string, t: TFunction) => {
  if (!string) return string;

  const words = string.split(" ");
  const result = words.map((word) => {
    // Разбиваем по "+"
    if (word.includes("+")) {
      return word
        .split("+")
        .map((part) => t(`cars:${part}`, { defaultValue: part }))
        .join("+");
    }

    // Сначала пробуем перевести всё слово целиком (включая скобки)
    const full = t(`cars:${word}`, { defaultValue: "" });
    if (full) return full;

    // Если есть скобки — переводим основу, код оставляем как есть
    if (word.includes("(")) {
      const base = word.split("(")[0].trim();
      const code = word.substring(word.indexOf("("));
      const translated = t(`cars:${base}`, { defaultValue: base });
      return `${translated} ${code}`.trim();
    }

    return t(`cars:${word}`, { defaultValue: word });
  });

  return result.join(" ");
};
