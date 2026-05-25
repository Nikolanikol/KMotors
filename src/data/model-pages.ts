export interface ModelFaq {
  q: string;
  a: string;
}

export interface ModelData {
  slug: string;
  manufacturer: string;        // для CarSlider фильтра (на корейском)
  manufacturerEn: string;      // Hyundai / KIA
  modelKo: string;             // корейское название для API
  catalogFilter: string;       // параметр для ссылки на каталог
  coverImage: string;          // путь к обложке в /public/models/
  gallery: string[];           // массив путей к фото галереи
  priceFrom: number;           // от, тыс. руб.
  priceTo: number;             // до, тыс. руб.
  years: string;               // диапазон годов
  encarQuery: string;          // готовый query для Encar API (прокси)
  sliderUrl?: string;          // прямой URL к Encar API (если прокси не работает)
  content: {
    ru: {
      title: string;
      subtitle: string;
      description: string;
      benefits: { title: string; text: string }[];
      steps: { title: string; text: string }[];
      faq: ModelFaq[];
    };
    en: {
      title: string;
      subtitle: string;
      description: string;
      benefits: { title: string; text: string }[];
      steps: { title: string; text: string }[];
      faq: ModelFaq[];
    };
  };
}

export const MODEL_PAGES: ModelData[] = [
  {
    slug: "kia-sorento",
    manufacturer: "기아",
    manufacturerEn: "KIA",
    modelKo: "쏘렌토",
    catalogFilter: ".Sorento",
    coverImage: "/models/kia-sorento/1.webp",
    gallery: ["/models/kia-sorento/1.webp", "/models/kia-sorento/2.webp", "/models/kia-sorento/3.webp", "/models/kia-sorento/4.webp"],
    sliderUrl: "https://api.encar.com/search/car/list/premium?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%EA%B8%B0%EC%95%84._.ModelGroup.%EC%8F%98%EB%A0%8C%ED%86%A0.))_.Mileage.range(..50000).)&sr=%7CModifiedDate%7C%7C20",
    priceFrom: 2200,
    priceTo: 5500,
    years: "2020–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84._.ModelGroup.%EC%8F%98%EB%A0%8C%ED%86%A0.))",
    content: {
      ru: {
        title: "KIA Sorento из Кореи — купить с пробегом, цена под ключ",
        subtitle: "7-местный кроссовер напрямую с корейского рынка. Личный осмотр в Сувоне.",
        description: "KIA Sorento — один из самых популярных автомобилей из Кореи. Вместительный 7-местный кроссовер с богатым оснащением, надёжными двигателями и современным дизайном. На корейском рынке представлен в широком диапазоне комплектаций по ценам значительно ниже российского рынка.",
        benefits: [
          { title: "Экономия 30–50%", text: "Цена Sorento на корейском рынке значительно ниже, чем у официальных дилеров в России и Казахстане — даже с учётом доставки и таможни." },
          { title: "Личный осмотр", text: "Каждый автомобиль осматривается лично в Сувоне перед покупкой. Вы получаете фото и видеоотчёт со всеми деталями кузова и салона." },
          { title: "Доставка 3–6 недель", text: "Морская доставка до Владивостока занимает 7–14 дней. С учётом таможни и оформления — от 3 до 6 недель до получения." },
        ],
        steps: [
          { title: "Выберите автомобиль", text: "Просмотрите каталог или напишите нам — подберём вариант под ваш бюджет." },
          { title: "Задаток и осмотр", text: "Вносите задаток, мы осматриваем авто лично и отправляем отчёт." },
          { title: "Оплата и отправка", text: "После подтверждения оплачиваете остаток — авто отправляется в Россию." },
          { title: "Получение", text: "Встречаете автомобиль во Владивостоке или договариваемся о доставке до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит KIA Sorento из Кореи под ключ?", a: "В зависимости от года выпуска и комплектации — от 2 200 000 до 5 500 000 ₽ под ключ с учётом доставки, таможни и утилизационного сбора. Для точного расчёта напишите нам в Telegram." },
          { q: "Сколько времени занимает доставка KIA Sorento из Кореи?", a: "Морская доставка до Владивостока — 7–14 дней. С учётом таможенного оформления и подготовки документов — от 3 до 6 недель с момента покупки." },
          { q: "Можно ли проверить Sorento перед покупкой?", a: "Да. После внесения задатка мы лично осматриваем автомобиль в Корее и отправляем вам подробный фото- и видеоотчёт. Вы принимаете решение до полной оплаты." },
        ],
      },
      en: {
        title: "KIA Sorento from Korea — buy used, all-in price",
        subtitle: "7-seat crossover directly from the Korean market. Personal inspection in Suwon.",
        description: "KIA Sorento is one of the most popular cars imported from Korea. A spacious 7-seat crossover with rich equipment and reliable engines, available at prices significantly below European and Russian markets.",
        benefits: [
          { title: "30–50% savings", text: "Sorento prices on the Korean market are significantly lower than at official dealers in Russia and Kazakhstan — even including shipping and customs." },
          { title: "Personal inspection", text: "Every car is personally inspected in Suwon before purchase. You receive a detailed photo and video report." },
          { title: "3–6 week delivery", text: "Sea delivery to Vladivostok takes 7–14 days. Including customs and registration — 3 to 6 weeks total." },
        ],
        steps: [
          { title: "Choose a car", text: "Browse the catalog or contact us — we'll find the right option for your budget." },
          { title: "Deposit & inspection", text: "Pay a deposit, we inspect the car personally and send a detailed report." },
          { title: "Payment & shipping", text: "After confirmation, pay the balance — the car is shipped to Russia." },
          { title: "Pickup", text: "Collect your car in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a KIA Sorento from Korea cost all-in?", a: "Depending on the year and trim level — from $24,000 to $60,000 all-in including shipping, customs and recycling fee. Contact us for an exact quote." },
          { q: "How long does delivery take?", a: "Sea delivery to Vladivostok — 7–14 days. Including customs — 3 to 6 weeks from purchase." },
          { q: "Can I inspect the Sorento before buying?", a: "Yes. After the deposit we personally inspect the car in Korea and send you a detailed photo and video report." },
        ],
      },
    },
  },
  {
    slug: "hyundai-tucson",
    manufacturer: "현대",
    manufacturerEn: "Hyundai",
    modelKo: "투싼",
    catalogFilter: ".Tucson",
    coverImage: "/models/tucson.avif",
    gallery: [],
    priceFrom: 1500,
    priceTo: 3500,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80._.ModelGroup.%ED%88%AC%EC%8C%98.))",
    content: {
      ru: {
        title: "Hyundai Tucson из Кореи — купить с пробегом, цена под ключ",
        subtitle: "Компактный кроссовер с лучшим соотношением цены и качества на рынке.",
        description: "Hyundai Tucson — самый продаваемый компактный кроссовер в Корее. Экономичный, надёжный, с современным дизайном и богатым оснащением. Отличный выбор для города и путешествий. На корейском рынке огромный выбор комплектаций по доступным ценам.",
        benefits: [
          { title: "Лучшая цена", text: "Tucson из Кореи выходит на 25–45% дешевле, чем аналогичный автомобиль у российских дилеров или на вторичном рынке." },
          { title: "Огромный выбор", text: "На корейском рынке тысячи Tucson разных годов, комплектаций и цветов. Найдём именно тот, что вам нужен." },
          { title: "Гарантия осмотра", text: "Каждый Tucson осматривается в Сувоне лично. Вы видите реальное состояние авто до оплаты." },
        ],
        steps: [
          { title: "Выберите автомобиль", text: "Просмотрите каталог или опишите желаемый вариант — подберём по бюджету." },
          { title: "Задаток и осмотр", text: "Вносите задаток, мы осматриваем и отправляем подробный отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете остаток, авто отправляется." },
          { title: "Получение", text: "Забираете во Владивостоке или договариваемся о доставке до вас." },
        ],
        faq: [
          { q: "Сколько стоит Hyundai Tucson из Кореи под ключ?", a: "От 1 500 000 до 3 500 000 ₽ в зависимости от года и комплектации. Tucson 2021–2022 среднего уровня обходится в 2–2.5 млн ₽ под ключ." },
          { q: "Какие двигатели доступны на Tucson из Кореи?", a: "На корейском рынке Tucson представлен с бензиновыми (2.0, 2.5), дизельными (1.6d, 2.0d) и гибридными двигателями. Самые популярные запросы — бензин 2.0 и гибрид." },
          { q: "Какой пробег обычно у Tucson из Кореи?", a: "Большинство предложений — пробег 30 000–100 000 км. Корейский рынок отличается честной историей обслуживания и минимальным пробегом относительно возраста автомобиля." },
        ],
      },
      en: {
        title: "Hyundai Tucson from Korea — buy used, all-in price",
        subtitle: "Compact crossover with the best price-to-quality ratio on the market.",
        description: "Hyundai Tucson is the best-selling compact crossover in Korea. Economical, reliable, with modern design and rich equipment. An excellent choice for city and travel.",
        benefits: [
          { title: "Best price", text: "Tucson from Korea is 25–45% cheaper than similar cars at Russian dealers or on the secondary market." },
          { title: "Huge selection", text: "Thousands of Tucson models of different years, trims and colors on the Korean market." },
          { title: "Inspection guarantee", text: "Every Tucson is personally inspected in Suwon. You see the real condition before payment." },
        ],
        steps: [
          { title: "Choose a car", text: "Browse the catalog or describe what you need — we'll find it within your budget." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect and send a detailed report." },
          { title: "Payment & shipping", text: "Confirm and pay the balance — car is shipped." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a Hyundai Tucson from Korea cost all-in?", a: "From $16,000 to $38,000 depending on year and trim. A 2021–2022 mid-spec Tucson typically comes to around $22,000–$27,000 all-in." },
          { q: "What engines are available on Tucson from Korea?", a: "The Korean market Tucson comes with gasoline (2.0, 2.5), diesel (1.6d, 2.0d) and hybrid engines. Most popular are the 2.0 gasoline and hybrid." },
          { q: "What mileage do Korean Tucsons typically have?", a: "Most listings show 30,000–100,000 km. Korea is known for honest service history and relatively low mileage for vehicle age." },
        ],
      },
    },
  },
  {
    slug: "kia-carnival",
    manufacturer: "기아",
    manufacturerEn: "KIA",
    modelKo: "카니발",
    catalogFilter: ".Carnival",
    coverImage: "/models/carnival.avif",
    gallery: [],
    priceFrom: 3000,
    priceTo: 7000,
    years: "2020–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84._.ModelGroup.%EC%B9%B4%EB%8B%88%EB%B0%9C.))",
    content: {
      ru: {
        title: "KIA Carnival из Кореи — купить минивэн, цена под ключ",
        subtitle: "Премиальный 7–9-местный минивэн для семьи. Уровень бизнес-класса по разумной цене.",
        description: "KIA Carnival — культовый минивэн на корейском рынке. Просторный, комфортный, с роскошным салоном и передовыми системами безопасности. Идеален для больших семей, корпоративных поездок и путешествий. В России стоит в 2–3 раза дороже чем в Корее.",
        benefits: [
          { title: "Бизнес-класс по цене эконома", text: "Carnival 4-го поколения предлагает уровень комфорта Mercedes V-Class при цене вдвое ниже." },
          { title: "7, 8 или 9 мест", text: "Доступен в различных конфигурациях салона — от 7-местного люкс до 9-местного семейного варианта." },
          { title: "Корейское качество", text: "На корейском рынке Carnival поставлялся с максимальным оснащением: панорамная крыша, массаж кресел, мониторы на сиденьях." },
        ],
        steps: [
          { title: "Выберите конфигурацию", text: "7, 8 или 9 мест, год, бюджет — напишите нам и подберём." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем лично, отправляем отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете остаток, Carnival отправляется." },
          { title: "Получение", text: "Забираете во Владивостоке или доставляем до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит KIA Carnival из Кореи под ключ?", a: "В зависимости от года и комплектации — от 3 000 000 до 7 000 000 ₽. Carnival 4-го поколения 2021–2022 в базовой комплектации — около 3.5–4.5 млн ₽ под ключ." },
          { q: "Carnival 4 Generation — чем отличается от предыдущих?", a: "4-е поколение (с 2020 года) — полностью новая платформа. Значительно просторнее, современный дизайн, улучшенные системы безопасности, новые опции комфорта." },
          { q: "Есть ли Carnival с 9 местами?", a: "Да, на корейском рынке доступен в конфигурации на 9 мест (базовый салон). Версии 7-местные — это, как правило, комплектации с раздельными сиденьями 2-го ряда." },
        ],
      },
      en: {
        title: "KIA Carnival from Korea — buy minivan, all-in price",
        subtitle: "Premium 7–9 seat minivan for families. Business class comfort at a reasonable price.",
        description: "KIA Carnival is an iconic minivan on the Korean market. Spacious, comfortable, with a luxurious interior and advanced safety systems. Perfect for large families and corporate trips.",
        benefits: [
          { title: "Business class at economy price", text: "4th generation Carnival offers Mercedes V-Class comfort levels at half the price." },
          { title: "7, 8 or 9 seats", text: "Available in various seat configurations — from 7-seat luxury to 9-seat family version." },
          { title: "Korean quality", text: "Korean market Carnival came with maximum equipment: panoramic roof, seat massage, rear monitors." },
        ],
        steps: [
          { title: "Choose configuration", text: "7, 8 or 9 seats, year, budget — contact us and we'll find it." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect personally, send the report." },
          { title: "Payment & shipping", text: "Confirm, pay the balance — Carnival is shipped." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery." },
        ],
        faq: [
          { q: "How much does a KIA Carnival from Korea cost all-in?", a: "Depending on year and trim — from $33,000 to $76,000. A 4th gen 2021–2022 base trim comes to around $38,000–$49,000 all-in." },
          { q: "What's different about the 4th Generation Carnival?", a: "The 4th gen (from 2020) is on an entirely new platform. Much more spacious, modern design, improved safety systems and new comfort options." },
          { q: "Is the 9-seat Carnival available?", a: "Yes, the Korean market has a 9-seat configuration. 7-seat versions typically feature separate 2nd row captain chairs." },
        ],
      },
    },
  },
  {
    slug: "hyundai-palisade",
    manufacturer: "현대",
    manufacturerEn: "Hyundai",
    modelKo: "팰리세이드",
    catalogFilter: ".Palisade",
    coverImage: "/models/palisade.avif",
    gallery: [],
    priceFrom: 3500,
    priceTo: 6500,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80._.ModelGroup.%ED%8C%B0%EB%A6%AC%EC%84%B8%EC%9D%B4%EB%93%9C.))",
    content: {
      ru: {
        title: "Hyundai Palisade из Кореи — большой кроссовер, цена под ключ",
        subtitle: "Флагманский 7–8-местный кроссовер. Представительный, комфортный, по цене ниже европейских аналогов.",
        description: "Hyundai Palisade — топовый полноразмерный кроссовер в линейке Hyundai. Просторный, представительный, с богатым оснащением. На корейском рынке Palisade — статусный автомобиль с роскошными комплектациями по ценам, недостижимым для европейских конкурентов.",
        benefits: [
          { title: "Альтернатива BMW X7", text: "Palisade сопоставим по размеру и оснащению с BMW X7 и Land Rover Discovery, но стоит в 2–3 раза дешевле." },
          { title: "8 мест и полный привод", text: "Комплектации с 4WD и 8 местами — стандарт для корейского рынка. Максимальная проходимость и вместимость." },
          { title: "Топовое оснащение", text: "Кожаный салон, вентиляция и подогрев сидений, цифровая приборная панель, система автопилота — в базе для Кореи." },
        ],
        steps: [
          { title: "Выберите год и комплектацию", text: "Расскажите о бюджете и пожеланиях — подберём Palisade под вас." },
          { title: "Задаток и осмотр", text: "Вносите задаток, мы осматриваем и отправляем фото/видео отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете, авто отправляется в Россию." },
          { title: "Получение", text: "Забираете во Владивостоке или доставляем до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит Hyundai Palisade из Кореи под ключ?", a: "В зависимости от года и комплектации — от 3 500 000 до 6 500 000 ₽. Palisade 2021–2022 с полным приводом — около 4–5 млн ₽ под ключ." },
          { q: "Есть ли Palisade с полным приводом?", a: "Да, большинство Palisade на корейском рынке — с полным приводом HTRAC AWD. Это стандарт для данной модели." },
          { q: "Чем Palisade лучше Kia Sorento?", a: "Palisade — полноразмерный, Sorento — компактный. Palisade просторнее внутри, больше снаружи, богаче оснащён. При этом оба производятся в Корее и доступны по схожим схемам покупки." },
        ],
      },
      en: {
        title: "Hyundai Palisade from Korea — large crossover, all-in price",
        subtitle: "Flagship 7–8 seat crossover. Prestigious, comfortable, cheaper than European alternatives.",
        description: "Hyundai Palisade is Hyundai's top full-size crossover. Spacious, prestigious, with rich equipment. On the Korean market, Palisade is a status vehicle with luxury trim levels at prices unavailable for European competitors.",
        benefits: [
          { title: "BMW X7 alternative", text: "Palisade is comparable in size and equipment to BMW X7 and Land Rover Discovery but costs 2–3 times less." },
          { title: "8 seats and AWD", text: "Trims with 4WD and 8 seats are standard for the Korean market." },
          { title: "Top equipment", text: "Leather interior, ventilated seats, digital dashboard, autopilot — standard for Korea." },
        ],
        steps: [
          { title: "Choose year and trim", text: "Tell us your budget and preferences — we'll find the right Palisade." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect and send photo/video report." },
          { title: "Payment & shipping", text: "Confirm and pay — car is shipped to Russia." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery." },
        ],
        faq: [
          { q: "How much does a Hyundai Palisade from Korea cost all-in?", a: "Depending on year and trim — from $38,000 to $70,000. A 2021–2022 AWD Palisade typically comes to $43,000–$54,000 all-in." },
          { q: "Is AWD available on Palisade?", a: "Yes, most Palisades on the Korean market come with HTRAC AWD. This is standard for the model." },
          { q: "How does Palisade compare to KIA Sorento?", a: "Palisade is full-size, Sorento is compact. Palisade is more spacious inside, larger outside, and better equipped." },
        ],
      },
    },
  },
  {
    slug: "kia-sportage",
    manufacturer: "기아",
    manufacturerEn: "KIA",
    modelKo: "스포티지",
    catalogFilter: ".Sportage",
    coverImage: "/models/kia-sportage/1.webp",
    gallery: ["/models/kia-sportage/1.webp", "/models/kia-sportage/2.webp", "/models/kia-sportage/3.webp", "/models/kia-sportage/4.webp", "/models/kia-sportage/5.webp", "/models/kia-sportage/6.webp"],
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%EA%B8%B0%EC%95%84._.(C.ModelGroup.%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80._.Model.%EB%8D%94%20%EB%89%B4%20%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80%205%EC%84%B8%EB%8C%80.))))&sr=%7CModifiedDate%7C%7C20",
    priceFrom: 1500,
    priceTo: 3200,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84._.ModelGroup.%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80.))",
    content: {
      ru: {
        title: "KIA Sportage из Кореи — купить с пробегом, цена под ключ",
        subtitle: "Молодёжный компактный кроссовер с ярким дизайном и современными технологиями.",
        description: "KIA Sportage — один из самых узнаваемых компактных кроссоверов в мире. Пятое поколение (NQ5) получило кардинально новый дизайн и передовую электронику. На корейском рынке Sportage доступен в комплектациях, которые не выходили на российский рынок.",
        benefits: [
          { title: "Новое поколение дешевле", text: "Sportage 5-го поколения (2022–2024) из Кореи обходится дешевле, чем Sportage 4-го поколения у российских дилеров." },
          { title: "Гибридные версии", text: "На корейском рынке доступны гибридные и plug-in гибридные версии Sportage — в России они официально не поставлялись." },
          { title: "Богатое оснащение", text: "Корейские версии Sportage укомплектованы лучше европейских: 12.3\" экран, проекция на стекло, кожаный салон — в стандарте." },
        ],
        steps: [
          { title: "Выберите поколение", text: "4-е или 5-е поколение, бензин или гибрид — расскажите о пожеланиях." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем и отправляем подробный отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете, Sportage отправляется в Россию." },
          { title: "Получение", text: "Забираете во Владивостоке или доставляем до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит KIA Sportage из Кореи под ключ?", a: "От 1 500 000 до 3 200 000 ₽ в зависимости от года и комплектации. Sportage 2021–2022 среднего уровня — около 2–2.5 млн ₽ под ключ." },
          { q: "Sportage 4 или 5 поколение — что лучше выбрать?", a: "5-е поколение (NQ5, с 2022) — кардинально новый дизайн, лучше технологии. 4-е — проверенная надёжность, ниже цена. Зависит от бюджета и приоритетов." },
          { q: "Есть ли Sportage гибрид из Кореи?", a: "Да, корейский рынок предлагает Sportage Hybrid (48V mild hybrid) и Sportage Plug-in Hybrid. Обе версии в Россию официально не поставлялись — только через частный импорт." },
        ],
      },
      en: {
        title: "KIA Sportage from Korea — buy used, all-in price",
        subtitle: "Stylish compact crossover with bold design and modern technology.",
        description: "KIA Sportage is one of the most recognizable compact crossovers worldwide. The 5th generation (NQ5) received a radical new design and advanced electronics. Available in trims not sold in European markets.",
        benefits: [
          { title: "New gen at lower cost", text: "5th gen Sportage (2022–2024) from Korea costs less than 4th gen at Russian dealers." },
          { title: "Hybrid versions", text: "Korean market offers Sportage Hybrid and Plug-in Hybrid versions not officially available in Russia." },
          { title: "Rich equipment", text: "Korean Sportage is better equipped than European versions: 12.3\" screen, HUD, leather interior — standard." },
        ],
        steps: [
          { title: "Choose generation", text: "4th or 5th gen, gasoline or hybrid — tell us your preferences." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect and send detailed report." },
          { title: "Payment & shipping", text: "Confirm and pay — Sportage is shipped to Russia." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery." },
        ],
        faq: [
          { q: "How much does a KIA Sportage from Korea cost all-in?", a: "From $16,000 to $35,000 depending on year and trim. A 2021–2022 mid-spec Sportage typically comes to $22,000–$27,000 all-in." },
          { q: "Sportage gen 4 or 5 — which to choose?", a: "5th gen (NQ5, from 2022) has a radical new design and better tech. 4th gen — proven reliability, lower price. Depends on budget and priorities." },
          { q: "Is Sportage hybrid available from Korea?", a: "Yes, the Korean market offers both Sportage Hybrid (48V mild hybrid) and Plug-in Hybrid. Neither was officially sold in Russia — available only through private import." },
        ],
      },
    },
  },
];

export function getModelBySlug(slug: string): ModelData | undefined {
  return MODEL_PAGES.find((m) => m.slug === slug);
}
