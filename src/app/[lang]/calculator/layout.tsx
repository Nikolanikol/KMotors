import { CalcParamsProvider } from "@/components/Customs/CalcParams";

/**
 * Хранилище общих параметров авто живёт ЗДЕСЬ, а не в layout сегмента страны.
 *
 * Проверено вживую: layout внутри динамического сегмента `[country]`
 * перемонтируется при смене параметра — Next считает разные значения разными
 * узлами кэша, поэтому состояние провайдера обнулялось на каждом переключении
 * таба. Статический сегмент `calculator` этой смены не видит и переживает
 * переход, а значит введённые год, объём и цена не теряются.
 *
 * Ничего не рисует, поэтому страница-хаб `/calculator` от него не меняется.
 */
export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CalcParamsProvider>{children}</CalcParamsProvider>;
}
