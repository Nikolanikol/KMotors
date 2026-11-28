"use client";

// Страница «О нас» в стиле K-Axis (тёмная тема, бронза), переделана 28.11.2026.
// Решение владельца 28.11.2026: на странице сказать, что мы НЕ берём комиссию и делаем
// скидки, причём скидки — заметно, а размер скидки называем только в личных сообщениях.
// Поэтому цифр скидки здесь нет и не будет: блок ведёт в Telegram-бота, WhatsApp и
// директ Instagram. Каталог авто для Кореи скрыт (useCountry), как и везде на сайте.

import { useState, useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Truck,
  Search,
  Globe,
  HeadphonesIcon,
  Package,
  CreditCard,
  ClipboardList,
  Car,
  ChevronLeft,
  ChevronRight,
  BadgePercent,
  HandCoins,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { useCountry } from "@/hooks/useCountry";
import { waHref } from "@/lib/contact";
import { TG_BOT_URL } from "@/lib/carContactLinks";

interface Props {
  lang: string;
}

/** Директ Instagram: ig.me/m/<профиль> открывает переписку, а не ленту профиля. */
const IG_DM_URL = "https://ig.me/m/axiskoreancar";

const L: Record<string, Record<string, string>> = {
  ru: {
    heroTag: "О компании",
    heroTitle: "K-Axis — автомобили и запчасти",
    heroHighlight: "напрямую из Кореи",
    heroDesc:
      "Подбираем, проверяем и привозим автомобили с корейского рынка и аукционов. Поставляем оригинальные запчасти Hyundai, Kia и Genesis.",
    heroBadgeZero: "0% комиссии",
    heroBadgeDiscount: "Скидки — в личных сообщениях",
    heroCta: "Каталог авто",
    heroCtaParts: "Каталог запчастей",
    heroDiscount: "Узнать свою скидку",

    offerZeroTag: "Без комиссии",
    offerZeroTitle: "Мы не берём комиссию",
    offerZeroDesc:
      "Ни процента сверху за нашу работу. Цену машины или детали называем такой, какая она есть.",
    offerDiscTag: "Скидки",
    offerDiscTitle: "Делаем шикарные скидки",
    offerDiscDesc:
      "Размер скидки не публикуем — называем лично. Напишите нам в личные сообщения, и менеджер скажет, сколько сэкономите именно вы.",
    offerDiscHint: "Ответим в мессенджере, который вам удобен",
    waText: "Здравствуйте! Хочу узнать про скидку.",

    whoTitle: "Кто мы",
    whoP1:
      "K-Axis — команда в Южной Корее. Мы находим автомобили на Encar и корейских аукционах, проверяем историю и состояние, выкупаем, оформляем документы и отправляем покупателю.",
    whoP2:
      "Вторая часть нашей работы — оригинальные запчасти. Работаем с крупными корейскими поставщиками, включая Hyundai Mobis, Mando и Parts Mall; в каталоге K-Axis больше 48 000 позиций — от фильтров и колодок до двигателей и кузова.",
    whoImageAlt: "Склад оригинальных запчастей в Корее",
    whoImageCaption: "Оригинальные запчасти Hyundai · Kia · Genesis",

    statsYear: "Год основания",
    statsCountries: "Стран доставки",
    statsParts: "Запчастей в каталоге",
    statsBrands: "Марки",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48 000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "Автомобили из Кореи",
    autoP1:
      "Корейские марки — Hyundai, Kia, Genesis, SsangYong — и популярные импортные: BMW, Mercedes-Benz, Audi, Toyota, Lexus и другие. Подберём машину на аукционе или у дилера по вашим критериям.",
    autoP2:
      "Полное сопровождение: подбор, проверка истории, выкуп, документы, доставка до порта назначения. Калькулятор на сайте покажет итоговую стоимость с растаможкой и доставкой.",
    autoCta: "Калькулятор стоимости",
    autoCatalog: "Каталог авто",

    howTitle: "Как заказать запчасть",
    step1title: "Заявка",
    step1desc: "Найдите деталь в каталоге или оставьте запрос — подберём по VIN-номеру",
    step2title: "Подбор и расчёт",
    step2desc: "Подбираем оригинальную запчасть и считаем стоимость с доставкой до двери",
    step3title: "Оплата",
    step3desc: "Оплата банковской картой или другим доступным способом",
    step4title: "Доставка",
    step4desc: "Отправляем EMS Korea — от 7 дней. Вы получаете трек-номер",

    advTitle: "Почему K-Axis",
    adv1title: "Только оригинал",
    adv1desc: "Работаем с Hyundai Mobis и другими OEM-поставщиками. Никаких подделок.",
    adv2title: "Без посредников",
    adv2desc: "Машины и запчасти едут из Кореи прямо к вам — дешевле и быстрее.",
    adv3title: "Быстрая доставка",
    adv3desc: "Запчасти — EMS Korea, 7–20 дней в любую точку мира, с трекингом.",
    adv4title: "Подбор по VIN",
    adv4desc: "Не знаете артикул? Пришлите VIN — подберём деталь, которая точно подойдёт.",
    adv5title: "Без комиссии",
    adv5desc: "Не берём процент за свою работу, а скидку называем лично.",
    adv6title: "На связи",
    adv6desc: "Менеджеры отвечают в Telegram, WhatsApp и Instagram на вашем языке.",

    geoTitle: "География доставки",
    geoDesc: "Отправляем из Южной Кореи в эти страны:",

    ctaTitle: "Узнайте свою скидку",
    ctaDesc: "Напишите нам — подберём машину или запчасть и назовём скидку лично. Комиссию не берём.",
  },
  en: {
    heroTag: "About Us",
    heroTitle: "K-Axis — cars and parts",
    heroHighlight: "direct from Korea",
    heroDesc:
      "We find, inspect and deliver cars from the Korean market and auctions, and supply genuine Hyundai, Kia and Genesis parts.",
    heroBadgeZero: "0% commission",
    heroBadgeDiscount: "Discounts — via direct message",
    heroCta: "Car Catalog",
    heroCtaParts: "Parts Catalog",
    heroDiscount: "Get your discount",

    offerZeroTag: "No commission",
    offerZeroTitle: "We charge no commission",
    offerZeroDesc:
      "Not a single percent on top for our work. We quote the price of the car or part as it is.",
    offerDiscTag: "Discounts",
    offerDiscTitle: "We give great discounts",
    offerDiscDesc:
      "We don't publish the discount — we tell you personally. Send us a direct message and a manager will tell you exactly how much you save.",
    offerDiscHint: "We reply in whichever messenger suits you",
    waText: "Hello! I'd like to know about the discount.",

    whoTitle: "Who We Are",
    whoP1:
      "K-Axis is a team based in South Korea. We find cars on Encar and Korean auctions, check their history and condition, buy them, handle the paperwork and ship them to the buyer.",
    whoP2:
      "The other half of our work is genuine parts. We work with major Korean suppliers including Hyundai Mobis, Mando and Parts Mall; the K-Axis catalog has over 48,000 items — from filters and brake pads to engines and body parts.",
    whoImageAlt: "Genuine parts warehouse in Korea",
    whoImageCaption: "Genuine Hyundai · Kia · Genesis parts",

    statsYear: "Founded",
    statsCountries: "Countries",
    statsParts: "Parts in catalog",
    statsBrands: "Brands",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48,000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "Cars from Korea",
    autoP1:
      "Korean brands — Hyundai, Kia, Genesis, SsangYong — and popular imports: BMW, Mercedes-Benz, Audi, Toyota, Lexus and more. We'll find the right car at auction or a dealership based on your criteria.",
    autoP2:
      "Full support: selection, history check, purchase, documents, delivery to your destination port. The on-site calculator shows the total cost including customs and shipping.",
    autoCta: "Cost Calculator",
    autoCatalog: "Car Catalog",

    howTitle: "How to order a part",
    step1title: "Request",
    step1desc: "Find a part in the catalog or send a request — we'll match it by VIN",
    step2title: "Selection & Quote",
    step2desc: "We source the genuine part and calculate the cost with door delivery",
    step3title: "Payment",
    step3desc: "Pay by card or another available method",
    step4title: "Delivery",
    step4desc: "Shipped via EMS Korea — from 7 days. You get a tracking number",

    advTitle: "Why K-Axis",
    adv1title: "Genuine Only",
    adv1desc: "We work with Hyundai Mobis and other OEM suppliers. No counterfeits.",
    adv2title: "No Middlemen",
    adv2desc: "Cars and parts go from Korea straight to you — cheaper and faster.",
    adv3title: "Fast Delivery",
    adv3desc: "Parts ship via EMS Korea, 7–20 days worldwide, with tracking.",
    adv4title: "VIN Matching",
    adv4desc: "Don't know the part number? Send your VIN — we'll find the exact part.",
    adv5title: "No Commission",
    adv5desc: "We take no percentage for our work, and tell you your discount personally.",
    adv6title: "Always in Touch",
    adv6desc: "Managers reply on Telegram, WhatsApp and Instagram in your language.",

    geoTitle: "Where We Deliver",
    geoDesc: "We ship from South Korea to these countries:",

    ctaTitle: "Find out your discount",
    ctaDesc: "Message us — we'll find a car or a part and tell you your discount personally. No commission.",
  },
  ko: {
    heroTag: "회사 소개",
    heroTitle: "K-Axis — 자동차와 부품",
    heroHighlight: "한국에서 직접",
    heroDesc: "한국 시장과 경매에서 자동차를 찾고 점검해 배송하며, 현대·기아·제네시스 정품 부품을 공급합니다.",
    heroBadgeZero: "수수료 0%",
    heroBadgeDiscount: "할인 — 개인 메시지로 안내",
    heroCta: "자동차 카탈로그",
    heroCtaParts: "부품 카탈로그",
    heroDiscount: "할인 알아보기",

    offerZeroTag: "수수료 없음",
    offerZeroTitle: "수수료를 받지 않습니다",
    offerZeroDesc: "저희 업무에 대해 별도의 수수료를 받지 않습니다.",
    offerDiscTag: "할인",
    offerDiscTitle: "파격적인 할인을 드립니다",
    offerDiscDesc: "할인 금액은 공개하지 않고 개인적으로 안내합니다. 메시지를 보내주시면 담당자가 안내해 드립니다.",
    offerDiscHint: "편하신 메신저로 답변드립니다",
    waText: "안녕하세요! 할인에 대해 알고 싶습니다.",

    whoTitle: "회사 소개",
    whoP1: "K-Axis는 한국에 있는 팀입니다. Encar와 한국 경매에서 차량을 찾고, 이력과 상태를 확인하고, 구매·서류·배송까지 처리합니다.",
    whoP2: "또 하나의 사업은 정품 부품입니다. 현대모비스, 만도, 파츠몰 등과 거래하며 카탈로그에는 48,000개 이상의 품목이 있습니다.",
    whoImageAlt: "한국 정품 부품 창고",
    whoImageCaption: "현대 · 기아 · 제네시스 정품 부품",

    statsYear: "설립 연도",
    statsCountries: "배송 국가",
    statsParts: "부품 품목",
    statsBrands: "브랜드",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48,000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "한국에서 자동차 구매",
    autoP1: "현대, 기아, 제네시스, 쌍용 등 한국 브랜드와 BMW, Mercedes-Benz, Audi, Toyota, Lexus 등 수입 브랜드까지. 경매나 딜러에서 원하시는 차를 찾아드립니다.",
    autoP2: "선정, 이력 확인, 구매, 서류, 목적지 항구까지 배송 — 전 과정을 지원합니다.",
    autoCta: "비용 계산기",
    autoCatalog: "자동차 카탈로그",

    howTitle: "부품 주문 방법",
    step1title: "문의",
    step1desc: "카탈로그에서 부품을 찾거나 요청을 남기세요 — VIN으로 매칭합니다",
    step2title: "선정 및 견적",
    step2desc: "정품 부품을 찾고 배송비 포함 비용을 계산합니다",
    step3title: "결제",
    step3desc: "카드 또는 기타 결제 수단",
    step4title: "배송",
    step4desc: "EMS Korea로 발송 — 7일부터. 추적 번호 제공",

    advTitle: "K-Axis를 선택하는 이유",
    adv1title: "정품만 취급",
    adv1desc: "현대모비스 등 OEM 공급업체와 거래. 위조품 없음.",
    adv2title: "중간 유통 없음",
    adv2desc: "자동차와 부품이 한국에서 바로 배송됩니다.",
    adv3title: "빠른 배송",
    adv3desc: "부품은 EMS Korea로 전 세계 7–20일, 추적 가능.",
    adv4title: "VIN 매칭",
    adv4desc: "부품 번호를 모르시나요? VIN을 보내주세요.",
    adv5title: "수수료 없음",
    adv5desc: "수수료는 받지 않고, 할인은 개인적으로 안내합니다.",
    adv6title: "언제나 연락 가능",
    adv6desc: "텔레그램, WhatsApp, Instagram으로 답변합니다.",

    geoTitle: "배송 지역",
    geoDesc: "한국에서 다음 국가로 배송합니다:",

    ctaTitle: "할인을 알아보세요",
    ctaDesc: "메시지를 보내주세요 — 차량이나 부품을 찾고 할인을 개인적으로 안내합니다. 수수료 없음.",
  },
  ka: {
    heroTag: "ჩვენს შესახებ",
    heroTitle: "K-Axis — ავტომობილები და ნაწილები",
    heroHighlight: "პირდაპირ კორეიდან",
    heroDesc:
      "ვარჩევთ, ვამოწმებთ და ჩამოგვყავს ავტომობილები კორეული ბაზრიდან და აუქციონებიდან. ვაწვდით Hyundai, Kia და Genesis ორიგინალურ ნაწილებს.",
    heroBadgeZero: "0% საკომისიო",
    heroBadgeDiscount: "ფასდაკლება — პირად შეტყობინებაში",
    heroCta: "ავტო კატალოგი",
    heroCtaParts: "ნაწილების კატალოგი",
    heroDiscount: "გაიგეთ თქვენი ფასდაკლება",

    offerZeroTag: "საკომისიოს გარეშე",
    offerZeroTitle: "საკომისიოს არ ვიღებთ",
    offerZeroDesc:
      "ჩვენს სამუშაოზე არც ერთი პროცენტი ზემოდან. ავტომობილის ან ნაწილის ფასს ისე გეუბნებით, როგორიც არის.",
    offerDiscTag: "ფასდაკლებები",
    offerDiscTitle: "ვაკეთებთ შესანიშნავ ფასდაკლებებს",
    offerDiscDesc:
      "ფასდაკლების ოდენობას არ ვაქვეყნებთ — პირადად გეტყვით. მოგვწერეთ პირად შეტყობინებაში და მენეჯერი გეტყვით, რამდენს დაზოგავთ.",
    offerDiscHint: "გიპასუხებთ თქვენთვის მოსახერხებელ მესენჯერში",
    waText: "გამარჯობა! მინდა გავიგო ფასდაკლების შესახებ.",

    whoTitle: "ვინ ვართ ჩვენ",
    whoP1:
      "K-Axis — გუნდი სამხრეთ კორეაში. ვპოულობთ ავტომობილებს Encar-ზე და კორეულ აუქციონებზე, ვამოწმებთ ისტორიასა და მდგომარეობას, ვყიდულობთ, ვაფორმებთ დოკუმენტებს და ვუგზავნით მყიდველს.",
    whoP2:
      "ჩვენი საქმის მეორე ნაწილი — ორიგინალური ნაწილები. ვთანამშრომლობთ დიდ კორეულ მომწოდებლებთან, მათ შორის Hyundai Mobis, Mando და Parts Mall; კატალოგში 48 000-ზე მეტი პოზიციაა.",
    whoImageAlt: "ორიგინალური ნაწილების საწყობი კორეაში",
    whoImageCaption: "Hyundai · Kia · Genesis ორიგინალური ნაწილები",

    statsYear: "დაარსების წელი",
    statsCountries: "მიტანის ქვეყნები",
    statsParts: "ნაწილები კატალოგში",
    statsBrands: "მარკები",
    statsYearVal: "2025",
    statsCountriesVal: "37+",
    statsPartsVal: "48 000+",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "ავტომობილები კორეიდან",
    autoP1:
      "კორეული მარკები — Hyundai, Kia, Genesis, SsangYong — და პოპულარული იმპორტი: BMW, Mercedes-Benz, Audi, Toyota, Lexus და სხვა. აუქციონზე ან დილერთან თქვენი კრიტერიუმებით.",
    autoP2:
      "სრული თანხლება: შერჩევა, ისტორიის შემოწმება, შეძენა, დოკუმენტები, მიტანა. საიტის კალკულატორი აჩვენებს საბოლოო ფასს განბაჟებითა და მიტანით.",
    autoCta: "ფასის კალკულატორი",
    autoCatalog: "ავტო კატალოგი",

    howTitle: "როგორ შევუკვეთოთ ნაწილი",
    step1title: "მოთხოვნა",
    step1desc: "იპოვეთ ნაწილი კატალოგში ან დატოვეთ მოთხოვნა — VIN ნომრით შევარჩევთ",
    step2title: "შერჩევა და ფასი",
    step2desc: "ვარჩევთ ორიგინალურ ნაწილს და ვითვლით ფასს მიტანით",
    step3title: "გადახდა",
    step3desc: "გადახდა ბარათით ან სხვა ხელმისაწვდომი მეთოდით",
    step4title: "მიტანა",
    step4desc: "EMS Korea — 7 დღიდან. მიიღებთ თვალთვალის ნომერს",

    advTitle: "რატომ K-Axis",
    adv1title: "მხოლოდ ორიგინალი",
    adv1desc: "ვმუშაობთ Hyundai Mobis-თან და სხვა OEM მომწოდებლებთან.",
    adv2title: "შუამავლების გარეშე",
    adv2desc: "ავტომობილები და ნაწილები კორეიდან პირდაპირ თქვენთან.",
    adv3title: "სწრაფი მიტანა",
    adv3desc: "ნაწილები — EMS Korea, 7–20 დღე, თვალთვალით.",
    adv4title: "VIN შერჩევა",
    adv4desc: "არ იცით ნაწილის ნომერი? გამოგვიგზავნეთ VIN.",
    adv5title: "საკომისიოს გარეშე",
    adv5desc: "ჩვენს სამუშაოზე პროცენტს არ ვიღებთ, ფასდაკლებას პირადად გეტყვით.",
    adv6title: "ყოველთვის კავშირზე",
    adv6desc: "მენეჯერები პასუხობენ Telegram-ში, WhatsApp-სა და Instagram-ში.",

    geoTitle: "მიტანის გეოგრაფია",
    geoDesc: "ვაგზავნით სამხრეთ კორეიდან ამ ქვეყნებში:",

    ctaTitle: "გაიგეთ თქვენი ფასდაკლება",
    ctaDesc: "მოგვწერეთ — შევარჩევთ ავტომობილს ან ნაწილს და ფასდაკლებას პირადად გეტყვით. საკომისიოს არ ვიღებთ.",
  },
  ar: {
    heroTag: "عن الشركة",
    heroTitle: "K-Axis — سيارات وقطع غيار",
    heroHighlight: "مباشرة من كوريا",
    heroDesc:
      "نختار السيارات من السوق والمزادات الكورية ونفحصها ونشحنها إليك، ونوفر قطع غيار Hyundai وKia وGenesis الأصلية.",
    heroBadgeZero: "0% عمولة",
    heroBadgeDiscount: "الخصومات — عبر الرسائل الخاصة",
    heroCta: "كتالوج السيارات",
    heroCtaParts: "كتالوج القطع",
    heroDiscount: "اعرف خصمك",

    offerZeroTag: "بدون عمولة",
    offerZeroTitle: "لا نأخذ أي عمولة",
    offerZeroDesc:
      "ولا نسبة واحدة إضافية مقابل عملنا. نخبرك بسعر السيارة أو القطعة كما هو.",
    offerDiscTag: "خصومات",
    offerDiscTitle: "نقدم خصومات رائعة",
    offerDiscDesc:
      "لا ننشر قيمة الخصم — نخبرك بها شخصيًا. راسلنا في الرسائل الخاصة وسيخبرك المدير بمقدار ما ستوفره.",
    offerDiscHint: "نرد عبر المراسل الذي يناسبك",
    waText: "مرحباً! أود معرفة المزيد عن الخصم.",

    whoTitle: "من نحن",
    whoP1:
      "K-Axis فريق في كوريا الجنوبية. نجد السيارات على Encar والمزادات الكورية، ونتحقق من تاريخها وحالتها، ونشتريها ونجهز الوثائق ونشحنها إلى المشتري.",
    whoP2:
      "الجزء الثاني من عملنا — قطع الغيار الأصلية. نعمل مع كبار الموردين الكوريين، منهم Hyundai Mobis وMando وParts Mall؛ في الكتالوج أكثر من 48,000 منتج.",
    whoImageAlt: "مستودع قطع غيار أصلية في كوريا",
    whoImageCaption: "قطع غيار Hyundai · Kia · Genesis الأصلية",

    statsYear: "سنة التأسيس",
    statsCountries: "دول التوصيل",
    statsParts: "قطع في الكتالوج",
    statsBrands: "العلامات",
    statsYearVal: "2025",
    statsCountriesVal: "+37",
    statsPartsVal: "+48,000",
    statsBrandsVal: "Hyundai · Kia · Genesis",

    autoTitle: "سيارات من كوريا",
    autoP1:
      "العلامات الكورية — Hyundai وKia وGenesis وSsangYong — والمستوردة الشهيرة: BMW وMercedes-Benz وAudi وToyota وLexus وغيرها. نجد السيارة المناسبة في المزاد أو عند الوكيل.",
    autoP2:
      "دعم كامل: الاختيار، فحص التاريخ، الشراء، الوثائق، التوصيل إلى ميناء الوجهة. الحاسبة على الموقع تُظهر التكلفة الإجمالية مع الجمارك والشحن.",
    autoCta: "حاسبة التكلفة",
    autoCatalog: "كتالوج السيارات",

    howTitle: "كيف تطلب قطعة غيار",
    step1title: "الطلب",
    step1desc: "ابحث عن القطعة في الكتالوج أو أرسل طلبًا — سنطابقها برقم VIN",
    step2title: "الاختيار والتسعير",
    step2desc: "نختار القطعة الأصلية ونحسب التكلفة مع التوصيل",
    step3title: "الدفع",
    step3desc: "الدفع بالبطاقة أو بطريقة أخرى متاحة",
    step4title: "التوصيل",
    step4desc: "شحن عبر EMS Korea — من 7 أيام. تحصل على رقم تتبع",

    advTitle: "لماذا K-Axis",
    adv1title: "أصلي فقط",
    adv1desc: "نعمل مع Hyundai Mobis وموردي OEM آخرين. لا تقليد.",
    adv2title: "بدون وسطاء",
    adv2desc: "السيارات والقطع تصل من كوريا إليك مباشرة — أرخص وأسرع.",
    adv3title: "توصيل سريع",
    adv3desc: "القطع عبر EMS Korea، من 7 إلى 20 يومًا، مع التتبع.",
    adv4title: "مطابقة VIN",
    adv4desc: "لا تعرف رقم القطعة؟ أرسل رقم VIN وسنجدها.",
    adv5title: "بدون عمولة",
    adv5desc: "لا نأخذ نسبة مقابل عملنا، ونخبرك بخصمك شخصيًا.",
    adv6title: "على تواصل دائم",
    adv6desc: "المديرون يردون على Telegram وWhatsApp وInstagram بلغتك.",

    geoTitle: "جغرافية التوصيل",
    geoDesc: "نشحن من كوريا الجنوبية إلى هذه الدول:",

    ctaTitle: "اعرف خصمك",
    ctaDesc: "راسلنا — سنجد السيارة أو القطعة ونخبرك بخصمك شخصيًا. بدون عمولة.",
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


const CAR_BRANDS: { name: string; models: string[]; img?: string }[] = [
  { name: "Hyundai", models: ["Tucson", "Santa Fe", "Palisade", "IONIQ 5", "Sonata", "Creta"], img: "/images/cars/hyundai.jpg" },
  { name: "Kia", models: ["Sportage", "Sorento", "EV6", "K5", "Carnival", "Seltos"], img: "/images/cars/kia.jpg" },
  { name: "Genesis", models: ["G80", "GV70", "GV80", "G70", "GV60"], img: "/images/cars/genesis.jpg" },
  { name: "SsangYong", models: ["Torres", "Rexton", "Korando", "Tivoli"], img: "/images/cars/ssangyong.jpg" },
  { name: "Chevrolet", models: ["Trailblazer", "Trax", "Malibu", "Spark"], img: "/images/cars/chevrolet.jpg" },
  { name: "Renault Samsung", models: ["QM6", "SM6", "Arkana", "XM3"], img: "/images/cars/renault.jpg" },
  { name: "BMW", models: ["3 Series", "5 Series", "X3", "X5", "iX"], img: "/images/cars/bmw.jpg" },
  { name: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLC", "GLE", "EQS"], img: "/images/cars/mercedes.jpg" },
  { name: "Audi", models: ["A4", "A6", "Q5", "Q7", "e-tron"], img: "/images/cars/audi.jpg" },
  { name: "Volkswagen", models: ["Tiguan", "Golf", "ID.4", "Passat", "Touareg"], img: "/images/cars/volkswagen.jpg" },
  { name: "Toyota", models: ["Camry", "RAV4", "Land Cruiser", "Prius", "Highlander"], img: "/images/cars/toyota.jpg" },
  { name: "Lexus", models: ["RX", "NX", "ES", "LX", "UX"], img: "/images/cars/lexus.jpg" },
  { name: "Tesla", models: ["Model 3", "Model Y", "Model S", "Model X"], img: "/images/cars/tesla.jpg" },
  { name: "Porsche", models: ["Cayenne", "Macan", "Panamera", "Taycan"], img: "/images/cars/porsche.jpg" },
  { name: "Volvo", models: ["XC60", "XC90", "S60", "V60", "EX30"], img: "/images/cars/volvo.jpg" },
  { name: "Land Rover", models: ["Range Rover", "Defender", "Discovery", "Evoque"], img: "/images/cars/land-rover.jpg" },
];

const ADV_ICONS = [Shield, Package, Truck, Search, HandCoins, HeadphonesIcon];

const STEP_ICONS = [ClipboardList, Search, CreditCard, Truck];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";
const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_10px_30px_rgba(157,94,52,0.35)] transition hover:brightness-115 hover:-translate-y-0.5 ${FOCUS}`;
const BTN_GHOST = `inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-[var(--axis-white)] border border-white/15 transition hover:bg-white/[0.06] hover:border-white/30 ${FOCUS}`;

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Три кнопки «написать в личку». На бронзовой заливке — светлые, на тёмном фоне — графитовые. */
function MessengerButtons({ waText, onBronze }: { waText: string; onBronze?: boolean }) {
  const base = `inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition hover:-translate-y-0.5 ${FOCUS}`;
  const skin = onBronze
    ? "bg-[var(--axis-black)]/85 text-[var(--axis-white)] hover:bg-[var(--axis-black)] shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
    : "bg-[var(--axis-graphite)] text-[var(--axis-white)] border border-white/10 hover:bg-white/[0.08] hover:border-[var(--axis-bronze)]/60";
  const items = [
    { href: TG_BOT_URL, label: "Telegram", Icon: TelegramIcon },
    { href: waHref(waText), label: "WhatsApp", Icon: WhatsAppIcon },
    { href: IG_DM_URL, label: "Instagram", Icon: InstagramIcon },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {items.map(({ href, label, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${skin}`}>
          <Icon className="w-5 h-5 shrink-0" />
          {label}
        </a>
      ))}
    </div>
  );
}

