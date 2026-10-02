// Разбор RSC-потока страниц carnect.biz.
//
// Что такое RSC и почему мы читаем его, а не вёрстку. Сайт собран на Next.js
// (App Router). Сервер carnect сам ходит к аукционам, кладёт результат в
// пропсы компонентов и отдаёт браузеру дерево компонентов текстовым потоком
// («flight»), вшитым в HTML кусками:
//
//   <script>self.__next_f.push([1,"a:[\"$\",\"$L19\",null,{\"lot\":{…}}]\n"])</script>
//
// Склеенные куски — это строки вида `<id>:<JSON>`, и в пропсах лежит ГОТОВЫЙ
// JSON с полями их базы: {"lot":{"vin":…,"inspection":[…]}}. Поэтому мы не
// разбираем вёрстку регулярками, как у витрины dokanmazad, а достаём объект
// целиком по ключу и отдаём JSON.parse. Дизайн они могут менять сколько угодно;
// сломает нас только переименование полей, и это видно сразу (см. guard в
// list.ts / detail.ts).
//
// ⚠️ Отличие от src/lib/showcase/scrape.ts: там данные карточки разбросаны по
// отложенным кускам ("$L97") и текстовым узлам, отсюда chunkMap/resolveRefs.
// У carnect объекты данных приходят ЦЕЛИКОМ в одном пропе — ссылки "$L…" в
// них не встречаются (проверено на списках и лотах всех пяти площадок
// 02.10.2026). Появятся — extractValue вернёт строку "$L…" вместо объекта, и
// это отсечёт проверка формы у вызывающего, а не тихая подмена.

/**
 * Склеивает все куски потока в один текст.
 *
 * Каждый кусок — JS-строковый литерал внутри push([1,"…"]). Next пишет его
 * через JSON.stringify, поэтому JSON.parse('"…"') снимает экранирование
 * точно так же, как это сделал бы браузер.
 *
 * Регулярка строковая с учётом экранирования ((?:[^"\\]|\\.)*), а не ленивая
 * (.*?): внутри куска встречается `\"])` — экранированная кавычка перед
 * скобками, — и ленивый вариант обрезал бы кусок на ней.
 *
 * Первый элемент массива — тип куска. 1 — данные потока; 0 (bootstrap) и
 * 2/3 (form state, бинарные) нас не интересуют и пропускаются.
 */
export function decodeFlight(html: string): string {
  let out = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)) {
    try {
      out += JSON.parse(`"${m[1]}"`) as string;
    } catch {
      // Битый кусок не валит разбор всей страницы: нужный объект почти
      // наверняка в другом куске, а если именно в этом — его не найдёт
      // extractValue, и вызывающий увидит «не разобралось».
    }
  }
  return out;
}

/**
 * Страница отрисовала notFound() — Next ставит такую метку в поток.
 *
 * ⚠️ carnect отвечает на несуществующий лот и несуществующую площадку кодом
 * 200, а не 404 («soft 404», проверено 02.10.2026). По статусу «лот ушёл» не
 * отличить от живого — только по этой метке. Это служебный digest самого Next
 * (NEXT_HTTP_ERROR_FALLBACK;404), а не текст страницы: переводы и вёрстка его
 * не трогают.
 */
export function isNotFound(html: string): boolean {
  return html.includes("NEXT_HTTP_ERROR_FALLBACK;404");
}

/**
 * Значения потока со спецсмыслом. В RSC строка, начинающаяся с "$", — это
 * ссылка или маркер, а настоящий доллар экранируется удвоением ("$$").
 *   "$undefined" → undefined (поле есть, значения нет — встречается часто)
 *   "$$text"     → "$text"
 * Остальные маркеры ("$L…", "$D…", "$@…") оставляем как есть: в данных
 * carnect их нет, а если появятся, лучше увидеть сырую строку, чем гадать.
 */
function reviver(_key: string, value: unknown): unknown {
  if (typeof value !== "string" || value[0] !== "$") return value;
  if (value === "$undefined") return undefined;
  if (value.startsWith("$$")) return value.slice(1);
  return value;
}

/**
 * Позиция конца JSON-значения, начинающегося с `start` ({ или [).
 *
 * Счётчик скобок обязан пропускать строки: в названиях и примечаниях
 * встречаются «[ Hyundai ]» и «{…}» (titleKo у Autobell так и выглядит), и
 * наивный подсчёт закрыл бы объект посреди строки.
 */
function scanEnd(text: string, start: number): number {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;          // пропускаем экранированный символ целиком
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if ((c === "}" || c === "]") && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Все значения-объекты/массивы по ключу, в порядке появления в потоке.
 *
 * Возвращаем ВСЕ, а не первое: один и тот же ключ используют разные
 * компоненты страницы (у HeyDealer "items" — это и список машин, и пункты
 * опций внутри машины). Какое из значений нужное, решает вызывающий по
 * форме — см. pick().
 */
export function extractValues(flight: string, key: string): unknown[] {
  const out: unknown[] = [];
  const needle = `"${key}":`;
  let from = 0;
  for (;;) {
    const at = flight.indexOf(needle, from);
    if (at < 0) break;
    const start = at + needle.length;
    from = start;
    const open = flight[start];
    if (open !== "{" && open !== "[") continue;   // скаляр — не наш случай
    const end = scanEnd(flight, start);
    if (end < 0) break;
    try {
      out.push(JSON.parse(flight.slice(start, end), reviver));
    } catch {
      /* не JSON — пропускаем, ищем следующее вхождение */
    }
  }
  return out;
}

/** Первое значение по ключу, прошедшее проверку формы. */
export function pick<T>(flight: string, key: string, guard: (v: unknown) => v is T): T | null {
  for (const v of extractValues(flight, key)) if (guard(v)) return v;
  return null;
}

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
