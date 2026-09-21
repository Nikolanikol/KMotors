// Сбор лотов корейских автоаукционов с витрины-агрегатора.
//
// ⚠️ ИСТОЧНИК — ЧУЖАЯ ВИТРИНА, а не сами аукционы. Публичный списочный API из
// трёх площадок есть только у K Car; у Lotte и SK всё про машины лежит за
// логином (проверено: auction.skcarrental.com отдаёт оболочку с 로그인).
// dokanmazad.com — платформа, которая публикует лоты всех трёх сразу, и с неё
// мы берём КАТАЛОГ.
//
// ⚠️ Не путать с motors.wasigroupsa.com: это витрина ОДНОГО клиента той же
// платформы, и показывала она только Lotte. Замер 21.09.2026 по всему
// разделу: 2 315 лотов — Lotte 1 451, SK 516, K Car 348.
//
// Почему каталог отсюда, а не из прямого API K Car: тот отдаёт ОДНУ миниатюру
// на лот, здесь у тех же машин по 30 фотографий и диаграмма состояния кузова.
// Для витрины, которая должна завлекать, это решает. Прямой API K Car остаётся
// ради того, чего у посредника нет вовсе, — истории прошедших торгов, на
// которой стоит прогноз цены молотка.
//
// Из «источник чужой» следует всё остальное:
//   • он может исчезнуть без предупреждения — этот уже убирал K Car с витрины
//     клиента, поэтому модуль обязан деградировать, а не падать;
//   • разметка — отрисованное дерево RSC, а не JSON: карточки разбираются по
//     форме пропсов, и это хрупко по своей природе. Сменят вёрстку — парсер
//     вернёт пусто, и это должно быть ВИДНО в счётчиках, а не тихо;
//   • origin у них подтормаживает (ловили Cloudflare 525), поэтому страницы
//     берутся с повторами: без них прогон молча терял бы по паре страниц.
//
// Два уровня:
//   fetchList   — 78 страниц по 30 карточек, ~3 минуты. Даёт каталожную сетку.
//   fetchDetail — страница лота: 30–38 фото, диаграмма кузова, спецификация.
//                 Дёргается ПО ТРЕБОВАНИЮ при открытии лота, а не массовым
//                 обходом: 2 315 страниц с паузой — это полтора часа, и почти
//                 весь он пришёлся бы на лоты, которые никто не откроет.

const ORIGIN = process.env.AUCTION_SHOWCASE_ORIGIN ?? "https://www.dokanmazad.com";
// ⚠️ currency=KRW обязателен. Без него витрина отдаёт цены в ДОЛЛАРАХ, которые
// сама же и пересчитала (замер: ₩16 544 500 против $11 929). Вона у аукциона
// исходная, а доллар — производная от чужого курса, который мы не
// контролируем. Правило проекта прямое: чужая валюта хранится как есть,
// конвертации живут в одном месте.
const LIST_PATH = "/en/cars?sellType=auction&currency=KRW";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Площадка определяется по ХОСТУ ФОТОГРАФИИ, а не по полю в разметке.
 *
 * ⚠️ Поле `provider` есть только на странице лота, в списке его нет вовсе — а
 * знать площадку надо уже при обходе каталога. Хост картинки выдаёт её
 * однозначно: каждый аукцион раздаёт снимки со своего сервера.
 */
const PROVIDER_BY_IMAGE_HOST: [string, AuctionSource][] = [
  ["aucmark.skcarrental.com", "sk"],
  ["imgmk.lotteautoauction.net", "lotte"],
  ["kcarauction.com", "kcar"],
];

export type AuctionSource = "kcar" | "lotte" | "sk";

/** Площадки, чьи страницы лотов мы умеем разбирать. */
const KNOWN_PROVIDERS = new Set<string>(PROVIDER_BY_IMAGE_HOST.map(([, source]) => source));

function providerFromUrl(url: string | null | undefined): AuctionSource | null {
  const u = url ?? "";
  for (const [host, source] of PROVIDER_BY_IMAGE_HOST) if (u.includes(host)) return source;
  return null;
}

