export const convertNumber = (input: number | string): string => {
  if (typeof input === "string") {
    return (Number(input) * 1000).toLocaleString("ru-RU");
  }
  const multipliedValue = input * 10000;
  return multipliedValue.toLocaleString("ru-RU");
};

// Пример использования в TypeScript:

// ⚠️ Пробег ВСЕГДА в километрах, у обоих типов на входе. Ветка по typeof
// здесь была тем же дефектом, что стоил двух живых ошибок на ценах Encar
// (CLAUDE.md, «Цены и курсы»): строка множилась на 1000, число возвращалось
// как есть. Ломалось не везде и потому долго не замечалось — Encar напрямую
// отдаёт ЧИСЛО, и каталог показывал верные 17 922 км, а вот
// Home/CarSlider (`String(car.Mileage ?? "")`) и SoldCar
// (`String(snapshot.mileage)`) приводят значение к строке и получали
// «117 371 000 км» — сто семнадцать миллионов километров на карусели главной.
//
// Нормализация одна, множителя нет. Строку и число трактовать ОДИНАКОВО.
export const convertNumberKm = (input: number | string): string => {
  const km =
    typeof input === "number" ? input : Number(String(input).replace(/[^\d.-]/g, ""));
  return Number.isFinite(km) ? km.toLocaleString("ru-RU") : "";
};
