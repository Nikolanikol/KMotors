// Текст и разметка карточки авто, собранные из ДАННЫХ конкретной машины.
//
// Зачем отдельный модуль: блок «О модели» и JSON-LD раньше были шаблоном —
// девять из двенадцати предложений совпадали у всех машин, а description в
// разметке на ru/ka/ar был английским. Здесь чистые функции без сети и без
// i18next (под них тесты, tests/catalog/carContent.spec.ts); словарь Encar
// приходит аргументом.
//
// Правила, которые держат текст честным:
//   • ничего не выдумываем: нет поля — нет предложения; хангыль на сайт не
//     выводим (незнакомое слово — поле выбрасывается, как в carLabels.ts);
//   • «без ДТП» НЕ утверждаем: показываем только числа записи Encar и отметку
//     листа осмотра. Вердикт — не наше дело;
//   • сроки доставки — одно значение, 3–6 недель, как в FAQ и мета-описании;
//   • названия моделей не склоняем: значения идут парами «подпись: значение».
import { SITE_URL } from "@/lib/site";
import { localizeFuel, localizeSpec, type CarsDict } from "@/lib/carLabels";
import { catalog, OPTION_EN } from "@/components/Catalog/CarDetail/OptionsRow/data";

const HANGUL = /[ㄱ-힝]/;

/** Срок «от выкупа до выдачи». Единственное значение для описания, FAQ и меты. */
export const DELIVERY_WEEKS = "3–6";

type Lang = "ru" | "en" | "ka" | "ar";
const asLang = (l: string): Lang => (l === "en" || l === "ka" || l === "ar" ? l : "ru");

const NUMBER_LOCALE: Record<Lang, string> = {
  ru: "ru-RU",
  en: "en-US",
  ka: "en-US",
  ar: "en-US",
};

// ---------------------------------------------------------------------------
// Словари: месяцы (именительный — не склоняем), цвета, регионы Кореи
// ---------------------------------------------------------------------------

const MONTHS: Record<Lang, string[]> = {
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ka: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};

// Цвет кузова: Encar отдаёт корейское слово. Нет в таблице — поле пропускаем.
const COLORS: Record<string, Record<Lang, string>> = {
  흰색: { ru: "белый", en: "white", ka: "თეთრი", ar: "أبيض" },
  진주색: { ru: "жемчужный", en: "pearl", ka: "მარგალიტისფერი", ar: "لؤلؤي" },
  검정색: { ru: "чёрный", en: "black", ka: "შავი", ar: "أسود" },
  은색: { ru: "серебристый", en: "silver", ka: "ვერცხლისფერი", ar: "فضي" },
  명은색: { ru: "светло-серебристый", en: "light silver", ka: "ღია ვერცხლისფერი", ar: "فضي فاتح" },
  쥐색: { ru: "тёмно-серый", en: "dark gray", ka: "მუქი ნაცრისფერი", ar: "رمادي داكن" },
  회색: { ru: "серый", en: "gray", ka: "ნაცრისფერი", ar: "رمادي" },
  은회색: { ru: "серо-серебристый", en: "silver gray", ka: "ვერცხლისფერ-ნაცრისფერი", ar: "رمادي فضي" },
  갈색: { ru: "коричневый", en: "brown", ka: "ყავისფერი", ar: "بني" },
  밤색: { ru: "каштановый", en: "chestnut", ka: "წაბლისფერი", ar: "كستنائي" },
  금색: { ru: "золотистый", en: "gold", ka: "ოქროსფერი", ar: "ذهبي" },
  주황색: { ru: "оранжевый", en: "orange", ka: "ნარინჯისფერი", ar: "برتقالي" },
  노란색: { ru: "жёлтый", en: "yellow", ka: "ყვითელი", ar: "أصفر" },
  연두색: { ru: "салатовый", en: "light green", ka: "ღია მწვანე", ar: "أخضر فاتح" },
  초록색: { ru: "зелёный", en: "green", ka: "მწვანე", ar: "أخضر" },
  하늘색: { ru: "голубой", en: "light blue", ka: "ცისფერი", ar: "أزرق سماوي" },
  파란색: { ru: "синий", en: "blue", ka: "ლურჯი", ar: "أزرق" },
  청색: { ru: "синий", en: "blue", ka: "ლურჯი", ar: "أزرق" },
  보라색: { ru: "фиолетовый", en: "purple", ka: "მეწამული", ar: "بنفسجي" },
  분홍색: { ru: "розовый", en: "pink", ka: "ვარდისფერი", ar: "وردي" },
  빨간색: { ru: "красный", en: "red", ka: "წითელი", ar: "أحمر" },
  베이지색: { ru: "бежевый", en: "beige", ka: "ბეჟისფერი", ar: "بيج" },
};

