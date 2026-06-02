export interface ModelFaq {
  q: string;
  a: string;
}

export interface ModelData {
  slug: string;
  manufacturer: string;        // для CarSlider фильтра (на корейском)
  manufacturerEn: string;      // Hyundai / KIA
  modelKo: string;             // корейское название для API
  modelEn: string;             // английское название модели
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
    modelEn: "Sorento",
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
    modelEn: "Tucson",
    catalogFilter: ".Tucson",
    coverImage: "/models/tucson.jpg",
    gallery: [],
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%ED%98%84%EB%8C%80._.(C.ModelGroup.%ED%88%AC%EC%8B%BC._.Model.%EB%8D%94%20%EB%89%B4%20%ED%88%AC%EC%8B%BC%20(NX4_).))))&sr=%7CModifiedDate%7C%7C20",
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
    modelEn: "Carnival",
    catalogFilter: ".Carnival",
    coverImage: "/models/carnival.jpg",
    gallery: [],
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%EA%B8%B0%EC%95%84._.(C.ModelGroup.%EC%B9%B4%EB%8B%88%EB%B0%9C._.Model.%EB%8D%94%20%EB%89%B4%20%EC%B9%B4%EB%8B%88%EB%B0%9C%204%EC%84%B8%EB%8C%80.))))&sr=%7CModifiedDate%7C%7C20",
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
    modelEn: "Palisade",
    catalogFilter: ".Palisade",
    coverImage: "/models/palisade.jpg",
    gallery: [],
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%ED%98%84%EB%8C%80._.(C.ModelGroup.%ED%8C%B0%EB%A6%AC%EC%84%B8%EC%9D%B4%EB%93%9C._.Model.%ED%8C%B0%EB%A6%AC%EC%84%B8%EC%9D%B4%EB%93%9C%20(LX3_).))))&sr=%7CModifiedDate%7C%7C20",
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
    slug: "hyundai-santa-fe",
    manufacturer: "현대",
    manufacturerEn: "Hyundai",
    modelKo: "싼타페",
    modelEn: "Santa Fe",
    catalogFilter: ".SantaFe",
    coverImage: "/models/santafe.jpg",
    gallery: [],
    priceFrom: 2000,
    priceTo: 5000,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80._.ModelGroup.%EC%8B%BC%ED%83%80%ED%8E%98.))",
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%ED%98%84%EB%8C%80._.(C.ModelGroup.%EC%8B%BC%ED%83%80%ED%8E%98._.Model.%EC%8B%BC%ED%83%80%ED%8E%98%20(MX5_).))))&sr=%7CModifiedDate%7C%7C20",
    content: {
      ru: {
        title: "Hyundai Santa Fe из Кореи — купить кроссовер, цена под ключ",
        subtitle: "Семейный 5–7-местный кроссовер с богатым оснащением напрямую из Кореи.",
        description: "Hyundai Santa Fe — один из самых популярных семейных кроссоверов на корейском рынке. Просторный, надёжный, с современным дизайном и широким набором опций безопасности. Четвёртое и пятое поколения предлагают уровень комфорта премиум-класса при разумной цене. В Корее Santa Fe традиционно богаче оснащён, чем версии для других рынков.",
        benefits: [
          { title: "Экономия 30–45%", text: "Santa Fe из Кореи обходится значительно дешевле, чем аналогичный автомобиль у российских или казахстанских дилеров — даже с учётом доставки и таможни." },
          { title: "Полный привод в стандарте", text: "На корейском рынке большинство Santa Fe комплектуются полным приводом AWD — оптимальный выбор для российских дорог." },
          { title: "Широкий выбор", text: "Тысячи предложений разных годов и комплектаций: от экономичных бензиновых до гибридных и дизельных версий." },
        ],
        steps: [
          { title: "Выберите автомобиль", text: "Расскажите о бюджете и пожеланиях — подберём Santa Fe под ваши задачи." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем лично в Корее и отправляем фото/видео отчёт." },
          { title: "Оплата и отправка", text: "После подтверждения оплачиваете остаток — Santa Fe отправляется в Россию." },
          { title: "Получение", text: "Забираете во Владивостоке или доставляем до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит Hyundai Santa Fe из Кореи под ключ?", a: "В зависимости от года и комплектации — от 2 000 000 до 5 000 000 ₽ под ключ с учётом доставки, таможни и утилизационного сбора. Напишите нам для точного расчёта." },
          { q: "Santa Fe 4 или 5 поколение — что выбрать?", a: "5-е поколение (с 2024) — новейший дизайн и технологии, но выше цена. 4-е поколение (2018–2023) — отличное соотношение цены и качества, большой выбор на рынке. Зависит от бюджета." },
          { q: "Есть ли гибридный Santa Fe из Кореи?", a: "Да, на корейском рынке доступны Santa Fe Hybrid и Plug-in Hybrid. Эти версии практически не поставлялись в Россию официально — редкая возможность приобрести гибрид напрямую." },
        ],
      },
      en: {
        title: "Hyundai Santa Fe from Korea — buy crossover, all-in price",
        subtitle: "Family 5–7 seat crossover with rich equipment directly from Korea.",
        description: "Hyundai Santa Fe is one of the most popular family crossovers on the Korean market. Spacious, reliable, with modern design and a wide range of safety features. The 4th and 5th generations offer premium-level comfort at a reasonable price.",
        benefits: [
          { title: "30–45% savings", text: "Santa Fe from Korea is significantly cheaper than comparable cars at dealers in Russia or Kazakhstan — even including shipping and customs." },
          { title: "AWD as standard", text: "On the Korean market most Santa Fe models come with AWD — ideal for Russian roads." },
          { title: "Wide selection", text: "Thousands of listings across different years and trims: from economical gasoline to hybrid and diesel versions." },
        ],
        steps: [
          { title: "Choose a car", text: "Tell us your budget and preferences — we'll find the right Santa Fe for you." },
          { title: "Deposit & inspection", text: "Pay a deposit, we inspect personally in Korea and send a photo/video report." },
          { title: "Payment & shipping", text: "After confirmation pay the balance — Santa Fe is shipped to Russia." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a Hyundai Santa Fe from Korea cost all-in?", a: "Depending on year and trim — from $22,000 to $55,000 all-in including shipping, customs and recycling fee. Contact us for an exact quote." },
          { q: "Santa Fe gen 4 or 5 — which to choose?", a: "5th gen (from 2024) has the latest design and tech, but costs more. 4th gen (2018–2023) offers excellent value with a large selection on the market." },
          { q: "Is hybrid Santa Fe available from Korea?", a: "Yes, the Korean market offers Santa Fe Hybrid and Plug-in Hybrid versions. These were rarely officially sold in Russia — a rare opportunity to get a hybrid directly." },
        ],
      },
    },
  },
  {
    slug: "genesis-gv80",
    manufacturer: "제네시스",
    manufacturerEn: "Genesis",
    modelKo: "GV80",
    modelEn: "GV80",
    catalogFilter: ".GV80",
    coverImage: "/models/genesis-gv80.jpg",
    gallery: [],
    priceFrom: 4500,
    priceTo: 10000,
    years: "2020–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EC%A0%9C%EB%84%A4%EC%8B%9C%EC%8A%A4._.ModelGroup.GV80.))",
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%EC%A0%9C%EB%84%A4%EC%8B%9C%EC%8A%A4._.(C.ModelGroup.GV80._.Model.GV80.))))&sr=%7CModifiedDate%7C%7C20",
    content: {
      ru: {
        title: "Genesis GV80 из Кореи — цена под ключ",
        subtitle: "Корейский флагманский люкс-кроссовер. Конкурент BMW X5 и Lexus RX вдвое дешевле.",
        description: "Genesis GV80 — флагманский кроссовер люксового бренда Hyundai Motor Group. Сочетает в себе изысканный дизайн, передовые технологии и непревзойдённый комфорт. На корейском рынке GV80 — статусный автомобиль, который конкурирует с BMW X5, Mercedes GLE и Lexus GX, превосходя их по оснащению при значительно меньшей цене.",
        benefits: [
          { title: "Конкурент BMW X5 вдвое дешевле", text: "GV80 по комфорту и технологиям сопоставим с немецкими премиум-кроссоверами, но стоит в 1.5–2 раза дешевле. При этом уровень отделки и оснащения — мировой топ." },
          { title: "Премиальное оснащение", text: "Квилтированная кожа Nappa, 14.5\" экран, 21 динамик Lexicon, массаж и вентиляция кресел, проекция на стекло — стандарт для корейского рынка." },
          { title: "Трёхлитровый дизель и 2.5T", text: "GV80 доступен с 3.0d рядной «шестёркой» и 2.5 T бензином — оба двигателя обеспечивают выдающуюся динамику и ресурс." },
        ],
        steps: [
          { title: "Выберите двигатель и комплектацию", text: "2.5T или 3.0d, стандарт или Sport — расскажите о пожеланиях." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем каждый автомобиль лично и предоставляем полный отчёт." },
          { title: "Оплата и отправка", text: "После подтверждения оплачиваете, GV80 отправляется во Владивосток." },
          { title: "Получение", text: "Забираете во Владивостоке или организуем доставку до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит Genesis GV80 из Кореи под ключ?", a: "В зависимости от года, двигателя и комплектации — от 4 500 000 до 10 000 000 ₽ под ключ. GV80 2021–2022 2.5T — около 5–6.5 млн ₽, 3.0d топ — 7–9 млн ₽." },
          { q: "Genesis GV80 или BMW X5 — что лучше купить из Кореи?", a: "GV80 по оснащению не уступает X5, а по качеству отделки во многом превосходит. При этом стоит на 20–40% дешевле аналогичного X5 из Кореи, и обслуживание обходится дешевле." },
          { q: "Есть ли GV80 с задним или полным приводом?", a: "На корейском рынке GV80 доступен в обоих вариантах: RWD (задний привод) и AWD (полный привод). Большинство версий — AWD, особенно с дизельным двигателем." },
        ],
      },
      en: {
        title: "Genesis GV80 from Korea — buy premium crossover, all-in price",
        subtitle: "Korea's flagship luxury crossover. BMW X5 and Lexus RX competitor at half the price.",
        description: "Genesis GV80 is the flagship crossover from Hyundai Motor Group's luxury brand. It combines refined design, cutting-edge technology and unmatched comfort, competing directly with BMW X5 and Mercedes GLE at a significantly lower price.",
        benefits: [
          { title: "BMW X5 rival at half price", text: "GV80 matches German premium crossovers in comfort and technology but costs 1.5–2× less, with world-class interior quality." },
          { title: "Premium equipment", text: "Quilted Nappa leather, 14.5\" screen, 21-speaker Lexicon audio, seat massage and ventilation, HUD — standard on Korean market." },
          { title: "3.0 diesel and 2.5T", text: "GV80 is available with both a 3.0d inline-six diesel and 2.5T gasoline — both delivering outstanding performance and longevity." },
        ],
        steps: [
          { title: "Choose engine and trim", text: "2.5T or 3.0d, standard or Sport — tell us your preferences." },
          { title: "Deposit & inspection", text: "Pay a deposit, we personally inspect each car and provide a full report." },
          { title: "Payment & shipping", text: "After confirmation pay the balance — GV80 is shipped to Vladivostok." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a Genesis GV80 from Korea cost all-in?", a: "Depending on year, engine and trim — from $49,000 to $110,000 all-in. A 2021–2022 GV80 2.5T typically comes to $55,000–$70,000; top-spec 3.0d — $75,000–$100,000." },
          { q: "Genesis GV80 or BMW X5 — which is better from Korea?", a: "GV80 matches X5 in equipment and surpasses it in interior quality in many areas. It costs 20–40% less than a comparable X5 from Korea, and maintenance is cheaper." },
          { q: "Is GV80 available in RWD and AWD?", a: "Yes, the Korean market offers both RWD and AWD. Most versions come with AWD, especially with the diesel engine." },
        ],
      },
    },
  },
  {
    slug: "kia-k5",
    manufacturer: "기아",
    manufacturerEn: "KIA",
    modelKo: "K5",
    modelEn: "K5",
    catalogFilter: ".K5",
    coverImage: "/models/k5.jpg",
    gallery: [],
    priceFrom: 1500,
    priceTo: 3500,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%EA%B8%B0%EC%95%84._.ModelGroup.K5.))",
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%EA%B8%B0%EC%95%84._.(C.ModelGroup.K5._.Model.%EB%8D%94%20%EB%89%B4%20K5%203%EC%84%B8%EB%8C%80.))))&sr=%7CModifiedDate%7C%7C20",
    content: {
      ru: {
        title: "KIA K5 из Кореи — купить седан, цена под ключ",
        subtitle: "Стильный седан бизнес-класса напрямую из Кореи. Бывшая Optima — теперь ещё лучше.",
        description: "KIA K5 (бывшая Optima) — флагманский седан KIA. Третье поколение получило агрессивный спортивный дизайн, мощные двигатели и богатейшее оснащение. В Корее K5 — это конкурент Toyota Camry и Honda Accord, предлагающий более современный стиль и технологии. На российском рынке K5 никогда официально не продавалась — только из Кореи.",
        benefits: [
          { title: "Уникальный импорт", text: "KIA K5 официально в Россию не поставлялась. Купить её можно только через частный импорт из Кореи — это делает автомобиль редким и статусным." },
          { title: "Конкурент Camry дешевле", text: "K5 по уровню комфорта и технологий не уступает Toyota Camry, но стоит на 20–35% дешевле при значительно более ярком дизайне." },
          { title: "Мощные двигатели", text: "На корейском рынке K5 доступна с 2.0 180 л.с. и турбированным 1.6T 180 л.с. — оба двигателя обеспечивают отличную динамику." },
        ],
        steps: [
          { title: "Выберите год и двигатель", text: "Бензин 2.0 или турбо 1.6T, год, комплектация — расскажите о пожеланиях." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем лично, отправляем подробный отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете остаток, K5 отправляется в Россию." },
          { title: "Получение", text: "Забираете во Владивостоке или доставляем до вашего города." },
        ],
        faq: [
          { q: "Сколько стоит KIA K5 из Кореи под ключ?", a: "В зависимости от года и комплектации — от 1 500 000 до 3 500 000 ₽ под ключ. K5 2021–2022 среднего уровня — около 2–2.8 млн ₽ под ключ." },
          { q: "KIA K5 и KIA Optima — это одно и то же?", a: "Да. Название K5 используется на корейском рынке, Optima — для международных рынков. С 2021 года глобальная модель тоже переименована в K5. Это третье поколение с новым дизайном." },
          { q: "Стоит ли брать K5 вместо Hyundai Sonata?", a: "Обе модели на одной платформе. K5 — более спортивный и агрессивный дизайн, Sonata — более консервативный и просторный. Выбор зависит от вкуса." },
        ],
      },
      en: {
        title: "KIA K5 from Korea — buy sedan, all-in price",
        subtitle: "Stylish business-class sedan directly from Korea. Former Optima — now even better.",
        description: "KIA K5 (formerly Optima) is KIA's flagship sedan. The 3rd generation received aggressive sporty design, powerful engines and top-tier equipment. In Korea, K5 competes with Toyota Camry and Honda Accord, offering a more modern style. K5 was never officially sold in Russia — only available via private import from Korea.",
        benefits: [
          { title: "Unique import", text: "KIA K5 was never officially sold in Russia. It can only be purchased through private import from Korea — making it rare and exclusive." },
          { title: "Camry rival at lower cost", text: "K5 matches Toyota Camry in comfort and technology but costs 20–35% less with a significantly bolder design." },
          { title: "Powerful engines", text: "Korean market K5 is available with 2.0 (180 hp) and turbocharged 1.6T (180 hp) — both delivering excellent performance." },
        ],
        steps: [
          { title: "Choose year and engine", text: "2.0 gasoline or 1.6T turbo, year, trim — tell us your preferences." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect personally, send detailed report." },
          { title: "Payment & shipping", text: "Confirm, pay the balance — K5 is shipped to Russia." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a KIA K5 from Korea cost all-in?", a: "Depending on year and trim — from $16,000 to $38,000 all-in. A 2021–2022 mid-spec K5 typically comes to $22,000–$30,000 all-in." },
          { q: "Are KIA K5 and KIA Optima the same car?", a: "Yes. K5 is the name used on the Korean market; Optima was the international name. Since 2021 the global model is also called K5. This is the 3rd generation with a new design." },
          { q: "Should I choose K5 over Hyundai Sonata?", a: "Both share the same platform. K5 has a sportier, more aggressive design; Sonata is more conservative and slightly roomier. It comes down to personal taste." },
        ],
      },
    },
  },
  {
    slug: "hyundai-sonata",
    manufacturer: "현대",
    manufacturerEn: "Hyundai",
    modelKo: "쏘나타",
    modelEn: "Sonata",
    catalogFilter: ".Sonata",
    coverImage: "/models/sonata.jpg",
    gallery: [],
    priceFrom: 1500,
    priceTo: 3800,
    years: "2019–2024",
    encarQuery: "(And.Hidden.N._.SellType.%EC%9D%BC%EB%B0%98._.(C.CarType.A._.Manufacturer.%ED%98%84%EB%8C%80._.ModelGroup.%EC%8F%98%EB%82%98%ED%83%80.))",
    sliderUrl: "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.%ED%98%84%EB%8C%80._.(C.ModelGroup.%EC%8F%98%EB%82%98%ED%83%80._.Model.%EC%8F%98%EB%82%98%ED%83%80%20%EB%94%94%20%EC%97%A3%EC%A7%80(DN8_).))))&sr=%7CModifiedDate%7C%7C20",
    content: {
      ru: {
        title: "Hyundai Sonata из Кореи — купить седан, цена под ключ",
        subtitle: "Легендарный седан бизнес-класса — комфорт, простор и надёжность по корейским ценам.",
        description: "Hyundai Sonata — один из самых узнаваемых и продаваемых седанов в мире. Восьмое поколение (DN8) получило инновационный дизайн с «флагом» из хромированной полосы, просторный салон и богатое техническое оснащение. На корейском рынке Sonata традиционно выпускается в версиях, недоступных на других рынках, включая гибридную и N-Line.",
        benefits: [
          { title: "Дешевле на 25–40%", text: "Sonata из Кореи стоит значительно меньше, чем аналогичная модель на российском вторичном рынке — огромный выбор с прозрачной историей обслуживания." },
          { title: "Просторный салон", text: "Sonata DN8 — одна из самых просторных машин в классе. Большое заднее сиденье, огромный багажник, панорамная крыша в топовых версиях." },
          { title: "Гибрид и N-Line", text: "На корейском рынке доступны Sonata Hybrid и спортивная версия N-Line — обе крайне редко встречаются на российском рынке." },
        ],
        steps: [
          { title: "Выберите версию", text: "Стандарт, Hybrid или N-Line — расскажите о бюджете и пожеланиях." },
          { title: "Задаток и осмотр", text: "Вносите задаток, осматриваем лично, отправляем фото/видео отчёт." },
          { title: "Оплата и отправка", text: "Подтверждаете — оплачиваете остаток, Sonata отправляется в Россию." },
          { title: "Получение", text: "Забираете во Владивостоке или организуем доставку до вас." },
        ],
        faq: [
          { q: "Сколько стоит Hyundai Sonata из Кореи под ключ?", a: "В зависимости от года и комплектации — от 1 500 000 до 3 800 000 ₽ под ключ. Sonata 2021–2022 среднего уровня — около 2–2.7 млн ₽ под ключ." },
          { q: "Hyundai Sonata или KIA K5 — что лучше?", a: "Обе модели на одной платформе (N3). Sonata — более консервативный комфортный стиль, больше места в салоне. K5 — агрессивный спортивный дизайн. Основное различие — дизайн и вкусовые предпочтения." },
          { q: "Есть ли Sonata Hybrid из Кореи?", a: "Да, Sonata Hybrid — один из самых продаваемых гибридов в Корее. Предлагает отличную экономию топлива при сохранении всех преимуществ Sonata. Практически не поставлялась в Россию официально." },
        ],
      },
      en: {
        title: "Hyundai Sonata from Korea — buy sedan, all-in price",
        subtitle: "Legendary business-class sedan — comfort, space and reliability at Korean prices.",
        description: "Hyundai Sonata is one of the most recognized and best-selling sedans worldwide. The 8th generation (DN8) features innovative design with a distinctive chrome strip, spacious interior and rich equipment. The Korean market offers versions unavailable elsewhere, including Hybrid and N-Line.",
        benefits: [
          { title: "25–40% cheaper", text: "Sonata from Korea costs significantly less than a comparable model on the Russian secondary market, with a wide selection and transparent service history." },
          { title: "Spacious interior", text: "Sonata DN8 is one of the most spacious cars in its class. Large rear seat, huge trunk, panoramic roof in top trims." },
          { title: "Hybrid and N-Line", text: "Korean market offers Sonata Hybrid and sporty N-Line versions — both extremely rare on the Russian market." },
        ],
        steps: [
          { title: "Choose version", text: "Standard, Hybrid or N-Line — tell us your budget and preferences." },
          { title: "Deposit & inspection", text: "Pay deposit, we inspect personally, send photo/video report." },
          { title: "Payment & shipping", text: "Confirm, pay the balance — Sonata is shipped to Russia." },
          { title: "Pickup", text: "Collect in Vladivostok or arrange delivery to your city." },
        ],
        faq: [
          { q: "How much does a Hyundai Sonata from Korea cost all-in?", a: "Depending on year and trim — from $16,000 to $41,000 all-in. A 2021–2022 mid-spec Sonata typically comes to $22,000–$29,000 all-in." },
          { q: "Hyundai Sonata or KIA K5 — which is better?", a: "Both share the same platform (N3). Sonata has a more conservative, comfortable style with more interior space. K5 has an aggressive sporty design. The main difference is styling and personal taste." },
          { q: "Is Sonata Hybrid available from Korea?", a: "Yes, Sonata Hybrid is one of the best-selling hybrids in Korea. It offers excellent fuel economy while retaining all Sonata advantages. Rarely sold officially in Russia." },
        ],
      },
    },
  },
  {
    slug: "kia-sportage",
    manufacturer: "기아",
    manufacturerEn: "KIA",
    modelKo: "스포티지",
    modelEn: "Sportage",
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
