/**
 * Отслеживание посылок Korea Post EMS.
 *
 * Публичного API у Korea Post нет — берём форму их же страницы отслеживания:
 * POST на trace.epost.go.kr с тремя полями, в ответ HTML, из которого нужны
 * ровно две таблицы (`summary="Basic Information"` и `summary="Delivery Status…"`).
 *
 * ⚠️ Обе таблицы ПЛОСКИЕ — внутри ячеек только <br> и <p>, вложенных таблиц нет
 * (проверено на живом ответе 19.08.2026). Поэтому парсер здесь свой, на строках,
 * а не cheerio: одна зависимость в standalone-образе ради одной страницы не
 * окупается, а лок пересобирать на проекте с хрупкой Docker-сборкой рискованно.
 * Появятся вложенные таблицы — менять на настоящий парсер, а не чинить регулярки.
 *
 * ⚠️ Модуль НЕ бросает исключений НИКОГДА: страница отслеживания обязана
 * показать клиенту внятное состояние, а не 500. Три исхода разведены полем
 * `status` и схлопывать их нельзя — «номер не найден» и «Korea Post не отвечает»
 * означают для клиента разное (то же правило, что у fetchVehicleData).
 */

const ENDPOINT = "https://trace.epost.go.kr/xtts/servlet/kpl.tts.common.svl.SttSVL";
const TRACE_TIMEOUT_MS = 15000;

/** Стандарт UPU S10: две буквы, девять цифр, код страны отправления. */
export const EMS_NUMBER_RE = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

/**
 * Языки, на которых страница отслеживания идёт в индекс.
 *
 * ⚠️ Ворота ОДНИ на всё: этот же список гасит индексацию в `generateMetadata`
 * и убирает URL из `sitemap-main.xml`. Переводов у ka/ar нет — i18next покажет
 * там английский (fallbackLng), и это осознанно, но в индексе такая страница
 * стала бы дубликатом /en. Появятся переводы — добавлять язык В ОДНОМ месте.
 */
export const TRACKING_INDEXED_LANGS = ["ru", "en"];

export const isTrackingIndexed = (lang: string) => TRACKING_INDEXED_LANGS.includes(lang);

/**
 * Стадии — линейный путь посылки, каким его видит клиент. Порядок в массиве
 * задаёт порядок шагов в интерфейсе, `failed` и `unknown` вне линии.
 */
export const EMS_PIPELINE = [
  "accepted",
  "in_transit",
  "departed",
  "arrived",
  "customs",
  "delivered",
] as const;

export type EmsStage = (typeof EMS_PIPELINE)[number] | "failed" | "unknown";

export interface EmsEvent {
  /** "14:37" — может быть пустым, Korea Post не всегда отдаёт время. */
  time: string;
  /** "31-Jul-2026" как пришло от Korea Post. */
  date: string;
  /** Исходная английская строка статуса — фолбэк, если ключа в словаре нет. */
  status: string;
  /** Ключ словаря `tracking.status.*`, null — незнакомый статус. */
  statusKey: string | null;
  location: string;
  details: string;
  stage: EmsStage;
}

export interface EmsTrackingResult {
  number: string;
  /**
   * found — посылка есть, есть события.
   * not_found — Korea Post ответил, но такого номера у него нет.
   * invalid — номер не похож на S10, до Korea Post не ходили.
   * upstream_error — Korea Post не ответил или ответил не тем.
   */
  status: "found" | "not_found" | "invalid" | "upstream_error";
  currentStatus: string;
  currentStatusKey: string | null;
  stage: EmsStage;
  sender: { name: string; date: string };
  recipient: { name: string; date: string };
  mailType: string;
  /** Страна назначения из поля Details, если Korea Post её назвал. */
  destination: string | null;
  postingZip: string | null;
  events: EmsEvent[];
  fetchedAt: string;
}

/**
 * Правила разбора английских статусов Korea Post. Порядок значим —
 * идут от частного к общему, первое совпадение выигрывает.
 *
 * `key` ведёт в словарь `tracking.status.*`; незнакомый статус остаётся
 * английским текстом, и это лучше пустоты.
 */
