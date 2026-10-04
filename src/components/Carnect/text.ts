// Подписи интерфейса каталога и страницы машины carnect — парами [ru, en].
//
// Не i18next, и это осознанно: те же компоненты живут под /admin, где
// инстанса i18next нет вовсе, и на витрине, где страница серверная. Язык
// приходит пропом (lang.ts). Витрина сейчас целиком на английском, на всех
// локалях сайта (решение владельца 04.10.2026), служебный каталог — на русском.
//
// Данные машины (узлы, дефекты, панели кузова) переводит модель — card.ts и
// defects.ts, здесь только интерфейс.

import { numLocale, pick, type CardLang, type Pair } from "@/lib/carnect/lang";

export const T = {
  // ─── Страница машины ───
  backToCatalog: ["← каталог", "← catalog"],
  photos: ["Фото", "Photos"],
  noPhotos: ["Фото нет.", "No photos."],
  photoWord: ["фото", "photo"],
  galleryOpen: ["Открыть галерею", "Open gallery"],
  galleryPrev: ["Предыдущее фото", "Previous photo"],
  galleryNext: ["Следующее фото", "Next photo"],
  galleryClose: ["Закрыть", "Close"],

  priceStart: ["Старт торгов", "Starting bid"],
  priceFixed: ["Цена выкупа", "Buy-now price"],
  price: ["Цена", "Price"],
  byBidding: ["ставками", "by bidding"],
  atAuction: ["на торгах", "at auction"],
  startNote: [
    "Стартовая — итог торгов обычно выше; сверху сбор аукциона, доставка, растаможка.",
    "Starting bid — the final price is usually higher; auction fee, shipping and customs are extra.",
  ],
  noPriceHey: [
    "Цены нет: дилеры делают ставки до окончания торгов.",
    "No list price: dealers bid until the auction closes.",
  ],
  newPrice: ["Новая стоила", "Price when new"],
  auctionOn: ["торги", "auction"],
  at: ["в", "at"],
  until: ["до", "until"],
  auctionUntil: ["торги до", "auction closes"],
  auctionOver: ["торги прошли", "auction over"],
  h: ["ч", "h"],
  m: ["м", "m"],
  s: ["с", "s"],
  korea: ["Корея", "Korea time"],
  grade: ["Оценка площадки", "Auction grade"],
  lot: ["лот", "lot"],

  model: ["Модель", "Model"],
  year: ["Год", "Year"],
  mileage: ["Пробег", "Mileage"],
  fuel: ["Топливо", "Fuel"],
  gearbox: ["Коробка", "Transmission"],
  engine: ["Объём", "Engine"],
  cc: ["см³", "cc"],
  km: ["км", "km"],

  specs: ["Характеристики", "Specifications"],
  make: ["Марка", "Make"],
  trim: ["Комплектация", "Trim"],
  body: ["Кузов", "Body"],
  color: ["Цвет", "Color"],
  interior: ["Салон", "Interior"],
  seats: ["Мест", "Seats"],
  usage: ["Использование", "Usage"],
  manufactured: ["Дата производства", "Manufactured"],
  firstReg: ["Первая регистрация", "First registration"],
  engineCode: ["Код двигателя", "Engine code"],

  docs: ["Документы и торги", "Documents and auction"],
  plate: ["Госномер", "Plate"],
  lotNo: ["Номер лота", "Lot number"],
  inspectionAct: ["Акт осмотра", "Inspection report"],
  keys: ["Ключи", "Keys"],
  venue: ["Аукционный дом", "Auction venue"],
  source: ["Площадка", "Platform"],
  vinCut: ["Последние символы VIN площадка скрывает.", "The platform hides the last VIN characters."],

  bodyTitle: ["Кузов", "Body"],
  bodyClean: ["Повреждений и следов ремонта кузова не отмечено.", "No body damage or repairs recorded."],
  bodySelf: [
    "Осмотра нет: тип Self — фото и описание делает сам продавец.",
    "No inspection: Self listings are photographed and described by the seller.",
  ],
  bodySheet: [
    "Площадка отдаёт схему кузова только картинкой — это лист осмотра ниже.",
    "The platform provides the body diagram only as an image — see the inspection sheet below.",
  ],
  bodyNone: ["Площадка не отдаёт сведений о кузове.", "The platform provides no body information."],

  sheet: ["Лист осмотра площадки", "Auction inspection sheet"],
  sheetNote: [
    "Оригинал листа осмотра аукциона. Нажмите, чтобы открыть в полном размере.",
    "Original auction inspection sheet. Tap to open full size.",
  ],
  defects: ["Замечания площадки", "Auction inspection notes"],
  defectsNote: ["Список составлен площадкой при осмотре перед торгами.", "Recorded by the auction during the pre-sale inspection."],
  sellerSays: ["Со слов продавца", "Seller's description"],
  sellerNote: [
    "Осмотра нет: тип Self, состояние описывает сам продавец.",
    "No inspection: Self listing, condition described by the seller.",
  ],
  checks: ["Состояние узлов", "Component condition"],

  history: ["Страховая история", "Insurance history"],
  owners: ["Смен владельцев", "Owner changes"],
  plateChanges: ["Смен номеров", "Plate changes"],
  myClaims: ["ДТП по своей страховке", "Claims on own insurance"],
  otherClaims: ["ДТП по чужой страховке", "Claims on other party's insurance"],
  damage: ["Ущерб по страховке", "Insurance damage"],
  totalLoss: ["Тотал", "Total loss"],
  flood: ["Утопленник", "Flood damage"],
  theft: ["Угон", "Theft"],
  uninsured: ["Периоды без страховки", "Uninsured periods"],
  uninsuredNote: ["ДТП за это время в истории нет", "accidents in these periods are not on record"],
  yes: ["да", "yes"],
  no: ["нет", "no"],
  legal: ["Юридическая чистота", "Legal status"],
  seizures: ["Аресты", "Seizures"],
  mortgages: ["Залоги", "Liens"],
  present: ["есть", "yes"],

  options: ["Опции", "Options"],
  engineSound: ["Звук двигателя", "Engine sound"],
  engineSoundNote: ["Запись работающего двигателя. Включите звук.", "Recording of the running engine. Turn the sound on."],

  // ─── Каталог ───
  catalogTitle: ["Каталог аукционов", "Korean car auctions"],
  catalogSubtitle: [
    "Лоты ближайших торгов K Car, Lotte, SK, Autobell, Autohub и машины HeyDealer. Ставку делаем мы — вы выбираете машину.",
    "Lots from the upcoming K Car, Lotte, SK, Autobell and Autohub sales, plus HeyDealer cars. We place the bid — you pick the car.",
  ],
  catalogPriceNote: [
    "Цена на карточках — СТАРТОВАЯ, а не итоговая: на торгах она растёт, а сверху идут сбор аукциона, доставка и растаможка. У Lotte и HeyDealer Self/Zero цены нет — её определяют ставки.",
    "Prices shown are STARTING bids, not final prices: bidding pushes them up, and the auction fee, shipping and customs come on top. Lotte and HeyDealer Self/Zero publish no price — it is set by bidding.",
  ],
  any: ["любая", "any"],
  makeFirst: ["сначала марка", "pick a make first"],
  yearFrom: ["год от", "year from"],
  yearTo: ["год до", "year to"],
  kmMax: ["пробег до, км", "max mileage, km"],
  priceMax: ["цена до, млн ₩", "max price, ₩ mln"],
  sort: ["сортировка", "sort"],
  sortNew: ["новые", "newest listings"],
  sortPrice: ["дешевле", "lowest price"],
  sortYear: ["моложе", "newest year"],
  sortKm: ["меньше пробег", "lowest mileage"],
  hideNoPrice: ["скрыть лоты без цены", "hide lots without a price"],
  hideNoPriceHint: ["Lotte и HeyDealer Self/Zero не публикуют цену", "Lotte and HeyDealer Self/Zero do not publish a price"],
  show: ["Показать", "Show"],
  reset: ["сбросить", "reset"],
  found: ["Найдено", "Found"],
  pageOf: ["страница {p} из {n}", "page {p} of {n}"],
  goToPage: ["на страницу", "go to page"],
  go: ["ок", "go"],
  fixed: ["фикс", "fixed"],
  start: ["старт", "start"],
  priceAtAuction: ["цена на торгах", "price at auction"],
  catalogDown: ["Каталог временно недоступен", "The catalog is temporarily unavailable"],
  catalogDownText: ["Попробуйте обновить страницу через минуту.", "Please refresh the page in a minute."],
  nothing: ["Ничего не нашлось", "Nothing found"],
  nothingText: [
    "Под фильтр ничего не подошло. Ослабьте условия или снимите выбор источников.",
    "No cars match the filter. Loosen the conditions or clear the selected platforms.",
  ],

  // ─── Состояния ───
  loading: ["Загружаем машину…", "Loading the car…"],
  goneTitle: ["Машина ушла с торгов", "This car has left the auction"],
  goneText: [
    "Источник отдал «не найдено»: продана или снята — что именно, он не говорит.",
    "The listing is gone — sold or withdrawn; the auction does not say which.",
  ],
  unavailableTitle: ["Подробности временно недоступны", "Details are temporarily unavailable"],
  unavailableText: [
    "Это не значит, что машина ушла; обновите страницу позже.",
    "This does not mean the car is gone — please refresh in a few minutes.",
  ],
} satisfies Record<string, Pair>;

