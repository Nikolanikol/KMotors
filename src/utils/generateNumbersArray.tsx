export function generateNumbersArray(
  min: number,
  max: number,
  step: number
): number[] {
  if (step <= 0) {
    throw new Error("Шаг должен быть положительным");
  }

  const result: number[] = [];
  for (let i = min; i <= max; i += step) {
    result.push(i);
  }

  return result;
}
