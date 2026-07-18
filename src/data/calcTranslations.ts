// Единый словарь для обоих калькуляторов растаможки:
//   - src/components/Catalog/CarDetail/CustomsCalculator/CustomsCalculator.tsx (сайдбар)
//   - src/components/Calculator/CalculatorPage.tsx (отдельная страница /calculator)
//
// Индексируется по `lang`-пропсу, НЕ через i18next-синглтон. Причина: страница
// /calculator содержит SEO-блок (H2, FAQ), который должен рендериться в корректном
// языке уже на сервере. Синглтон на сервере всегда "ru" (см. задачу №9), а `lang`-проп
// корректен на сервере — поэтому словарь обходит проблему SSR для SEO-контента.
//
// RU — эталон (взят из исходного кода). ka-прозу (FAQ/SEO) желательно дать носителю на вычитку.

export type CalcLang = "ru" | "en" | "ko" | "ka" | "ar";

export interface CalcStrings {
  // ── Шапка ──
  title: string;                 // "Калькулятор растаможки"
  titleAccent: string;           // H1-акцент на странице: "авто из Кореи"
  forIndividuals: string;        // "Для физических лиц"
  pageSubtitle: string;          // подзаголовок страницы

  // ── Вкладки стран ──
  countryRU: string;
  countryKZ: string;
  countryUZ: string;

  // ── Форма (страница) ──
  carParams: string;             // "Параметры автомобиля"
  priceLabel: string;            // "Стоимость авто (USD)"
  volumeLabel: string;           // "Объём двигателя"
  cc: string;                    // "см³"
  yearLabel: string;             // "Год выпуска"
  monthLabel: string;            // "Месяц выпуска"
  fuelLabel: string;             // "Тип двигателя"
  fuelGasoline: string;
  fuelDiesel: string;
  fuelHybrid: string;            // "Гибрид (HEV / PHEV)"
  fuelElectric: string;          // "Электромобиль (EV)"
  powerLabel: string;            // "Мощность двигателя"
  hp: string;                    // "л.с."
  calculate: string;             // "Рассчитать →"
  calculating: string;           // "Загрузка курсов..."
  formHint: string;              // "💡 Расчёт ориентировочный..."
  emptyState: string;            // "Заполните параметры слева..."

  // ── Форма (сайдбар) ──
  powerLabelHp: string;          // "Мощность двигателя (л.с.)"
  hpPlaceholder: string;         // "например: 150"
  calcShort: string;             // "Посчитать"
  sidebarHint: string;           // "💡 Дату производства и мощность..."
  kzUzHint: string;              // "💡 Дату производства уточняйте..."

  // ── Ошибки ──
  errPrice: string;
  errVolume: string;
  errPower: string;
  errPowerHp: string;            // "Введите мощность двигателя в л.с."
  ratesError: string;            // "Не удалось загрузить курсы валют..."

  // ── Строка курсов ──
  cbrPrefix: string;             // "Курс ЦБ РФ:"
  approxRateRU: string;          // "Приблизительный курс (ЦБ РФ недоступен):"
  approx: string;                // "(приблизительный)"

  // ── Результат (общее) ──
  totalCustoms: string;          // "Итого к оплате на таможне"
  totalCustomsShort: string;     // "Итого таможенных платежей" (страница)
  carPriceApprox: string;        // "Цена авто ≈"
  age: string;                   // "Возраст:"
  months: string;                // "мес."
  breakdown: string;             // "Расшифровка:"
  duty: string;                  // "Таможенная пошлина"
  customsFee: string;            // "Таможенный сбор"
  recyclingFee: string;          // "Утилизационный сбор"
  recyclingFeeShort: string;     // "Утилсбор" (страница)
  total: string;                 // "Итого"
  finalCostIn: string;           // "Итоговая стоимость авто в" (+ страна в родит. падеже)
  finalCostInShort: string;      // "Итоговая стоимость в" (страница)
  countryRUgen: string;          // "России"
  countryKZgen: string;          // "Казахстане"
  countryUZgen: string;          // "Узбекистане"
  car: string;                   // "Авто" (в строке "Авто X + Таможня Y")
  customs: string;               // "Таможня"
  shippingNote: string;          // "🚢 Доставка не включена в расчёт..."
  electricDuty0: string;         // "(0% — электро)"

  // ── Дисклеймеры ──
  disclaimerRU: string;
  disclaimerKZ: string;
  disclaimerUZ: string;

  // ── RU-специфика ──
  commercialRate: string;        // "> 160 — коммерческая ставка" (префикс — л.с. подставляется)

  // ── KZ-специфика ──
  customsValue: string;          // "Таможенная стоимость"
  customsFeeMRP: string;         // "Таможенный сбор (6 МРП)"
  exciseEngine: string;          // "Акциз (объём >3 000 см³)"
  exciseLuxury: string;          // "Акциз на роскошь (10%)"
  vat16: string;                 // "НДС 16%"
  registrationTson: string;      // "Первичная регистрация (ЦОН)"
  additionalKZ: string;          // "Доп. расходы (СБКТС, ЭВАК, брокер, СВХ)"
  electricTenge0: string;        // "(0 ₸ — электро)"
  warnOld7: string;              // "⚠️ Автомобиль старше 7 лет..."
  warnReg36Prefix: string;       // "⚠️ Возраст авто " + N + " мес. — сбор 500 МРП ("
  warnLuxuryPrefix: string;      // "💎 Таможенная стоимость превышает 18 000 МРП ("
  warnLuxurySuffix: string;      // ") — применяется акциз на роскошь +10%"

  // ── UZ-специфика ──
  customsFeePKM: string;         // "Таможенный сбор (ПКМ №700)"
  vat12: string;                 // "НДС 12%"
  electricSum0: string;          // "(0 сум — электро)"
  warnUsed1y: string;            // "⚠️ Автомобиль старше 1 года..."
  bonusElectricUZ: string;       // "⚡ Электромобиль: пошлина 0%..."

  // ── CTA ──
  ctaTitle: string;              // "Хотите точный расчёт с учётом доставки...?" (сайдбар)
  catalogCtaTitle: string;       // "Нашли подходящую стоимость?" (страница)
  catalogCtaText: string;        // "Подберём авто под ваш бюджет..."
  catalogCtaBtn: string;         // "Перейти в каталог →"

  // ── SEO-блок (страница) ──
  seoH2: string;                 // "Как рассчитывается растаможка авто из Кореи в 2026 году"
  seoIntro: string;
  seoCardRU: string;
  seoCardKZ: string;
  seoCardUZ: string;
  deliveryH3: string;            // "Сколько стоит доставка авто из Кореи"
  deliveryText: string;          // фрахт от $600 до Владивостока + расчёт у менеджера
  leadTitle: string;             // заголовок lead-формы под результатом
  leadText: string;              // подзаголовок lead-формы
  faqH2: string;                 // "Частые вопросы"
  faq: { q: string; a: string }[];

