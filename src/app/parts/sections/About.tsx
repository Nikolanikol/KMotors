"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Truck, Shield, Clock, Users } from "lucide-react";

const advantages = [
  {
    icon: Truck,
    title: "Прямые поставки",
    description: "Работаем без посредников напрямую с производителями",
  },
  {
    icon: Shield,
    title: "Гарантия качества",
    description: "Только оригинальные запчасти с сертификатами",
  },
  {
    icon: Clock,
    title: "Быстрая доставка",
    description: "От 7 дней в любую точку мира",
  },
  {
    icon: Users,
    title: "Персональный подход",
    description: "Помощь в подборе деталей по VIN-номеру",
  },
];

export function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Image */}
          <div
            className={`relative transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/warehouse.jpg"
                alt="Kmotors warehouse"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#002C5F]/60 to-transparent" />

              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold">2015</div>
                    <div className="text-sm text-white/70">Год основания</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">2000+</div>
                    <div className="text-sm text-white/70">Клиентов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">50+</div>
                    <div className="text-sm text-white/70">Стран</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-32 h-32 border-2 border-[#BB162B]/20 rounded-2xl -z-10" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#002C5F]/10 rounded-2xl -z-10" />
          </div>

          {/* Right Column - Content */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-[#BB162B]" />
              <span className="text-[#BB162B] text-sm font-medium tracking-wider uppercase">
                О компании
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#002C5F] mb-6">
              Kmotors — ваш
              <br />
              <span className="text-[#BB162B]">надёжный поставщик</span>
            </h2>

            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Компания Kmotors специализируется на поставках оригинальных
              автозапчастей из Южной Кореи. Мы работаем напрямую с
              производителями и официальными дилерами, что позволяет предлагать
              конкурентные цены и гарантировать подлинность каждой детали.
            </p>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Наша миссия — сделать ремонт корейских автомобилей доступным и
              качественным. Мы понимаем, как важно получить правильную запчасть
              вовремя, поэтому обеспечиваем быструю обработку заказов и надёжную
              доставку.
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-10">
              {[
                "Оригинальные запчасти Hyundai, Kia, Genesis",
                "Прямые поставки из Южной Кореи",
                "Подбор по VIN-номеру автомобиля",
                "Гарантия на все запчасти",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advantages Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={advantage.title}
                className={`bg-[#F5F7FA] rounded-xl p-6 text-center hover:bg-[#002C5F] group transition-all duration-300 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: isVisible ? `${400 + index * 100}ms` : "0ms",
                }}
              >
                <div className="w-14 h-14 rounded-full bg-[#002C5F] flex items-center justify-center mx-auto mb-4 group-hover:bg-[#BB162B] transition-colors">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#002C5F] mb-2 group-hover:text-white transition-colors">
                  {advantage.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-white/80 transition-colors">
                  {advantage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
