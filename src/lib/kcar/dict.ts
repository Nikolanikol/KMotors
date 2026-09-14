// Словари перевода с корейского.
//
// Площадка отдаёт всё по-корейски и без единого справочника: марка приходит
// как 현대, модель как «더 뉴 그랜저 하이브리드», топливо как 가솔린+전기.
// Держим переводы здесь, а не размазываем по коду.
//
// ⚠️ Модели переводятся ПОТОКЕННО, а не по полному имени. Уникальных моделей
// в одной сессии 155, и полный словарь пришлось бы вести вручную. Замена
// известных кусков («그랜저» → Grandeur, «더 뉴» → The New) покрывает все 371
// лот последней сессии; незнакомое остаётся по-корейски и это видно.
// Порядок в MODEL_TOKENS значим: составные идут до односложных, иначе
// «더 뉴» распадётся на «The» + «New» по отдельности.

export const MAKERS: Record<string, string> = {
  현대: "Hyundai",
  기아: "Kia",
  제네시스: "Genesis",
  "쉐보레(GM대우)": "Chevrolet",
  "르노코리아(삼성)": "Renault Korea",
  KGM: "KGM (SsangYong)",
  쌍용: "SsangYong",
  벤츠: "Mercedes-Benz",
  BMW: "BMW",
  아우디: "Audi",
  폭스바겐: "Volkswagen",
  렉서스: "Lexus",
  토요타: "Toyota",
  혼다: "Honda",
  포드: "Ford",
  링컨: "Lincoln",
  지프: "Jeep",
  볼보: "Volvo",
  포르쉐: "Porsche",
  미니: "MINI",
  테슬라: "Tesla",
  재규어: "Jaguar",
  랜드로버: "Land Rover",
  푸조: "Peugeot",
  닛산: "Nissan",
  인피니티: "Infiniti",
  캐딜락: "Cadillac",
  크라이슬러: "Chrysler",
  마세라티: "Maserati",
};

export const MODEL_TOKENS: [string, string][] = [
  ["그랜드 스타렉스", "Grand Starex"], ["스타렉스", "Starex"],
  ["그랜저", "Grandeur"], ["쏘나타", "Sonata"], ["아반떼", "Avante"],
  ["싼타페", "Santa Fe"], ["투싼", "Tucson"], ["팰리세이드", "Palisade"],
  ["맥스크루즈", "Maxcruz"], ["베라크루즈", "Veracruz"], ["아이오닉", "Ioniq"],
  ["코나", "Kona"], ["베뉴", "Venue"], ["캐스퍼", "Casper"],
  ["포터2", "Porter II"], ["포터", "Porter"], ["마이티", "Mighty"],
  ["카운티", "County"], ["에쿠스", "Equus"], ["제네시스", "Genesis"],
  ["스포티지", "Sportage"], ["쏘렌토", "Sorento"], ["모하비", "Mohave"],
  ["카니발", "Carnival"], ["모닝", "Morning"], ["레이", "Ray"],
  ["스토닉", "Stonic"], ["니로", "Niro"], ["셀토스", "Seltos"],
  ["쏘울", "Soul"], ["포르테", "Forte"], ["프라이드", "Pride"],
  ["봉고III", "Bongo III"], ["봉고", "Bongo"], ["스팅어", "Stinger"],
  ["스파크", "Spark"], ["말리부", "Malibu"], ["트랙스", "Trax"],
  ["트레일블레이저", "Trailblazer"], ["올란도", "Orlando"], ["크루즈", "Cruze"],
  ["아베오", "Aveo"], ["캡티바", "Captiva"], ["다마스", "Damas"],
  ["티볼리", "Tivoli"], ["렉스턴", "Rexton"], ["코란도", "Korando"],
  ["액티언", "Actyon"], ["체어맨", "Chairman"],
  ["SM6", "SM6"], ["SM5", "SM5"], ["SM3", "SM3"], ["QM6", "QM6"],
  ["QM3", "QM3"], ["QM5", "QM5"], ["캡처", "Captur"], ["마스터", "Master"],
  ["트위지", "Twizy"], ["아르카나", "Arkana"],
  ["시리즈", "Series"], ["클래스", "Class"], ["티구안", "Tiguan"],
  ["파사트", "Passat"], ["골프", "Golf"], ["제타", "Jetta"],
  ["아테온", "Arteon"], ["투아렉", "Touareg"],
  ["그랜드 보이저", "Grand Voyager"], ["레인지로버", "Range Rover"],
  ["에비에이터", "Aviator"], ["익스플로러", "Explorer"], ["임팔라", "Impala"],
  ["엑센트", "Accent"], ["어코드", "Accord"], ["스타리아", "Staria"],
  ["캠리", "Camry"], ["쿠퍼", "Cooper"], ["폴로", "Polo"],
  ["이쿼녹스", "Equinox"], ["비틀", "Beetle"], ["알티마", "Altima"],
  // модификаторы поколений и кузова
  ["더 뉴", "The New"], ["올 뉴", "All New"], ["더 넥스트", "The Next"],
  ["디 올 뉴", "The All New"], ["올뉴", "All New"], ["뉴모닝", "New Morning"],
  ["더 프라임", "The Prime"], ["더 볼드", "The Bold"], ["브릴리언트", "Brilliant"],
  ["어메이징", "Amazing"], ["라이즈", "Rise"], ["프리미어", "Premier"],
  ["세대", "Gen"], ["하이브리드", "Hybrid"], ["일렉트릭", "Electric"],
  ["트럭", "Truck"], ["카고", "Cargo"], ["밴", "Van"], ["쿱", "Coupe"],
  ["스포츠", "Sports"], ["쿠페", "Coupe"], ["리무진", "Limousine"],
  ["특장차", "Special"], ["특장", "Special body"], ["장축", "LWB"],
  ["초장축", "XLWB"], ["킹캡", "King Cab"], ["더블캡", "Double Cab"],
  ["슈퍼캡", "Super Cab"], ["노바", "Nova"], ["네오", "Neo"],
  ["뷰티풀", "Beautiful"], ["럭셔리", "Luxury"], ["(신형)", " (new)"],
  ["칸", "Khan"],
  // односложные — строго последними
  ["뉴", "New"], ["더", "The"],
];

