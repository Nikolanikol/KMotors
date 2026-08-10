"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { FormValues } from "./FieldRenderer";

/**
 * Общие параметры автомобиля, переживающие переход между странами.
 *
 * Провайдер живёт в layout сегмента `/calculator`, а layout при навигации
 * внутри сегмента не перемонтируется — поэтому введённое остаётся при
 * переключении таба, хотя каждая страна это отдельный маршрут и отдельная
 * страница. Без этого «табы» ощущались бы как уход со страницы.
 *
 * Делятся только поля, которые у всех стран значат одно и то же. Топливо
 * СОЗНАТЕЛЬНО не делится: наборы значений разные — у Грузии нет дизеля,
 * у Кыргызстана есть последовательный гибрид, и перенос значения вслепую
 * подставил бы соседней стране несуществующий вариант.
 */
const SHARED_FIELDS = [
  "year",
  "volumeCc",
  "price",
  "freight",
  "priceCurrency",
] as const;

export function isSharedField(id: string): boolean {
  return (SHARED_FIELDS as readonly string[]).includes(id);
}

interface CalcParamsValue {
  shared: FormValues;
  remember: (patch: FormValues) => void;
}

const CalcParamsContext = createContext<CalcParamsValue | null>(null);

export function CalcParamsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shared, setShared] = useState<FormValues>({});

  const remember = useCallback((patch: FormValues) => {
    setShared((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({ shared, remember }), [shared, remember]);

  return (
    <CalcParamsContext.Provider value={value}>
      {children}
    </CalcParamsContext.Provider>
  );
}

export function useCalcParams(): CalcParamsValue {
  const value = useContext(CalcParamsContext);
  // Провайдер ставится в layout сегмента, но панель должна оставаться
  // работоспособной и без него — например если её когда-нибудь встроят
  // в другую страницу.
  return value ?? { shared: {}, remember: () => {} };
}
