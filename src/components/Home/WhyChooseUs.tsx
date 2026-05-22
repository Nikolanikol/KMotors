"use client";
import { useTranslation } from "react-i18next";

const T = {
  ru: {
    title: "Почему K-Axis",
    features: [
      { title: "Проверка на аукционе", desc: "Каждый автомобиль проходит тщательную проверку на корейских аукционах Encar, KCar и Manheim." },
      { title: "Полная история", desc: "Отчёт о ДТП, количестве владельцев, пробеге и техническом состоянии каждого авто." },
      { title: "Доставка под ключ", desc: "От покупки на аукционе до доставки в ваш город — берём всё на себя." },
    ],
  },
  en: {
    title: "Why K-Axis",
    features: [
      { title: "Auction Verification", desc: "Every car is thoroughly inspected at Korean auctions: Encar, KCar and Manheim." },
      { title: "Full History", desc: "Accident report, number of owners, mileage and technical condition of every car." },
      { title: "Turnkey Delivery", desc: "From auction purchase to delivery in your city — we handle everything." },
    ],
  },
  ko: {
    title: "왜 K-Axis인가",
    features: [
      { title: "경매 검증", desc: "모든 차량은 Encar, KCar, Manheim 등 한국 경매에서 철저히 검사됩니다." },
      { title: "전체 이력", desc: "사고 이력, 소유자 수, 주행거리 및 기술적 상태에 대한 보고서." },
      { title: "턴키 배송", desc: "경매 구매부터 귀하의 도시까지 배송까지 — 모든 것을 저희가 처리합니다." },
    ],
  },
  ka: {
    title: "რატომ K-Axis",
    features: [
      { title: "აუქციონის შემოწმება", desc: "თითოეული მანქანა გადის საფუძვლიან შემოწმებას კორეულ აუქციონებზე: Encar, KCar და Manheim." },
      { title: "სრული ისტორია", desc: "ავარიების, მფლობელების რაოდენობის, გარბენისა და ტექნიკური მდგომარეობის ანგარიში." },
      { title: "კომპლექსური მიწოდება", desc: "აუქციონზე შეძენიდან თქვენს ქალაქში მიწოდებამდე — ყველაფერს ჩვენ ვაგვარებთ." },
    ],
  },
  ar: {
    title: "لماذا K-Axis",
    features: [
      { title: "التحقق من المزاد", desc: "تخضع كل سيارة لفحص دقيق في مزادات كوريا: Encar وKCar وManheim." },
      { title: "السجل الكامل", desc: "تقرير عن الحوادث وعدد الملاك والمسافة المقطوعة والحالة الفنية لكل سيارة." },
      { title: "التسليم الكامل", desc: "من الشراء في المزاد حتى التسليم في مدينتك — نتولى كل شيء." },
    ],
  },
};

const ICONS = [
  <svg key="1" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu1" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu1)"/>
    <path d="M18 24l6 6 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  <svg key="2" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu2" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu2)"/>
    <circle cx="24" cy="22" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M24 16v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  <svg key="3" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <defs><linearGradient id="wcu3" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#FF4500"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
    <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#wcu3)"/>
    <rect x="14" y="20" width="20" height="12" rx="2" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="18" cy="32" r="3" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="32" r="3" stroke="white" strokeWidth="2" fill="none"/>
  </svg>,
];

export default function WhyChooseUs() {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof typeof T;
  const t = T[lang] || T.ru;

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-16" style={{ color: "var(--axis-white)" }}>
          {t.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.features.map((feature, i) => (
            <div key={i}
              className="rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 cursor-default"
              style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(255,69,0,0.2)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,69,0,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="mb-6">{ICONS[i]}</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--axis-white)" }}>{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
