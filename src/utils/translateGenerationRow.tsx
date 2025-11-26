import { TFunction } from "i18next";

export const translateGenerationRow = (string: string, t: TFunction) => {
  if (string) {
    const arr = string.split(" ");
    // Используем namespace 'cars' для названий автомобилей
    // Если перевод не найден, возвращаем оригинальное значение
    const result = arr
      .map((value) => {
        const translated = t(`cars:${value}`, { defaultValue: value });
        return translated;
      })
      .join(" ");

    return result;
  }
  return string;
};
