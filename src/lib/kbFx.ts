// Курс Кукмин-банка (KB국민은행) для цен на АВТО.
//
// Зачем отдельный источник, когда есть getCurrencyRates. Цена авто на витрине
// и сумма в инвойсе должны сходиться. Инвойс выставляет наш банк: клиент шлёт
// доллары (рубли), KB меняет их на воны по СВОЕЙ колонке — 송금 받으실 때,
// телеграфный покупной курс. Рыночный курс (frankfurter / ЦБ РФ) этой колонки
// не знает и всегда выгоднее её: замер 27.08.2026 дал +1.51% по доллару и
// +1.24% по рублю. На машине в 20 млн вон это 218 $ разницы — ровно та сумма,
// которая иначе всплывала бы при выставлении инвойса.
//
// ⚠️ Колонка ровно одна и менять её нельзя не подумав. В таблице KB шесть
// чисел, и три из них выглядят подходящими:
//   매매기준율      1381.60 — середина без банковской маржи, по ней не платят
//   송금 보내실 때   1395.00 — банк ПРОДАЁТ валюту (мы отправляем перевод)
//   송금 받으실 때   1368.20 — банк ПОКУПАЕТ валюту (мы получаем перевод) ← наша
//   현찰 사실/파실   1405.77 / 1357.43 — наличные, к переводу отношения не имеют
// Взять базовый курс — значит показать цену, по которой сделка не пройдёт.
//
// ⚠️ Это ЧУЖАЯ HTML-страница без публичного API, поэтому модуль обязан
// деградировать, а не падать: правило то же, что у Encar. Не ответила / сменила
// разметку / отдала бессмыслицу — уходим на рыночный курс, и это ЛОГИРУЕТСЯ.
// Молчаливый фолбэк здесь означает цены на 1.5% ниже наших же счетов.
//
// Курс сервером и только сервером (см. CLAUDE.md, «Цены и курсы»): клиентские
// компоненты получают готовое число пропсом сверху.

import { getCurrencyRates } from "@/utils/getCurrencyRates";

const KB_URL = "https://obank.kbstar.com/quics?page=C101423";

/** Страница ~270 КБ, а котировка меняется десятки раз в день — час компромисс. */
const KB_REVALIDATE_SECONDS = 3600;

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

export interface KbRates {
  /** Множитель: воны × krwToUsd = доллары. */
  krwToUsd: number;
  /** Множитель: воны × krwToRub = рубли. */
  krwToRub: number;
  /** Отметка котировки KB, «2026.08.27 19:29:01» — для логов и отладки. */
  quotedAt: string;
  /** Номер котировки за день (회차). KB публикует их сотнями. */
  round: string;
}

/** Курс с пометкой, откуда он взялся: расхождение цен иначе не диагностируется. */
export interface CarRates {
  krwToUsd: number;
  krwToRub: number;
  source: "kb" | "market";
  /** Отметка котировки KB либо дата рыночного источника. */
  updatedAt: string;
}

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

/**
 * Читает таблицу KB. Возвращает `null` при любой неудаче — вызывающий решает,
 * чем заместить. Исключений не бросает никогда.
 */
export async function getKbRates(): Promise<KbRates | null> {
  try {
    const res = await fetch(KB_URL, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: KB_REVALIDATE_SECONDS },
      headers: {
        // Без внятного user-agent банковский фронт иногда отдаёт заглушку.
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`KB ${res.status}`);

    const html = await res.text();

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
  } catch (err) {
    // Тихо падать нельзя: расхождение витрины и инвойса иначе невидимо.
    console.error("[kbFx] курс KB недоступен, уходим на рыночный:", err);
    return null;
  }
}

/**
 * Курс для цен на авто: KB, а при его недоступности — рыночный.
 *
 * Рыночный курс ВЫГОДНЕЕ банковского, поэтому фолбэк занижает цену, а не
 * завышает — это осознанный выбор: лучше недосчитать 1.5% на витрине, чем
 * показать цену выше той, по которой реально считает наш банк.
 */
export async function getCarRates(): Promise<CarRates> {
  const kb = await getKbRates();
  if (kb) {
    return {
      krwToUsd: kb.krwToUsd,
      krwToRub: kb.krwToRub,
      source: "kb",
      updatedAt: kb.quotedAt,
    };
  }

  const market = await getCurrencyRates();
  return {
    krwToUsd: market.krwToUsd,
    krwToRub: market.krwToRub,
    source: "market",
    updatedAt: market.updatedAt,
  };
}