  // ── Функции склонения/единиц ──
  ageYearsWord: (n: number) => string;   // "год" / "года" / "лет" и аналоги
  unitSum: string;                       // "сум" (валюта UZS словом)

  // ── Названия месяцев (12) ──
  monthNames: string[];
}

export const CALC_T: Record<CalcLang, CalcStrings> = {
  // ─────────────────────────────── RU ───────────────────────────────
  ru: {
    title: "Калькулятор растаможки",
    titleAccent: "авто из Кореи",
    forIndividuals: "Для физических лиц",
    pageSubtitle: "Актуальные ставки 2026 — Россия, Казахстан, Узбекистан. Для физических лиц.",
    countryRU: "Россия",
    countryKZ: "Казахстан",
    countryUZ: "Узбекистан",
    carParams: "Параметры автомобиля",
    priceLabel: "Стоимость авто (USD)",
    volumeLabel: "Объём двигателя",
    cc: "см³",
    yearLabel: "Год выпуска",
    monthLabel: "Месяц выпуска",
    fuelLabel: "Тип двигателя",
    fuelGasoline: "Бензин",
    fuelDiesel: "Дизель",
    fuelHybrid: "Гибрид (HEV / PHEV)",
    fuelElectric: "Электромобиль (EV)",
    powerLabel: "Мощность двигателя",
    hp: "л.с.",
    calculate: "Рассчитать →",
    calculating: "Загрузка курсов...",
    formHint: "💡 Расчёт ориентировочный. Доставка не включена. Актуальные ставки уточняйте у брокера.",
    emptyState: "Заполните параметры слева\nи нажмите «Рассчитать»",
    powerLabelHp: "Мощность двигателя (л.с.)",
    hpPlaceholder: "например: 150",
    calcShort: "Посчитать",
    sidebarHint: "💡 Дату производства и мощность двигателя уточняйте у продавца или на индивидуальном просчёте — от этих данных зависит итоговая сумма",
    kzUzHint: "💡 Дату производства уточняйте у продавца или на индивидуальном просчёте — от этих данных зависит итоговая сумма",
    errPrice: "Введите стоимость авто",
    errVolume: "Введите объём двигателя",
    errPower: "Введите мощность двигателя",
    errPowerHp: "Введите мощность двигателя в л.с.",
    ratesError: "Не удалось загрузить курсы валют. Попробуйте обновить страницу.",
    cbrPrefix: "Курс ЦБ РФ:",
    approxRateRU: "Приблизительный курс (ЦБ РФ недоступен):",
    approx: "(приблизительный)",
    totalCustoms: "Итого к оплате на таможне",
    totalCustomsShort: "Итого таможенных платежей",
    carPriceApprox: "Цена авто ≈",
    age: "Возраст:",
    months: "мес.",
    breakdown: "Расшифровка:",
    duty: "Таможенная пошлина",
    customsFee: "Таможенный сбор",
    recyclingFee: "Утилизационный сбор",
    recyclingFeeShort: "Утилсбор",
    total: "Итого",
    finalCostIn: "Итоговая стоимость авто в",
    finalCostInShort: "Итоговая стоимость в",
    countryRUgen: "России",
    countryKZgen: "Казахстане",
    countryUZgen: "Узбекистане",
    car: "Авто",
    customs: "Таможня",
    shippingNote: "🚢 Доставка не включена в расчёт — обсуждается отдельно",
    electricDuty0: "(0% — электро)",
    disclaimerRU: "⚠️ Расчёт ориентировочный для физических лиц по ставкам ЕАЭС. Не учтены: брокерские услуги, хранение, СБКТС, ЭПТС. Актуальные ставки уточняйте у таможенного брокера.",
    disclaimerKZ: "⚠️ Расчёт ориентировочный для физических лиц. Ставки МРП 2026, НДС 16% (новый НК РК с 01.01.2026). Доп. расходы (~400 000 ₸) — оценочные. Актуальные ставки уточняйте у таможенного брокера.",
    disclaimerUZ: "⚠️ Расчёт ориентировочный для физических лиц. Авто до 1 года, не ниже Euro-5, левый руль. С 01.01.2026 льготы на малолитражки отменены. Уточняйте у таможенного брокера.",
    commercialRate: "> 160 — коммерческая ставка",
    customsValue: "Таможенная стоимость",
    customsFeeMRP: "Таможенный сбор (6 МРП)",
    exciseEngine: "Акциз (объём >3 000 см³)",
    exciseLuxury: "Акциз на роскошь (10%)",
    vat16: "НДС 16%",
    registrationTson: "Первичная регистрация (ЦОН)",
    additionalKZ: "Доп. расходы (СБКТС, ЭВАК, брокер, СВХ)",
    electricTenge0: "(0 ₸ — электро)",
    warnOld7: "⚠️ Автомобиль старше 7 лет — пошлина по минимальной специфической ставке (€/см³), ввоз нецелесообразен",
    warnReg36Prefix: "мес. — сбор за первичную регистрацию 500 МРП",
    warnLuxuryPrefix: "💎 Таможенная стоимость превышает 18 000 МРП",
    warnLuxurySuffix: "— применяется акциз на роскошь +10%",
    customsFeePKM: "Таможенный сбор (ПКМ №700)",
    vat12: "НДС 12%",
    electricSum0: "(0 сум — электро)",
    warnUsed1y: "⚠️ Автомобиль старше 1 года — в Узбекистане применяются заградительные пошлины, ввоз нецелесообразен",
    bonusElectricUZ: "⚡ Электромобиль: пошлина 0%, утилизационный сбор 0 сум",
    ctaTitle: "Хотите точный расчёт с учётом доставки и брокерских услуг?",
    catalogCtaTitle: "Нашли подходящую стоимость?",
    catalogCtaText: "Подберём авто под ваш бюджет из каталога Encar",
    catalogCtaBtn: "Перейти в каталог →",
    seoH2: "Как рассчитывается растаможка авто из Кореи в 2026 году",
    seoIntro: "Калькулятор учитывает актуальные ставки таможенных пошлин ЕАЭС, утилизационного сбора и НДС для трёх стран. Расчёт производится для физических лиц при самостоятельном ввозе автомобиля.",
    seoCardRU: "Пошлина по комбинированной ставке ЕАЭС (% от стоимости + €/см³). Утилизационный сбор от 3 400 ₽ (льготная ставка для физлиц до 160 л.с.) до нескольких миллионов. Таможенный сбор — ступенчатая шкала по стоимости.",
    seoCardKZ: "Пошлина 15%. НДС 16% с 01.01.2026. Утильсбор привязан к МРП (4 325 ₸ в 2026). Первичная регистрация: от 1 081 ₸ (до 2 лет) до 2 162 500 ₸ (старше 3 лет). Электромобили: нулевой утильсбор.",
    seoCardUZ: "С 01.01.2026 льготы на малолитражки отменены. Пошлина = 15% + фикс. доплата в USD за каждый см³. НДС 12%. Утильсбор 30–300 БРВ. Электромобили: нулевая пошлина и утильсбор.",
    deliveryH3: "Сколько стоит доставка авто из Кореи",
    deliveryText: "Калькулятор считает только таможенные платежи — морской фрахт оплачивается отдельно. Самый дешёвый маршрут — до Владивостока: морской фрахт от $600. Дальше стоимость зависит от конечного региона доставки и габаритов авто. Точную сумму по вашему маршруту рассчитает менеджер.",
    leadTitle: "Получить точный расчёт с доставкой",
    leadText: "Оставьте контакт — менеджер посчитает итог под вашу машину и регион и поможет подобрать авто под бюджет.",
    faqH2: "Частые вопросы",
    faq: [
      { q: "Включена ли доставка в расчёт?", a: "Нет. Стоимость доставки из Кореи до таможни рассчитывается отдельно и зависит от маршрута, веса и габаритов автомобиля. Уточняйте у менеджера." },
      { q: "Для каких лиц работает калькулятор?", a: "Только для физических лиц. Для юридических лиц и ИП ставки существенно отличаются." },
      { q: "Насколько точен расчёт?", a: "Расчёт ориентировочный. Итоговая сумма может незначительно отличаться из-за актуального курса валют на дату оформления и индивидуальных параметров автомобиля." },
      { q: "Какие авто выгоднее всего ввозить в Казахстан?", a: "Новые электромобили (до 1 года): нулевой утильсбор и льготная пошлина. Новые бензиновые до 2 лет с объёмом до 2 000 см³ — оптимальное соотношение таможенной нагрузки к стоимости." },
      { q: "Почему в Узбекистане так дорого растаможивать ДВС?", a: "С 1 января 2026 года Узбекистан отменил льготы на малолитражки. Теперь все бензиновые и дизельные авто платят 15% пошлины плюс фиксированную доплату за каждый кубический сантиметр объёма. Это делает электромобили значительно выгоднее." },
    ],
    ageYearsWord: (n) => (n === 1 ? "год" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "года" : "лет"),
    unitSum: "сум",
    monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  },

  // ─────────────────────────────── EN ───────────────────────────────
  en: {
    title: "Customs calculator",
    titleAccent: "for cars from Korea",
    forIndividuals: "For individuals",
    pageSubtitle: "2026 rates — Russia, Kazakhstan, Uzbekistan. For individuals.",
    countryRU: "Russia",
    countryKZ: "Kazakhstan",
    countryUZ: "Uzbekistan",
    carParams: "Vehicle parameters",
    priceLabel: "Car price (USD)",
    volumeLabel: "Engine displacement",
    cc: "cc",
    yearLabel: "Year",
    monthLabel: "Month",
    fuelLabel: "Engine type",
    fuelGasoline: "Gasoline",
    fuelDiesel: "Diesel",
    fuelHybrid: "Hybrid (HEV / PHEV)",
    fuelElectric: "Electric (EV)",
    powerLabel: "Engine power",
    hp: "hp",
    calculate: "Calculate →",
    calculating: "Loading rates...",
    formHint: "💡 Estimate only. Shipping not included. Confirm current rates with a broker.",
    emptyState: "Fill in the parameters on the left\nand click “Calculate”",
    powerLabelHp: "Engine power (hp)",
    hpPlaceholder: "e.g. 150",
    calcShort: "Calculate",
    sidebarHint: "💡 Confirm the production date and engine power with the seller or via an individual quote — the final amount depends on these values",
    kzUzHint: "💡 Confirm the production date with the seller or via an individual quote — the final amount depends on it",
    errPrice: "Enter the car price",
    errVolume: "Enter the engine displacement",
    errPower: "Enter the engine power",
    errPowerHp: "Enter the engine power in hp",
    ratesError: "Failed to load exchange rates. Please refresh the page.",
    cbrPrefix: "CBR rate:",
    approxRateRU: "Approximate rate (CBR unavailable):",
    approx: "(approximate)",
    totalCustoms: "Total customs payment",
    totalCustomsShort: "Total customs payments",
    carPriceApprox: "Car price ≈",
    age: "Age:",
    months: "mo.",
    breakdown: "Breakdown:",
    duty: "Customs duty",
    customsFee: "Customs fee",
    recyclingFee: "Recycling fee",
    recyclingFeeShort: "Recycling fee",
    total: "Total",
    finalCostIn: "Total cost of the car in",
    finalCostInShort: "Total cost in",
    countryRUgen: "Russia",
    countryKZgen: "Kazakhstan",
    countryUZgen: "Uzbekistan",
    car: "Car",
    customs: "Customs",
    shippingNote: "🚢 Shipping is not included — discussed separately",
    electricDuty0: "(0% — electric)",
    disclaimerRU: "⚠️ Estimate for individuals based on EAEU rates. Not included: broker services, storage, SBKTS, EPTS. Confirm current rates with a customs broker.",
    disclaimerKZ: "⚠️ Estimate for individuals. MRP rates 2026, VAT 16% (new Kazakhstan Tax Code from 01.01.2026). Additional costs (~400,000 ₸) are estimated. Confirm current rates with a customs broker.",
    disclaimerUZ: "⚠️ Estimate for individuals. Car up to 1 year old, Euro-5 or higher, left-hand drive. From 01.01.2026 the small-engine exemptions are cancelled. Confirm with a customs broker.",
    commercialRate: "> 160 — commercial rate",
    customsValue: "Customs value",
    customsFeeMRP: "Customs fee (6 MRP)",
    exciseEngine: "Excise (displacement >3,000 cc)",
    exciseLuxury: "Luxury excise (10%)",
    vat16: "VAT 16%",
    registrationTson: "Initial registration (PSC)",
    additionalKZ: "Additional costs (SBKTS, EVAC, broker, warehouse)",
    electricTenge0: "(0 ₸ — electric)",
    warnOld7: "⚠️ The car is over 7 years old — duty at the minimum specific rate (€/cc), import is not viable",
    warnReg36Prefix: "mo. — initial registration fee 500 MRP",
    warnLuxuryPrefix: "💎 Customs value exceeds 18,000 MRP",
    warnLuxurySuffix: "— a luxury excise of +10% applies",
    customsFeePKM: "Customs fee (Resolution No. 700)",
    vat12: "VAT 12%",
    electricSum0: "(0 sum — electric)",
    warnUsed1y: "⚠️ The car is over 1 year old — Uzbekistan applies prohibitive duties, import is not viable",
    bonusElectricUZ: "⚡ Electric car: 0% duty, recycling fee 0 sum",
    ctaTitle: "Want an exact quote including shipping and broker services?",
    catalogCtaTitle: "Found a suitable price?",
    catalogCtaText: "We’ll pick a car within your budget from the Encar catalog",
    catalogCtaBtn: "Go to catalog →",
    seoH2: "How customs clearance for cars from Korea is calculated in 2026",
    seoIntro: "The calculator accounts for current EAEU customs duty rates, the recycling fee and VAT for three countries. The calculation is for individuals importing a vehicle themselves.",
    seoCardRU: "Duty at the combined EAEU rate (% of value + €/cc). Recycling fee from 3,400 ₽ (reduced rate for individuals up to 160 hp) to several million. Customs fee — a tiered scale based on value.",
    seoCardKZ: "Duty 15%. VAT 16% from 01.01.2026. Recycling fee tied to MRP (4,325 ₸ in 2026). Initial registration: from 1,081 ₸ (up to 2 years) to 2,162,500 ₸ (over 3 years). Electric cars: zero recycling fee.",
    seoCardUZ: "From 01.01.2026 the small-engine exemptions are cancelled. Duty = 15% + a fixed USD surcharge per cc. VAT 12%. Recycling fee 30–300 BRV. Electric cars: zero duty and recycling fee.",
    deliveryH3: "How much does shipping a car from Korea cost",
    deliveryText: "The calculator covers customs payments only — sea freight is paid separately. The cheapest route is to Vladivostok: sea freight from $600. Beyond that, the cost depends on the final delivery region and the car's dimensions. A manager will calculate the exact amount for your route.",
    leadTitle: "Get an exact quote with delivery",
    leadText: "Leave your contact — a manager will calculate the total for your specific car and region and help pick a car within budget.",
    faqH2: "Frequently asked questions",
    faq: [
      { q: "Is shipping included in the calculation?", a: "No. Shipping from Korea to customs is calculated separately and depends on the route, weight and dimensions of the car. Check with a manager." },
      { q: "Who is the calculator for?", a: "Individuals only. For companies and sole proprietors the rates differ significantly." },
      { q: "How accurate is the calculation?", a: "It is an estimate. The final amount may differ slightly due to the exchange rate on the clearance date and the individual parameters of the car." },
      { q: "Which cars are the most cost-effective to import into Kazakhstan?", a: "New electric cars (up to 1 year): zero recycling fee and a reduced duty. New gasoline cars up to 2 years old with a displacement up to 2,000 cc — the best ratio of customs burden to price." },
      { q: "Why is it so expensive to clear an internal-combustion car in Uzbekistan?", a: "From January 1, 2026 Uzbekistan cancelled the small-engine exemptions. Now all gasoline and diesel cars pay a 15% duty plus a fixed surcharge for each cubic centimeter of displacement. This makes electric cars significantly more cost-effective." },
    ],
    ageYearsWord: (n) => (n === 1 ? "year" : "years"),
    unitSum: "sum",
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },

  // ─────────────────────────────── KO ───────────────────────────────
  ko: {
    title: "통관 계산기",
    titleAccent: "한국 자동차",
    forIndividuals: "개인용",
    pageSubtitle: "2026년 최신 요율 — 러시아, 카자흐스탄, 우즈베키스탄. 개인용.",
    countryRU: "러시아",
    countryKZ: "카자흐스탄",
    countryUZ: "우즈베키스탄",
    carParams: "차량 정보",
    priceLabel: "차량 가격 (USD)",
    volumeLabel: "배기량",
    cc: "cc",
    yearLabel: "연식",
    monthLabel: "출고 월",
    fuelLabel: "엔진 유형",
    fuelGasoline: "가솔린",
    fuelDiesel: "디젤",
    fuelHybrid: "하이브리드 (HEV / PHEV)",
    fuelElectric: "전기차 (EV)",
    powerLabel: "엔진 출력",
    hp: "마력",
    calculate: "계산하기 →",
    calculating: "환율 불러오는 중...",
    formHint: "💡 예상 금액입니다. 배송비 미포함. 최신 요율은 통관사에 확인하세요.",
    emptyState: "왼쪽에 정보를 입력하고\n‘계산하기’를 누르세요",
    powerLabelHp: "엔진 출력 (마력)",
    hpPlaceholder: "예: 150",
    calcShort: "계산",
    sidebarHint: "💡 생산 연월과 엔진 출력은 판매자 또는 개별 견적으로 확인하세요 — 최종 금액이 이 값에 따라 달라집니다",
    kzUzHint: "💡 생산 연월은 판매자 또는 개별 견적으로 확인하세요 — 최종 금액이 이에 따라 달라집니다",
    errPrice: "차량 가격을 입력하세요",
    errVolume: "배기량을 입력하세요",
    errPower: "엔진 출력을 입력하세요",
    errPowerHp: "엔진 출력을 마력으로 입력하세요",
    ratesError: "환율을 불러오지 못했습니다. 페이지를 새로고침하세요.",
    cbrPrefix: "러시아 중앙은행 환율:",
    approxRateRU: "대략 환율 (중앙은행 이용 불가):",
    approx: "(대략)",
    totalCustoms: "통관 시 총 납부액",
    totalCustomsShort: "통관 비용 합계",
    carPriceApprox: "차량 가격 ≈",
    age: "연식:",
    months: "개월",
    breakdown: "내역:",
    duty: "관세",
    customsFee: "통관 수수료",
    recyclingFee: "폐차 부담금",
    recyclingFeeShort: "폐차 부담금",
    total: "합계",
    finalCostIn: "최종 차량 가격 —",
    finalCostInShort: "최종 가격 —",
    countryRUgen: "러시아",
    countryKZgen: "카자흐스탄",
    countryUZgen: "우즈베키스탄",
    car: "차량",
    customs: "통관",
    shippingNote: "🚢 배송비는 계산에 포함되지 않으며 별도 협의합니다",
    electricDuty0: "(0% — 전기)",
    disclaimerRU: "⚠️ EAEU 요율 기준 개인용 예상 금액. 미포함: 통관 대행, 보관, SBKTS, EPTS. 최신 요율은 통관사에 확인하세요.",
    disclaimerKZ: "⚠️ 개인용 예상 금액. 2026 MRP 요율, 부가세 16% (2026.01.01 신규 카자흐스탄 세법). 추가 비용(~400,000 ₸)은 추정치입니다. 최신 요율은 통관사에 확인하세요.",
    disclaimerUZ: "⚠️ 개인용 예상 금액. 1년 이내 차량, Euro-5 이상, 좌핸들. 2026.01.01부터 소형 엔진 감면 폐지. 통관사에 확인하세요.",
    commercialRate: "> 160 — 상업용 요율",
    customsValue: "과세가격",
    customsFeeMRP: "통관 수수료 (6 MRP)",
    exciseEngine: "개별소비세 (배기량 >3,000cc)",
    exciseLuxury: "사치세 (10%)",
    vat16: "부가세 16%",
    registrationTson: "최초 등록 (PSC)",
    additionalKZ: "추가 비용 (SBKTS, EVAC, 통관사, 보세창고)",
    electricTenge0: "(0 ₸ — 전기)",
    warnOld7: "⚠️ 7년 초과 차량 — 최저 종량 요율(€/cc) 적용, 수입 비권장",
    warnReg36Prefix: "개월 — 최초 등록비 500 MRP",
    warnLuxuryPrefix: "💎 과세가격이 18,000 MRP 초과",
    warnLuxurySuffix: "— 사치세 +10% 적용",
    customsFeePKM: "통관 수수료 (결의 제700호)",
    vat12: "부가세 12%",
    electricSum0: "(0 sum — 전기)",
    warnUsed1y: "⚠️ 1년 초과 차량 — 우즈베키스탄은 고율 관세 적용, 수입 비권장",
    bonusElectricUZ: "⚡ 전기차: 관세 0%, 폐차 부담금 0 sum",
    ctaTitle: "배송비와 통관 대행을 포함한 정확한 견적을 원하시나요?",
    catalogCtaTitle: "적당한 가격을 찾으셨나요?",
    catalogCtaText: "Encar 카탈로그에서 예산에 맞는 차량을 골라드립니다",
    catalogCtaBtn: "카탈로그로 이동 →",
    seoH2: "2026년 한국 자동차 통관 비용 계산 방법",
    seoIntro: "이 계산기는 3개국의 EAEU 관세, 폐차 부담금, 부가세 최신 요율을 반영합니다. 개인이 직접 차량을 수입하는 경우를 기준으로 계산합니다.",
    seoCardRU: "EAEU 복합 요율(가격의 % + €/cc) 관세. 폐차 부담금은 3,400 ₽(160마력 이하 개인 우대 요율)부터 수백만까지. 통관 수수료는 가격에 따른 단계별 요율.",
    seoCardKZ: "관세 15%. 2026.01.01부터 부가세 16%. 폐차 부담금은 MRP(2026년 4,325 ₸)에 연동. 최초 등록: 1,081 ₸(2년 이하)부터 2,162,500 ₸(3년 초과)까지. 전기차: 폐차 부담금 0.",
    seoCardUZ: "2026.01.01부터 소형 엔진 감면 폐지. 관세 = 15% + cc당 고정 USD 추가금. 부가세 12%. 폐차 부담금 30–300 BRV. 전기차: 관세와 폐차 부담금 0.",
    deliveryH3: "How much does shipping a car from Korea cost",
    deliveryText: "The calculator covers customs payments only — sea freight is paid separately. The cheapest route is to Vladivostok: sea freight from $600. Beyond that, the cost depends on the final delivery region and the car's dimensions. A manager will calculate the exact amount for your route.",
    leadTitle: "Get an exact quote with delivery",
    leadText: "Leave your contact — a manager will calculate the total for your specific car and region and help pick a car within budget.",
    faqH2: "자주 묻는 질문",
    faq: [
      { q: "배송비가 계산에 포함되나요?", a: "아니요. 한국에서 통관까지의 배송비는 별도로 계산되며 경로, 무게, 차량 크기에 따라 달라집니다. 담당자에게 확인하세요." },
      { q: "누구를 위한 계산기인가요?", a: "개인 전용입니다. 법인 및 개인사업자는 요율이 크게 다릅니다." },
      { q: "계산이 얼마나 정확한가요?", a: "예상치입니다. 통관일의 환율과 차량 개별 사양에 따라 최종 금액이 다소 달라질 수 있습니다." },
      { q: "카자흐스탄에 수입할 때 가장 유리한 차량은?", a: "신형 전기차(1년 이내): 폐차 부담금 0, 우대 관세. 배기량 2,000cc 이하 2년 이내 신형 가솔린차 — 통관 부담 대비 가격이 가장 좋습니다." },
      { q: "우즈베키스탄에서 내연기관차 통관이 왜 비싼가요?", a: "2026년 1월 1일부터 우즈베키스탄은 소형 엔진 감면을 폐지했습니다. 이제 모든 가솔린·디젤 차량은 15% 관세에 배기량 cc당 고정 추가금을 냅니다. 이로 인해 전기차가 훨씬 유리해졌습니다." },
    ],
    ageYearsWord: () => "년",
    unitSum: "sum",
    monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  },

  // ─────────────────────────────── KA ───────────────────────────────
  ka: {
    title: "განბაჟების კალკულატორი",
    titleAccent: "კორეული ავტომობილები",
    forIndividuals: "ფიზიკური პირებისთვის",
    pageSubtitle: "2026 წლის განაკვეთები — რუსეთი, ყაზახეთი, უზბეკეთი. ფიზიკური პირებისთვის.",
    countryRU: "რუსეთი",
    countryKZ: "ყაზახეთი",
    countryUZ: "უზბეკეთი",
    carParams: "ავტომობილის მონაცემები",
    priceLabel: "ავტომობილის ფასი (USD)",
    volumeLabel: "ძრავის მოცულობა",
    cc: "სმ³",
    yearLabel: "გამოშვების წელი",
    monthLabel: "გამოშვების თვე",
    fuelLabel: "ძრავის ტიპი",
    fuelGasoline: "ბენზინი",
    fuelDiesel: "დიზელი",
    fuelHybrid: "ჰიბრიდი (HEV / PHEV)",
    fuelElectric: "ელექტრო (EV)",
    powerLabel: "ძრავის სიმძლავრე",
    hp: "ცხ.ძ.",
    calculate: "გამოთვლა →",
    calculating: "კურსების ჩატვირთვა...",
    formHint: "💡 გათვლა სავარაუდოა. მიწოდება არ შედის. მიმდინარე განაკვეთები დააზუსტეთ ბროკერთან.",
    emptyState: "შეავსეთ პარამეტრები მარცხნივ\nდა დააჭირეთ „გამოთვლას“",
    powerLabelHp: "ძრავის სიმძლავრე (ცხ.ძ.)",
    hpPlaceholder: "მაგ.: 150",
    calcShort: "გამოთვლა",
    sidebarHint: "💡 გამოშვების თარიღი და ძრავის სიმძლავრე დააზუსტეთ გამყიდველთან ან ინდივიდუალურ გათვლაზე — საბოლოო თანხა ამ მონაცემებზეა დამოკიდებული",
    kzUzHint: "💡 გამოშვების თარიღი დააზუსტეთ გამყიდველთან ან ინდივიდუალურ გათვლაზე — საბოლოო თანხა ამაზეა დამოკიდებული",
    errPrice: "შეიყვანეთ ავტომობილის ფასი",
    errVolume: "შეიყვანეთ ძრავის მოცულობა",
    errPower: "შეიყვანეთ ძრავის სიმძლავრე",
    errPowerHp: "შეიყვანეთ ძრავის სიმძლავრე ცხ.ძ.-ში",
    ratesError: "ვერ ჩაიტვირთა ვალუტის კურსები. გთხოვთ, განაახლოთ გვერდი.",
    cbrPrefix: "რუსეთის ცენტრალური ბანკის კურსი:",
    approxRateRU: "სავარაუდო კურსი (ცენტრალური ბანკი მიუწვდომელია):",
    approx: "(სავარაუდო)",
    totalCustoms: "საბაჟოზე გადასახდელი ჯამი",
    totalCustomsShort: "საბაჟო გადასახადების ჯამი",
    carPriceApprox: "ავტომობილის ფასი ≈",
    age: "ასაკი:",
    months: "თვე",
    breakdown: "დეტალები:",
    duty: "საბაჟო გადასახადი",
    customsFee: "საბაჟო მოსაკრებელი",
    recyclingFee: "უტილიზაციის მოსაკრებელი",
    recyclingFeeShort: "უტილიზაცია",
    total: "ჯამი",
    finalCostIn: "ავტომობილის საბოლოო ღირებულება —",
    finalCostInShort: "საბოლოო ღირებულება —",
    countryRUgen: "რუსეთი",
    countryKZgen: "ყაზახეთი",
    countryUZgen: "უზბეკეთი",
    car: "ავტო",
    customs: "საბაჟო",
    shippingNote: "🚢 მიწოდება არ შედის გათვლაში — განიხილება ცალკე",
    electricDuty0: "(0% — ელექტრო)",
    disclaimerRU: "⚠️ სავარაუდო გათვლა ფიზიკური პირებისთვის EAEU-ს განაკვეთებით. არ შედის: საბროკერო მომსახურება, შენახვა, SBKTS, EPTS. მიმდინარე განაკვეთები დააზუსტეთ საბაჟო ბროკერთან.",
    disclaimerKZ: "⚠️ სავარაუდო გათვლა ფიზიკური პირებისთვის. MRP განაკვეთები 2026, დღგ 16% (ყაზახეთის ახალი საგადასახადო კოდექსი 01.01.2026-დან). დამატებითი ხარჯები (~400,000 ₸) სავარაუდოა. მიმდინარე განაკვეთები დააზუსტეთ საბაჟო ბროკერთან.",
    disclaimerUZ: "⚠️ სავარაუდო გათვლა ფიზიკური პირებისთვის. ავტო 1 წლამდე, Euro-5 ან მაღალი, მარცხენა საჭე. 01.01.2026-დან მცირე ძრავის შეღავათები გაუქმებულია. დააზუსტეთ საბაჟო ბროკერთან.",
    commercialRate: "> 160 — კომერციული განაკვეთი",
    customsValue: "საბაჟო ღირებულება",
    customsFeeMRP: "საბაჟო მოსაკრებელი (6 MRP)",
    exciseEngine: "აქციზი (მოცულობა >3,000 სმ³)",
    exciseLuxury: "ფუფუნების აქციზი (10%)",
    vat16: "დღგ 16%",
    registrationTson: "პირველადი რეგისტრაცია (PSC)",
    additionalKZ: "დამატებითი ხარჯები (SBKTS, EVAC, ბროკერი, საწყობი)",
    electricTenge0: "(0 ₸ — ელექტრო)",
    warnOld7: "⚠️ ავტომობილი 7 წელზე მეტია — გადასახადი მინიმალური სპეციფიკური განაკვეთით (€/სმ³), შემოტანა არარენტაბელურია",
    warnReg36Prefix: "თვე — პირველადი რეგისტრაციის მოსაკრებელი 500 MRP",
    warnLuxuryPrefix: "💎 საბაჟო ღირებულება აღემატება 18,000 MRP-ს",
    warnLuxurySuffix: "— გამოიყენება ფუფუნების აქციზი +10%",
    customsFeePKM: "საბაჟო მოსაკრებელი (დადგენილება №700)",
    vat12: "დღგ 12%",
    electricSum0: "(0 sum — ელექტრო)",
    warnUsed1y: "⚠️ ავტომობილი 1 წელზე მეტია — უზბეკეთში მოქმედებს ამკრძალავი გადასახადები, შემოტანა არარენტაბელურია",
    bonusElectricUZ: "⚡ ელექტრომობილი: გადასახადი 0%, უტილიზაციის მოსაკრებელი 0 sum",
    ctaTitle: "გსურთ ზუსტი გათვლა მიწოდებისა და საბროკერო მომსახურების ჩათვლით?",
    catalogCtaTitle: "იპოვეთ შესაფერისი ფასი?",
    catalogCtaText: "შევარჩევთ ავტომობილს თქვენს ბიუჯეტზე Encar-ის კატალოგიდან",
    catalogCtaBtn: "კატალოგში გადასვლა →",
    seoH2: "როგორ გამოითვლება კორეული ავტომობილის განბაჟება 2026 წელს",
    seoIntro: "კალკულატორი ითვალისწინებს EAEU-ს საბაჟო გადასახადების, უტილიზაციის მოსაკრებლისა და დღგ-ს მიმდინარე განაკვეთებს სამი ქვეყნისთვის. გათვლა ხდება ფიზიკური პირებისთვის ავტომობილის დამოუკიდებელი შემოტანისას.",
    seoCardRU: "გადასახადი EAEU-ს კომბინირებული განაკვეთით (% ღირებულებიდან + €/სმ³). უტილიზაციის მოსაკრებელი 3,400 ₽-დან (შეღავათიანი განაკვეთი ფიზიკური პირებისთვის 160 ცხ.ძ.-მდე) რამდენიმე მილიონამდე. საბაჟო მოსაკრებელი — საფეხურებრივი შკალა ღირებულების მიხედვით.",
    seoCardKZ: "გადასახადი 15%. დღგ 16% 01.01.2026-დან. უტილიზაცია მიბმულია MRP-ზე (4,325 ₸ 2026-ში). პირველადი რეგისტრაცია: 1,081 ₸-დან (2 წლამდე) 2,162,500 ₸-მდე (3 წელზე მეტი). ელექტრომობილები: ნულოვანი უტილიზაცია.",
    seoCardUZ: "01.01.2026-დან მცირე ძრავის შეღავათები გაუქმებულია. გადასახადი = 15% + ფიქსირებული USD დანამატი ყოველ სმ³-ზე. დღგ 12%. უტილიზაცია 30–300 BRV. ელექტრომობილები: ნულოვანი გადასახადი და უტილიზაცია.",
    deliveryH3: "How much does shipping a car from Korea cost",
    deliveryText: "The calculator covers customs payments only — sea freight is paid separately. The cheapest route is to Vladivostok: sea freight from $600. Beyond that, the cost depends on the final delivery region and the car's dimensions. A manager will calculate the exact amount for your route.",
    leadTitle: "Get an exact quote with delivery",
    leadText: "Leave your contact — a manager will calculate the total for your specific car and region and help pick a car within budget.",
    faqH2: "ხშირად დასმული კითხვები",
    faq: [
      { q: "შედის თუ არა მიწოდება გათვლაში?", a: "არა. მიწოდება კორეიდან საბაჟომდე იანგარიშება ცალკე და დამოკიდებულია მარშრუტზე, წონასა და ავტომობილის ზომებზე. დააზუსტეთ მენეჯერთან." },
      { q: "ვისთვის მუშაობს კალკულატორი?", a: "მხოლოდ ფიზიკური პირებისთვის. იურიდიული პირებისა და ინდ. მეწარმეებისთვის განაკვეთები მნიშვნელოვნად განსხვავდება." },
      { q: "რამდენად ზუსტია გათვლა?", a: "გათვლა სავარაუდოა. საბოლოო თანხა შეიძლება ოდნავ განსხვავდებოდეს განბაჟების დღეს ვალუტის კურსისა და ავტომობილის ინდივიდუალური პარამეტრების გამო." },
      { q: "რომელი ავტომობილების შემოტანაა ყველაზე მომგებიანი ყაზახეთში?", a: "ახალი ელექტრომობილები (1 წლამდე): ნულოვანი უტილიზაცია და შეღავათიანი გადასახადი. ახალი ბენზინის 2 წლამდე 2,000 სმ³-მდე მოცულობით — საბაჟო ტვირთისა და ფასის საუკეთესო თანაფარდობა." },
      { q: "რატომ არის უზბეკეთში ძვირი ДВС-ის განბაჟება?", a: "2026 წლის 1 იანვრიდან უზბეკეთმა გააუქმა მცირე ძრავის შეღავათები. ახლა ყველა ბენზინისა და დიზელის ავტომობილი იხდის 15% გადასახადს პლუს ფიქსირებულ დანამატს ყოველ კუბურ სანტიმეტრზე. ეს ელექტრომობილებს გაცილებით მომგებიანს ხდის." },
    ],
    ageYearsWord: () => "წელი",
    unitSum: "sum",
    monthNames: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
  },

  // ─────────────────────────────── AR ───────────────────────────────
  ar: {
    title: "حاسبة التخليص الجمركي",
    titleAccent: "لسيارات من كوريا",
    forIndividuals: "للأفراد",
    pageSubtitle: "أسعار 2026 — روسيا، كازاخستان، أوزبكستان. للأفراد.",
    countryRU: "روسيا",
    countryKZ: "كازاخستان",
    countryUZ: "أوزبكستان",
    carParams: "بيانات السيارة",
    priceLabel: "سعر السيارة (USD)",
    volumeLabel: "سعة المحرك",
    cc: "سم³",
    yearLabel: "سنة الصنع",
    monthLabel: "شهر الصنع",
    fuelLabel: "نوع المحرك",
    fuelGasoline: "بنزين",
    fuelDiesel: "ديزل",
    fuelHybrid: "هجين (HEV / PHEV)",
    fuelElectric: "كهربائية (EV)",
    powerLabel: "قوة المحرك",
    hp: "حصان",
    calculate: "احسب →",
    calculating: "جارٍ تحميل الأسعار...",
    formHint: "💡 الحساب تقديري. الشحن غير مشمول. تأكد من الأسعار الحالية مع وسيط.",
    emptyState: "املأ البيانات على اليسار\nثم اضغط «احسب»",
    powerLabelHp: "قوة المحرك (حصان)",
    hpPlaceholder: "مثال: 150",
    calcShort: "احسب",
    sidebarHint: "💡 تأكد من تاريخ الصنع وقوة المحرك مع البائع أو عبر عرض سعر فردي — المبلغ النهائي يعتمد على هذه البيانات",
    kzUzHint: "💡 تأكد من تاريخ الصنع مع البائع أو عبر عرض سعر فردي — المبلغ النهائي يعتمد على ذلك",
    errPrice: "أدخل سعر السيارة",
    errVolume: "أدخل سعة المحرك",
    errPower: "أدخل قوة المحرك",
    errPowerHp: "أدخل قوة المحرك بالحصان",
    ratesError: "تعذّر تحميل أسعار الصرف. يرجى تحديث الصفحة.",
    cbrPrefix: "سعر البنك المركزي الروسي:",
    approxRateRU: "سعر تقريبي (البنك المركزي غير متاح):",
    approx: "(تقريبي)",
    totalCustoms: "إجمالي المدفوع في الجمارك",
    totalCustomsShort: "إجمالي الرسوم الجمركية",
    carPriceApprox: "سعر السيارة ≈",
    age: "العمر:",
    months: "شهر",
    breakdown: "التفصيل:",
    duty: "الرسوم الجمركية",
    customsFee: "رسوم التخليص",
    recyclingFee: "رسوم إعادة التدوير",
    recyclingFeeShort: "إعادة التدوير",
    total: "الإجمالي",
    finalCostIn: "التكلفة النهائية للسيارة في",
    finalCostInShort: "التكلفة النهائية في",
    countryRUgen: "روسيا",
    countryKZgen: "كازاخستان",
    countryUZgen: "أوزبكستان",
    car: "السيارة",
    customs: "الجمارك",
    shippingNote: "🚢 الشحن غير مشمول في الحساب — يُناقش على حدة",
    electricDuty0: "(0% — كهربائية)",
    disclaimerRU: "⚠️ حساب تقديري للأفراد وفق أسعار الاتحاد الاقتصادي الأوراسي. غير مشمول: خدمات الوسيط، التخزين، SBKTS، EPTS. تأكد من الأسعار الحالية مع وسيط جمركي.",
    disclaimerKZ: "⚠️ حساب تقديري للأفراد. أسعار MRP 2026، ضريبة القيمة المضافة 16% (قانون ضرائب كازاخستان الجديد من 01.01.2026). التكاليف الإضافية (~400,000 ₸) تقديرية. تأكد من الأسعار الحالية مع وسيط جمركي.",
    disclaimerUZ: "⚠️ حساب تقديري للأفراد. سيارة أقل من سنة، Euro-5 أو أعلى، مقود يسار. من 01.01.2026 أُلغيت إعفاءات المحركات الصغيرة. تأكد مع وسيط جمركي.",
    commercialRate: "> 160 — سعر تجاري",
    customsValue: "القيمة الجمركية",
    customsFeeMRP: "رسوم التخليص (6 MRP)",
    exciseEngine: "ضريبة إنتاج (سعة >3,000 سم³)",
    exciseLuxury: "ضريبة الرفاهية (10%)",
    vat16: "ضريبة القيمة المضافة 16%",
    registrationTson: "التسجيل الأولي (PSC)",
    additionalKZ: "تكاليف إضافية (SBKTS، EVAC، وسيط، مستودع)",
    electricTenge0: "(0 ₸ — كهربائية)",
    warnOld7: "⚠️ السيارة أقدم من 7 سنوات — الرسوم بالحد الأدنى للسعر النوعي (€/سم³)، الاستيراد غير مجدٍ",
    warnReg36Prefix: "شهر — رسوم التسجيل الأولي 500 MRP",
    warnLuxuryPrefix: "💎 القيمة الجمركية تتجاوز 18,000 MRP",
    warnLuxurySuffix: "— تُطبَّق ضريبة الرفاهية +10%",
    customsFeePKM: "رسوم التخليص (القرار رقم 700)",
    vat12: "ضريبة القيمة المضافة 12%",
    electricSum0: "(0 sum — كهربائية)",
    warnUsed1y: "⚠️ السيارة أقدم من سنة — تطبّق أوزبكستان رسومًا مانعة، الاستيراد غير مجدٍ",
    bonusElectricUZ: "⚡ سيارة كهربائية: رسوم 0%، رسوم إعادة تدوير 0 sum",
    ctaTitle: "هل تريد عرض سعر دقيقًا يشمل الشحن وخدمات الوسيط؟",
    catalogCtaTitle: "وجدت السعر المناسب؟",
    catalogCtaText: "سنختار لك سيارة ضمن ميزانيتك من كتالوج Encar",
    catalogCtaBtn: "الانتقال إلى الكتالوج →",
    seoH2: "كيف يُحسب التخليص الجمركي لسيارات كوريا في 2026",
    seoIntro: "تأخذ الحاسبة في الاعتبار أسعار الرسوم الجمركية للاتحاد الأوراسي ورسوم إعادة التدوير وضريبة القيمة المضافة الحالية لثلاث دول. يتم الحساب للأفراد عند استيراد السيارة بأنفسهم.",
    seoCardRU: "الرسوم بالسعر المركّب للاتحاد الأوراسي (% من القيمة + €/سم³). رسوم إعادة التدوير من 3,400 ₽ (سعر مخفّض للأفراد حتى 160 حصانًا) إلى عدة ملايين. رسوم التخليص — جدول تدريجي حسب القيمة.",
    seoCardKZ: "الرسوم 15%. ضريبة القيمة المضافة 16% من 01.01.2026. رسوم إعادة التدوير مرتبطة بـ MRP (4,325 ₸ في 2026). التسجيل الأولي: من 1,081 ₸ (حتى سنتين) إلى 2,162,500 ₸ (أكثر من 3 سنوات). السيارات الكهربائية: رسوم إعادة تدوير صفرية.",
    seoCardUZ: "من 01.01.2026 أُلغيت إعفاءات المحركات الصغيرة. الرسوم = 15% + إضافة ثابتة بالدولار لكل سم³. ضريبة القيمة المضافة 12%. رسوم إعادة التدوير 30–300 BRV. السيارات الكهربائية: رسوم صفرية وإعادة تدوير صفرية.",
    deliveryH3: "How much does shipping a car from Korea cost",
    deliveryText: "The calculator covers customs payments only — sea freight is paid separately. The cheapest route is to Vladivostok: sea freight from $600. Beyond that, the cost depends on the final delivery region and the car's dimensions. A manager will calculate the exact amount for your route.",
    leadTitle: "Get an exact quote with delivery",
    leadText: "Leave your contact — a manager will calculate the total for your specific car and region and help pick a car within budget.",
    faqH2: "الأسئلة الشائعة",
    faq: [
      { q: "هل الشحن مشمول في الحساب؟", a: "لا. يُحسب الشحن من كوريا إلى الجمارك على حدة ويعتمد على المسار والوزن وأبعاد السيارة. تأكد مع المدير." },
      { q: "لمن تعمل الحاسبة؟", a: "للأفراد فقط. تختلف الأسعار كثيرًا للشركات وأصحاب المشاريع الفردية." },
      { q: "ما مدى دقة الحساب؟", a: "الحساب تقديري. قد يختلف المبلغ النهائي قليلًا بسبب سعر الصرف في يوم التخليص والمواصفات الفردية للسيارة." },
      { q: "ما السيارات الأكثر جدوى للاستيراد إلى كازاخستان؟", a: "السيارات الكهربائية الجديدة (حتى سنة): رسوم إعادة تدوير صفرية ورسوم مخفّضة. السيارات البنزينية الجديدة حتى سنتين بسعة حتى 2,000 سم³ — أفضل نسبة بين العبء الجمركي والسعر." },
      { q: "لماذا تخليص سيارات الاحتراق الداخلي مكلف في أوزبكستان؟", a: "من 1 يناير 2026 ألغت أوزبكستان إعفاءات المحركات الصغيرة. الآن تدفع جميع سيارات البنزين والديزل رسومًا 15% إضافةً إلى مبلغ ثابت لكل سنتيمتر مكعب من السعة. هذا يجعل السيارات الكهربائية أكثر جدوى بكثير." },
    ],
    ageYearsWord: () => "سنة",
    unitSum: "sum",
    monthNames: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
};

export function getCalcStrings(lang: string): CalcStrings {
  return CALC_T[(lang as CalcLang)] ?? CALC_T.ru;
}
