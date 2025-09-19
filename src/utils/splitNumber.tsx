export const convertNumber = (input: number | string): string => {
  if (typeof input === "string") {
    return (Number(input) * 1000).toLocaleString("ru-RU");
  }
  const multipliedValue = input * 10000;
  return multipliedValue.toLocaleString("ru-RU");
};

// Пример использования в TypeScript:

export const convertNumberKm = (input: number | string): string => {
  if (typeof input === "string") {
    return (Number(input) * 1000).toLocaleString("ru-RU");
  }
  const multipliedValue = input;
  return multipliedValue.toLocaleString("ru-RU");
};
