"use client";
import { useTranslation } from "react-i18next";

const T = {
  ru: {
    title: "Этапы покупки",
    steps: [
      { num: "01", title: "Записаться на бесплатную консультацию", desc: ["Обсудим ваши пожелания и бюджет", "Поможем определиться с моделью", "Ответим на все вопросы без сложных терминов"] },
      { num: "02", title: "Подписание договора", desc: ["Официальный договор с фиксацией обязательств", "Прозрачная система оплаты без скрытых комиссий", "Оплата официально по расчётному счёту"] },
      { num: "03", title: "Поиск и покупка авто", desc: ["Подбор через проверенные аукционы Encar, KCar", "Фото и видеоотчёты о состоянии авто", "Если не подобрали — возвращаем деньги"] },
      { num: "04", title: "Доставка и таможенное оформление", desc: ["Доставка от 15 дней через официальную таможню", "Полное оформление документов (СБКТС, ЭПТС, ТПО)", "Страхование на всех этапах перевозки"] },
      { num: "05", title: "Передача автомобиля", desc: ["Получение в пункте выдачи", "Машина готова к постановке на учёт"] },
    ],
  },
  en: {
    title: "Buying Process",
    steps: [
      { num: "01", title: "Book a Free Consultation", desc: ["Discuss your preferences and budget", "Help you choose the right model", "Answer all questions simply and clearly"] },
      { num: "02", title: "Sign the Agreement", desc: ["Official contract securing our obligations", "Transparent payment with no hidden fees", "Official bank transfer payment"] },
      { num: "03", title: "Find & Purchase the Car", desc: ["Selection via verified Encar, KCar auctions", "Photo and video reports on car condition", "Full refund if no match found"] },
      { num: "04", title: "Delivery & Customs", desc: ["Delivery from 15 days via official customs", "Full documentation processing", "Insurance at all transport stages"] },
      { num: "05", title: "Vehicle Handover", desc: ["Pick up at delivery point", "Car ready for registration"] },
    ],
  },
  ko: {
    title: "구매 절차",
    steps: [
      { num: "01", title: "무료 상담 예약", desc: ["귀하의 요구사항과 예산을 논의합니다", "올바른 모델 선택을 도와드립니다", "모든 질문에 쉽게 답변해 드립니다"] },
      { num: "02", title: "계약 체결", desc: ["의무 사항을 명시한 공식 계약", "숨겨진 수수료 없는 투명한 지불", "공식 은행 이체 결제"] },
      { num: "03", title: "차량 검색 및 구매", desc: ["Encar, KCar 경매를 통한 선택", "차량 상태 사진·영상 보고서", "적합한 차량 없으면 전액 환불"] },
      { num: "04", title: "배송 및 통관", desc: ["공식 통관을 통한 15일 이상 배송", "모든 서류 처리 완료", "운송 전 단계 보험"] },
      { num: "05", title: "차량 인도", desc: ["인도 지점에서 수령", "등록 준비 완료"] },
    ],
  },
  ka: {
    title: "შეძენის ეტაპები",
    steps: [
      { num: "01", title: "უფასო კონსულტაციის დაჯავშნა", desc: ["განვიხილავთ თქვენს სურვილებს და ბიუჯეტს", "დაგეხმარებით მოდელის არჩევაში", "ვუპასუხებთ ყველა კითხვას"] },
      { num: "02", title: "ხელშეკრულების გაფორმება", desc: ["ოფიციალური ხელშეკრულება", "გამჭვირვალე გადახდის სისტემა", "ოფიციალური საბანკო გადარიცხვა"] },
      { num: "03", title: "მანქანის ძიება და შეძენა", desc: ["შერჩევა Encar, KCar აუქციონებით", "ფოტო და ვიდეო ანგარიშები", "თუ ვერ შევარჩიეთ — ვაბრუნებთ თანხას"] },
      { num: "04", title: "მიწოდება და გაბაჟება", desc: ["მიწოდება 15 დღიდან", "სრული დოკუმენტური გაფორმება", "დაზღვევა ყველა ეტაპზე"] },
      { num: "05", title: "მანქანის გადაცემა", desc: ["მიღება გაცემის პუნქტში", "მანქანა მზადაა რეგისტრაციისთვის"] },
    ],
  },
  ar: {
    title: "خطوات الشراء",
    steps: [
      { num: "01", title: "حجز استشارة مجانية", desc: ["نناقش تفضيلاتك وميزانيتك", "نساعدك في اختيار الموديل المناسب", "نجيب على جميع أسئلتك بوضوح"] },
      { num: "02", title: "توقيع العقد", desc: ["عقد رسمي يضمن التزاماتنا", "نظام دفع شفاف بدون رسوم خفية", "دفع رسمي عبر تحويل بنكي"] },
      { num: "03", title: "البحث وشراء السيارة", desc: ["الاختيار عبر مزادات Encar وKCar", "تقارير صور وفيديو عن حالة السيارة", "استرداد كامل إذا لم نجد المناسب"] },
      { num: "04", title: "الشحن والجمارك", desc: ["شحن من 15 يوماً عبر الجمارك الرسمية", "معالجة جميع الوثائق", "تأمين في جميع مراحل النقل"] },
      { num: "05", title: "تسليم السيارة", desc: ["الاستلام من نقطة التسليم", "السيارة جاهزة للتسجيل"] },
    ],
  },
};

export default function Stage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof typeof T;
  const t = T[lang] || T.ru;

  return (
    <section className="py-24" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-center mb-16" style={{ color: "var(--axis-white)" }}>
          {t.title}
        </h2>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4">
          {t.steps.map((step) => (
            <div key={step.num}
              className="flex-shrink-0 w-[280px] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(255,69,0,0.2)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,69,0,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,69,0,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="text-4xl font-bold mb-4 opacity-60" style={{ color: "var(--axis-orange)" }}>{step.num}</div>
              <h3 className="text-base font-semibold mb-4 leading-snug" style={{ color: "var(--axis-white)" }}>{step.title}</h3>
              <ul className="space-y-2">
                {step.desc.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--axis-gray)" }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--axis-orange)" }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
