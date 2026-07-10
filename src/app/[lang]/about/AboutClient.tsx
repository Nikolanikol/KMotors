"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Truck,
  Award,
  Search,
  Globe,
  HeadphonesIcon,
  Package,
  CreditCard,
  ClipboardList,
  Send,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  lang: string;
}

const L: Record<string, Record<string, string>> = {
  ru: {
    heroTag: "О компании",
    heroTitle: "K-Axis — оригинальные запчасти",
    heroHighlight: "напрямую из Кореи",
    heroDesc:
      "Прямые поставки автозапчастей Hyundai, Kia и Genesis от производителей и официальных дилеров Южной Кореи. Надёжно, быстро, по честной цене.",
    heroCta: "Перейти в каталог",
    heroContact: "Связаться с нами",

    whoTitle: "Кто мы",
    whoP1:
      "K-Axis — это команда специалистов, которая работает напрямую с крупнейшими поставщиками автозапчастей в Южной Корее, включая Hyundai Mobis, Mando, Parts Mall и других. Мы закупаем только оригинальные детали без посредников, поэтому можем гарантировать подлинность и конкурентные цены.",
    whoP2:
      "Наша миссия — сделать ремонт и обслуживание корейских автомобилей доступным для клиентов по всему миру. Каталог K-Axis содержит более 48 000 позиций — от фильтров и тормозных колодок до двигателей и элементов кузова.",
    whoImageAlt: "Hyundai Mobis — партнёр K-Axis",

    statsYear: "Год основания",
    statsCountries: "Стран доставки",
    statsParts: "Товаров в каталоге",
    statsBrands: "Бренды запчастей",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48 000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "Автомобили из Кореи",
    autoP1:
      "Помимо запчастей, K-Axis помогает приобрести автомобили напрямую из Южной Кореи. Корейские марки — Hyundai, Kia, Genesis, SsangYong — и популярные импортные бренды: BMW, Mercedes-Benz, Audi, Tesla, Toyota и многие другие. Подберём автомобиль на аукционе или у дилера по вашим критериям.",
    autoP2:
      "Полное сопровождение: подбор, проверка истории, выкуп, оформление документов, доставка до порта назначения. Калькулятор на сайте поможет рассчитать итоговую стоимость с учётом таможенных пошлин и доставки.",
    autoCta: "Калькулятор стоимости",
    autoCatalog: "Каталог авто",

    howTitle: "Как мы работаем",
    step1title: "Заявка",
    step1desc: "Найдите деталь в каталоге или оставьте запрос — мы подберём по VIN-номеру",
    step2title: "Подбор и расчёт",
    step2desc: "Подбираем оригинальную запчасть и рассчитываем стоимость с доставкой до вашей двери",
    step3title: "Оплата",
    step3desc: "Безопасная оплата банковской картой или другими доступными способами",
    step4title: "Доставка",
    step4desc: "Отправляем EMS Korea — от 7 дней. Вы получаете трекинг-номер для отслеживания",

    advTitle: "Почему K-Axis",
    adv1title: "Только оригинал",
    adv1desc: "Работаем напрямую с Hyundai Mobis и другими OEM-поставщиками. Никаких подделок.",
    adv2title: "Прямые поставки",
    adv2desc: "Без посредников — запчасти едут из Кореи прямо к вам. Это дешевле и быстрее.",
    adv3title: "Быстрая доставка",
    adv3desc: "EMS Korea: 7-20 дней в любую точку мира. Трекинг на каждом этапе.",
    adv4title: "Подбор по VIN",
    adv4desc: "Не знаете артикул? Пришлите VIN — подберём нужную деталь с гарантией совместимости.",
    adv5title: "Безопасная оплата",
    adv5desc: "Безопасная оплата с защитой покупателя. Ваши деньги в безопасности до получения товара.",
    adv6title: "Поддержка 24/7",
    adv6desc: "Менеджеры на связи в Telegram и WhatsApp. Отвечаем на вашем языке.",

    geoTitle: "География доставки",
    geoDesc: "Доставляем оригинальные запчасти из Южной Кореи в следующие страны:",

    ctaTitle: "Нужна запчасть?",
    ctaDesc: "Свяжитесь с нами — поможем подобрать и доставить оригинальную деталь из Кореи.",
    ctaCatalog: "Каталог запчастей",
    ctaContact: "Написать нам",
  },
  en: {
    heroTag: "About Us",
    heroTitle: "K-Axis — genuine auto parts",
    heroHighlight: "direct from Korea",
    heroDesc:
      "Direct supply of Hyundai, Kia and Genesis auto parts from manufacturers and official dealers in South Korea. Reliable, fast, at fair prices.",
    heroCta: "Browse Catalog",
    heroContact: "Contact Us",

    whoTitle: "Who We Are",
    whoP1:
      "K-Axis is a team of specialists working directly with South Korea's largest auto parts suppliers, including Hyundai Mobis, Mando, Parts Mall, and others. We source only genuine parts without middlemen, guaranteeing authenticity and competitive pricing.",
    whoP2:
      "Our mission is to make Korean vehicle maintenance accessible to customers worldwide. The K-Axis catalog contains over 48,000 items — from filters and brake pads to engines and body parts.",
    whoImageAlt: "Hyundai Mobis — K-Axis partner",

    statsYear: "Founded",
    statsCountries: "Countries",
    statsParts: "Products",
    statsBrands: "Parts Brands",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48,000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "Cars from Korea",
    autoP1:
      "Beyond parts, K-Axis helps you purchase vehicles directly from South Korea. Korean brands — Hyundai, Kia, Genesis, SsangYong — plus popular imports: BMW, Mercedes-Benz, Audi, Tesla, Toyota, and many more. We'll find the right car at auction or dealership based on your criteria.",
    autoP2:
      "Full support: selection, history check, purchase, documentation, delivery to your destination port. Our on-site calculator helps estimate the total cost including customs duties and shipping.",
    autoCta: "Cost Calculator",
    autoCatalog: "Car Catalog",

    howTitle: "How We Work",
    step1title: "Request",
    step1desc: "Find a part in our catalog or submit a request — we'll match by VIN number",
    step2title: "Selection & Quote",
    step2desc: "We source the genuine part and calculate the total cost including delivery",
    step3title: "Payment",
    step3desc: "Secure payment via credit/debit card or other available methods",
    step4title: "Delivery",
    step4desc: "Shipped via EMS Korea — from 7 days. You receive a tracking number",

    advTitle: "Why K-Axis",
    adv1title: "Genuine Only",
    adv1desc: "Direct partnerships with Hyundai Mobis and other OEM suppliers. No counterfeits.",
    adv2title: "Direct Supply",
    adv2desc: "No middlemen — parts ship from Korea straight to you. Cheaper and faster.",
    adv3title: "Fast Delivery",
    adv3desc: "EMS Korea: 7-20 days worldwide. Tracking at every stage.",
    adv4title: "VIN Matching",
    adv4desc: "Don't know the part number? Send your VIN — we'll find the exact part.",
    adv5title: "Secure Payment",
    adv5desc: "Secure payment with buyer protection. Your money is safe until you receive the goods.",
    adv6title: "24/7 Support",
    adv6desc: "Managers available on Telegram and WhatsApp. We reply in your language.",

    geoTitle: "Delivery Geography",
    geoDesc: "We deliver genuine parts from South Korea to the following countries:",

    ctaTitle: "Need a part?",
    ctaDesc: "Contact us — we'll help you find and deliver the genuine part from Korea.",
    ctaCatalog: "Parts Catalog",
    ctaContact: "Contact Us",
  },
  ko: {
    heroTag: "회사 소개",
    heroTitle: "K-Axis — 정품 자동차 부품",
    heroHighlight: "한국에서 직접 공급",
    heroDesc:
      "현대, 기아, 제네시스 자동차 부품을 한국 제조사 및 공식 딜러에서 직접 공급합니다. 신뢰할 수 있고, 빠르며, 합리적인 가격.",
    heroCta: "카탈로그 보기",
    heroContact: "문의하기",

    whoTitle: "회사 소개",
    whoP1:
      "K-Axis는 현대모비스, 만도, 파츠몰 등 한국 최대 자동차 부품 공급업체와 직접 거래하는 전문 팀입니다. 중간 유통 없이 정품만 취급하여 정품성과 경쟁력 있는 가격을 보장합니다.",
    whoP2:
      "우리의 사명은 전 세계 고객이 한국 자동차를 쉽게 정비할 수 있도록 하는 것입니다. K-Axis 카탈로그에는 필터, 브레이크 패드부터 엔진, 차체 부품까지 48,000개 이상의 품목이 있습니다.",
    whoImageAlt: "현대모비스 — K-Axis 파트너",

    statsYear: "설립 연도",
    statsCountries: "배송 국가",
    statsParts: "카탈로그 상품",
    statsBrands: "부품 브랜드",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48,000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "한국에서 자동차 구매",
    autoP1:
      "부품 외에도 K-Axis는 한국에서 직접 자동차 구매를 도와드립니다. 현대, 기아, 제네시스, 쌍용 등 한국 브랜드는 물론 BMW, Mercedes-Benz, Audi, Tesla, Toyota 등 인기 수입 브랜드까지. 경매나 딜러에서 원하시는 조건의 차를 찾아드립니다.",
    autoP2:
      "선정, 이력 확인, 구매, 서류 처리, 목적지 항구까지 배송 — 전 과정을 지원합니다. 사이트의 계산기로 관세 및 배송비 포함 총 비용을 미리 확인하세요.",
    autoCta: "비용 계산기",
    autoCatalog: "자동차 카탈로그",

    howTitle: "이용 방법",
    step1title: "문의",
    step1desc: "카탈로그에서 부품을 찾거나 요청을 남기세요 — VIN 번호로 매칭해 드립니다",
    step2title: "선정 및 견적",
    step2desc: "정품 부품을 찾고 배송비 포함 총 비용을 계산합니다",
    step3title: "결제",
    step3desc: "신용/직불카드 또는 기타 이용 가능한 결제 수단으로 안전하게 결제",
    step4title: "배송",
    step4desc: "EMS Korea로 발송 — 7일부터. 추적 번호를 제공합니다",

    advTitle: "K-Axis를 선택하는 이유",
    adv1title: "정품만 취급",
    adv1desc: "현대모비스 및 기타 OEM 공급업체와 직접 거래. 위조품 없음.",
    adv2title: "직접 공급",
    adv2desc: "중간 유통 없이 한국에서 직접 배송. 더 저렴하고 빠릅니다.",
    adv3title: "빠른 배송",
    adv3desc: "EMS Korea: 전 세계 7-20일. 모든 단계에서 추적 가능.",
    adv4title: "VIN 매칭",
    adv4desc: "부품 번호를 모르시나요? VIN을 보내주시면 정확한 부품을 찾아드립니다.",
    adv5title: "안전한 결제",
    adv5desc: "구매자 보호가 있는 안전한 결제. 상품을 받을 때까지 안전합니다.",
    adv6title: "24/7 지원",
    adv6desc: "텔레그램과 WhatsApp으로 상담 가능. 한국어로 답변해 드립니다.",

    geoTitle: "배송 지역",
    geoDesc: "한국에서 다음 국가로 정품 부품을 배송합니다:",

    ctaTitle: "부품이 필요하신가요?",
    ctaDesc: "연락 주세요 — 한국에서 정품 부품을 찾아 배송해 드립니다.",
    ctaCatalog: "부품 카탈로그",
    ctaContact: "문의하기",
  },
  ka: {
    heroTag: "ჩვენს შესახებ",
    heroTitle: "K-Axis — ორიგინალური ავტონაწილები",
    heroHighlight: "პირდაპირ კორეიდან",
    heroDesc:
      "Hyundai, Kia და Genesis ავტონაწილების პირდაპირი მიწოდება სამხრეთ კორეის მწარმოებლებისა და ოფიციალური დილერებისგან.",
    heroCta: "კატალოგის ნახვა",
    heroContact: "დაგვიკავშირდით",

    whoTitle: "ვინ ვართ ჩვენ",
    whoP1:
      "K-Axis არის სპეციალისტთა გუნდი, რომელიც პირდაპირ მუშაობს სამხრეთ კორეის უმსხვილეს ავტონაწილების მომწოდებლებთან, მათ შორის Hyundai Mobis, Mando, Parts Mall. ვიძენთ მხოლოდ ორიგინალურ ნაწილებს შუამავლების გარეშე.",
    whoP2:
      "ჩვენი მისია — კორეული ავტომობილების მოვლა ხელმისაწვდომი გავხადოთ მთელი მსოფლიოსთვის. K-Axis კატალოგში 48 000-ზე მეტი პროდუქტია.",
    whoImageAlt: "Hyundai Mobis — K-Axis-ის პარტნიორი",

    statsYear: "დაარსების წელი",
    statsCountries: "მიტანის ქვეყნები",
    statsParts: "პროდუქტები",
    statsBrands: "ნაწილების ბრენდები",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48 000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "ავტომობილები კორეიდან",
    autoP1:
      "ნაწილების გარდა, K-Axis გეხმარებათ ავტომობილის შეძენაში პირდაპირ სამხრეთ კორეიდან. კორეული ბრენდები — Hyundai, Kia, Genesis, SsangYong — და პოპულარული იმპორტი: BMW, Mercedes-Benz, Audi, Tesla, Toyota და სხვა. აუქციონზე ან დილერთან თქვენი კრიტერიუმებით.",
    autoP2:
      "სრული თანხლება: შერჩევა, ისტორიის შემოწმება, შეძენა, დოკუმენტაცია, მიტანა. საიტის კალკულატორი დაგეხმარებათ საბაჟო გადასახადებისა და მიტანის ჩათვლით საბოლოო ფასის გამოთვლაში.",
    autoCta: "ფასის კალკულატორი",
    autoCatalog: "ავტო კატალოგი",

    howTitle: "როგორ ვმუშაობთ",
    step1title: "მოთხოვნა",
    step1desc: "იპოვეთ ნაწილი კატალოგში ან დატოვეთ მოთხოვნა — VIN ნომრით შევარჩევთ",
    step2title: "შერჩევა და ფასი",
    step2desc: "ვარჩევთ ორიგინალურ ნაწილს და ვითვლით ფასს მიტანით",
    step3title: "გადახდა",
    step3desc: "უსაფრთხო გადახდა ბარათით ან სხვა ხელმისაწვდომი მეთოდით",
    step4title: "მიტანა",
    step4desc: "EMS Korea-ით გაგზავნა — 7 დღიდან. თვალთვალის ნომერს მიიღებთ",

    advTitle: "რატომ K-Axis",
    adv1title: "მხოლოდ ორიგინალი",
    adv1desc: "პირდაპირი თანამშრომლობა Hyundai Mobis-თან და სხვა OEM მომწოდებლებთან.",
    adv2title: "პირდაპირი მიწოდება",
    adv2desc: "შუამავლების გარეშე — ნაწილები კორეიდან პირდაპირ თქვენთან.",
    adv3title: "სწრაფი მიტანა",
    adv3desc: "EMS Korea: 7-20 დღე მსოფლიოს ნებისმიერ წერტილში.",
    adv4title: "VIN შერჩევა",
    adv4desc: "არ იცით ნაწილის ნომერი? გამოგვიგზავნეთ VIN — ზუსტ ნაწილს მოვძებნით.",
    adv5title: "უსაფრთხო გადახდა",
    adv5desc: "უსაფრთხო გადახდა მყიდველის დაცვით.",
    adv6title: "24/7 მხარდაჭერა",
    adv6desc: "მენეჯერები ხელმისაწვდომია Telegram-სა და WhatsApp-ში.",

    geoTitle: "მიტანის გეოგრაფია",
    geoDesc: "ორიგინალურ ნაწილებს ვაწვდით სამხრეთ კორეიდან შემდეგ ქვეყნებში:",

    ctaTitle: "გჭირდებათ ნაწილი?",
    ctaDesc: "დაგვიკავშირდით — დაგეხმარებით კორეიდან ორიგინალური ნაწილის მოძიებასა და მიტანაში.",
    ctaCatalog: "ნაწილების კატალოგი",
    ctaContact: "მოგვწერეთ",
  },
  ar: {
    heroTag: "عن الشركة",
    heroTitle: "K-Axis — قطع غيار أصلية",
    heroHighlight: "مباشرة من كوريا",
    heroDesc:
      "توريد مباشر لقطع غيار Hyundai وKia وGenesis من المصنعين والوكلاء الرسميين في كوريا الجنوبية. موثوق وسريع وبأسعار عادلة.",
    heroCta: "تصفح الكتالوج",
    heroContact: "تواصل معنا",

    whoTitle: "من نحن",
    whoP1:
      "K-Axis هو فريق متخصص يعمل مباشرة مع أكبر موردي قطع غيار السيارات في كوريا الجنوبية، بما في ذلك Hyundai Mobis وMando وParts Mall وغيرها. نحن نوفر قطع الغيار الأصلية فقط بدون وسطاء.",
    whoP2:
      "مهمتنا — جعل صيانة السيارات الكورية في متناول العملاء حول العالم. يحتوي كتالوج K-Axis على أكثر من 48,000 منتج.",
    whoImageAlt: "Hyundai Mobis — شريك K-Axis",

    statsYear: "سنة التأسيس",
    statsCountries: "دول التوصيل",
    statsParts: "منتجات",
    statsBrands: "العلامات التجارية",
    statsYearVal: "2025",
    statsCountriesVal: "+37",
    statsPartsVal: "+48,000",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "سيارات من كوريا",
    autoP1:
      "بالإضافة إلى قطع الغيار، يساعدك K-Axis في شراء السيارات مباشرة من كوريا الجنوبية. العلامات الكورية — Hyundai وKia وGenesis وSsangYong — والعلامات المستوردة الشهيرة: BMW وMercedes-Benz وAudi وTesla وToyota وغيرها. سنجد السيارة المناسبة في المزاد أو عند الوكيل.",
    autoP2:
      "دعم كامل: الاختيار، فحص التاريخ، الشراء، التوثيق، التوصيل إلى ميناء الوجهة. حاسبة الموقع تساعدك في تقدير التكلفة الإجمالية شاملة الرسوم الجمركية والشحن.",
    autoCta: "حاسبة التكلفة",
    autoCatalog: "كتالوج السيارات",

    howTitle: "كيف نعمل",
    step1title: "الطلب",
    step1desc: "ابحث عن القطعة في الكتالوج أو أرسل طلبًا — سنطابقها برقم VIN",
    step2title: "الاختيار والتسعير",
    step2desc: "نختار القطعة الأصلية ونحسب التكلفة الإجمالية شاملة التوصيل",
    step3title: "الدفع",
    step3desc: "دفع آمن عبر بطاقة الائتمان/الخصم أو طرق الدفع الأخرى المتاحة",
    step4title: "التوصيل",
    step4desc: "شحن عبر EMS Korea — من 7 أيام. تحصل على رقم تتبع",

    advTitle: "لماذا K-Axis",
    adv1title: "أصلي فقط",
    adv1desc: "شراكة مباشرة مع Hyundai Mobis وموردي OEM آخرين. لا تقليد.",
    adv2title: "توريد مباشر",
    adv2desc: "بدون وسطاء — القطع تُشحن من كوريا مباشرة إليك. أرخص وأسرع.",
    adv3title: "توصيل سريع",
    adv3desc: "EMS Korea: 7-20 يومًا حول العالم. تتبع في كل مرحلة.",
    adv4title: "مطابقة VIN",
    adv4desc: "لا تعرف رقم القطعة؟ أرسل رقم VIN وسنجد القطعة المناسبة.",
    adv5title: "دفع آمن",
    adv5desc: "دفع آمن مع حماية المشتري. أموالك آمنة حتى استلام البضاعة.",
    adv6title: "دعم 24/7",
    adv6desc: "المديرون متاحون على Telegram وWhatsApp. نرد بلغتك.",

    geoTitle: "جغرافية التوصيل",
    geoDesc: "نوصل قطع الغيار الأصلية من كوريا الجنوبية إلى الدول التالية:",

    ctaTitle: "تحتاج قطعة غيار؟",
    ctaDesc: "تواصل معنا — سنساعدك في العثور على القطعة الأصلية وتوصيلها من كوريا.",
    ctaCatalog: "كتالوج القطع",
    ctaContact: "راسلنا",
  },
};

