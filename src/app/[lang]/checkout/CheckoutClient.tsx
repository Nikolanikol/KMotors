"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Ship, Plane } from "lucide-react";
import dynamic from "next/dynamic";

const PayPalCheckout = dynamic(() => import("@/components/PayPalCheckout"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading payment...</span>
    </div>
  ),
});
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";
import {
  calcEmsUsd,
  calcEmspUsd,
  isEmsAvailable,
  isEmspAvailable,
  COUNTRY_NAMES,
  COUNTRY_SELECTOR_ORDER,
} from "@/lib/ems-rates";
import { packItems, type PackResult } from "@/lib/matryoshka";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  cartItemId: string;
  quantity: number;
  productId: number;
  partNumber: string;
  nameRu: string;
  nameEn: string;
  priceKrw: number;
  imageUrl: string | null;
  weightKg: number;
  billedWeightKg: number;
  shipMethod: "EMS" | "EMS_PREMIUM" | "SEA" | "CLARIFY";
}

interface Props {
  lang: string;
  userId: string;
  items: CheckoutItem[];
  profile: {
    name?: string | null;
    phone?: string | null;
    country?: string | null;
    city?: string | null;
    address?: string | null;
    zip?: string | null;
  };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const L: Record<string, Record<string, string>> = {
  ru: {
    back: "← Назад в корзину",
    title: "Оформление заказа",
    itemsSection: "Состав заказа",
    addressSection: "Адрес доставки",
    shippingSection: "Способ доставки",
    notesSection: "Комментарий",
    totalSection: "Итого",
    country: "Страна",
    name: "Имя получателя",
    phone: "Телефон",
    city: "Город",
    address: "Улица, дом, квартира",
    zip: "Почтовый индекс",
    selectCountry: "Выберите страну...",
    ems: "EMS Корейская почта",
    emsp: "EMS Premium (DHL / FedEx / UPS)",
    days_ems: "10–20 дней",
    days_emsp: "5–10 дней",
    seaNotice: "Крупногабаритные позиции — морская доставка (45–75 дней). Стоимость уточнит менеджер.",
    noCountry: "Выберите страну для расчёта доставки",
    overweight: "Общий вес превышает лимит — свяжитесь с менеджером",
    noDelivery: "Доставка в эту страну недоступна — свяжитесь с менеджером",
    subtotal: "Товары",
    shipping: "Авиадоставка",
    seaLine: "Морская доставка",
    tbd: "уточнит менеджер",
    totalLabel: "К оплате",
    seaPlus: "+ море (уточнит менеджер)",
    placeOrder: "Оформить заказ",
    placing: "Оформляем...",
    requiredFields: "Заполните: имя, телефон, город и адрес",
    selectCountryFirst: "Выберите страну доставки",
    chooseShipping: "Выберите способ доставки",
    paymentTitle: "Оплата заказа",
    paymentDesc: "Завершите оплату для подтверждения заказа",
    successTitle: "Заказ оплачен!",
    successDesc1: "Ваш заказ",
    successDesc2: "оплачен. Менеджер свяжется с вами для уточнения деталей доставки.",
    toOrders: "Мои заказы",
    toCatalog: "Продолжить покупки",
    notesPlaceholder: "Особые пожелания, удобное время для связи...",
    phName: "Иван Петров",
    phPhone: "+7 900 123-45-67",
    phCity: "Москва",
    phAddress: "ул. Ленина, д. 1, кв. 10",
    phZip: "123456",
    kg: "кг",
    per: "×",
    billedWeight: "расч. вес",
  },
  en: {
    back: "← Back to cart",
    title: "Checkout",
    itemsSection: "Order Summary",
    addressSection: "Shipping Address",
    shippingSection: "Shipping Method",
    notesSection: "Order Notes",
    totalSection: "Total",
    country: "Country",
    name: "Recipient name",
    phone: "Phone",
    city: "City",
    address: "Street, building, apt",
    zip: "ZIP / Postal code",
    selectCountry: "Select country...",
    ems: "EMS Korea Post",
    emsp: "EMS Premium (DHL / FedEx / UPS)",
    days_ems: "10–20 days",
    days_emsp: "5–10 days",
    seaNotice: "Oversized items — sea freight (45–75 days). Cost will be confirmed by manager.",
    noCountry: "Select a country to calculate shipping",
    overweight: "Total weight exceeds limit — please contact manager",
    noDelivery: "Shipping to this country is unavailable — contact manager",
    subtotal: "Items",
    shipping: "Air shipping",
    seaLine: "Sea freight",
    tbd: "manager will confirm",
    totalLabel: "Total to pay",
    seaPlus: "+ sea freight (TBD)",
    placeOrder: "Place Order",
    placing: "Placing order...",
    requiredFields: "Please fill in: name, phone, city and address",
    selectCountryFirst: "Please select a country",
    chooseShipping: "Please select a shipping method",
    paymentTitle: "Payment",
    paymentDesc: "Complete your payment to confirm the order",
    successTitle: "Order paid!",
    successDesc1: "Your order",
    successDesc2: "has been paid. A manager will contact you to confirm shipping details.",
    toOrders: "My Orders",
    toCatalog: "Continue shopping",
    notesPlaceholder: "Special requests, preferred contact time...",
    phName: "John Smith",
    phPhone: "+1 555 123-4567",
    phCity: "New York",
    phAddress: "123 Main St, Apt 4",
    phZip: "10001",
    kg: "kg",
    per: "×",
    billedWeight: "billed wt.",
  },
  ko: {
    back: "← 장바구니로 돌아가기",
    title: "주문하기",
    itemsSection: "주문 내역",
    addressSection: "배송 주소",
    shippingSection: "배송 방법",
    notesSection: "메모",
    totalSection: "합계",
    country: "국가",
    name: "받는 사람",
    phone: "전화번호",
    city: "도시",
    address: "주소",
    zip: "우편번호",
    selectCountry: "국가 선택...",
    ems: "EMS 한국 우체국",
    emsp: "EMS 프리미엄 (DHL/FedEx/UPS)",
    days_ems: "10–20일",
    days_emsp: "5–10일",
    seaNotice: "대형 물품 — 해상 운송 (45–75일). 비용은 담당자가 확인합니다.",
    noCountry: "배송비 계산을 위해 국가를 선택하세요",
    overweight: "중량 초과 — 담당자에게 문의하세요",
    noDelivery: "해당 국가로 배송 불가 — 담당자에게 문의하세요",
    subtotal: "상품",
    shipping: "항공 배송",
    seaLine: "해상 배송",
    tbd: "담당자 확인",
    totalLabel: "결제 금액",
    seaPlus: "+ 해상 (담당자 확인)",
    placeOrder: "주문하기",
    placing: "처리 중...",
    requiredFields: "이름, 전화번호, 도시, 주소를 입력해주세요",
    selectCountryFirst: "국가를 선택해주세요",
    chooseShipping: "배송 방법을 선택해주세요",
    paymentTitle: "결제",
    paymentDesc: "주문 확인을 위해 결제를 완료해주세요",
    successTitle: "결제 완료!",
    successDesc1: "주문",
    successDesc2: "이 결제되었습니다. 담당자가 배송 세부사항 확인을 위해 연락드립니다.",
    toOrders: "내 주문",
    toCatalog: "계속 쇼핑하기",
    notesPlaceholder: "특별 요청사항...",
    phName: "홍길동",
    phPhone: "+82 10-1234-5678",
    phCity: "서울",
    phAddress: "강남구 테헤란로 123",
    phZip: "06100",
    kg: "kg",
    per: "×",
    billedWeight: "청구 중량",
  },
  ka: {
    back: "← კალათაში დაბრუნება",
    title: "შეკვეთის გაფორმება",
    itemsSection: "შეკვეთის შემადგენლობა",
    addressSection: "მიტანის მისამართი",
    shippingSection: "მიტანის მეთოდი",
    notesSection: "კომენტარი",
    totalSection: "სულ",
    country: "ქვეყანა",
    name: "მიმღების სახელი",
    phone: "ტელეფონი",
    city: "ქალაქი",
    address: "მისამართი",
    zip: "საფოსტო ინდექსი",
    selectCountry: "ქვეყნის არჩევა...",
    ems: "EMS კორეის ფოსტა",
    emsp: "EMS Premium (DHL/FedEx/UPS)",
    days_ems: "10–20 დღე",
    days_emsp: "5–10 დღე",
    seaNotice: "მსხვილგაბარიტული — საზღვაო (45–75 დღე). ღირებულება განსაზღვრავს მენეჯერი.",
    noCountry: "ფასის გამოსათვლელად აირჩიეთ ქვეყანა",
    overweight: "წონა აჭარბებს ლიმიტს — დაუკავშირდით მენეჯერს",
    noDelivery: "ამ ქვეყანაში მიტანა შეუძლებელია — დაუკავშირდით მენეჯერს",
    subtotal: "საქონელი",
    shipping: "საჰაერო მიტანა",
    seaLine: "საზღვაო მიტანა",
    tbd: "განსაზღვრავს მენეჯერი",
    totalLabel: "გადასახდელი",
    seaPlus: "+ ზღვა (მენეჯერი)",
    placeOrder: "შეკვეთა",
    placing: "მუშავდება...",
    requiredFields: "შეავსეთ: სახელი, ტელეფონი, ქალაქი და მისამართი",
    selectCountryFirst: "აირჩიეთ ქვეყანა",
    chooseShipping: "აირჩიეთ მიტანის მეთოდი",
    paymentTitle: "გადახდა",
    paymentDesc: "შეკვეთის დასადასტურებლად დაასრულეთ გადახდა",
    successTitle: "შეკვეთა გადახდილია!",
    successDesc1: "თქვენი შეკვეთა",
    successDesc2: "მიღებულია. მენეჯერი დაგიკავშირდება გადახდის დასადასტურებლად.",
    toOrders: "ჩემი შეკვეთები",
    toCatalog: "შოპინგის გაგრძელება",
    notesPlaceholder: "სპეციალური სურვილები...",
    phName: "გიორგი ბერიძე",
    phPhone: "+995 555 12-34-56",
    phCity: "თბილისი",
    phAddress: "რუსთაველის გამზ. 1",
    phZip: "0100",
    kg: "კგ",
    per: "×",
    billedWeight: "ანგარიშ. წონა",
  },
  ar: {
    back: "← العودة إلى السلة",
    title: "إتمام الطلب",
    itemsSection: "ملخص الطلب",
    addressSection: "عنوان الشحن",
    shippingSection: "طريقة الشحن",
    notesSection: "ملاحظات",
    totalSection: "الإجمالي",
    country: "الدولة",
    name: "اسم المستلم",
    phone: "الهاتف",
    city: "المدينة",
    address: "العنوان",
    zip: "الرمز البريدي",
    selectCountry: "اختر الدولة...",
    ems: "EMS البريد الكوري",
    emsp: "EMS Premium (DHL/FedEx/UPS)",
    days_ems: "10–20 يوم",
    days_emsp: "5–10 أيام",
    seaNotice: "بضائع كبيرة — شحن بحري (45–75 يومًا). التكلفة يحددها المدير.",
    noCountry: "اختر دولة لحساب تكاليف الشحن",
    overweight: "الوزن يتجاوز الحد — تواصل مع المدير",
    noDelivery: "الشحن إلى هذه الدولة غير متاح — تواصل مع المدير",
    subtotal: "المنتجات",
    shipping: "الشحن الجوي",
    seaLine: "الشحن البحري",
    tbd: "يحدده المدير",
    totalLabel: "الإجمالي للدفع",
    seaPlus: "+ بحري (يحدده المدير)",
    placeOrder: "تأكيد الطلب",
    placing: "جارٍ المعالجة...",
    requiredFields: "يرجى ملء: الاسم والهاتف والمدينة والعنوان",
    selectCountryFirst: "يرجى اختيار دولة",
    chooseShipping: "يرجى اختيار طريقة الشحن",
    paymentTitle: "الدفع",
    paymentDesc: "أكمل الدفع لتأكيد الطلب",
    successTitle: "تم الدفع!",
    successDesc1: "طلبك",
    successDesc2: "تم دفعه. سيتواصل معك المدير لتأكيد تفاصيل الشحن.",
    toOrders: "طلباتي",
    toCatalog: "مواصلة التسوق",
    notesPlaceholder: "طلبات خاصة...",
    phName: "محمد أحمد",
    phPhone: "+971 50 123 4567",
    phCity: "دبي",
    phAddress: "شارع الشيخ زايد، مبنى 5",
    phZip: "00000",
    kg: "كغ",
    per: "×",
    billedWeight: "الوزن المحسوب",
  },
};

const FALLBACK_RATE = 0.00066; // June 2026
const usdFmt = new Intl.NumberFormat("en-US");

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutClient({ lang, userId, items, profile }: Props) {
  const l = L[lang] ?? L.ru;
  const isRTL = lang === "ar";

  const [country, setCountry] = useState(profile.country ?? "");
  const [form, setForm] = useState({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    address: profile.address ?? "",
    zip: profile.zip ?? "",
  });
  const [shippingMethod, setShippingMethod] = useState<"EMS" | "EMS_PREMIUM" | null>(null);
  const [notes, setNotes] = useState("");
  const [krwToUsd, setKrwToUsd] = useState(FALLBACK_RATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotalUsd, setOrderTotalUsd] = useState(0);
  const [showPayPal, setShowPayPal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    fetch("https://api.frankfurter.dev/v1/latest?from=KRW&to=USD")
      .then((r) => r.json())
      .then((d) => { if (d.rates?.USD) setKrwToUsd(d.rates.USD); })
      .catch(() => {});
  }, []);

