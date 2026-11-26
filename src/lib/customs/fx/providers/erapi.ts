// Обёртка на время переезда: источник живёт в `src/lib/fx/sources/erapi.ts`.
export {
  ERAPI_URL,
  ERAPI_REVALIDATE_SECONDS,
  parseErApi,
  loadErApi as fetchErApi,
} from "@/lib/fx/sources/erapi";