const GEO_REGIONS: { label: Record<string, string>; countries: { code: string; flag: string; name: Record<string, string> }[] }[] = [
  {
    label: { ru: "СНГ", en: "CIS", ko: "CIS", ka: "დსთ", ar: "رابطة الدول" },
    countries: [
      { code: "RU", flag: "🇷🇺", name: { ru: "Россия", en: "Russia", ko: "러시아", ka: "რუსეთი", ar: "روسيا" } },
      { code: "KZ", flag: "🇰🇿", name: { ru: "Казахстан", en: "Kazakhstan", ko: "카자흐스탄", ka: "ყაზახეთი", ar: "كازاخستان" } },
      { code: "BY", flag: "🇧🇾", name: { ru: "Беларусь", en: "Belarus", ko: "벨라루스", ka: "ბელარუსი", ar: "بيلاروسيا" } },
      { code: "UA", flag: "🇺🇦", name: { ru: "Украина", en: "Ukraine", ko: "우크라이나", ka: "უკრაინა", ar: "أوكرانيا" } },
      { code: "UZ", flag: "🇺🇿", name: { ru: "Узбекистан", en: "Uzbekistan", ko: "우즈베키스탄", ka: "უზბეკეთი", ar: "أوزبكستان" } },
      { code: "AZ", flag: "🇦🇿", name: { ru: "Азербайджан", en: "Azerbaijan", ko: "아제르바이잔", ka: "აზერბაიჯანი", ar: "أذربيجان" } },
      { code: "AM", flag: "🇦🇲", name: { ru: "Армения", en: "Armenia", ko: "아르메니아", ka: "სომხეთი", ar: "أرمينيا" } },
      { code: "GE", flag: "🇬🇪", name: { ru: "Грузия", en: "Georgia", ko: "조지아", ka: "საქართველო", ar: "جورجيا" } },
    ],
  },
  {
    label: { ru: "Европа", en: "Europe", ko: "유럽", ka: "ევროპა", ar: "أوروبا" },
    countries: [
      { code: "DE", flag: "🇩🇪", name: { ru: "Германия", en: "Germany", ko: "독일", ka: "გერმანია", ar: "ألمانيا" } },
      { code: "GB", flag: "🇬🇧", name: { ru: "Великобритания", en: "UK", ko: "영국", ka: "დიდი ბრიტანეთი", ar: "بريطانيا" } },
      { code: "FR", flag: "🇫🇷", name: { ru: "Франция", en: "France", ko: "프랑스", ka: "საფრანგეთი", ar: "فرنسا" } },
      { code: "ES", flag: "🇪🇸", name: { ru: "Испания", en: "Spain", ko: "스페인", ka: "ესპანეთი", ar: "إسبانيا" } },
      { code: "IT", flag: "🇮🇹", name: { ru: "Италия", en: "Italy", ko: "이탈리아", ka: "იტალია", ar: "إيطاليا" } },
      { code: "PL", flag: "🇵🇱", name: { ru: "Польша", en: "Poland", ko: "폴란드", ka: "პოლონეთი", ar: "بولندا" } },
      { code: "NL", flag: "🇳🇱", name: { ru: "Нидерланды", en: "Netherlands", ko: "네덜란드", ka: "ნიდერლანდები", ar: "هولندا" } },
      { code: "TR", flag: "🇹🇷", name: { ru: "Турция", en: "Turkey", ko: "터키", ka: "თურქეთი", ar: "تركيا" } },
    ],
  },
  {
    label: { ru: "Азия", en: "Asia", ko: "아시아", ka: "აზია", ar: "آسيا" },
    countries: [
      { code: "CN", flag: "🇨🇳", name: { ru: "Китай", en: "China", ko: "중국", ka: "ჩინეთი", ar: "الصين" } },
      { code: "JP", flag: "🇯🇵", name: { ru: "Япония", en: "Japan", ko: "일본", ka: "იაპონია", ar: "اليابان" } },
      { code: "SG", flag: "🇸🇬", name: { ru: "Сингапур", en: "Singapore", ko: "싱가포르", ka: "სინგაპური", ar: "سنغافورة" } },
      { code: "TH", flag: "🇹🇭", name: { ru: "Таиланд", en: "Thailand", ko: "태국", ka: "ტაილანდი", ar: "تايلاند" } },
      { code: "VN", flag: "🇻🇳", name: { ru: "Вьетнам", en: "Vietnam", ko: "베트남", ka: "ვიეტნამი", ar: "فيتنام" } },
      { code: "MY", flag: "🇲🇾", name: { ru: "Малайзия", en: "Malaysia", ko: "말레이시아", ka: "მალაიზია", ar: "ماليزيا" } },
      { code: "ID", flag: "🇮🇩", name: { ru: "Индонезия", en: "Indonesia", ko: "인도네시아", ka: "ინდონეზია", ar: "إندونيسيا" } },
      { code: "PH", flag: "🇵🇭", name: { ru: "Филиппины", en: "Philippines", ko: "필리핀", ka: "ფილიპინები", ar: "الفلبين" } },
      { code: "IN", flag: "🇮🇳", name: { ru: "Индия", en: "India", ko: "인도", ka: "ინდოეთი", ar: "الهند" } },
      { code: "TW", flag: "🇹🇼", name: { ru: "Тайвань", en: "Taiwan", ko: "대만", ka: "ტაივანი", ar: "تايوان" } },
      { code: "HK", flag: "🇭🇰", name: { ru: "Гонконг", en: "Hong Kong", ko: "홍콩", ka: "ჰონგ კონგი", ar: "هونغ كونغ" } },
    ],
  },
  {
    label: { ru: "Ближний Восток", en: "Middle East", ko: "중동", ka: "ახლო აღმოსავლეთი", ar: "الشرق الأوسط" },
    countries: [
      { code: "AE", flag: "🇦🇪", name: { ru: "ОАЭ", en: "UAE", ko: "아랍에미리트", ka: "არაბეთის საემირო", ar: "الإمارات" } },
      { code: "SA", flag: "🇸🇦", name: { ru: "Саудовская Аравия", en: "Saudi Arabia", ko: "사우디아라비아", ka: "საუდის არაბეთი", ar: "السعودية" } },
      { code: "IL", flag: "🇮🇱", name: { ru: "Израиль", en: "Israel", ko: "이스라엘", ka: "ისრაელი", ar: "إسرائيل" } },
      { code: "EG", flag: "🇪🇬", name: { ru: "Египет", en: "Egypt", ko: "이집트", ka: "ეგვიპტე", ar: "مصر" } },
    ],
  },
  {
    label: { ru: "Америка и Океания", en: "Americas & Oceania", ko: "아메리카 및 오세아니아", ka: "ამერიკა და ოკეანია", ar: "الأمريكتان وأوقيانوسيا" },
    countries: [
      { code: "US", flag: "🇺🇸", name: { ru: "США", en: "USA", ko: "미국", ka: "აშშ", ar: "الولايات المتحدة" } },
      { code: "CA", flag: "🇨🇦", name: { ru: "Канада", en: "Canada", ko: "캐나다", ka: "კანადა", ar: "كندا" } },
      { code: "BR", flag: "🇧🇷", name: { ru: "Бразилия", en: "Brazil", ko: "브라질", ka: "ბრაზილია", ar: "البرازيل" } },
      { code: "AR", flag: "🇦🇷", name: { ru: "Аргентина", en: "Argentina", ko: "아르헨티나", ka: "არგენტინა", ar: "الأرجنتين" } },
      { code: "AU", flag: "🇦🇺", name: { ru: "Австралия", en: "Australia", ko: "호주", ka: "ავსტრალია", ar: "أستراليا" } },
      { code: "NZ", flag: "🇳🇿", name: { ru: "Новая Зеландия", en: "New Zealand", ko: "뉴질랜드", ka: "ახალი ზელანდია", ar: "نيوزيلندا" } },
    ],
  },
];