const STATUS_RULES: { test: RegExp; key: string; stage: EmsStage }[] = [
  { test: /unsuccessful|attempted|absence/i, key: "attempted", stage: "arrived" },
  { test: /return|재발송|반송/i, key: "returned", stage: "failed" },
  { test: /delivery completed|배달완료|final delivery|^delivered/i, key: "delivered", stage: "delivered" },
  { test: /out for delivery|delivery started|배달준비/i, key: "delivering", stage: "delivered" },
  { test: /held|detained|보류/i, key: "customsHeld", stage: "customs" },
  { test: /customs|clearance|통관/i, key: "customs", stage: "customs" },
  { test: /handed over|transport company|airline|flight/i, key: "handedToCarrier", stage: "departed" },
  { test: /departure from outward/i, key: "departureOutward", stage: "departed" },
  { test: /arrival at outward/i, key: "arrivalOutward", stage: "departed" },
  { test: /arrival at inward|received at the destination|arrival at destination/i, key: "arrivedDestination", stage: "arrived" },
  { test: /departure from inward/i, key: "departureInward", stage: "in_transit" },
  { test: /arrival at office of exchange|arrival/i, key: "arrivalExchange", stage: "in_transit" },
  { test: /sorting|in transit|transit/i, key: "inTransit", stage: "in_transit" },
  { test: /posting|collection|acceptance|접수/i, key: "posting", stage: "accepted" },
  { test: /fail|error|cancel/i, key: "failed", stage: "failed" },
];