export type TextKey = keyof typeof T;

/** Подпись интерфейса на нужном языке. */
export const tx = (lang: CardLang, key: TextKey) => pick(lang, T[key]);

/** Число с разделителями разрядов по языку карточки. */
export const fmt = (lang: CardLang, v: number) => v.toLocaleString(numLocale(lang));

/** Воны: 0 и отсутствие — это «нет цены», а не ₩0 (у Lotte startKrw всегда 0). */
export const won = (lang: CardLang, v: number | null | undefined) => (v ? `₩${fmt(lang, v)}` : null);

/** «2023 (3 years)» — год с возрастом. Русская форма со склонением — carAge.ts. */
export function yearAgeEn(year: number | null | undefined, now = new Date()): string | null {
  if (!year) return null;
  const age = now.getFullYear() - year;
  if (age <= 0) return String(year);
  return `${year} (${age} ${age === 1 ? "year" : "years"})`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * «2026-10-06T19:15:05+09:00» → «06.10 в 19:15 (Корея)» / «Oct 6, 19:15 (Korea time)».
 * Время берём как есть — оно корейское.
 */
export function koreanTime(lang: CardLang, iso: string | undefined): string | null {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return null;
  return lang === "en"
    ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[4]}:${m[5]} (${tx(lang, "korea")})`
    : `${m[3]}.${m[2]} ${tx(lang, "at")} ${m[4]}:${m[5]} (${tx(lang, "korea")})`;
}