function SectionTitle({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <span className={`block h-0.5 w-12 rounded-full bg-[var(--axis-bronze)] mb-4 ${center ? "mx-auto" : ""}`} />
      <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-[var(--axis-white)]">{children}</h2>
    </div>
  );
}

export default function AboutClient({ lang }: Props) {
  const l = L[lang] ?? L.ru;
  const { isCatalogBlocked } = useCountry();
  const [imgError, setImgError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: direction === "right" ? 356 : -356,
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
    <div className="min-h-screen bg-[var(--axis-black)] text-[var(--axis-white)]" dir="ltr">

      {/* ═══ 1. ШАПКА ═══ */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/hero-cars.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] opacity-45 md:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--axis-black)] via-[var(--axis-black)]/85 to-[var(--axis-black)]/30" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--axis-black)] to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--axis-bronze)] border border-[var(--axis-bronze)]/35 bg-[var(--axis-bronze)]/10 mb-6">
            {l.heroTag}
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl leading-[1.08] max-w-3xl mb-5">
            {l.heroTitle}{" "}
            <span className="text-[var(--axis-bronze)]">{l.heroHighlight}</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--axis-silver)] max-w-2xl mb-8 leading-relaxed">
            {l.heroDesc}
          </p>

          {/* Плашки предложения — видны сразу, ещё до блока со скидками */}
          <div className="flex flex-wrap gap-2.5 mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_6px_20px_rgba(157,94,52,0.4)]">
              <HandCoins className="w-4 h-4" />
              {l.heroBadgeZero}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[var(--axis-white)] border border-[var(--axis-bronze)]/50 bg-[var(--axis-black)]/60 backdrop-blur-sm">
              <BadgePercent className="w-4 h-4 text-[var(--axis-bronze)]" />
              {l.heroBadgeDiscount}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#discount" className={BTN_PRIMARY} data-nav-ignore>
              <BadgePercent className="w-4 h-4" />
              {l.heroDiscount}
            </a>
            <Link href={isCatalogBlocked ? `/${lang}/parts` : `/${lang}/catalog`} className={BTN_GHOST}>
              {isCatalogBlocked ? l.heroCtaParts : l.heroCta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 2. БЕЗ КОМИССИИ + СКИДКИ (решение владельца: заметно) ═══ */}
      <section id="discount" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* 0% */}
          <div className="lg:col-span-2 rounded-3xl p-7 sm:p-9 bg-[var(--axis-charcoal)] border border-[var(--axis-bronze)]/30 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_rgba(0,0,0,0.5)] flex flex-col">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--axis-bronze)] mb-4">
              {l.offerZeroTag}
            </span>
            <div className="font-heading text-7xl sm:text-8xl leading-none text-[var(--axis-bronze)] mb-4">
              0%
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{l.offerZeroTitle}</h2>
            <p className="text-sm sm:text-base text-[var(--axis-gray)] leading-relaxed">{l.offerZeroDesc}</p>
          </div>

          {/* Скидки */}
          <div className="lg:col-span-3 relative overflow-hidden rounded-3xl p-7 sm:p-9 text-white bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] shadow-[0_24px_60px_rgba(157,94,52,0.35),0_0_0_1px_rgba(255,255,255,0.08)_inset]">
            <BadgePercent
              aria-hidden="true"
              className="absolute -right-10 -top-10 w-56 h-56 sm:w-72 sm:h-72 text-white/[0.08] rotate-12 pointer-events-none"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase bg-white/15 mb-4">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                </span>
                {l.offerDiscTag}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3">
                {l.offerDiscTitle}
              </h2>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-6 max-w-xl">
                {l.offerDiscDesc}
              </p>
              <MessengerButtons waText={l.waText} onBronze />
              <p className="flex items-center gap-1.5 text-xs text-white/70 mt-3">
                <MessageCircle className="w-3.5 h-3.5" />
                {l.offerDiscHint}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. КТО МЫ ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <SectionTitle>{l.whoTitle}</SectionTitle>
            <p className="text-[var(--axis-silver)] leading-relaxed mt-6 mb-4">{l.whoP1}</p>
            <p className="text-[var(--axis-gray)] leading-relaxed">{l.whoP2}</p>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[3/2] bg-[var(--axis-charcoal)] border border-white/[0.06] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            {!imgError ? (
              <Image
                src="/images/about-mobis.jpg"
                alt={l.whoImageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-14 h-14 text-[var(--axis-bronze)]" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
              <p className="text-sm font-medium text-[var(--axis-white)]">{l.whoImageCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. ЦИФРЫ ═══ */}
      <section className="border-y border-white/[0.06] bg-[var(--axis-charcoal)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: l.statsYear, value: l.statsYearVal },
              { label: l.statsCountries, value: l.statsCountriesVal },
              { label: l.statsParts, value: l.statsPartsVal },
              { label: l.statsBrands, value: l.statsBrandsVal },
            ].map((s) => (
              <div key={s.label} className="text-center px-2">
                <div className="font-heading text-2xl sm:text-3xl text-[var(--axis-bronze)] mb-1.5">{s.value}</div>
                <div className="text-[11px] sm:text-xs text-[var(--axis-gray)] font-medium uppercase tracking-[0.14em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. АВТО ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--axis-bronze)]/10 border border-[var(--axis-bronze)]/30 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-[var(--axis-bronze)]" />
          </div>
          <SectionTitle>{l.autoTitle}</SectionTitle>
        </div>
        <p className="text-[var(--axis-silver)] leading-relaxed mb-3 max-w-3xl">{l.autoP1}</p>
        <p className="text-[var(--axis-gray)] leading-relaxed mb-10 max-w-3xl">{l.autoP2}</p>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <style>{`.slider-hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
          <button
            onClick={() => scrollSlider("left")}
            className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[var(--axis-graphite)] border border-white/10 text-[var(--axis-white)] items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition hover:bg-[var(--axis-bronze-deep)] hidden lg:flex ${FOCUS}`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={sliderRef}
            className="slider-hide-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CAR_BRANDS.map((brand) => (
              <div key={brand.name} className="snap-start shrink-0 w-[270px] sm:w-[340px]">
                <div className="rounded-2xl h-[220px] sm:h-[240px] relative overflow-hidden group bg-[var(--axis-charcoal)] border border-white/[0.06] transition-colors hover:border-[var(--axis-bronze)]/50">
                  {brand.img && (
                    <Image
                      src={brand.img}
                      alt={brand.name}
                      fill
                      className="object-cover opacity-55 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                      sizes="340px"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                  <div className="relative p-5 flex flex-col justify-between h-full">
                    <h3 className="font-heading text-xl sm:text-2xl tracking-wide drop-shadow-md">{brand.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.models.map((m) => (
                        <span key={m} className="text-[11px] text-white/90 bg-black/40 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
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
            className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[var(--axis-graphite)] border border-white/10 text-[var(--axis-white)] items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition hover:bg-[var(--axis-bronze-deep)] hidden lg:flex ${FOCUS}`}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link href={`/${lang}/calculator`} className={BTN_PRIMARY}>
            {l.autoCta}
          </Link>
          {!isCatalogBlocked && (
            <Link href={`/${lang}/catalog`} className={BTN_GHOST}>
              {l.autoCatalog}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ═══ 6. ПРЕИМУЩЕСТВА ═══ */}
      <section className="bg-[var(--axis-charcoal)] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <SectionTitle center>{l.advTitle}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {[1, 2, 3, 4, 5, 6].map((n, i) => {
              const Icon = ADV_ICONS[i];
              const highlight = n === 5; // «Без комиссии» — подсвечена
              return (
                <div
                  key={n}
                  className={`flex gap-4 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(182,119,73,0.12)] ${
                    highlight
                      ? "bg-[var(--axis-bronze)]/10 border-[var(--axis-bronze)]/50 hover:border-[var(--axis-bronze)]"
                      : "bg-[var(--axis-graphite)] border-[var(--axis-bronze)]/15 hover:border-[var(--axis-bronze)]/50"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">{l[`adv${n}title`]}</h3>
                    <p className="text-sm text-[var(--axis-gray)] leading-relaxed">{l[`adv${n}desc`]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 7. КАК ЗАКАЗАТЬ ЗАПЧАСТЬ ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <SectionTitle center>{l.howTitle}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[1, 2, 3, 4].map((n, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={n} className="relative rounded-2xl p-6 bg-[var(--axis-charcoal)] border border-white/[0.06] transition-colors hover:border-[var(--axis-bronze)]/40">
                <div className="flex items-center justify-between mb-5">
                  <Icon className="w-6 h-6 text-[var(--axis-bronze)]" />
                  <span className="font-heading text-3xl text-white/10">0{n}</span>
                </div>
                <h3 className="text-base font-semibold mb-2">{l[`step${n}title`]}</h3>
                <p className="text-sm text-[var(--axis-gray)] leading-relaxed">{l[`step${n}desc`]}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-8">
          <Link href={`/${lang}/parts`} className={BTN_GHOST}>
            {l.heroCtaParts}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══ 8. ГЕОГРАФИЯ ═══ */}
      <section className="bg-[var(--axis-charcoal)] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="flex flex-col items-center text-center">
            <Globe className="w-8 h-8 text-[var(--axis-bronze)] mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl">{l.geoTitle}</h2>
            <p className="text-sm text-[var(--axis-gray)] mt-3 mb-10 max-w-lg">{l.geoDesc}</p>
          </div>
          <div className="space-y-8">
            {GEO_REGIONS.map((region) => (
              <div key={region.label.en}>
                <h3 className="text-[11px] font-semibold text-[var(--axis-bronze)] uppercase tracking-[0.18em] mb-3 px-1">
                  {region.label[lang] ?? region.label.en}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {region.countries.map((c) => (
                    <div
                      key={c.code}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 bg-[var(--axis-graphite)] border border-white/[0.06] transition-colors hover:border-[var(--axis-bronze)]/40"
                    >
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="text-sm text-[var(--axis-silver)] truncate">{c.name[lang] ?? c.name.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. ПРИЗЫВ — ещё раз про скидку ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center bg-[var(--axis-charcoal)] border border-[var(--axis-bronze)]/30 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full bg-[var(--axis-bronze)]/20 blur-[100px] pointer-events-none" />
          <div className="relative max-w-2xl mx-auto">
            <BadgePercent className="w-11 h-11 text-[var(--axis-bronze)] mx-auto mb-5" />
            <h2 className="font-heading text-3xl sm:text-4xl mb-4">{l.ctaTitle}</h2>
            <p className="text-[var(--axis-gray)] text-sm sm:text-base mb-8">{l.ctaDesc}</p>
            <MessengerButtons waText={l.waText} />
          </div>
        </div>
      </section>
    </div>
  );
}
