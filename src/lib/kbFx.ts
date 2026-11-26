// Обёртка на время переезда: курсы живут в `src/lib/fx` (единственный вход).
// Банковский вид Кукмин-банка — бывшая реализация этого файла, формы те же;
// колонка, правдоподобие и деградация описаны в `src/lib/fx/sources/kb.ts`.
// Новый код импортирует `getFx("car")` / `getCarRates` из `@/lib/fx`.
export { getCarRates, getKbRates } from "@/lib/fx";
export type { CarRates, KbRates } from "@/lib/fx";