const PAGE_DELAY_MS = 600;
/** Пауза перед повтором, растёт с попыткой. */
const RETRY_DELAY_MS = 1200;
const MAX_PAGES = 80;

export interface ShowcaseCard {
  /** Площадка лота. null — снимок с незнакомого хоста, такие мы не берём. */
  source: AuctionSource | null;
  externalId: string;
  maker: string | null;
  model: string | null;
  /** «THE NEW (D) 2.2 Noblesse 9Seater» — витрина отдаёт её отдельно от модели. */
  trim: string | null;
  year: number | null;
  mileageKm: number | null;
  fuel: string | null;
  transmission: string | null;
  /** Цена старта торгов в ВОНАХ — витрина подписывает её «Starting Price». */
  startPriceKrw: number | null;
  /** Дата окончания торгов, YYYY-MM-DD. Из неё витрина считает обратный отсчёт. */
  auctionDate: string | null;
  thumbUrl: string | null;
  sourceUrl: string;
}

export interface ShowcaseDetail {
  /** «Kia Niro PLUS (E) 2023» — как площадка называет лот целиком. */
  name: string | null;
  /** Строка-сводка: «2023 | Automatic | 125,050 km | Electric». */
  summary: string | null;
  photos: string[];
  /** Диаграмма состояния кузова — готовая картинка, по одной на лот. */
  statusImageUrl: string | null;
  /** Номер объявления у площадки (sku). Он же в имени файла диаграммы. */
  adNumber: string | null;
  vin: string | null;
  year: number | null;
  trim: string | null;
  fuel: string | null;
  transmission: string | null;
  engineCc: number | null;
  seats: number | null;
  bodyType: string | null;
  color: string | null;
  drivetrain: string | null;
  priceKrw: number | null;
  /** Дата окончания торгов — из неё витрина считает обратный отсчёт. */
  auctionEnd: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Страница витрины с ПОВТОРАМИ.
 *
 * ⚠️ Повторы обязательны, а не «на всякий случай»: origin у платформы
 * подтормаживает и отдаёт Cloudflare 525. Замер 21.09.2026: без повторов из
 * шести страниц не отдались две, с тремя попытками — 78 из 78. Без этого
 * каждый прогон молча терял бы по паре страниц каталога, и заметить это было
 * бы нечем: счётчик «страниц обойдено» выглядел бы нормальным.
 */
async function getHtml(url: string, signal?: AbortSignal, tries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        signal,
        cache: "no-store",
      });
      if (res.ok) return await res.text();
    } catch {
      /* сеть моргнула — пробуем ещё */
    }
    if (attempt < tries) await sleep(RETRY_DELAY_MS * attempt);
  }
  console.error(`[showcase] страница не отдалась после ${tries} попыток: ${url}`);
  return null;
}

/**
 * В разметке RSC кавычки экранированы, а знак доллара удвоен ($$9,857 — это
 * «$9,857»). Снимаем экранирование один раз на документ.
 */
const unescape = (html: string) => html.split('\\"').join('"');