const ADV_ICONS = [Shield, Package, Truck, Search, CreditCard, HeadphonesIcon];

const STEP_ICONS = [ClipboardList, Search, CreditCard, Truck];

const CAR_BRANDS: { name: string; from: string; to: string; models: string[]; img?: string }[] = [
  { name: "Hyundai", from: "#002C5F", to: "#1a5fa0", models: ["Tucson", "Santa Fe", "Palisade", "IONIQ 5", "Sonata", "Creta"], img: "/images/cars/hyundai.jpg" },
  { name: "Kia", from: "#05141F", to: "#1a3d5c", models: ["Sportage", "Sorento", "EV6", "K5", "Carnival", "Seltos"], img: "/images/cars/kia.jpg" },
  { name: "Genesis", from: "#1a1a2e", to: "#3d3d5c", models: ["G80", "GV70", "GV80", "G70", "GV60"], img: "/images/cars/genesis.jpg" },
  { name: "SsangYong", from: "#1b4332", to: "#2d6a4f", models: ["Torres", "Rexton", "Korando", "Tivoli"], img: "/images/cars/ssangyong.jpg" },
  { name: "Chevrolet", from: "#1a1a1a", to: "#c8a415", models: ["Trailblazer", "Trax", "Malibu", "Spark"], img: "/images/cars/chevrolet.jpg" },
  { name: "Renault Samsung", from: "#f4b400", to: "#d49b00", models: ["QM6", "SM6", "Arkana", "XM3"], img: "/images/cars/renault.jpg" },
  { name: "BMW", from: "#1c69d3", to: "#0a3d91", models: ["3 Series", "5 Series", "X3", "X5", "iX"], img: "/images/cars/bmw.jpg" },
  { name: "Mercedes-Benz", from: "#222222", to: "#555555", models: ["C-Class", "E-Class", "GLC", "GLE", "EQS"], img: "/images/cars/mercedes.jpg" },
  { name: "Audi", from: "#bb0a30", to: "#8a0823", models: ["A4", "A6", "Q5", "Q7", "e-tron"], img: "/images/cars/audi.jpg" },
  { name: "Volkswagen", from: "#001e50", to: "#003380", models: ["Tiguan", "Golf", "ID.4", "Passat", "Touareg"], img: "/images/cars/volkswagen.jpg" },
  { name: "Toyota", from: "#cc0000", to: "#8a0000", models: ["Camry", "RAV4", "Land Cruiser", "Prius", "Highlander"], img: "/images/cars/toyota.jpg" },
  { name: "Lexus", from: "#1a1a1a", to: "#4a4a4a", models: ["RX", "NX", "ES", "LX", "UX"], img: "/images/cars/lexus.jpg" },
  { name: "Tesla", from: "#1a1a2e", to: "#e31937", models: ["Model 3", "Model Y", "Model S", "Model X"], img: "/images/cars/tesla.jpg" },
  { name: "Porsche", from: "#6b0f1a", to: "#4a0a12", models: ["Cayenne", "Macan", "Panamera", "Taycan"], img: "/images/cars/porsche.jpg" },
  { name: "Volvo", from: "#003057", to: "#1a5276", models: ["XC60", "XC90", "S60", "V60", "EX30"], img: "/images/cars/volvo.jpg" },
  { name: "Land Rover", from: "#005a2b", to: "#2e7d32", models: ["Range Rover", "Defender", "Discovery", "Evoque"], img: "/images/cars/land-rover.jpg" },
];