export const FUEL: Record<string, string> = {
  가솔린: "Бензин",
  디젤: "Дизель",
  LPG: "Газ (LPG)",
  "가솔린+전기": "Гибрид",
  "디젤+전기": "Гибрид (дизель)",
  전기: "Электро",
  수소: "Водород",
  "가솔린+LPG": "Бензин/газ",
  "LPG+전기": "Гибрид (LPG)",
  "가솔린+CNG": "Бензин/CNG",
  CNG: "CNG",
  기타: "Прочее",
};

export const TRANSMISSION: Record<string, string> = {
  오토: "АКПП",
  수동: "МКПП",
  CVT: "CVT",
  세미오토: "Робот",
  기타: "Прочее",
};

export const USAGE: Record<string, string> = {
  상품: "Дилерский",
  렌트: "Прокат",
  영업: "Такси/коммерческая",
  리스: "Лизинг",
  관용: "Государственная",
};

export const COLORS: Record<string, string> = {
  검정색: "Чёрный",
  흰색: "Белый",
  진주색: "Перламутр",
  은색: "Серебристый",
  회색: "Серый",
  쥐색: "Тёмно-серый",
  청색: "Синий",
  남색: "Тёмно-синий",
  적색: "Красный",
  갈색: "Коричневый",
  녹색: "Зелёный",
  노란색: "Жёлтый",
  은회색: "Серо-серебристый",
  기타: "Другой",
};

/** Узлы кузова в листе осмотра. Ключи — как их присылает карточка лота. */
export const INSPECTION_NODES: Record<string, string> = {
  hood: "капот",
  frontLeftFender: "переднее левое крыло",
  frontRightFender: "переднее правое крыло",
  frontLeftDoor: "передняя левая дверь",
  frontRightDoor: "передняя правая дверь",
  rearLeftDoor: "задняя левая дверь",
  rearRightDoor: "задняя правая дверь",
  trunk: "крышка багажника",
  roof: "панель крыши",
  leftQuarterPanel: "левая задняя панель",
  rightQuarterPanel: "правая задняя панель",
  leftRockerPanel: "левый порог",
  rightRockerPanel: "правый порог",
  leftAPillar: "передняя стойка (левая)",
  rightAPillar: "передняя стойка (правая)",
  leftBPillar: "средняя стойка (левая)",
  rightBPillar: "средняя стойка (правая)",
  leftCPillar: "задняя стойка (левая)",
  rightCPillar: "задняя стойка (правая)",
  frontWindshield: "лобовое стекло",
};

/**
 * Позиции каркаса приходят буквами A–Q без расшифровки. Витрина-источник
 * тоже выводит их как «Шасси A» — расшифровка есть только на схеме в самом
 * акте осмотра, которую мы сохраняем отдельной картинкой (diagram_url).
 * Придумывать анатомию по буквам нельзя: ошибёмся в «лонжерон или арка».
 */
export function frameLabel(key: string): string | null {
  const m = /^chassis([A-Q])$/.exec(key);
  return m ? `каркас ${m[1]}` : null;
}

