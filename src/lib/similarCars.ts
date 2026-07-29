// Подбор «таких же» для страницы проданной машины.
//
// Encar на проданной машине отдаёт 404, поэтому его собственный эндпоинт
// рекомендаций (legacy/.../recommend/{id}) тут бесполезен — он привязан к живому
// объявлению. Вместо него собираем обычный поисковый запрос из полей снимка
// cars_seen: марка + модельная группа + год ±1 + цена ±15%.
//
// Корейские имена берутся из снимка не случайно: фильтр Encar принимает только
// их (Manufacturer.현대._.ModelGroup.팰리세이드.), английские в запрос не годятся.

import { getCars } from "@/components/Catalog/Row/utils/service";
import type { CarSnapshot } from "@/lib/carsSeen";

const YEAR_SPREAD = 1;
const PRICE_SPREAD = 0.15;
const LIMIT = 6;

/**
 * Форма запроса скопирована с проверенной: на
 * (And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.현대._.ModelGroup.팰리세이드.))_.Price.range(2000..5000)._.Year.range(202100..202399).)
 * Encar вернул Count 2475 и корректные строки. Менять расстановку скобок и точек
 * вслепую нельзя — лишняя точка перед закрывающей скобкой даёт HTTP 404,
 * и выглядит это как «ничего не найдено», а не как сломанный запрос.
 */
function buildQuery(s: CarSnapshot): string | null {
  const mfr = s.manufacturer_ko?.trim();
  if (!mfr) return null;

  const group = s.model_group_ko?.trim();
  // Снимки из бэкфилла приходят без modelGroup (в листинге Encar его нет) —
  // тогда сужаем только до марки. Хуже, но лучше пустого блока.
  const base = group
    ? `(C.CarType.Y._.(C.Manufacturer.${encodeURIComponent(mfr)}._.ModelGroup.${encodeURIComponent(group)}.))`
    : `(C.CarType.Y._.Manufacturer.${encodeURIComponent(mfr)}.)`;

  const filters: string[] = [];
  if (s.price_manwon && s.price_manwon > 0) {
    filters.push(
      `_.Price.range(${Math.floor(s.price_manwon * (1 - PRICE_SPREAD))}..${Math.ceil(
        s.price_manwon * (1 + PRICE_SPREAD)
      )}).`
    );
  }
  if (s.year && s.year > 1980) {
    filters.push(`_.Year.range(${s.year - YEAR_SPREAD}00..${s.year + YEAR_SPREAD}99).`);
  }

  return `(And.Hidden.N._.${base}${filters.join("")})`;
}

/**
 * Живые машины, похожие на проданную. Никогда не бросает исключение и никогда
 * не отдаёт саму проданную машину (её у Encar уже нет). Пустой массив —
 * штатный результат: блок просто не рендерится, как и «Рекомендуемые авто».
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSimilarCars(snapshot: CarSnapshot | null): Promise<any[]> {
  if (!snapshot) return [];
  const query = buildQuery(snapshot);
  if (!query) return [];

  const { data } = await getCars(query, "0", LIMIT);
  return data.filter((c) => String(c?.Id) !== snapshot.encar_id).slice(0, LIMIT);
}
