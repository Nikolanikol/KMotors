// Походы на carnect.biz — единственное место, откуда модуль ходит в сеть.
//
// Главная задача файла — чтобы источник нас не заметил и не закрыл. Банят не
// за чтение публичных страниц, а за то, как оно выглядит в логах: десятки
// запросов в секунду, параллельные залпы, долбёжка после ошибок. Отсюда
// правила, каждое из которых здесь зашито и в вызывающем коде не повторяется:
//
//   1. ДВЕ ПОЛОСЫ. «bulk» — плановый обход списков: строго по одному запросу,
//      пауза ~2.5–3.5 с между ними. «interactive» — страница лота, которую
//      открыл живой человек у нас: ждать за обходом списка он не должен,
//      поэтому у неё своя, короткая очередь. Нагрузку от неё задаёт число
//      наших посетителей, а не крон, и она закрыта кешем уровнем выше.
//   2. ОШИБКИ ТОРМОЗЯТ, А НЕ УСКОРЯЮТ. 5xx и сеть — до трёх попыток с
//      растущей паузой. 429/503 с Retry-After — ждём, сколько попросили (до
//      минуты), и только один раз; дольше — сдаёмся и сообщаем наверх
//      `rateLimited`, обход на этом обязан остановиться целиком.
//   3. 404 НЕ ПОВТОРЯЕМ. Ответ не изменится, а лишний запрос — лишний.
//   4. Один постоянный User-Agent. Никакой ротации адресов и заголовков:
//      если carnect закроет нам доступ при такой нагрузке, это решение
//      владельца сайта, и его надо решать разговором, а не обходом.
//
// ⚠️ Состояние очередей живёт в памяти процесса. Прод — один долгоживущий
// контейнер (Coolify), так что очередь общая на все запросы. Появится второй
// инстанс — паузы станут на инстанс, а не на сайт; тогда очередь выносить.

import { isNotFound } from "./rsc";

export const CARNECT_ORIGIN = process.env.CARNECT_ORIGIN ?? "https://carnect.biz";

// Тот же браузерный UA, что у витрины dokanmazad (showcase/scrape.ts): за
// Cloudflare у carnect голый UA node/undici рискует получить проверку на
// бота. UA ОДИН и не меняется между запросами — см. правило 4 выше.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Пауза между запросами планового обхода. Плюс случайная добавка до JITTER. */
const BULK_GAP_MS = 2500;
const BULK_JITTER_MS = 1000;
/** Минимальный зазор для запросов посетителей — только чтобы не было залпа. */
const INTERACTIVE_GAP_MS = 400;

/** Сколько ждём один ответ. Страница списка весит ~350 КБ, origin бывает медленным. */
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_TRIES = 3;
/** Пауза перед повтором после 5xx/сети, растёт с попыткой: 3 с, 6 с. */
const RETRY_BASE_MS = 3000;
/** Больше этого Retry-After не ждём: значит, нас всерьёз просят уйти. */
const MAX_RETRY_AFTER_MS = 60_000;

export type Lane = "bulk" | "interactive";

/**
 * Исход похода. ТРИ варианта, и схлопывать их нельзя — то же правило, что у
 * fetchVehicleData с Encar и у витрины dokanmazad:
 *
 *   html  — страница есть, разбирать её дальше.
 *   gone  — страницы нет (404 ИЛИ soft-404, см. isNotFound): лот ушёл с
 *           торгов. Устойчивый факт, его можно кешировать.
 *   failed — сайт не ответил или попросил подождать. Лот, возможно, жив;
 *           объявлять его ушедшим — врать клиенту.
 *
 * `rateLimited` отдельно от прочих сбоев: вызывающий обход обязан на нём
 * остановиться, а не идти к следующей странице.
 */