export default function AboutClient({ lang }: Props) {
  const l = L[lang] ?? L.ru;
  const isRTL = false; // RTL-переворот отключён — макет всегда LTR (см. layout.tsx)
  const [imgError, setImgError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const scrollAmount = 356;
    sliderRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      if (!sliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        sliderRef.current.scrollBy({ left: 356, behavior: "smooth" });
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="bg-[#F5F7FA] min-h-screen" dir={isRTL ? "rtl" : "ltr"}>

      {/* ═══ 1. HERO ═══ */}
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
            {l.heroTitle}
            <br className="hidden sm:block" />
            {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
              {l.heroHighlight}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {l.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${lang}/parts`}
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

      {/* ═══ 2. КТО МЫ ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F] mb-6">
              {l.whoTitle}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">{l.whoP1}</p>
            <p className="text-gray-600 leading-relaxed">{l.whoP2}</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[3/2]">
            {!imgError ? (
              <Image
                src="/images/about-mobis.jpg"
                alt={l.whoImageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#002C5F] to-[#001a3a] flex flex-col items-center justify-center gap-4 p-8">
                <div className="flex items-center gap-3">
                  <Shield className="w-10 h-10 text-orange-400" />
                  <span className="text-2xl font-bold text-white tracking-wide">Hyundai Mobis</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200/60 text-sm">
                  <span>Mando</span>
                  <span>·</span>
                  <span>Parts Mall</span>
                  <span>·</span>
                  <span>CTR</span>
                  <span>·</span>
                  <span>AMD</span>
                </div>
                <p className="text-blue-200/40 text-xs mt-2">OEM Partners · South Korea</p>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-5">
              <p className="text-white text-sm font-medium">
                Hyundai Mobis — OEM Partner
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2.5. АВТО ═══ */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <Car className="w-6 h-6 text-[#002C5F]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F]">
              {l.autoTitle}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4 max-w-3xl">{l.autoP1}</p>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-3xl">{l.autoP2}</p>

          {/* Car brands slider */}
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <style>{`.slider-hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
            <button
              onClick={() => scrollSlider("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center hover:bg-gray-50 transition hidden lg:flex"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div
              ref={sliderRef}
              className="slider-hide-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {CAR_BRANDS.map((brand) => (
                <div key={brand.name} className="snap-start shrink-0 w-[280px] sm:w-[340px]">
                  <div
                    className="rounded-2xl h-[220px] sm:h-[240px] flex flex-col justify-between relative overflow-hidden group cursor-default"
                    style={{ background: `linear-gradient(135deg, ${brand.from}, ${brand.to})` }}
                  >
                    {brand.img && (
                      <Image
                        src={brand.img}
                        alt={brand.name}
                        fill
                        className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                        sizes="340px"
                      />
                    )}
                    {!brand.img && (
                      <div className="absolute inset-0 opacity-[0.07]">
                        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white blur-xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative p-5 flex flex-col justify-between h-full">
                      <h4 className="text-white font-bold text-xl sm:text-2xl tracking-wide drop-shadow-md">
                        {brand.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brand.models.map((m) => (
                          <span
                            key={m}
                            className="text-[11px] text-white/90 bg-black/30 rounded-full px-3 py-1 backdrop-blur-sm"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollSlider("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center hover:bg-gray-50 transition hidden lg:flex"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href={`/${lang}/calculator`}
              className="px-6 py-2.5 rounded-xl bg-[#002C5F] hover:bg-[#001f45] text-white font-semibold text-sm transition"
            >
              {l.autoCta}
            </Link>
            <Link
              href={`/${lang}/catalog`}
              className="px-6 py-2.5 rounded-xl border-2 border-[#002C5F]/20 hover:border-[#002C5F]/40 text-[#002C5F] font-semibold text-sm transition"
            >
              {l.autoCatalog}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 3. ЦИФРЫ ═══ */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: l.statsYear, value: l.statsYearVal },
              { label: l.statsCountries, value: l.statsCountriesVal },
              { label: l.statsParts, value: l.statsPartsVal },
              { label: l.statsBrands, value: l.statsBrandsVal },
            ].map((s) => (
              <div key={s.label} className="text-center p-4">
                <div className="text-2xl sm:text-3xl font-bold text-[#002C5F] mb-1">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. КАК МЫ РАБОТАЕМ ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
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
              <div key={i} className="relative bg-white rounded-2xl border border-gray-100 p-6 text-center group hover:shadow-lg hover:border-orange-100 transition-all duration-300">
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
      </section>

      {/* ═══ 5. ПРЕИМУЩЕСТВА ═══ */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
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
                  className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-orange-100 hover:shadow-md transition-all duration-300 bg-[#F5F7FA]/50"
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
        </div>
      </section>

      {/* ═══ 6. ГЕОГРАФИЯ ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Globe className="w-7 h-7 text-orange-500" />
          <h2 className="text-2xl sm:text-3xl font-bold text-[#002C5F]">
            {l.geoTitle}
          </h2>
        </div>
        <p className="text-gray-500 text-center text-sm mb-10 max-w-lg mx-auto">
          {l.geoDesc}
        </p>
        <div className="space-y-8">
          {GEO_REGIONS.map((region) => (
            <div key={region.label.en}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                {region.label[lang] ?? region.label.en}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {region.countries.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 hover:border-orange-200 hover:shadow-sm transition-all"
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="text-sm font-medium text-[#002C5F]">
                      {c.name[lang] ?? c.name.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            🇰🇷 → {GEO_REGIONS.flatMap((r) => r.countries).map((c) => c.flag).join(" ")}
          </p>
        </div>
      </section>

      {/* ═══ 7. CTA ═══ */}
      <section className="relative overflow-hidden bg-[#002C5F]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <Send className="w-10 h-10 text-orange-400 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {l.ctaTitle}
          </h2>
          <p className="text-blue-100/70 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            {l.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${lang}/parts`}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25"
            >
              {l.ctaCatalog}
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3.5 rounded-xl border border-white/20 hover:border-white/40 text-white/90 hover:text-white font-semibold text-sm transition-all"
            >
              {l.ctaContact}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