export const INSPECTION_STATUS: Record<string, string> = {
  replaced: "заменено",
  damaged: "повреждено",
  welded: "сварено",
  weld: "сварено",
  adjusted: "отрегулировано",
  corroded: "коррозия",
  corrosion: "коррозия",
  painted: "окрашено",
  partialPainted: "частично окрашено",
  replacedWithoutPaint: "заменено без покраски",
  scratch: "царапина",
  dent: "вмятина",
  repairNeeded: "требует замены",
};

/** Узлы из короткой описи JINDAN_EX_LIST — там своя, более грубая номенклатура. */
export const DEFECT_PARTS: Record<string, string> = {
  무사고: "без ДТП",
  본네트: "капот",
  트렁크: "крышка багажника",
  루프패널: "крыша",
  라디에이터서포트: "рамка радиатора",
  프론트패널: "передняя панель",
  크로스멤버: "поперечина",
  대쉬패널: "моторный щит",
  플로어패널: "пол",
  트렁크플로어패널: "пол багажника",
  앞대쉬패널: "моторный щит",
  리어패널: "задняя панель",
  패키지트레이: "полка багажника",
  "앞문(좌)": "перед. дверь Л",
  "앞문(우)": "перед. дверь П",
  "뒷문(좌)": "задн. дверь Л",
  "뒷문(우)": "задн. дверь П",
  "앞펜더(좌)": "перед. крыло Л",
  "앞팬더(좌)": "перед. крыло Л",
  "앞펜더(우)": "перед. крыло П",
  "앞팬더(우)": "перед. крыло П",
  "쿼터패널(좌)": "задн. крыло Л",
  "쿼터패널(우)": "задн. крыло П",
  "사이드실(좌)": "порог Л",
  "사이드실(우)": "порог П",
  "앞휠하우스(좌)": "перед. арка Л",
  "앞휠하우스(우)": "перед. арка П",
  "뒷휠하우스(좌)": "задн. арка Л",
  "뒷휠하우스(우)": "задн. арка П",
  "앞사이드멤버(좌)": "перед. лонжерон Л",
  "앞사이드멤버(우)": "перед. лонжерон П",
  "뒷 사이드맴버(좌)": "задн. лонжерон Л",
  "뒷 사이드맴버(우)": "задн. лонжерон П",
  "A필러(좌)": "стойка A Л",
  "A필러(우)": "стойка A П",
  "B필러(좌)": "стойка B Л",
  "B필러(우)": "стойка B П",
  "C필러(좌)": "стойка C Л",
  "C필러(우)": "стойка C П",
};

export function tr(dict: Record<string, string>, value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  return dict[v] ?? v;
}

export function translateModel(name: string | null | undefined): string | null {
  let out = (name ?? "").trim();
  if (!out) return null;
  for (const [ko, en] of MODEL_TOKENS) out = out.split(ko).join(en);
  return out.replace(/\s+/g, " ").trim() || null;
}

/**
 * Кузовные и трансмиссионные слова из названия комплектации. MODEL_TOKENS их
 * не берёт: там названия моделей, а здесь хвост вроде «그란쿠페» (Gran Coupe).
 */
export const TRIM_TOKENS: [string, string][] = [
  ["그란쿠페", "Gran Coupe"], ["그란turismo", "Gran Turismo"],
  ["시리즈", "Series"], ["쿠페", "Coupe"], ["컨버터블", "Convertible"],
  ["세단", "Sedan"], ["해치백", "Hatchback"], ["왜건", "Wagon"],
  ["밴", "Van"], ["트럭", "Truck"], ["리무진", "Limousine"],
  ["가솔린", "Gasoline"], ["디젤", "Diesel"], ["하이브리드", "Hybrid"],
  ["전기", "Electric"], ["사륜구동", "AWD"], ["이륜구동", "2WD"],
  ["고급형", "Luxury"], ["기본형", "Base"], ["영업용", "Commercial"],
  ["승용", "Passenger"], ["장축", "Long"], ["단축", "Short"],

  // Маркеры поколения — они лепятся к названию модели у всех марок подряд
  // («NF 쏘나타 트랜스폼», «더뉴 아반떼»), поэтому лежат здесь, а не в
  // MODEL_TOKENS: те про сами модели.
  ["트랜스폼", "Transform"], ["더뉴", "The New"], ["올뉴", "All New"],
  ["뉴", "New"], ["신형", "New"], ["구형", "Old"], ["페이스리프트", "Facelift"],
];

const HANGUL = /[ㄱ-힣]/;