function classify(statusText: string): { key: string | null; stage: EmsStage } {
  for (const rule of STATUS_RULES) {
    if (rule.test.test(statusText)) return { key: rule.key, stage: rule.stage };
  }
  return { key: null, stage: "unknown" };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** Теги превращаются в пробел, а не исчезают: иначе соседние <p> слипаются. */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function extractTable(html: string, summaryMarker: string): string | null {
  const marker = html.indexOf(`summary="${summaryMarker}`);
  if (marker === -1) return null;
  const start = html.lastIndexOf("<table", marker);
  const end = html.indexOf("</table>", marker);
  if (start === -1 || end === -1) return null;
  return html.slice(start, end);
}

function extractRows(tableHtml: string): string[] {
  const bodyStart = tableHtml.indexOf("<tbody");
  const body = bodyStart === -1 ? tableHtml : tableHtml.slice(bodyStart);
  return body.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
}

function extractCells(rowHtml: string): string[] {
  return (rowHtml.match(/<td[\s\S]*?<\/td>/gi) ?? []).map((cell) =>
    cell.replace(/^<td[^>]*>/i, "").replace(/<\/td>$/i, "")
  );
}

/** Ячейка «Имя<br>Дата» — вернуть обе половины по отдельности. */
function splitOnBreak(cellHtml: string): [string, string] {
  const parts = cellHtml.split(/<br\s*\/?>/i);
  return [stripTags(parts[0] ?? ""), stripTags(parts.slice(1).join(" "))];
}

/** «DUNPO» и «INTERNATIONAL POST OFFICE» кричат капсом — приводим к обычному виду. */
function humanizePlace(raw: string): string {
  if (!raw || raw !== raw.toUpperCase()) return raw;
  return raw
    .toLowerCase()
    .replace(/(^|[\s(-])([a-z])/g, (_, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

function emptyResult(
  number: string,
  status: EmsTrackingResult["status"]
): EmsTrackingResult {
  return {
    number,
    status,
    currentStatus: "",
    currentStatusKey: null,
    stage: "unknown",
    sender: { name: "", date: "" },
    recipient: { name: "", date: "" },
    mailType: "",
    destination: null,
    postingZip: null,
    events: [],
    fetchedAt: new Date().toISOString(),
  };
}

export function normalizeEmsNumber(input: string): string {
  return (input || "").replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Запрос и разбор одной посылки. Не бросает — любые сбои приходят
 * значением `status`.
 */
export async function trackEms(rawNumber: string): Promise<EmsTrackingResult> {
  const number = normalizeEmsNumber(rawNumber);

  if (!EMS_NUMBER_RE.test(number)) {
    return emptyResult(number, "invalid");
  }

  let html: string;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Без правдоподобного UA и Referer сервлет отдаёт страницу-заглушку.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://ems.epost.go.kr/front.Tracking01Eng.postal",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: new URLSearchParams({
        target_command: "kpl.tts.tt.epost.cmd.RetrieveEmsTraceEngCmd",
        JspURI: "/xtts/tt/epost/ems/EmsSearchResultEng.jsp",
        POST_CODE: number,
      }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(TRACE_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[ems] Korea Post вернул HTTP ${response.status} на ${number}`);
      return emptyResult(number, "upstream_error");
    }

    html = await response.text();
  } catch (error) {
    console.error(`[ems] запрос к Korea Post не удался на ${number}:`, error);
    return emptyResult(number, "upstream_error");
  }

  try {
    return parseEmsHtml(number, html);
  } catch (error) {
    // Разбор не должен ронять страницу даже при неожиданной вёрстке.
    console.error(`[ems] разбор ответа Korea Post не удался на ${number}:`, error);
    return emptyResult(number, "upstream_error");
  }
}

/** Вынесено отдельно, чтобы разбор можно было прогнать на сохранённом HTML. */
export function parseEmsHtml(number: string, html: string): EmsTrackingResult {
  const basicTable = extractTable(html, "Basic Information");
  const statusTable = extractTable(html, "Delivery Status");

  let senderName = "";
  let senderDate = "";
  let recipientName = "";
  let recipientDate = "";
  let headerStatus = "";
  let mailType = "";

  if (basicTable) {
    const cells = extractCells(extractRows(basicTable)[0] ?? "");
    // Колонки: номер | отправитель/дата | получатель/дата | статус | тип отправления
    if (cells.length >= 4) {
      [senderName, senderDate] = splitOnBreak(cells[1]);
      [recipientName, recipientDate] = splitOnBreak(cells[2]);
      headerStatus = stripTags(cells[3]);
      mailType = cells.length >= 5 ? stripTags(cells[4]) : "";
    }
  }

  const events: EmsEvent[] = [];
  let destination: string | null = null;
  let postingZip: string | null = null;

  if (statusTable) {
    for (const row of extractRows(statusTable)) {
      const cells = extractCells(row);
      if (cells.length < 3) continue;

      const when = stripTags(cells[0]);
      const status = stripTags(cells[1]);
      const location = humanizePlace(stripTags(cells[2]));
      const details = cells.length >= 4 ? stripTags(cells[3]) : "";
      if (!when && !status) continue;

      // Ячейка даты приходит как «14:37 31-Jul-2026»; времени может не быть.
      const timeMatch = when.match(/^(\d{1,2}:\d{2})\s*/);
      const time = timeMatch ? timeMatch[1] : "";
      const date = timeMatch ? when.slice(timeMatch[0].length).trim() : when;

      const country = details.match(/Transit or Destination country\s*:\s*([A-Za-z][A-Za-z\s]*)/i);
      if (country) destination = humanizePlace(country[1].trim());

      const zip = details.match(/Posting office zip code\s*:\s*(\d+)/i);
      if (zip) postingZip = zip[1];

      const { key, stage } = classify(status);
      events.push({ time, date, status, statusKey: key, location, details, stage });
    }
  }

  if (events.length === 0) {
    // Пустая лента при живом ответе = такого номера у Korea Post нет.
    return emptyResult(number, "not_found");
  }

  const latest = events[events.length - 1];
  const currentStatus = headerStatus || latest.status;
  const current = classify(currentStatus);

  return {
    number,
    status: "found",
    currentStatus,
    currentStatusKey: current.key,
    stage: current.stage,
    sender: { name: senderName, date: senderDate },
    recipient: { name: recipientName, date: recipientDate },
    mailType,
    destination,
    postingZip,
    events,
    fetchedAt: new Date().toISOString(),
  };
}