export function localizeColor(raw: string | null | undefined, lang: string): string | null {
  if (!raw) return null;
  const hit = COLORS[raw.trim()];
  return hit ? hit[asLang(lang)] : null;
}

// Регион и город продавца. Encar пишет адрес по-корейски («경기 수원시 권선구»).
// В ka/ar берём английские названия (фолбэк на en — конвенция проекта для
// словарей без перевода). Нет в таблице — не выводим, хангыль на сайт не идёт.
const REGIONS: Record<string, { ru: string; en: string }> = {
  서울: { ru: "Сеул", en: "Seoul" },
  부산: { ru: "Пусан", en: "Busan" },
  대구: { ru: "Тэгу", en: "Daegu" },
  인천: { ru: "Инчхон", en: "Incheon" },
  광주: { ru: "Кванджу", en: "Gwangju" },
  대전: { ru: "Тэджон", en: "Daejeon" },
  울산: { ru: "Ульсан", en: "Ulsan" },
  세종: { ru: "Седжон", en: "Sejong" },
  경기: { ru: "Кёнги", en: "Gyeonggi" },
  강원: { ru: "Канвон", en: "Gangwon" },
  충북: { ru: "Северный Чхунчхон", en: "North Chungcheong" },
  충남: { ru: "Южный Чхунчхон", en: "South Chungcheong" },
  전북: { ru: "Северный Чолла", en: "North Jeolla" },
  전남: { ru: "Южный Чолла", en: "South Jeolla" },
  경북: { ru: "Северный Кёнсан", en: "North Gyeongsang" },
  경남: { ru: "Южный Кёнсан", en: "South Gyeongsang" },
  제주: { ru: "Чеджу", en: "Jeju" },
};
// Города, где работает большинство дилеров. Остальные не показываем (только регион).
const CITIES: Record<string, { ru: string; en: string }> = {
  수원: { ru: "Сувон", en: "Suwon" },
  성남: { ru: "Соннам", en: "Seongnam" },
  고양: { ru: "Коян", en: "Goyang" },
  용인: { ru: "Ёнин", en: "Yongin" },
  부천: { ru: "Пучхон", en: "Bucheon" },
  안산: { ru: "Ансан", en: "Ansan" },
  안양: { ru: "Анян", en: "Anyang" },
  남양주: { ru: "Намянджу", en: "Namyangju" },
  화성: { ru: "Хвасон", en: "Hwaseong" },
  평택: { ru: "Пхёнтхэк", en: "Pyeongtaek" },
  의정부: { ru: "Ыйджонбу", en: "Uijeongbu" },
  시흥: { ru: "Сихын", en: "Siheung" },
  파주: { ru: "Паджу", en: "Paju" },
  김포: { ru: "Кимпхо", en: "Gimpo" },
  광명: { ru: "Кванмён", en: "Gwangmyeong" },
  군포: { ru: "Кунпхо", en: "Gunpo" },
  하남: { ru: "Хананм", en: "Hanam" },
  오산: { ru: "Осан", en: "Osan" },
  이천: { ru: "Ичхон", en: "Icheon" },
  안성: { ru: "Ансон", en: "Anseong" },
  양주: { ru: "Янджу", en: "Yangju" },
  구리: { ru: "Кури", en: "Guri" },
  의왕: { ru: "Ыйван", en: "Uiwang" },
  포천: { ru: "Пхочхон", en: "Pocheon" },
  여주: { ru: "Ёджу", en: "Yeoju" },
  동두천: { ru: "Тондучхон", en: "Dongducheon" },
  과천: { ru: "Кваджон", en: "Gwacheon" },
  천안: { ru: "Чхонан", en: "Cheonan" },
  아산: { ru: "Асан", en: "Asan" },
  청주: { ru: "Чхонджу", en: "Cheongju" },
  충주: { ru: "Чхунджу", en: "Chungju" },
  창원: { ru: "Чхангвон", en: "Changwon" },
  김해: { ru: "Кимхэ", en: "Gimhae" },
  진주: { ru: "Чинджу", en: "Jinju" },
  양산: { ru: "Янсан", en: "Yangsan" },
  구미: { ru: "Куми", en: "Gumi" },
  포항: { ru: "Похан", en: "Pohang" },
  경산: { ru: "Кёнсан", en: "Gyeongsan" },
  전주: { ru: "Чонджу", en: "Jeonju" },
  익산: { ru: "Иксан", en: "Iksan" },
  군산: { ru: "Кунсан", en: "Gunsan" },
  순천: { ru: "Сунчхон", en: "Suncheon" },
  여수: { ru: "Ёсу", en: "Yeosu" },
  목포: { ru: "Мокпхо", en: "Mokpo" },
  원주: { ru: "Вонджу", en: "Wonju" },
  춘천: { ru: "Чхунчхон", en: "Chuncheon" },
  강릉: { ru: "Каннын", en: "Gangneung" },
  서귀포: { ru: "Согвипхо", en: "Seogwipo" },
};