export type Fetched =
  | { kind: "html"; html: string }
  | { kind: "gone" }
  | { kind: "failed"; status: number | null; rateLimited: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Очередь полосы: каждый следующий запрос стартует не раньше, чем через gap
 * после старта предыдущего. Промис-цепочка гарантирует, что запросы одной
 * полосы не идут параллельно, даже если их вызвали разом.
 */
function makeLane(gap: () => number) {
  let tail: Promise<unknown> = Promise.resolve();
  let nextAt = 0;
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(async () => {
      const wait = nextAt - Date.now();
      if (wait > 0) await sleep(wait);
      nextAt = Date.now() + gap();
      return task();
    });
    // Ошибка одного запроса не должна заклинить очередь для остальных.
    tail = run.catch(() => undefined);
    return run;
  };
}

const lanes: Record<Lane, ReturnType<typeof makeLane>> = {
  bulk: makeLane(() => BULK_GAP_MS + Math.floor(Math.random() * BULK_JITTER_MS)),
  interactive: makeLane(() => INTERACTIVE_GAP_MS),
};

/** Retry-After бывает числом секунд или HTTP-датой. Не разобрали — null. */
function retryAfterMs(res: Response): number | null {
  const h = res.headers.get("retry-after");
  if (!h) return null;
  const sec = Number(h);
  if (Number.isFinite(sec)) return sec * 1000;
  const at = Date.parse(h);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

/**
 * Одна страница carnect. Не бросает исключений никогда — все исходы в типе.
 *
 * @param path путь с ведущим слэшем: "/auctions/glovis?page=2"
 */
export async function getPage(path: string, lane: Lane, signal?: AbortSignal): Promise<Fetched> {
  const url = `${CARNECT_ORIGIN}${path}`;
  let lastStatus: number | null = null;
  let waitedForRetryAfter = false;
  // Посетитель на странице лота ждёт ответа: три попытки с паузами 3 + 6 с —
  // это десяток секунд белого экрана. Ему хватит двух, обходу нужны три.
  const tries = lane === "interactive" ? 2 : MAX_TRIES;

  for (let attempt = 1; attempt <= tries; attempt++) {
    if (signal?.aborted) break;
    let res: Response;
    try {
      res = await lanes[lane](() =>
        fetch(url, {
          headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
            : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: "no-store",
        }),
      );
    } catch {
      // Сеть или таймаут — пробуем ещё, с паузой.
      lastStatus = null;
      if (attempt < tries) await sleep(RETRY_BASE_MS * attempt);
      continue;
    }

    lastStatus = res.status;

    if (res.ok) {
      const html = await res.text().catch(() => null);
      if (html === null) continue;
      // ⚠️ Soft-404: carnect отдаёт 200 на несуществующий лот. Проверять
      // обязательно здесь, иначе «лот ушёл» уедет наверх как «страница есть,
      // но не разобралась» и превратится в failed.
      return isNotFound(html) ? { kind: "gone" } : { kind: "html", html };
    }

    if (res.status === 404 || res.status === 410) return { kind: "gone" };

    if (res.status === 429 || res.status === 503) {
      // Нас явно попросили притормозить. Подождать один раз — вежливо;
      // ждать по кругу — уже осада. Долгое ожидание не ждём вовсе.
      const ms = retryAfterMs(res);
      if (waitedForRetryAfter || ms === null || ms > MAX_RETRY_AFTER_MS) {
        console.error(`[carnect] ${res.status} на ${path}, Retry-After=${ms ?? "нет"} — останавливаемся`);
        return { kind: "failed", status: res.status, rateLimited: true };
      }
      waitedForRetryAfter = true;
      await sleep(ms);
      continue;
    }

    // Прочие 4xx — повтор не поможет (403 от Cloudflare в том числе).
    if (res.status < 500) break;

    // 5xx, включая 52x Cloudflare: origin подтормаживает, пробуем ещё.
    if (attempt < tries) await sleep(RETRY_BASE_MS * attempt);
  }

  console.error(`[carnect] страница не отдалась (${lastStatus ?? "сеть"}): ${path}`);
  // 403 считаем тем же сигналом, что 429: скорее всего, нас начал фильтровать
  // Cloudflare, и продолжать обход значит усугублять.
  return { kind: "failed", status: lastStatus, rateLimited: lastStatus === 403 };
}
