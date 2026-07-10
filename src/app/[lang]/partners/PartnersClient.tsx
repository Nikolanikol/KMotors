"use client";

import Link from "next/link";
import {
  Handshake,
  TrendingUp,
  Users,
  CheckCircle,
  Building2,
  Zap,
  Truck,
  Shield,
  HeadphonesIcon,
  Clock,
  Package,
  Send,
  Wrench,
  Store,
  CarFront,
} from "lucide-react";

interface Props {
  lang: string;
}

const L: Record<string, Record<string, string>> = {
  ru: {
    heroTag: "B2B",
    heroTitle: "Партнёрская программа",
    heroHighlight: "K-Axis",
    heroDesc:
      "Оптовые поставки оригинальных запчастей Hyundai, Kia, Genesis напрямую из Кореи. Выгодные условия для автосервисов, магазинов и компаний с автопарком.",
    heroCta: "Оставить заявку",
    heroContact: "Связаться с нами",

    forWhomTitle: "Кому подходит",
    forWhom1title: "Автосервисы и СТО",
    forWhom1desc: "Ежедневная потребность в запчастях, быстрая доставка и наличие — ваши клиенты не ждут.",
    forWhom2title: "Магазины запчастей",
    forWhom2desc: "Конкурентные закупочные цены для перепродажи. Каталог из 48 000+ позиций.",
    forWhom3title: "Таксопарки и автопарки",
    forWhom3desc: "Регулярные ТО, предсказуемый ассортимент. Скидка на объём и отсрочка платежа.",

    tiersTitle: "Уровни партнёрства",
    tiersDesc: "Три уровня сотрудничества — выбирайте тот, который подходит вашему бизнесу",

    tier1name: "Старт",
    tier1volume: "от 30 000 ₽/мес",
    tier1f1: "Скидка 10% от розницы",
    tier1f2: "Предоплата 100%",
    tier1f3: "Стандартная доставка",
    tier1f4: "Личный менеджер",

    tier2name: "Партнёр",
    tier2volume: "от 100 000 ₽/мес",
    tier2f1: "Скидка 15% от розницы",
    tier2f2: "Приоритетная сборка",
    tier2f3: "Возврат неликвида до 5%",
    tier2f4: "Личный менеджер",

    tier3name: "Ключевой партнёр",
    tier3volume: "от 300 000 ₽/мес",
    tier3f1: "Скидка 20–25% от розницы",
    tier3f2: "Приоритетная доставка",
    tier3f3: "Совместные акции",
    tier3f4: "Выделенный менеджер",

    advTitle: "Преимущества партнёрства",
    adv1title: "Прямые поставки",
    adv1desc: "Без посредников из Южной Кореи — ниже цена, выше маржа для вашего бизнеса.",
    adv2title: "Только оригинал",
    adv2desc: "Hyundai Mobis, Mando, Parts Mall — гарантия подлинности каждой детали.",
    adv3title: "Быстрая доставка",
    adv3desc: "Приоритетная сборка и отправка для партнёров. EMS Korea от 7 дней.",
    adv4title: "Гибкие условия",
    adv4desc: "Отсрочка платежа, возврат неликвида, индивидуальные условия по объёму.",
    adv5title: "48 000+ позиций",
    adv5desc: "Полный каталог: от расходников до двигателей и кузовных элементов.",
    adv6title: "Выделенный менеджер",
    adv6desc: "Персональное сопровождение, подбор по VIN, оперативные ответы.",

    howTitle: "Как начать",
    step1title: "Заявка",
    step1desc: "Оставьте заявку на сайте или напишите нам в Telegram/WhatsApp",
    step2title: "Обсуждение",
    step2desc: "Менеджер свяжется с вами, обсудим объёмы и подберём оптимальный уровень",
    step3title: "Договор",
    step3desc: "Заключаем договор партнёрства — простой и прозрачный",
    step4title: "Работа",
    step4desc: "Вы делаете заказы по партнёрским ценам, мы обеспечиваем поставки",

    ctaTitle: "Готовы к сотрудничеству?",
    ctaDesc: "Оставьте заявку — обсудим условия и подберём оптимальную модель партнёрства для вашего бизнеса.",
    ctaButton: "Оставить заявку",
    ctaContact: "Написать в Telegram",
  },
  en: {
    heroTag: "B2B",
    heroTitle: "Partner Program",
    heroHighlight: "K-Axis",
    heroDesc:
      "Wholesale supply of genuine Hyundai, Kia, Genesis parts direct from Korea. Special terms for auto shops, resellers, and fleet companies.",
    heroCta: "Apply Now",
    heroContact: "Contact Us",

    forWhomTitle: "Who It's For",
    forWhom1title: "Auto Repair Shops",
    forWhom1desc: "Daily parts demand, fast delivery and stock availability — your customers don't wait.",
    forWhom2title: "Parts Retailers",
    forWhom2desc: "Competitive wholesale prices for resale. Catalog of 48,000+ items.",
    forWhom3title: "Taxi & Vehicle Fleets",
    forWhom3desc: "Regular maintenance, predictable inventory. Volume discounts and deferred payment.",

    tiersTitle: "Partnership Tiers",
    tiersDesc: "Three tiers of cooperation — choose the one that fits your business",

    tier1name: "Starter",
    tier1volume: "from $300/mo",
    tier1f1: "10% off retail price",
    tier1f2: "100% prepayment",
    tier1f3: "Standard shipping",
    tier1f4: "Personal manager",

    tier2name: "Partner",
    tier2volume: "from $1,000/mo",
    tier2f1: "15% off retail price",
    tier2f2: "Net 7 payment terms",
    tier2f3: "Priority order processing",
    tier2f4: "Up to 5% returns on slow movers",

    tier3name: "Key Partner",
    tier3volume: "from $3,000/mo",
    tier3f1: "20–25% off retail price",
    tier3f2: "Net 14 payment terms",
    tier3f3: "Free shipping",
    tier3f4: "Joint promotions",

    advTitle: "Partnership Benefits",
    adv1title: "Direct Supply",
    adv1desc: "No middlemen from South Korea — lower price, higher margins for your business.",
    adv2title: "Genuine Only",
    adv2desc: "Hyundai Mobis, Mando, Parts Mall — authenticity guaranteed on every part.",
    adv3title: "Fast Delivery",
    adv3desc: "Priority processing and shipping for partners. EMS Korea from 7 days.",
    adv4title: "Flexible Terms",
    adv4desc: "Deferred payments, slow-mover returns, custom volume agreements.",
    adv5title: "48,000+ Items",
    adv5desc: "Full catalog: from consumables to engines and body parts.",
    adv6title: "Dedicated Manager",
    adv6desc: "Personal support, VIN matching, fast response times.",

    howTitle: "How to Start",
    step1title: "Apply",
    step1desc: "Submit an application on our website or reach out via Telegram/WhatsApp",
    step2title: "Discussion",
    step2desc: "A manager will contact you to discuss volumes and find the optimal tier",
    step3title: "Agreement",
    step3desc: "We sign a partnership agreement — simple and transparent",
    step4title: "Let's Go",
    step4desc: "You order at partner prices, we ensure reliable supply",

    ctaTitle: "Ready to Partner?",
    ctaDesc: "Submit your application — we'll discuss terms and find the optimal partnership model for your business.",
    ctaButton: "Apply Now",
    ctaContact: "Message on Telegram",
  },
  ko: {
    heroTag: "B2B",
    heroTitle: "파트너 프로그램",
    heroHighlight: "K-Axis",
    heroDesc:
      "현대, 기아, 제네시스 정품 부품을 한국에서 직접 도매 공급합니다. 자동차 정비소, 부품점, 차량 관리 회사를 위한 특별 조건.",
    heroCta: "신청하기",
    heroContact: "문의하기",

    forWhomTitle: "대상",
    forWhom1title: "자동차 정비소",
    forWhom1desc: "매일 필요한 부품, 빠른 배송과 재고 — 고객을 기다리게 하지 마세요.",
    forWhom2title: "부품 판매점",
    forWhom2desc: "재판매를 위한 경쟁력 있는 도매 가격. 48,000개 이상의 품목 카탈로그.",
    forWhom3title: "택시 및 차량 관리",
    forWhom3desc: "정기적인 유지보수, 예측 가능한 재고. 물량 할인 및 후불 결제.",

    tiersTitle: "파트너십 단계",
    tiersDesc: "세 가지 협력 수준 — 비즈니스에 맞는 것을 선택하세요",

    tier1name: "스타트",
    tier1volume: "월 30만 원 이상",
    tier1f1: "소매가 대비 10% 할인",
    tier1f2: "100% 선불",
    tier1f3: "표준 배송",
    tier1f4: "전담 매니저",

    tier2name: "파트너",
    tier2volume: "월 100만 원 이상",
    tier2f1: "소매가 대비 15% 할인",
    tier2f2: "7일 후불 결제",
    tier2f3: "우선 주문 처리",
    tier2f4: "비인기 상품 5% 반품 가능",

    tier3name: "핵심 파트너",
    tier3volume: "월 300만 원 이상",
    tier3f1: "소매가 대비 20-25% 할인",
    tier3f2: "14일 후불 결제",
    tier3f3: "무료 배송",
    tier3f4: "공동 프로모션",

    advTitle: "파트너십 혜택",
    adv1title: "직접 공급",
    adv1desc: "한국에서 중간 유통 없이 — 더 낮은 가격, 더 높은 마진.",
    adv2title: "정품만 취급",
    adv2desc: "현대모비스, 만도, 파츠몰 — 모든 부품의 정품 보장.",
    adv3title: "빠른 배송",
    adv3desc: "파트너 우선 처리 및 발송. EMS Korea 7일부터.",
    adv4title: "유연한 조건",
    adv4desc: "후불 결제, 비인기 상품 반품, 맞춤 물량 계약.",
    adv5title: "48,000+ 품목",
    adv5desc: "소모품부터 엔진, 차체 부품까지 전체 카탈로그.",
    adv6title: "전담 매니저",
    adv6desc: "개인 지원, VIN 매칭, 빠른 응답.",

    howTitle: "시작 방법",
    step1title: "신청",
    step1desc: "웹사이트에서 신청하거나 Telegram/WhatsApp으로 연락하세요",
    step2title: "상담",
    step2desc: "매니저가 연락하여 물량과 최적 단계를 논의합니다",
    step3title: "계약",
    step3desc: "간단하고 투명한 파트너십 계약 체결",
    step4title: "시작",
    step4desc: "파트너 가격으로 주문하시면, 안정적인 공급을 보장합니다",

    ctaTitle: "파트너가 되시겠습니까?",
    ctaDesc: "신청해 주세요 — 조건을 논의하고 비즈니스에 최적인 파트너십 모델을 찾아드립니다.",
    ctaButton: "신청하기",
    ctaContact: "Telegram으로 문의",
  },
  ka: {
    heroTag: "B2B",
    heroTitle: "პარტნიორული პროგრამა",
    heroHighlight: "K-Axis",
    heroDesc:
      "Hyundai, Kia, Genesis ორიგინალური ნაწილების საბითუმო მიწოდება პირდაპირ კორეიდან. სპეციალური პირობები ავტოსერვისებისთვის, მაღაზიებისთვის და ავტოპარკებისთვის.",
    heroCta: "განაცხადის გაკეთება",
    heroContact: "დაგვიკავშირდით",

    forWhomTitle: "ვისთვის არის",
    forWhom1title: "ავტოსერვისები",
    forWhom1desc: "ყოველდღიური ნაწილების საჭიროება, სწრაფი მიტანა და მარაგი — თქვენი კლიენტები არ ელოდებიან.",
    forWhom2title: "ნაწილების მაღაზიები",
    forWhom2desc: "კონკურენტული საბითუმო ფასები გადაყიდვისთვის. 48 000+ პროდუქტის კატალოგი.",
    forWhom3title: "ტაქსი და ავტოპარკები",
    forWhom3desc: "რეგულარული ტექ.მომსახურება, პროგნოზირებადი ასორტიმენტი. მოცულობის ფასდაკლება და გადავადებული გადახდა.",

    tiersTitle: "პარტნიორობის დონეები",
    tiersDesc: "სამი თანამშრომლობის დონე — აირჩიეთ თქვენი ბიზნესისთვის შესაფერისი",

    tier1name: "სტარტი",
    tier1volume: "თვეში 300$-დან",
    tier1f1: "10% ფასდაკლება საცალო ფასიდან",
    tier1f2: "100% წინასწარ გადახდა",
    tier1f3: "სტანდარტული მიტანა",
    tier1f4: "პირადი მენეჯერი",

    tier2name: "პარტნიორი",
    tier2volume: "თვეში 1 000$-დან",
    tier2f1: "15% ფასდაკლება საცალო ფასიდან",
    tier2f2: "7 დღიანი გადავადებული გადახდა",
    tier2f3: "პრიორიტეტული შეკვეთის დამუშავება",
    tier2f4: "არალიკვიდის 5%-მდე დაბრუნება",

    tier3name: "ძირითადი პარტნიორი",
    tier3volume: "თვეში 3 000$-დან",
    tier3f1: "20-25% ფასდაკლება საცალო ფასიდან",
    tier3f2: "14 დღიანი გადავადებული გადახდა",
    tier3f3: "უფასო მიტანა",
    tier3f4: "ერთობლივი აქციები",

    advTitle: "პარტნიორობის უპირატესობები",
    adv1title: "პირდაპირი მიწოდება",
    adv1desc: "სამხრეთ კორეიდან შუამავლების გარეშე — დაბალი ფასი, მაღალი მარჟა.",
    adv2title: "მხოლოდ ორიგინალი",
    adv2desc: "Hyundai Mobis, Mando, Parts Mall — ყველა ნაწილის ნამდვილობის გარანტია.",
    adv3title: "სწრაფი მიტანა",
    adv3desc: "პარტნიორებისთვის პრიორიტეტული დამუშავება და გაგზავნა.",
    adv4title: "მოქნილი პირობები",
    adv4desc: "გადავადებული გადახდა, არალიკვიდის დაბრუნება, ინდივიდუალური პირობები.",
    adv5title: "48 000+ პროდუქტი",
    adv5desc: "სრული კატალოგი: სახარჯი მასალებიდან ძრავებამდე.",
    adv6title: "გამოყოფილი მენეჯერი",
    adv6desc: "პერსონალური მხარდაჭერა, VIN შერჩევა, სწრაფი პასუხები.",

    howTitle: "როგორ დავიწყოთ",
    step1title: "განაცხადი",
    step1desc: "დატოვეთ განაცხადი საიტზე ან მოგვწერეთ Telegram/WhatsApp-ში",
    step2title: "განხილვა",
    step2desc: "მენეჯერი დაგიკავშირდებათ მოცულობებისა და ოპტიმალური დონის განსახილველად",
    step3title: "ხელშეკრულება",
    step3desc: "ვაფორმებთ პარტნიორობის ხელშეკრულებას — მარტივი და გამჭვირვალე",
    step4title: "მუშაობა",
    step4desc: "თქვენ შეუკვეთავთ პარტნიორულ ფასებში, ჩვენ უზრუნველვყოფთ მიწოდებას",

    ctaTitle: "მზად ხართ თანამშრომლობისთვის?",
    ctaDesc: "დატოვეთ განაცხადი — განვიხილავთ პირობებს და შევარჩევთ ოპტიმალურ პარტნიორობის მოდელს.",
    ctaButton: "განაცხადის გაკეთება",
    ctaContact: "Telegram-ში მოგვწერეთ",
  },
  ar: {
    heroTag: "B2B",
    heroTitle: "برنامج الشراكة",
    heroHighlight: "K-Axis",
    heroDesc:
      "توريد بالجملة لقطع غيار Hyundai وKia وGenesis الأصلية مباشرة من كوريا. شروط خاصة لورش السيارات والمتاجر وشركات الأساطيل.",
    heroCta: "قدّم طلبك",
    heroContact: "تواصل معنا",

    forWhomTitle: "لمن هذا البرنامج",
    forWhom1title: "ورش إصلاح السيارات",
    forWhom1desc: "حاجة يومية لقطع الغيار، توصيل سريع وتوافر — عملاؤك لا ينتظرون.",
    forWhom2title: "متاجر قطع الغيار",
    forWhom2desc: "أسعار جملة تنافسية لإعادة البيع. كتالوج يضم أكثر من 48,000 منتج.",
    forWhom3title: "التاكسي وأساطيل المركبات",
    forWhom3desc: "صيانة دورية، مخزون متوقع. خصومات على الكميات ودفع مؤجل.",

    tiersTitle: "مستويات الشراكة",
    tiersDesc: "ثلاثة مستويات للتعاون — اختر ما يناسب عملك",

    tier1name: "بداية",
    tier1volume: "من 300$/شهر",
    tier1f1: "خصم 10% من سعر التجزئة",
    tier1f2: "دفع مسبق 100%",
    tier1f3: "شحن عادي",
    tier1f4: "مدير مخصص",

    tier2name: "شريك",
    tier2volume: "من 1,000$/شهر",
    tier2f1: "خصم 15% من سعر التجزئة",
    tier2f2: "دفع مؤجل 7 أيام",
    tier2f3: "أولوية معالجة الطلبات",
    tier2f4: "إرجاع حتى 5% من المنتجات البطيئة",

    tier3name: "شريك رئيسي",
    tier3volume: "من 3,000$/شهر",
    tier3f1: "خصم 20-25% من سعر التجزئة",
    tier3f2: "دفع مؤجل 14 يومًا",
    tier3f3: "شحن مجاني",
    tier3f4: "عروض ترويجية مشتركة",

    advTitle: "مزايا الشراكة",
    adv1title: "توريد مباشر",
    adv1desc: "بدون وسطاء من كوريا الجنوبية — سعر أقل، هامش ربح أعلى لعملك.",
    adv2title: "أصلي فقط",
    adv2desc: "Hyundai Mobis وMando وParts Mall — ضمان أصالة كل قطعة.",
    adv3title: "توصيل سريع",
    adv3desc: "أولوية المعالجة والشحن للشركاء. EMS Korea من 7 أيام.",
    adv4title: "شروط مرنة",
    adv4desc: "دفع مؤجل، إرجاع المنتجات البطيئة، اتفاقيات حسب الكمية.",
    adv5title: "+48,000 منتج",
    adv5desc: "كتالوج كامل: من المستهلكات إلى المحركات وقطع الهيكل.",
    adv6title: "مدير مخصص",
    adv6desc: "دعم شخصي، مطابقة VIN، استجابة سريعة.",

    howTitle: "كيف تبدأ",
    step1title: "التقديم",
    step1desc: "قدّم طلبًا على موقعنا أو تواصل عبر Telegram/WhatsApp",
    step2title: "المناقشة",
    step2desc: "سيتواصل معك مدير لمناقشة الكميات وتحديد المستوى الأمثل",
    step3title: "الاتفاقية",
    step3desc: "نوقّع اتفاقية شراكة — بسيطة وشفافة",
    step4title: "العمل",
    step4desc: "تطلب بأسعار الشركاء، ونحن نضمن التوريد المستمر",

    ctaTitle: "مستعد للشراكة؟",
    ctaDesc: "قدّم طلبك — سنناقش الشروط ونجد نموذج الشراكة الأمثل لعملك.",
    ctaButton: "قدّم طلبك",
    ctaContact: "راسلنا على Telegram",
  },
};