const LONG_REGION: [string, string][] = [
  ["충청북", "충북"], ["충청남", "충남"], ["전라북", "전북"], ["전라남", "전남"],
  ["경상북", "경북"], ["경상남", "경남"],
];

/**
 * «경기 수원시 권선구» → { region: "Кёнги", city: "Сувон" }. Номер телефона и
 * улицу не берём. Нет региона в таблице — null (лучше пусто, чем хангыль).
 * Для городов уровня региона (Сеул, Пусан…) город не дублируем.
 */
export function parseSellerPlace(
  address: string | null | undefined,
  lang: string,
): { region: string; city: string | null } | null {
  if (!address) return null;
  const tokens = String(address).trim().split(/\s+/);
  let regionKey = tokens[0].replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, "");
  for (const [long, short] of LONG_REGION) if (regionKey === long) regionKey = short;
  const region = REGIONS[regionKey];
  if (!region) return null;
  const l = asLang(lang);
  const pick = (e: { ru: string; en: string }) => (l === "ru" ? e.ru : e.en);

  const cityKey = (tokens[1] ?? "").replace(/(시|군)$/, "");
  const city = cityKey && cityKey !== regionKey ? CITIES[cityKey] : undefined;
  return { region: pick(region), city: city ? pick(city) : null };
}

// ---------------------------------------------------------------------------
// Опции
// ---------------------------------------------------------------------------

// Самые «весомые» для покупателя коды — как в vehicleCard.ts (RANK), короче.
// Порядок редакторский: редкое и дорогое первым.
const NOTABLE_OPTION_CODES = [
  "091", "095", "087", "079", "086", "088", "010", "090", "077", "034",
  "089", "092", "093", "080", "051", "078", "063", "082", "059", "014",
];

const catalogByCode = new Map(catalog.map((o) => [o.code, o]));

/** Сколько кодов из списка знает наш словарь — столько же показывает OptionsRow. */
export function countKnownOptions(codes: string[] | null | undefined): number {
  return (codes ?? []).filter((c) => catalogByCode.has(c)).length;
}

function optionName(code: string, lang: string): string | null {
  const item = catalogByCode.get(code);
  if (!item) return null;
  const name = lang === "ru" ? item.translatedValue : (OPTION_EN[code] ?? null);
  return name && !HANGUL.test(name) ? name : null;
}