  // ── Shipping logic ──────────────────────────────────────────────────────────
  const airItems = useMemo(
    () => items.filter((i) => i.shipMethod !== "SEA" && i.shipMethod !== "CLARIFY"),
    [items]
  );
  const seaItems = useMemo(
    () => items.filter((i) => i.shipMethod === "SEA" || i.shipMethod === "CLARIFY"),
    [items]
  );
  // ── Matryoshka: pack EMS items into Korea Post boxes ──
  const packResult: PackResult = useMemo(
    () =>
      packItems(
        airItems.map((i) => ({
          weightKg: i.weightKg,
          quantity: i.quantity,
          billedWeightKg: i.billedWeightKg,
        }))
      ),
    [airItems]
  );
  const totalAirWeight = packResult.finalBilled;
  const hasForcedEmsP = airItems.some((i) => i.shipMethod === "EMS_PREMIUM");

  const emsOk = !!country && isEmsAvailable(country) && totalAirWeight > 0 && totalAirWeight <= 30;
  const emspOk = !!country && isEmspAvailable(country) && totalAirWeight > 0 && totalAirWeight <= 20;
  const airButNoMethod = !!country && airItems.length > 0 && !emsOk && !emspOk;

  const emsUsd = emsOk ? calcEmsUsd(country, totalAirWeight, krwToUsd) : null;
  const emspUsd = emspOk ? calcEmspUsd(country, totalAirWeight, krwToUsd) : null;

