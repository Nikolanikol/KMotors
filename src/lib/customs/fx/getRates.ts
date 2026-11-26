// Обёртка на время переезда: курсы живут в `src/lib/fx` (единственный вход).
// Таможенный вид — бывшая реализация этого файла, форма `Rates` та же.
// Новый код импортирует `getFx("customs")` / `getCustomsRates` из `@/lib/fx`.
export { getCustomsRates as getRates } from "@/lib/fx";
export { mergeRates, logDegradation } from "@/lib/fx/views/customs";