/** До `limit` самых значимых опций машины, названия на языке страницы. */
export function notableOptions(codes: string[] | null | undefined, lang: string, limit = 4): string[] {
  const have = new Set(codes ?? []);
  const out: string[] = [];
  for (const code of NOTABLE_OPTION_CODES) {
    if (!have.has(code)) continue;
    const name = optionName(code, lang);
    if (name && !out.includes(name)) out.push(name);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Описание «О модели»
// ---------------------------------------------------------------------------

export interface CarFacts {
  lang: string;
  /** Нормализованная марка (normalizeBrand). */
  brand: string;
  /** Модельная группа без скобок и «THE NEW». */
  model: string;
  /** "YYYYMM". */
  yearMonth?: string | null;
  mileage?: number | null;
  /** см³. */
  displacement?: number | null;
  fuelRaw?: string | null;
  transmissionRaw?: string | null;
  bodyRaw?: string | null;
  colorRaw?: string | null;
  seats?: number | null;
  /** Адрес продавца Encar: берём только регион и город, телефон не передаём. */
  address?: string | null;
  standardCodes?: string[] | null;
  choiceCodes?: string[] | null;
  /** Запись истории; null — записи нет, предложение не выводим. */
  record?: { accidents: number | null; owners: number | null } | null;
  /** Лист осмотра; null — листа нет. */
  inspection?: { simpleRepair: boolean | null; date: string | null } | null;
}

interface Phrases {
  heading: (brand: string, model: string) => string;
  yearMonth: (month: string, year: string) => string;
  yearOnly: (year: string) => string;
  mileage: (km: string) => string;
  labels: { engine: string; transmission: string; body: string; color: string; seats: string };
  sep: string; // разделитель пар в строке характеристик
  place: (region: string, city: string | null) => string;
  options: (n: number, extra: number) => string;
  notable: (list: string) => string;
  history: (accidents: number | null, owners: number | null) => string;
  inspection: (date: string | null, repaired: boolean) => string;
  order: string;
  tagOrigin: (brand: string, model: string) => string;
  link: (brand: string, model: string) => string;
  litre: string;
  km: string;
  listSep: string;
}

const PHRASES: Record<Lang, Phrases> = {
  ru: {
    heading: (b, m) => `О модели ${b} ${m}`,
    yearMonth: (mo, y) => `Год и месяц выпуска — ${mo} ${y}.`,
    yearOnly: (y) => `Год выпуска — ${y}.`,
    mileage: (km) => `Пробег — ${km}.`,
    labels: { engine: "Двигатель", transmission: "Коробка передач", body: "Кузов", color: "Цвет", seats: "Мест" },
    sep: "; ",
    place: (r, c) => `Продавец — дилер из Южной Кореи: регион ${r}${c ? `, город ${c}` : ""}.`,
    options: (n, e) => `Опций в объявлении Encar: ${n}${e ? `, ещё ${e} — на выбор` : ""}.`,
    notable: (l) => `Среди значимых: ${l}.`,
    history: (a, o) => {
      const bits = [
        a !== null ? `обращений по страховке — ${a}` : null,
        o !== null ? `смен владельца — ${o}` : null,
      ].filter(Boolean);
      return `По страховой истории Encar: ${bits.join(", ")}.`;
    },
    inspection: (d, r) => `В листе осмотра Encar${d ? ` от ${d}` : ""} отметка «простой ремонт» внешних панелей ${r ? "стоит" : "не стоит"}.`,
    order: `Заказать этот автомобиль можно через K-Axis: после задатка наш специалист осматривает его в Корее и присылает фото- и видеоотчёт. Весь путь от выкупа до выдачи занимает ${DELIVERY_WEEKS} недель.`,
    tagOrigin: (b, m) => `${b} ${m} из Кореи`,
    link: (b, m) => `Все ${b} ${m} в каталоге →`,
    litre: "л",
    km: "км",
    listSep: ", ",
  },
  en: {
    heading: (b, m) => `About ${b} ${m}`,
    yearMonth: (mo, y) => `Year and month of manufacture: ${mo} ${y}.`,
    yearOnly: (y) => `Model year: ${y}.`,
    mileage: (km) => `Mileage: ${km}.`,
    labels: { engine: "Engine", transmission: "Transmission", body: "Body", color: "Colour", seats: "Seats" },
    sep: "; ",
    place: (r, c) => `The seller is a dealer in South Korea: ${r} region${c ? `, ${c}` : ""}.`,
    options: (n, e) => `Options listed in the Encar ad: ${n}${e ? `, plus ${e} optional` : ""}.`,
    notable: (l) => `Notable ones: ${l}.`,
    history: (a, o) => {
      const bits = [
        a !== null ? `${a} insurance claim${a === 1 ? "" : "s"}` : null,
        o !== null ? `${o} change${o === 1 ? "" : "s"} of owner` : null,
      ].filter(Boolean);
      return `Encar insurance history shows ${bits.join(" and ")}.`;
    },
    inspection: (d, r) => `In the Encar inspection sheet${d ? ` dated ${d}` : ""}, the “simple repair” mark for exterior panels is ${r ? "ticked" : "not ticked"}.`,
    order: `You can order this car through K-Axis: after a deposit our specialist inspects it in Korea and sends a photo and video report. The whole process from purchase to handover takes ${DELIVERY_WEEKS} weeks.`,
    tagOrigin: (b, m) => `${b} ${m} from Korea`,
    link: (b, m) => `All ${b} ${m} in the catalogue →`,
    litre: "L",
    km: "km",
    listSep: ", ",
  },
  ka: {
    heading: (b, m) => `${b} ${m}-ის შესახებ`,
    yearMonth: (mo, y) => `გამოშვების წელი და თვე — ${mo} ${y}.`,
    yearOnly: (y) => `გამოშვების წელი — ${y}.`,
    mileage: (km) => `გარბენი — ${km}.`,
    labels: { engine: "ძრავი", transmission: "გადაცემათა კოლოფი", body: "ძარა", color: "ფერი", seats: "ადგილები" },
    sep: "; ",
    place: (r, c) => `გამყიდველი — დილერი სამხრეთ კორეიდან: რეგიონი ${r}${c ? `, ქალაქი ${c}` : ""}.`,
    options: (n, e) => `Encar-ის განცხადებაში ოფციების რაოდენობა: ${n}${e ? `, კიდევ ${e} — არჩევითი` : ""}.`,
    notable: (l) => `მნიშვნელოვანი ოფციები: ${l}.`,
    history: (a, o) => {
      const bits = [
        a !== null ? `სადაზღვევო მიმართვები — ${a}` : null,
        o !== null ? `მფლობელის ცვლილება — ${o}` : null,
      ].filter(Boolean);
      return `Encar-ის სადაზღვევო ისტორიით: ${bits.join(", ")}.`;
    },
    inspection: (d, r) => `Encar-ის შემოწმების ფურცელში${d ? ` (${d})` : ""} გარე პანელების ნიშანი „მარტივი შეკეთება“ ${r ? "დასმულია" : "არ არის დასმული"}.`,
    order: `ამ ავტომობილის შეკვეთა შესაძლებელია K-Axis-ის მეშვეობით: ავანსის შემდეგ ჩვენი სპეციალისტი კორეაში დაათვალიერებს და გამოგიგზავნით ფოტო- და ვიდეოანგარიშს. მთელი პროცესი ყიდვიდან გადაცემამდე — ${DELIVERY_WEEKS} კვირა.`,
    tagOrigin: (b, m) => `${b} ${m} კორეიდან`,
    link: (b, m) => `ყველა ${b} ${m} კატალოგში →`,
    litre: "ლ",
    km: "კმ",
    listSep: ", ",
  },
  ar: {
    heading: (b, m) => `حول ${b} ${m}`,
    yearMonth: (mo, y) => `سنة وشهر الإنتاج — ${mo} ${y}.`,
    yearOnly: (y) => `سنة الإنتاج — ${y}.`,
    mileage: (km) => `المسافة المقطوعة — ${km}.`,
    labels: { engine: "المحرك", transmission: "ناقل الحركة", body: "الهيكل", color: "اللون", seats: "المقاعد" },
    sep: "؛ ",
    place: (r, c) => `البائع وكيل من كوريا الجنوبية: المنطقة ${r}${c ? `، المدينة ${c}` : ""}.`,
    options: (n, e) => `عدد التجهيزات في إعلان Encar: ${n}${e ? `، و${e} إضافية اختيارية` : ""}.`,
    notable: (l) => `من أبرزها: ${l}.`,
    history: (a, o) => {
      const bits = [
        a !== null ? `مطالبات التأمين — ${a}` : null,
        o !== null ? `تغييرات المالك — ${o}` : null,
      ].filter(Boolean);
      return `بحسب سجل التأمين في Encar: ${bits.join("، ")}.`;
    },
    inspection: (d, r) => `في ورقة فحص Encar${d ? ` (${d})` : ""} علامة «إصلاح بسيط» للألواح الخارجية ${r ? "موضوعة" : "غير موضوعة"}.`,
    order: `يمكن طلب هذه السيارة عبر K-Axis: بعد دفع العربون يفحصها متخصصنا في كوريا ويرسل تقريرًا بالصور والفيديو. تستغرق العملية كاملةً من الشراء إلى التسليم ${DELIVERY_WEEKS} أسابيع.`,
    tagOrigin: (b, m) => `${b} ${m} من كوريا`,
    link: (b, m) => `جميع ${b} ${m} في الكتالوج ←`,
    litre: "لتر",
    km: "كم",
    listSep: "، ",
  },
};

/**
 * «Автомат» → «автомат», «Sports Car» → «sports car», «Wagon 5-Door» →
 * «wagon 5-door». Аббревиатуры («SUV», «LPG») и ka/ar не трогаем: меняются
 * только слова «Заглавная + строчные».
 */
function lowerFirst(s: string, lang: Lang): string {
  if (lang !== "ru" && lang !== "en") return s;
  return s.replace(/(^|[\s-])([A-ZА-ЯЁ])([a-zа-яё]+)/g, (_m, pre: string, c: string, rest: string) => `${pre}${c.toLowerCase()}${rest}`);
}

function formatDisplacement(cc: number | null | undefined): string | null {
  if (!cc || cc < 100) return null;
  return (cc / 1000).toFixed(1);
}

/** "202410" → { year: "2024", month: 10 }. Месяц вне 1–12 отбрасываем. */
export function parseYearMonth(ym: string | null | undefined): { year: string; month: number | null } | null {
  const s = String(ym ?? "").trim();
  if (!/^\d{4}/.test(s)) return null;
  const month = s.length >= 6 ? Number(s.slice(4, 6)) : NaN;
  return { year: s.slice(0, 4), month: month >= 1 && month <= 12 ? month : null };
}

export interface CarDescriptionView {
  heading: string;
  /** Абзацы текста; пустые не попадают. */
  paragraphs: string[];
  /** Короткая сводка по данным машины — для description в JSON-LD. */
  summary: string;
  tags: string[];
  linkLabel: string;
}

export function buildCarDescription(f: CarFacts, dict: CarsDict): CarDescriptionView {
  const l = asLang(f.lang);
  const p = PHRASES[l];
  const ym = parseYearMonth(f.yearMonth);
  const km =
    typeof f.mileage === "number" && f.mileage > 0
      ? `${f.mileage.toLocaleString(NUMBER_LOCALE[l])} ${p.km}`
      : null;
  const disp = formatDisplacement(f.displacement);

  const fuel = localizeFuel(f.fuelRaw, dict);
  const transmission = localizeSpec(f.transmissionRaw, dict);
  const body = localizeSpec(f.bodyRaw, dict);
  const color = localizeColor(f.colorRaw, f.lang);

  // Абзац 1: год/месяц и пробег — главное, чем две одинаковые по модели
  // машины отличаются.
  const lead = [
    ym ? (ym.month ? p.yearMonth(MONTHS[l][ym.month - 1], ym.year) : p.yearOnly(ym.year)) : "",
    km ? p.mileage(km) : "",
  ].filter(Boolean);

  // Абзац 2: характеристики парами «подпись: значение» — без склонений.
  const engine = [fuel ? lowerFirst(fuel, l) : null, disp ? `${disp} ${p.litre}` : null]
    .filter(Boolean)
    .join(p.listSep);
  const pairs: [string, string | null][] = [
    [p.labels.engine, engine || null],
    [p.labels.transmission, transmission ? lowerFirst(transmission, l) : null],
    [p.labels.body, body ? lowerFirst(body, l) : null],
    [p.labels.color, color],
    [p.labels.seats, f.seats && f.seats > 0 ? String(f.seats) : null],
  ];
  const specLine = pairs
    .filter((x): x is [string, string] => !!x[1])
    // подписи после первой — со строчной: «Двигатель: …; коробка передач: …»
    .map(([k, v], i) => `${i === 0 ? k : lowerFirst(k, l)}: ${v}`)
    .join(p.sep);

  // Абзац 3: регион продавца и опции.
  const place = parseSellerPlace(f.address, f.lang);
  const nStd = countKnownOptions(f.standardCodes);
  const nChoice = countKnownOptions(f.choiceCodes);
  const nTotal = nStd + nChoice;
  const notable = notableOptions([...(f.standardCodes ?? []), ...(f.choiceCodes ?? [])], f.lang);
  const market = [
    place ? p.place(place.region, place.city) : "",
    nStd > 0 ? p.options(nStd, nChoice) : nTotal > 0 ? p.options(nTotal, 0) : "",
    notable.length ? p.notable(notable.join(p.listSep)) : "",
  ].filter(Boolean);

  // Абзац 4: история и осмотр — только если запись/лист реально есть.
  const rec = f.record;
  const hasRecord = !!rec && (rec.accidents !== null || rec.owners !== null);
  const insp = f.inspection && f.inspection.simpleRepair !== null ? f.inspection : null;
  const checks = [
    hasRecord ? p.history(rec!.accidents, rec!.owners) : "",
    insp ? p.inspection(insp.date, insp.simpleRepair === true) : "",
  ].filter(Boolean);

  const paragraphs = [
    [...lead, specLine ? `${specLine}.` : ""].filter(Boolean).join(" "),
    market.join(" "),
    checks.join(" "),
    p.order,
  ].filter(Boolean);

  const tags = [
    p.tagOrigin(f.brand, f.model),
    ...(ym ? [ym.year] : []),
    ...(disp && fuel ? [`${disp} ${p.litre} · ${lowerFirst(fuel, l)}`] : []),
    ...(km ? [km] : []),
    ...(color ? [color] : []),
  ];

  return {
    heading: p.heading(f.brand, f.model),
    paragraphs,
    summary: [...lead, specLine ? `${specLine}.` : ""].filter(Boolean).join(" "),
    tags,
    linkLabel: p.link(f.brand, f.model),
  };
}

// ---------------------------------------------------------------------------
// JSON-LD Car / Offer
// ---------------------------------------------------------------------------

const FUEL_SCHEMA: [string, string][] = [
  ["플러그인하이브리드", "https://schema.org/Hybrid"],
  ["하이브리드", "https://schema.org/Hybrid"],
  ["가솔린", "https://schema.org/Gasoline"],
  ["디젤", "https://schema.org/Diesel"],
  ["전기", "https://schema.org/Electric"],
  ["LPG", "https://schema.org/LPG"],
  ["lpg", "https://schema.org/LPG"],
  ["수소", "https://schema.org/Hydrogen"],
];

export function schemaFuelUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  return FUEL_SCHEMA.find(([k]) => raw.includes(k))?.[1];
}

export interface CarJsonLdInput {
  /** Канонический адрес САМОЙ страницы (тот же, что в alternates.canonical). */
  pageUrl: string;
  /** Название без года (бренд + модель + комплектация). */
  carName: string;
  year: string | null;
  brand: string;
  /** Описание на языке страницы (CarDescriptionView.summary). */
  description: string;
  images: string[];
  vin?: string | null;
  /** "YYYYMM". */
  yearMonth?: string | null;
  formYear?: string | null;
  mileage?: number | null;
  displacement?: number | null;
  fuelRaw?: string | null;
  bodyType?: string | null;
  color?: string | null;
  transmission?: string | null;
  seats?: number | null;
  /** Цена в вонах — та же, что видит посетитель (carPriceKrw, со стояночным сбором). */
  priceKrw: number;
}

/**
 * Car + Offer. Каждое необязательное поле выводится только если значение
 * реально есть. priceValidUntil, рейтинги и отзывы НЕ добавляем — данных нет.
 */
export function buildCarJsonLd(i: CarJsonLdInput): Record<string, unknown> {
  const ym = parseYearMonth(i.yearMonth);
  const fuelUrl = schemaFuelUrl(i.fuelRaw);
  const modelYear = i.formYear && /^\d{4}$/.test(i.formYear) ? i.formYear : ym?.year;

  return {
    "@context": "https://schema.org/",
    "@type": "Car",
    name: i.year ? `${i.carName} ${i.year}` : i.carName,
    ...(i.images.length > 0 && { image: i.images }),
    ...(i.description && { description: i.description }),
    brand: { "@type": "Brand", name: i.brand || "Unknown" },
    ...(i.vin && { vehicleIdentificationNumber: i.vin }),
    ...(modelYear && { vehicleModelDate: modelYear }),
    ...(ym?.month && { productionDate: `${ym.year}-${String(ym.month).padStart(2, "0")}` }),
    ...(i.bodyType && { bodyType: i.bodyType }),
    ...(i.color && { color: i.color }),
    ...(i.transmission && { vehicleTransmission: i.transmission }),
    ...(fuelUrl && { fuelType: fuelUrl }),
    ...(i.seats && i.seats > 0 && { vehicleSeatingCapacity: i.seats }),
    ...(i.mileage && i.mileage > 0 && {
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: i.mileage,
        unitCode: "KMT",
      },
    }),
    ...(i.displacement && i.displacement > 0 && {
      vehicleEngine: {
        "@type": "EngineSpecification",
        engineDisplacement: {
          "@type": "QuantitativeValue",
          value: i.displacement,
          unitCode: "CMQ",
        },
        ...(fuelUrl && { fuelType: fuelUrl }),
      },
    }),
    offers: {
      "@type": "Offer",
      // Адрес САМОЙ страницы: у дублей Encar vehicleId отличается от id в URL,
      // и Offer.url, построенный от него, расходился с canonical.
      url: i.pageUrl,
      // KRW намеренно: главная цена в карточке (CarDetailSidebar) — воны,
      // конвертация в ₽/$ идёт ниже как справочная. Валюта в разметке обязана
      // совпадать с видимой ценой, иначе Google бракует Offer.
      priceCurrency: "KRW",
      // Через carPriceKrw, а не сырое ×10000: в цене на странице сидит
      // стояночный сбор, и Offer обязан нести ту же сумму.
      price: i.priceKrw,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        name: "K-Axis",
        url: SITE_URL,
      },
      // Ставка указана только для того направления, где она действительно
      // фиксирована: морской фрахт до Владивостока. По остальным странам цена
      // считается по запросу, и выдумывать её в разметке нельзя — неверная
      // стоимость доставки хуже, чем её отсутствие. Растаможка сюда не входит:
      // она считается отдельно (CustomsCalculator). Сроки (подготовка +
      // дорога) в сумме укладываются в «3–6 недель» из текста карточки.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: "600",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RU",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 7,
            maxValue: 14,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 14,
            maxValue: 30,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "RU",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
  };
}
