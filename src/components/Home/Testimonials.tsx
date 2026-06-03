"use client";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const T = {
  ru: {
    title: "Отзывы клиентов",
    bought: "купил",
    items: [
      { quote: "Купил KIA K5 через K-Axis Motors. Процесс занял 3 недели — от выбора на аукционе до получения во Владивостоке. Машина в идеальном состоянии, все документы в порядке.", author: "Алексей Морозов", car: "KIA K5 2023" },
      { quote: "Второй раз обращаюсь сюда. Первый раз брал Tucson для жены, теперь Genesis G80 для себя. Отличный сервис, всё прозрачно, цены адекватные. Рекомендую!", author: "Дмитрий Волков", car: "Genesis G80 2024" },
      { quote: "Долго выбирала между местными дилерами и корейскими аукционами. Остановилась на K-Axis и не пожалела. Сэкономила почти миллион по сравнению с официальным дилером.", author: "Екатерина Соколова", car: "Hyundai Tucson 2024" },
    ],
  },
  en: {
    title: "Client Reviews",
    bought: "bought",
    items: [
      { quote: "Bought a KIA K5 through K-Axis Motors. The process took 3 weeks from auction to delivery. The car is in perfect condition, all documents in order.", author: "Alexei Morozov", car: "KIA K5 2023" },
      { quote: "Second time using this service. Got a Tucson for my wife, now Genesis G80 for myself. Excellent service, transparent, fair prices. Highly recommended!", author: "Dmitry Volkov", car: "Genesis G80 2024" },
      { quote: "Chose K-Axis over local dealers and saved almost a million rubles compared to the official dealer. No regrets at all!", author: "Ekaterina Sokolova", car: "Hyundai Tucson 2024" },
    ],
  },
  ko: {
    title: "고객 후기",
    bought: "구매",
    items: [
      { quote: "K-Axis를 통해 KIA K5를 구매했습니다. 경매 선택부터 수령까지 3주가 걸렸습니다. 차량 상태가 완벽하고 서류도 모두 준비되어 있었습니다.", author: "알렉세이 모로조프", car: "KIA K5 2023" },
      { quote: "두 번째로 이용합니다. 처음에는 아내를 위해 투싼을, 이번에는 제 자신을 위해 제네시스 G80을 구매했습니다. 훌륭한 서비스, 투명한 가격!", author: "드미트리 볼코프", car: "Genesis G80 2024" },
      { quote: "현지 딜러와 한국 경매 사이에서 고민하다 K-Axis를 선택했고 후회하지 않습니다. 공식 딜러보다 훨씬 저렴하게 구매했습니다.", author: "예카테리나 소콜로바", car: "Hyundai Tucson 2024" },
    ],
  },
  ka: {
    title: "კლიენტების შეფასებები",
    bought: "იყიდა",
    items: [
      { quote: "KIA K5 შევიძინე K-Axis-ის მეშვეობით. პროცესი 3 კვირა გაგრძელდა. მანქანა იდეალურ მდგომარეობაშია, ყველა დოკუმენტი წესრიგშია.", author: "ალექსეი მოროზოვი", car: "KIA K5 2023" },
      { quote: "მეორედ ვმიმართავ ამ სერვისს. პირველად ცოლისთვის Tucson, ახლა ჩემთვის Genesis G80. შესანიშნავი სერვისი, გამჭვირვალე ფასები!", author: "დმიტრი ვოლკოვი", car: "Genesis G80 2024" },
      { quote: "K-Axis-ი ავირჩიე ადგილობრივ დილერებთან შედარებით და არ ვინანი. ოფიციალურ დილერთან შედარებით ბევრი დავზოგე.", author: "ეკატერინა სოკოლოვა", car: "Hyundai Tucson 2024" },
    ],
  },
  ar: {
    title: "آراء العملاء",
    bought: "اشترى",
    items: [
      { quote: "اشتريت KIA K5 عبر K-Axis Motors. استغرقت العملية 3 أسابيع من المزاد حتى التسليم. السيارة في حالة ممتازة وجميع الوثائق جاهزة.", author: "أليكسي موروزوف", car: "KIA K5 2023" },
      { quote: "المرة الثانية التي أستخدم فيها هذه الخدمة. في المرة الأولى اشتريت Tucson لزوجتي، والآن Genesis G80 لنفسي. خدمة ممتازة وأسعار شفافة!", author: "دميتري فولكوف", car: "Genesis G80 2024" },
      { quote: "اخترت K-Axis بدلاً من الوكلاء المحليين ولم أندم. وفرت مبلغاً كبيراً مقارنةً بالوكيل الرسمي.", author: "يكاترينا سوكولوفا", car: "Hyundai Tucson 2024" },
    ],
  },
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill={i < count ? "var(--axis-orange)" : "var(--axis-gray-dim)"}>
          <path d="M6 0l1.5 3.8H12L8.2 6.2l1.5 3.8L6 9.5 2.3 10l1.5-3.8L0 3.8h4.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof typeof T;
  const t = T[lang] || T.ru;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-heading text-3xl md:text-4xl" style={{ color: "var(--axis-white)" }}>{t.title}</h2>
          <div className="flex gap-3">
            {(["left", "right"] as const).map((dir) => (
              <button key={dir} onClick={() => scroll(dir)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: "var(--axis-graphite)", color: "var(--axis-orange)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-orange)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--axis-graphite)"; (e.currentTarget as HTMLElement).style.color = "var(--axis-orange)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
          {t.items.map((item, i) => (
            <div key={i} className="snap-start w-[85vw] sm:min-w-[320px] sm:max-w-[380px] flex-shrink-0 rounded-2xl p-6 relative"
              style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
              <svg className="absolute top-4 right-4 opacity-10" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" fill="var(--axis-orange)" />
              </svg>
              <p className="italic leading-relaxed mb-6 text-sm" style={{ color: "var(--axis-white)" }}>"{item.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>{item.author}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--axis-gray)" }}>{t.bought} {item.car}</div>
                </div>
                <Stars count={5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
