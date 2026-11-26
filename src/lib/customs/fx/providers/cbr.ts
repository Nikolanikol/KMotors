// Обёртка на время переезда: ЦБ РФ загружается ОДИН раз на весь сайт,
// `src/lib/fx/sources/cbr.ts`. Здесь — прежние имена для таможенного вида.
import { loadCbr } from "@/lib/fx/sources/cbr";
import { cbrToProviderRates } from "@/lib/fx/views/customs";
import type { ProviderRates } from "@/lib/fx/types";

export { CBR_URL, CBR_REVALIDATE_SECONDS } from "@/lib/fx/sources/cbr";
export { parseCbr } from "@/lib/fx/views/customs";

export async function fetchCbr(): Promise<ProviderRates> {
  return cbrToProviderRates(await loadCbr());
}