  useEffect(() => {
    if (!country || airItems.length === 0) { setShippingMethod(null); return; }
    if (hasForcedEmsP && emspOk) setShippingMethod("EMS_PREMIUM");
    else if (emsOk) setShippingMethod("EMS");
    else if (emspOk) setShippingMethod("EMS_PREMIUM");
    else setShippingMethod(null);
  }, [country, emsOk, emspOk, hasForcedEmsP, airItems.length]);

  const shippingCostUsd =
    shippingMethod === "EMS" ? emsUsd
    : shippingMethod === "EMS_PREMIUM" ? emspUsd
    : null;

  const itemsSubtotal = useMemo(
    () => items.reduce((s, i) => s + krwToDisplayUsd(i.priceKrw, krwToUsd) * i.quantity, 0),
    [items, krwToUsd]
  );
  const totalUsd = itemsSubtotal + (shippingCostUsd ?? 0);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Client-side per-field validation
    const errs = new Set<string>();
    if (!form.name.trim() || form.name.trim().length < 2) errs.add("name");
    if (!form.phone.trim() || form.phone.trim().length < 6) errs.add("phone");
    if (!form.city.trim() || form.city.trim().length < 2) errs.add("city");
    if (!form.address.trim() || form.address.trim().length < 3) errs.add("address");
    if (!country) errs.add("country");