/**
 * Приводит смешанную корейско-латинскую строку к читаемой.
 *
 * Сперва подставляет известные слова, затем ВЫБРАСЫВАЕТ то, что осталось
 * хангылем: «640d xDrive 그란쿠페» → «640d xDrive Gran Coupe», а незнакомое
 * слово просто исчезает.
 *
 * ⚠️ Отличие от carLabels.localizeSpec намеренное. Тот выбрасывает поле
 * ЦЕЛИКОМ — и правильно, потому что пишет в title и description, где половина
 * фразы по-корейски хуже пустоты. Здесь строка смешанная, и в ней ровно та
 * часть, ради которой её и читают («640d xDrive»), латиницей. Терять её из-за
 * одного непереведённого слова — хуже, чем потерять слово.
 */
export function readableKorean(value: string | null | undefined): string | null {
  let out = (value ?? "").trim();
  if (!out) return null;
  // ⚠️ Порядок подстановки — от ДЛИННОГО ключа к короткому, иначе короткий
  // съедает часть длинного. Живой случай: в MODEL_TOKENS есть «쿠페» (Coupe),
  // и он превращал «그란쿠페» в «그란Coupe» — длинный ключ «그란쿠페» после
  // этого не совпадал, а слово с остатком хангыля отсеивалось целиком, и из
  // «640d xDrive Gran Coupe» получалось «640d xDrive». Внутри самого
  // MODEL_TOKENS порядок выдержан руками, но при слиянии двух списков он
  // теряется, поэтому сортируем явно.
  const tokens = [...MODEL_TOKENS, ...TRIM_TOKENS].sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of tokens) out = out.split(ko).join(en);
  const kept = out
    .split(/\s+/)
    .filter((word) => word && !HANGUL.test(word))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return kept || null;
}

/**
 * Статус лота у площадки. Словарь МАЛЕНЬКИЙ и с запасным выходом: незнакомый
 * статус возвращается как есть. Страница служебная, и «출품마감» менеджеру
 * полезнее пустоты — в отличие от витрины, где хангыль недопустим.
 */
const AUCTION_STATUS: Record<string, string> = {
  "출품마감": "Приём заявок закрыт",
  "경매대기": "Ожидает торгов",
  "경매진행": "Торги идут",
  "진행중": "Торги идут",
  "낙찰": "Продан",
  "유찰": "Не продан",
  "취소": "Снят",
};

export function auctionStatus(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v ? (AUCTION_STATUS[v] ?? v) : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Подписи характеристик для ДВУХ языков витрины
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ Ключ здесь — ЗНАЧЕНИЕ ИЗ БАЗЫ, а не корейский оригинал, и это вынужденно.
// У KCar словари выше переводят корейское в русское ПРИ ЗАГРУЗКЕ, у Lotte
// витрина-посредник отдаёт сразу английское. То есть в auction_lots лежит
// смесь: «Дизель» у одной площадки и «Diesel» у другой. Переводить корейское
// на лету мы уже не можем — оригинала в базе нет.
//
// Отсюда таблица принимает оба входа и отдаёт пару. Побочная польза: русская
// витрина перестаёт показывать английские значения Lotte, а английская —
// русские значения KCar. До этого каждая показывала чужое.
//
// Незнакомое значение возвращается КАК ЕСТЬ: на служебной странице лучше
// увидеть сырое, чем пустоту, а на публичной такие значения ловятся глазами.

type SpecPair = { ru: string; en: string };

const SPEC_I18N: Record<string, SpecPair> = {};

function pair(ru: string, en: string) {
  SPEC_I18N[ru] = { ru, en };
  SPEC_I18N[en] = { ru, en };
}

// Топливо — двенадцать значений KCar плюс то, как их называет Lotte.
pair("Бензин", "Gasoline");
pair("Дизель", "Diesel");
pair("Газ (LPG)", "LPG");
pair("Гибрид", "Hybrid");
pair("Гибрид (дизель)", "Diesel hybrid");
pair("Гибрид (LPG)", "LPG hybrid");
pair("Электро", "Electric");
pair("Водород", "Hydrogen");
pair("Бензин/газ", "Gasoline/LPG");
pair("Бензин/CNG", "Gasoline/CNG");
pair("CNG", "CNG");
pair("Прочее", "Other");

// Коробка. «Auto» и «Manual» — как их пишет витрина Lotte.
pair("АКПП", "Auto");
pair("МКПП", "Manual");
pair("CVT", "CVT");
pair("Робот", "DCT");

// Происхождение лота — только у KCar, у Lotte этого поля нет.
pair("Дилерский", "Dealer");
pair("Прокат", "Rental");
pair("Такси/коммерческая", "Taxi / commercial");
pair("Лизинг", "Leasing");
pair("Государственная", "Government");

/**
 * Значение характеристики на языке витрины.
 * Незнакомое отдаём как есть — пустое поле хуже непереведённого.
 */
export function specLabel(value: string | null | undefined, lang: string): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const p = SPEC_I18N[v];
  if (!p) return v;
  return lang === "ru" ? p.ru : p.en;
}
