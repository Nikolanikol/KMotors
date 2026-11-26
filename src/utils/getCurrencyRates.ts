// Обёртка на время переезда: курсы живут в `src/lib/fx` (единственный вход).
// Рыночный вид — бывшая реализация этого файла, форма объекта та же.
// Новый код импортирует `getFx("market")` / `getMarketRates` из `@/lib/fx`.
export { getMarketRates as getCurrencyRates } from "@/lib/fx";
export type { CurrencyRates } from "@/lib/fx";
