import { TFunction } from "i18next";

export const translateGenerationRow = (string: string, t: TFunction) => {
  if (!string) return string;

  // Разбиваем по пробелам, каждое слово ещё разбиваем по "+"
  const words = string.split(" ");
  const result = words.map((word) => {
    if (word.includes("+")) {
      return word
        .split("+")
        .map((part) => t(`cars:${part}`, { defaultValue: part }))
        .join("+");
    }
    return t(`cars:${word}`, { defaultValue: word });
  });

  return result.join(" ");
};