const FOR_WHOM_ICONS = [Wrench, Store, CarFront];
const ADV_ICONS = [Truck, Shield, Zap, TrendingUp, Package, HeadphonesIcon];
const STEP_ICONS = [Send, Users, Building2, Handshake];

const TIER_COLORS = [
  { border: "border-gray-200", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-700", accent: "text-gray-600" },
  { border: "border-orange-200", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", accent: "text-orange-600" },
  { border: "border-blue-200", bg: "bg-blue-50", badge: "bg-[#002C5F] text-white", accent: "text-[#002C5F]" },
];

export default function PartnersClient({ lang }: Props) {
  const l = L[lang] ?? L.ru;
  const isRTL = false; // RTL-переворот отключён — макет всегда LTR (см. layout.tsx)

  const tiers = [
    { name: l.tier1name, volume: l.tier1volume, features: [l.tier1f1, l.tier1f2, l.tier1f3, l.tier1f4] },
    { name: l.tier2name, volume: l.tier2volume, features: [l.tier2f1, l.tier2f2, l.tier2f3, l.tier2f4] },
    { name: l.tier3name, volume: l.tier3volume, features: [l.tier3f1, l.tier3f2, l.tier3f3, l.tier3f4] },
  ];

  return (
    <div className="bg-[#F5F7FA] min-h-screen" dir={isRTL ? "rtl" : "ltr"}>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#002C5F]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--axis-orange)] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/10 text-orange-300 border border-orange-400/20 mb-6">
            {l.heroTag}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            {l.heroTitle}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
              {l.heroHighlight}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {l.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              {l.heroCta}
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3.5 rounded-xl border border-white/20 hover:border-white/40 text-white/90 hover:text-white font-semibold text-sm transition-all"
            >
              {l.heroContact}
            </Link>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F] text-center mb-12">
          {l.forWhomTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: l.forWhom1title, desc: l.forWhom1desc },
            { title: l.forWhom2title, desc: l.forWhom2desc },
            { title: l.forWhom3title, desc: l.forWhom3desc },
          ].map((item, i) => {
            const Icon = FOR_WHOM_ICONS[i];
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:border-orange-100 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-base font-bold text-[#002C5F] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F] text-center mb-3">
            {l.tiersTitle}
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 max-w-lg mx-auto">
            {l.tiersDesc}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tiers.map((tier, i) => {
              const colors = TIER_COLORS[i];
              const isPopular = i === 1;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-7 transition-all duration-300 hover:shadow-xl ${isPopular ? "lg:scale-105 shadow-lg" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold shadow-md">
                      Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.badge} mb-3`}>
                      {tier.name}
                    </span>
                    <div className={`text-lg font-bold ${colors.accent}`}>
                      {tier.volume}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${i === 2 ? "text-[#002C5F]" : "text-orange-500"}`} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${lang}/contact`}
                    className={`block w-full text-center mt-6 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                      isPopular
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
                        : i === 2
                          ? "bg-[#002C5F] hover:bg-[#001f45] text-white"
                          : "border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    {l.heroCta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F] text-center mb-12">
          {l.advTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: l.adv1title, desc: l.adv1desc },
            { title: l.adv2title, desc: l.adv2desc },
            { title: l.adv3title, desc: l.adv3desc },
            { title: l.adv4title, desc: l.adv4desc },
            { title: l.adv5title, desc: l.adv5desc },
            { title: l.adv6title, desc: l.adv6desc },
          ].map((adv, i) => {
            const Icon = ADV_ICONS[i];
            return (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-orange-100 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#002C5F] mb-1">{adv.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How to Start */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F] text-center mb-12">
            {l.howTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: l.step1title, desc: l.step1desc },
              { title: l.step2title, desc: l.step2desc },
              { title: l.step3title, desc: l.step3desc },
              { title: l.step4title, desc: l.step4desc },
            ].map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={i} className="relative bg-[#F5F7FA] rounded-2xl border border-gray-100 p-6 text-center group hover:shadow-lg hover:border-orange-100 transition-all duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#002C5F] text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mt-2 mb-4 group-hover:bg-orange-100 transition-colors">
                    <Icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[#002C5F] mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#002C5F]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <Handshake className="w-10 h-10 text-orange-400 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {l.ctaTitle}
          </h2>
          <p className="text-blue-100/70 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            {l.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25"
            >
              {l.ctaButton}
            </Link>
            <a
              href="https://t.me/avto_korea_nikolai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl border border-white/20 hover:border-white/40 text-white/90 hover:text-white font-semibold text-sm transition-all"
            >
              {l.ctaContact}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
