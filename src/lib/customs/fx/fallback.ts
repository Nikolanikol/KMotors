// Обёртка на время переезда: вшитый снимок — ОДИН на весь сайт,
// `src/lib/fx/snapshot.ts`. Здесь только прежние имена.
import { FX_SNAPSHOT, snapshotProviderRates } from "@/lib/fx/snapshot";

export const FALLBACK_AS_OF = FX_SNAPSHOT.asOf;
export const FALLBACK_PER_USD = FX_SNAPSHOT.perUsd;
export const fallbackRates = snapshotProviderRates;