const num = (s: string | undefined) => {
  if (!s) return null;
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Словари значений, которые витрина рисует текстом. Нужны, чтобы отличить
 * топливо от коробки в общем потоке текстовых узлов: разметка их никак не
 * помечает, а порядок между карточками не гарантирован.
 */
const FUELS = new Set(["Diesel", "Gasoline", "Electric", "Hybrid", "LPG", "CNG", "Petrol"]);
const GEARBOXES = new Set(["Auto", "Manual", "CVT", "DCT", "Automatic"]);

/**
 * Карта отложенных кусков RSC.
 *
 * ⚠️ Половина данных карточки — топливо, коробка, год — лежит НЕ в ней самой,
 * а в отдельных кусках потока, на которые карточка ссылается как "$L97".
 * Прежний парсер их не разрешал и поэтому видел только цену, пробег и фото.
 * Куски объявляются как «<id>:[…]» и идут по всему документу, в том числе
 * ПОСЛЕ карточки, — поэтому карта строится один раз на весь ответ.
 */
function chunkMap(u: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of u.matchAll(/(?:^|\\n)([0-9a-f]{1,4}):(\[[\s\S]*?)(?=\\n[0-9a-f]{1,4}:|"\]\)<\/script>)/g)) {
    map.set(m[1], m[2]);
  }
  return map;
}

/** Подставляет содержимое кусков вместо ссылок. Куски ссылаются друг на друга. */
function resolveRefs(chunk: string, map: Map<string, string>): string {
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const m of [...chunk.matchAll(/"\$L([0-9a-f]{1,4})"/g)]) {
      const rep = map.get(m[1]);
      if (rep) {
        chunk = chunk.split(m[0]).join(rep);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return chunk;
}

/**
 * Разбирает страницу списка. Карточка в дереве RSC начинается с маркера
 * ["$","$1","<id>",{ — по нему и режем: каждый кусок до следующего маркера
 * принадлежит одной машине.
 */
export function parseList(html: string): ShowcaseCard[] {
  const u = unescape(html);
  const map = chunkMap(u);
  const marks = [...u.matchAll(/"\$1","(\d{6,12})",\{/g)].map((m) => ({ id: m[1], at: m.index ?? 0 }));
  const cards: ShowcaseCard[] = [];

  for (let i = 0; i < marks.length; i++) {
    const raw = u.slice(marks[i].at, marks[i + 1]?.at ?? marks[i].at + 6000);
    const chunk = resolveRefs(raw, map);

    // ⚠️ Модель и комплектация приходят РАЗОБРАННЫМИ, в пропе parts:
    // {"parts":["Carnival","THE NEW (D) 2.2 Noblesse 9Seater"]}. Резать alt по
    // пробелу («Kia Carnival») не нужно и вредно — там только короткое имя.
    const parts = /"parts":\[([^\]]*)\]/.exec(chunk)?.[1];
    // ⚠️ В parts приходит настоящий JSON-null, когда комплектации нет:
    // ["L",null]. Резать строку по запятой дешевле, чем парсить, но тогда
    // null превращается в СТРОКУ «null» и доезжает до экрана как подпись
    // карточки — так и случилось у лота Smart L.
    const [model, trim] = parts
      ? parts
          .split(",")
          .map((x) =>
            x
              .trim()
              .replace(/^"|"$/g, "")
              // ⚠️ Убираем ВСЕ обратные слэши. В названии встречается дюйм
              // диска — «20"/SDS/», — и в потоке он экранирован дважды: один
              // проход снятия экранирования оставлял «20\"/SDS/» на карточке.
              // В комплектациях слэша не бывает, так что стричь можно смело.
              .replace(/\\/g, "")
              .trim(),
          )
          .filter((x) => x && x !== "null" && x !== "undefined")
      : [null, null];

    // Текстовые и числовые узлы карточки — из них добираем то, что разметка
    // ничем не помечает.
    const nodes = [...chunk.matchAll(/"children":("[^"]{1,60}"|\d{1,9})/g)].map((m) =>
      m[1].replace(/^"|"$/g, ""),
    );
    const maker = nodes.find((n) => /^[A-Z][A-Za-z-]{1,18}$/.test(n) && !FUELS.has(n) && !GEARBOXES.has(n)) ?? null;

    // Первый снимок карточки: он же определяет площадку. Хост НЕ зашит —
    // платформа мешает лоты трёх аукционов в одном списке, и у каждого свой
    // сервер картинок.
    const thumb = /"src":"(https:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/i.exec(chunk)?.[1] ?? null;

    cards.push({
      externalId: marks[i].id,
      maker: maker === "View" ? null : maker,
      model: model ?? /"alt":"([^"]{2,60})"/.exec(chunk)?.[1] ?? null,
      trim: trim ?? null,
      year: num(nodes.find((n) => /^(19|20)\d{2}$/.test(n))),
      mileageKm: num(/([\d,]+) km/.exec(chunk)?.[1]),
      fuel: nodes.find((n) => FUELS.has(n)) ?? null,
      transmission: nodes.find((n) => GEARBOXES.has(n)) ?? null,
      startPriceKrw: num(/₩([\d,]+)/.exec(chunk)?.[1]),
      // ⚠️ Дата торгов приходит пропом таймера («date»), а не текстом: на
      // карточке витрина показывает не дату, а обратный отсчёт «35h 28m left».
      // Заглушку 2099 отбрасываем — ею помечены лоты без назначенных торгов.
      auctionDate: (() => {
        const d = /"date":"(\d{4}-\d{2}-\d{2})/.exec(chunk)?.[1] ?? null;
        return d && !d.startsWith("2099") ? d : null;
      })(),
      thumbUrl: thumb,
      source: providerFromUrl(thumb),
      sourceUrl: `${ORIGIN}/en/car/${marks[i].id}`,
    });
  }
  return cards;
}

/** Сбалансированный разбор массива по ключу — регуляркой вложенность не взять. */
function grabArray(text: string, key: string): unknown[] | null {
  const at = text.indexOf(`"${key}":[`);
  if (at < 0) return null;
  const start = text.indexOf("[", at);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]" && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1)) as unknown[];
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Разбирает страницу лота.
 *
 * ⚠️ Опора — JSON-LD, а не вёрстка. Площадка отдаёт schema.org-описание
 * машины (@type: ["Product","Car"]) со всеми полями спецификации: это
 * контракт для поисковиков, его меняют куда реже, чем разметку. Регулярки по
 * RSC-дереву оставлены ровно там, где структурного источника нет.
 *
 * ⚠️ Год берём из vehicleModelDate, а НЕ из ключа "year". Тот встречается на
 * странице многократно — его используют варианты фильтра и блок похожих
 * машин, — и первое вхождение к открытому лоту отношения не имеет: у Kia Niro
 * 2023 оно давало 2015.
 */
export function parseDetail(html: string): ShowcaseDetail | null {
  const u = unescape(html);
  // ⚠️ Принимаем ЛЮБУЮ известную площадку, а не одну. Раньше здесь стояла
  // жёсткая проверка на lotte — с ней страница лота SK разбиралась в null, и
  // карточка молча деградировала до одной миниатюры без диаграммы кузова.
  const provider = /"provider":"(\w+)"/.exec(u)?.[1] ?? "";
  if (!KNOWN_PROVIDERS.has(provider)) return null;

  const car = findCarJsonLd(html);

  const images = (grabArray(u, "images") ?? []) as { url?: string }[];
  // ⚠️ Галерея берётся из RSC, а не из JSON-LD: там площадка кладёт только
  // первые пять снимков, а на странице их 37.
  const photos = images.map((x) => x.url).filter((x): x is string => !!x);

  // ⚠️ Диаграмма кузова лежит в accidentImages, а НЕ в reports: reports пуст у
  // всех проверенных лотов Lotte, потому что витрина отдаёт не панельные
  // данные, а заранее отрисованную картинку на своём CDN.
  const accident = (grabArray(u, "accidentImages") ?? []) as { url?: string }[];

  // VIN подписан «Vehicle Number» и живёт только в отрисованном тексте.
  // Ищем по форме, а не по подписи: подпись переводится, форма — нет.
  let vin: string | null = null;
  for (const m of u.matchAll(/"children":"([A-HJ-NPR-Z0-9]{17})"/g)) {
    if (/\d/.test(m[1]) && /[A-Z]/.test(m[1])) { vin = m[1]; break; }
  }

  const offers = (car?.offers ?? {}) as Record<string, unknown>;
  const engine = (car?.vehicleEngine ?? {}) as Record<string, unknown>;
  const name = typeof car?.name === "string" ? car.name : null;

  // Комплектация — то, что в названии между моделью и годом.
  const model = typeof car?.model === "string" ? car.model : null;
  let trim: string | null = null;
  if (name && model && name.includes(model)) {
    trim = name.slice(name.indexOf(model) + model.length).replace(/\s*(19|20)\d\d\s*$/, "").trim() || null;
  }

  const rawDate = typeof offers.priceValidUntil === "string" ? offers.priceValidUntil : null;
  // У части лотов витрина ставит заглушку 2099 — в витрину её пускать нельзя.
  const auctionEnd = rawDate && !rawDate.startsWith("2099") ? rawDate : null;

  return {
    name,
    summary: typeof car?.description === "string" ? car.description : null,
    photos,
    statusImageUrl: accident[0]?.url ?? null,
    adNumber: typeof car?.sku === "string" ? car.sku : null,
    vin,
    year: num(typeof car?.vehicleModelDate === "string" ? car.vehicleModelDate : undefined),
    trim,
    fuel: str(car?.fuelType),
    transmission: str(car?.vehicleTransmission),
    engineCc: num(str(engine.name) ?? undefined),
    seats: typeof car?.seatingCapacity === "number" ? car.seatingCapacity : null,
    bodyType: str(car?.bodyType),
    color: str(car?.color),
    drivetrain: labelled(u, "Drivetrain"),
    priceKrw: typeof offers.price === "number" ? offers.price : null,
    auctionEnd,
  };
}


/** Значение поля по его подписи в отрисованном дереве: подпись → следующий текст. */
function labelled(u: string, label: string): string | null {
  const at = u.indexOf(`"children":"${label}"`);
  if (at < 0) return null;
  const v = /"children":"([^"]{1,40})"/.exec(u.slice(at + label.length + 14))?.[1]?.trim() ?? null;
  return !v || v === "Not Available" ? null : v;
}

/**
 * Площадка отдаёт значения в нижнем регистре («suv», «hybrid», «lpg»).
 * Короткие — это аббревиатуры, их поднимаем целиком: «Suv» вместо «SUV»
 * читается как опечатка.
 */
function str(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  return s.length <= 3 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Описание машины из schema.org. Блоков JSON-LD на странице два — организация
 * и товар, — и нужный лежит внутри @graph, поэтому ищем по @type, а не берём
 * первый попавшийся.
 */
function findCarJsonLd(html: string): Record<string, unknown> | null {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const graph = (parsed as { "@graph"?: unknown[] })?.["@graph"];
    for (const node of Array.isArray(graph) ? graph : [parsed]) {
      const type = (node as { "@type"?: unknown })?.["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (types.includes("Car")) return node as Record<string, unknown>;
    }
  }
  return null;
}

/** Обходит список постранично. Не бросает: вернём, что успели, плюс причину. */
export async function fetchList(
  signal?: AbortSignal,
): Promise<{ cards: ShowcaseCard[]; pages: number; error?: string }> {
  const out: ShowcaseCard[] = [];
  const seen = new Set<string>();
  let pages = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await getHtml(`${ORIGIN}${LIST_PATH}&page=${page}`, signal);
    if (!html) {
      const error = `страница ${page} не отдалась`;
      console.error(`[lotte] ${error}`);
      return { cards: out, pages, error };
    }
    const cards = parseList(html);
    pages++;
    if (!cards.length) break;                       // список кончился

    let fresh = 0;
    for (const c of cards) {
      if (seen.has(c.externalId)) continue;
      seen.add(c.externalId);
      out.push(c);
      fresh++;
    }
    // ⚠️ Витрина на странице за последней отдаёт ПОВТОР последней, а не пусто.
    // Без этой проверки обход шёл бы до MAX_PAGES, накручивая дубли.
    if (!fresh) break;

    await sleep(PAGE_DELAY_MS);
  }

  return { cards: out, pages };
}

/** Детали одного лота. По требованию, не массовым обходом. */
export async function fetchDetail(externalId: string, signal?: AbortSignal): Promise<ShowcaseDetail | null> {
  const html = await getHtml(`${ORIGIN}/en/car/${externalId}?currency=KRW`, signal);
  return html ? parseDetail(html) : null;
}
