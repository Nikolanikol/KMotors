/**
 * Одна загрузка на источник, даже когда виды запрашивают его одновременно.
 *
 * Внутри рендера Next схлопывает одинаковые `fetch` сам (тот же URL, те же
 * опции — поэтому опции у каждого источника заданы ОДНОЙ константой). Эта
 * обёртка закрывает остальное: вызовы вне рендера (крон, API-маршрут) и
 * параллельные `getFx("market")` + `getFx("customs")`, которые без неё ушли бы
 * к ЦБ РФ двумя запросами.
 *
 * Держится только запрос В ПОЛЁТЕ: после ответа запись снимается, и следующий
 * вызов снова идёт через кеш данных Next. Своего долгого кеша здесь нет —
 * второй кеш рядом с кешем Next разошёлся бы с его `revalidate`.
 */
const inflight = new Map<string, Promise<unknown>>();

export function shared<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = load().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
