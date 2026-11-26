// Обёртка на время переезда: типы слоя курсов живут в `src/lib/fx/types.ts`.
export {
  TRACKED_CURRENCIES,
  SOURCE_LABELS,
  rateBetween,
  formatRateValue,
} from "@/lib/fx/types";
export type { CurrencyCode, RateSource, ProviderRates, Rates } from "@/lib/fx/types";