    if (errs.size > 0) {
      setFieldErrors(errs);
      setError(errs.has("country") ? l.selectCountryFirst : l.requiredFields);
      return;
    }
    if (airItems.length > 0 && !shippingMethod) {
      setError(l.chooseShipping); return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors(new Set());

    try {
      const res = await fetch("/api/parts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          shippingMethod,
          shippingCostUsd: shippingCostUsd ?? 0,
          shippingAddress: { ...form, country },
          notes,
          krwToUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Server returned per-field errors
        if (data.fields && Array.isArray(data.fields)) {
          setFieldErrors(new Set(data.fields));
        }
        throw new Error(data.error ?? "Error");
      }
      setOrderNumber(data.orderNumber);
      setOrderId(data.orderId);
      setOrderTotalUsd(data.totalUsd);
      setShowPayPal(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = (item: CheckoutItem) => {
    const name = lang === "en" || lang === "ko" ? (item.nameEn || item.nameRu) : (item.nameRu || item.nameEn);
    return name || item.partNumber || `#${item.productId}`;
  };

  // ── Payment success screen ──────────────────────────────────────────────────
  if (paymentComplete && orderNumber) {
    return (
      <div
        className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4 text-gray-900"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-[#002C5F] mb-2">{l.successTitle}</h2>
          <p className="text-gray-600 text-sm mb-1">
            {l.successDesc1}{" "}
            <span className="font-bold text-[#002C5F]">{orderNumber}</span>{" "}
            {l.successDesc2}
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Link
              href={`/${lang}/account?tab=orders`}
              className="block w-full py-3 rounded-xl bg-[#002C5F] text-white font-semibold text-sm hover:bg-[#003a7a] transition"
            >
              {l.toOrders}
            </Link>
            <Link
              href={`/${lang}/parts`}
              className="block w-full py-3 rounded-xl border border-gray-200 text-[#002C5F] font-semibold text-sm hover:border-gray-300 transition"
            >
              {l.toCatalog}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── PayPal payment screen ─────────────────────────────────────────────────
  if (showPayPal && orderNumber && orderId) {
    return (
      <div
        className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4 text-gray-900"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#002C5F] mb-1">{l.paymentTitle ?? "Payment"}</h2>
            <p className="text-gray-500 text-sm">{l.paymentDesc ?? "Complete your payment to confirm the order"}</p>
          </div>

          <PayPalCheckout
            orderId={orderId}
            totalUsd={orderTotalUsd}
            orderNumber={orderNumber}
            onSuccess={() => setPaymentComplete(true)}
            onError={(err) => setError(err)}
          />
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#F5F7FA] py-8 px-4 text-gray-900"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Back */}
        <Link
          href={`/${lang}/account?tab=cart`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#002C5F] transition"
        >
          {l.back}
        </Link>

        <h1 className="text-2xl font-bold text-[#002C5F]">{l.title}</h1>

        {/* ── 1. Items ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {l.itemsSection}
          </h2>

          {/* Авиадоставка */}
          {airItems.length > 0 && (
            <div className={seaItems.length > 0 ? "mb-4" : ""}>
              {seaItems.length > 0 && (
                <div className="flex items-center gap-2 mb-3 pb-1">
                  <Plane className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l.shipping}</span>
                  <span className="text-xs text-gray-400">({airItems.length})</span>
                </div>
              )}
              <div className="space-y-3">
                {airItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.nameEn} width={48} height={48} className="object-contain w-full h-full p-1" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002C5F] line-clamp-1">{displayName(item)}</p>
                      <p className="text-xs text-gray-400">{item.partNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{l.billedWeight} {item.billedWeightKg} {l.kg}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 ${
                          item.shipMethod === "EMS_PREMIUM" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                        }`}>
                          <Plane className="w-2.5 h-2.5" />
                          {item.shipMethod === "EMS" ? "EMS" : "EMS+"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#BB162B]">{formatUsd(item.priceKrw, krwToUsd)}</p>
                      {item.quantity > 1 && <p className="text-xs text-gray-400">{l.per} {item.quantity}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Морская доставка */}
          {seaItems.length > 0 && (
            <div>
              {airItems.length > 0 && <div className="border-t border-gray-100 my-3" />}
              <div className="flex items-center gap-2 mb-3 pb-1">
                <Ship className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l.seaLine}</span>
                <span className="text-xs text-gray-400">({seaItems.length})</span>
              </div>
              <div className="space-y-3">
                {seaItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.nameEn} width={48} height={48} className="object-contain w-full h-full p-1" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002C5F] line-clamp-1">{displayName(item)}</p>
                      <p className="text-xs text-gray-400">{item.partNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{l.billedWeight} {item.billedWeightKg} {l.kg}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 bg-blue-50 text-blue-600">
                          <Ship className="w-2.5 h-2.5" />
                          SEA
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#BB162B]">{formatUsd(item.priceKrw, krwToUsd)}</p>
                      {item.quantity > 1 && <p className="text-xs text-gray-400">{l.per} {item.quantity}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Address ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {l.addressSection}
          </h2>
          <div className="space-y-3">
            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l.country}</label>
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setFieldErrors((p) => { const n = new Set(p); n.delete("country"); return n; }); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-white ${fieldErrors.has("country") ? "border-red-400 ring-1 ring-red-200 focus:border-red-500" : "border-gray-200 focus:border-[#002C5F]"}`}
              >
                <option value="">{l.selectCountry}</option>
                {COUNTRY_SELECTOR_ORDER.map((code) => (
                  <option key={code} value={code}>
                    {lang === "en" ? COUNTRY_NAMES[code]?.en : COUNTRY_NAMES[code]?.ru} ({code})
                  </option>
                ))}
              </select>
            </div>
            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l.name}</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder={l.phName}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFieldErrors((p) => { const n = new Set(p); n.delete("name"); return n; }); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ${fieldErrors.has("name") ? "border-red-400 ring-1 ring-red-200 focus:border-red-500" : "border-gray-200 focus:border-[#002C5F]"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l.phone}</label>
                <input
                  type="tel"
                  value={form.phone}
                  placeholder={l.phPhone}
                  onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setFieldErrors((p) => { const n = new Set(p); n.delete("phone"); return n; }); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ${fieldErrors.has("phone") ? "border-red-400 ring-1 ring-red-200 focus:border-red-500" : "border-gray-200 focus:border-[#002C5F]"}`}
                />
              </div>
            </div>
            {/* City */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{l.city}</label>
              <input
                type="text"
                value={form.city}
                placeholder={l.phCity}
                onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setFieldErrors((p) => { const n = new Set(p); n.delete("city"); return n; }); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ${fieldErrors.has("city") ? "border-red-400 ring-1 ring-red-200 focus:border-red-500" : "border-gray-200 focus:border-[#002C5F]"}`}
              />
            </div>
            {/* Address + ZIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{l.address}</label>
                <input
                  type="text"
                  value={form.address}
                  placeholder={l.phAddress}
                  onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setFieldErrors((p) => { const n = new Set(p); n.delete("address"); return n; }); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ${fieldErrors.has("address") ? "border-red-400 ring-1 ring-red-200 focus:border-red-500" : "border-gray-200 focus:border-[#002C5F]"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l.zip}</label>
                <input
                  type="text"
                  value={form.zip}
                  placeholder={l.phZip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#002C5F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Shipping ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {l.shippingSection}
          </h2>

          {airItems.length > 0 && (
            <div className="space-y-2 mb-4">
              {!country ? (
                <p className="text-sm text-gray-400">{l.noCountry}</p>
              ) : airButNoMethod ? (
                <p className="text-sm text-orange-600 font-medium">
                  {totalAirWeight > 30 ? l.overweight : l.noDelivery}
                </p>
              ) : (
                <div className="space-y-2">
                  {emsOk && emsUsd !== null && (
                    <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${shippingMethod === "EMS" ? "border-[#002C5F] bg-blue-50/30" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="EMS"
                          checked={shippingMethod === "EMS"}
                          onChange={() => setShippingMethod("EMS")}
                          className="accent-[#002C5F]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#002C5F]">{l.ems}</p>
                          <p className="text-xs text-gray-400">{l.days_ems} · {totalAirWeight.toFixed(2)} {l.kg}</p>
                        </div>
                      </div>
                      <span className="text-base font-bold text-[#002C5F]">${usdFmt.format(emsUsd)}</span>
                    </label>
                  )}
                  {emspOk && emspUsd !== null && (
                    <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${shippingMethod === "EMS_PREMIUM" ? "border-[#002C5F] bg-blue-50/30" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="EMS_PREMIUM"
                          checked={shippingMethod === "EMS_PREMIUM"}
                          onChange={() => setShippingMethod("EMS_PREMIUM")}
                          className="accent-[#002C5F]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#002C5F]">{l.emsp}</p>
                          <p className="text-xs text-gray-400">{l.days_emsp} · {totalAirWeight.toFixed(2)} {l.kg}</p>
                        </div>
                      </div>
                      <span className="text-base font-bold text-[#002C5F]">${usdFmt.format(emspUsd)}</span>
                    </label>
                  )}
                </div>
              )}

              {/* Matryoshka packing info */}
              {packResult.boxes.length > 0 && shippingCostUsd !== null && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-base mt-0.5">📦</span>
                  <div className="text-xs text-emerald-700">
                    <span className="font-medium">
                      {packResult.boxes.length}{" "}
                      {lang === "ru"
                        ? (packResult.boxes.length === 1 ? "коробка" : packResult.boxes.length < 5 ? "коробки" : "коробок")
                        : (packResult.boxes.length === 1 ? "box" : "boxes")}
                      {" · "}{totalAirWeight.toFixed(2)} {l.kg}
                    </span>
                    {packResult.savings > 0 && (
                      <span className="ml-1.5 text-emerald-600 font-semibold">
                        — {lang === "ru" ? "экономия" : "you save"}{" "}
                        {((packResult.savings / packResult.simpleBilled) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {seaItems.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Ship className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">{l.seaNotice}</p>
            </div>
          )}

          {airItems.length === 0 && seaItems.length === 0 && (
            <p className="text-sm text-gray-400">{l.noCountry}</p>
          )}
        </div>

        {/* ── 4. Notes ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {l.notesSection}
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={l.notesPlaceholder}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#002C5F] resize-none"
          />
        </div>

        {/* ── 5. Total + Submit ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {l.totalSection}
          </h2>

          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{l.subtotal}</span>
              <span className="font-semibold">${usdFmt.format(itemsSubtotal)}</span>
            </div>
            {airItems.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{l.shipping}</span>
                <span className="font-semibold">
                  {shippingCostUsd !== null
                    ? `$${usdFmt.format(shippingCostUsd)}`
                    : <span className="text-gray-400 italic">{l.tbd}</span>}
                </span>
              </div>
            )}
            {seaItems.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{l.seaLine}</span>
                <span className="text-gray-400 italic">{l.tbd}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-bold text-[#002C5F]">{l.totalLabel}</span>
              <div className="text-right">
                <span className="font-bold text-xl text-[#002C5F]">${usdFmt.format(totalUsd)}</span>
                {seaItems.length > 0 && (
                  <p className="text-xs text-gray-400">{l.seaPlus}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#BB162B] hover:bg-[#9a1122] text-white font-bold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {l.placing}
              </>
            ) : (
              l.placeOrder
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
