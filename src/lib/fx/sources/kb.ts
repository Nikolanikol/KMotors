import { shared } from "@/lib/fx/shared";
import type { KbRates } from "@/lib/fx/types";

/**
 * Кукмин-банк (KB국민은행) — источник банковского вида для авто.
 *
 * Зачем отдельный источник, когда есть рыночный курс. Цена авто на витрине и
 * сумма в инвойсе должны сходиться. Инвойс выставляет наш банк: клиент шлёт
 * доллары (рубли), KB меняет их на воны по СВОЕЙ колонке — 송금 받으실 때,
 * телеграфный покупной курс. Рыночный курс этой колонки не знает и всегда
 * выгоднее её: замер 27.08.2026 дал +1.51% по доллару и +1.24% по рублю.
 *
 * ⚠️ Колонка ровно одна и менять её нельзя не подумав. В таблице KB шесть
 * чисел, и три из них выглядят подходящими:
 *   매매기준율      1381.60 — середина без банковской маржи, по ней не платят
 *   송금 보내실 때   1395.00 — банк ПРОДАЁТ валюту (мы отправляем перевод)
 *   송금 받으실 때   1368.20 — банк ПОКУПАЕТ валюту (мы получаем перевод) ← наша
 *   현찰 사실/파실   1405.77 / 1357.43 — наличные, к переводу отношения не имеют
 *
 * ⚠️ Это ЧУЖАЯ HTML-страница без публичного API: парсер обязан деградировать,
 * а не падать. Здесь он бросает, а ловит и логирует вид (`views/car.ts`).
 */
export const KB_URL = "https://obank.kbstar.com/quics?page=C101423";

/** Страница ~270 КБ, а котировка меняется десятки раз в день — час компромисс. */
export const KB_REVALIDATE_SECONDS = 3600;

const KB_HEADERS = {
  // Без внятного user-agent банковский фронт иногда отдаёт заглушку.
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
};

/**
 * Порядок числовых ячеек в строке валюты (проверено 27.08.2026 на USD, чья
 * последняя ячейка — USD-конверсия — равна ровно 1.0, что и подтверждает
 * сопоставление колонок).
 */
const CELL_TT_BUYING = 2; // 송금 받으실 때

/**
 * Границы правдоподобия: страница отдала 200, но верстальщик мог переставить
 * колонки. Число вне диапазона — это не курс, а разметка, и брать его нельзя.
 */
const SANE_RANGE: Record<string, { min: number; max: number }> = {
  USD: { min: 800, max: 3000 }, // вон за доллар
  RUB: { min: 5, max: 60 }, // вон за рубль
};

/** Воны за единицу валюты из строки таблицы. `null` — если строки/числа нет. */
function parseCurrencyRow(html: string, code: string): number | null {
  const row = new RegExp(`uf_goLink\\('${code}'\\)[\\s\\S]{0,2000}?</tr>`).exec(html);
  if (!row) return null;

  const cells = [...row[0].matchAll(/<td class="tRight">\s*([\d,.]+)\s*<\/td>/g)].map((m) =>
    Number(m[1].replace(/,/g, "")),
  );

  const value = cells[CELL_TT_BUYING];
  if (!Number.isFinite(value)) return null;

  const range = SANE_RANGE[code];
  if (range && (value < range.min || value > range.max)) return null;

  return value;
}

/** Разбор страницы KB. Бросает, если таблица не разобрана или числа неправдоподобны. */
export function parseKbHtml(html: string): KbRates {
  const krwPerUsd = parseCurrencyRow(html, "USD");
  const krwPerRub = parseCurrencyRow(html, "RUB");
  if (!krwPerUsd || !krwPerRub) throw new Error("KB: не разобрана таблица курсов");

  const stamp = /(\d{4}\.\d{2}\.\d{2})(?:&nbsp;|\s)+(\d{2}:\d{2}:\d{2})\s*\((\d+)회차\)/.exec(html);

  return {
    krwToUsd: 1 / krwPerUsd,
    krwToRub: 1 / krwPerRub,
    quotedAt: stamp ? `${stamp[1]} ${stamp[2]}` : "",
    round: stamp?.[3] ?? "",
  };
}

export function loadKb(): Promise<KbRates> {
  return shared("kb", async () => {
    const res = await fetch(KB_URL, {
      // Таймаут создаётся на каждый запрос, поэтому опции не вынесены в
      // константу целиком; ключ кеша Next от signal не зависит.
      signal: AbortSignal.timeout(8000),
      next: { revalidate: KB_REVALIDATE_SECONDS },
      headers: KB_HEADERS,
    });
    if (!res.ok) throw new Error(`KB ${res.status}`);
    return parseKbHtml(await res.text());
  });
}
