"use client";
import { useEffect, useRef, useState } from "react";
import {
  Cog,
  Car,
  Wrench,
  Disc,
  Settings,
  Zap,
  Filter,
  Lightbulb,
} from "lucide-react";

const categories = [
  {
    icon: Cog,
    title: "Двигатели и комплектующие",
    description: "Поршни, кольца, вкладыши, прокладки, ремни",
    items: ["Поршни", "Кольца", "Вкладыши", "Прокладки"],
  },
  {
    icon: Car,
    title: "Кузовные детали",
    description: "Крылья, бамперы, двери, капоты, крышки багажника",
    items: ["Крылья", "Бамперы", "Двери", "Капоты"],
  },
  {
    icon: Wrench,
    title: "Подвеска и рулевое",
    description: "Амортизаторы, рычаги, наконечники, стойки",
    items: ["Амортизаторы", "Рычаги", "Наконечники", "Сайлентблоки"],
  },
  {
    icon: Disc,
    title: "Тормозная система",
    description: "Диски, колодки, суппорты, цилиндры",
    items: ["Тормозные диски", "Колодки", "Суппорты", "Тормозные шланги"],
  },
  {
    icon: Settings,
    title: "Трансмиссия",
    description: "КПП, сцепление, карданы, полуоси",
    items: ["Сцепление", "Карданы", "Полуоси", "Подшипники"],
  },
  {
    icon: Zap,
    title: "Электрика",
    description: "Генераторы, стартеры, фары, аккумуляторы",
    items: ["Генераторы", "Стартеры", "Фары", "Проводка"],
  },
  {
    icon: Filter,
    title: "Фильтры и расходники",
    description: "Масляные, воздушные, топливные, салонные",
    items: ["Масляные фильтры", "Воздушные", "Топливные", "Салонные"],
  },
  {
    icon: Lightbulb,
    title: "Салон и оптика",
    description: "Фары, фонари, зеркала, панели приборов",
    items: ["Фары", "Фонари", "Зеркала"],
  },
];

export function Catalog() {
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
    <section id="catalog" ref={sectionRef} className="py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#BB162B]" />
            <span className="text-[#BB162B] text-sm font-medium tracking-wider uppercase">
              Каталог
            </span>
            <div className="h-px w-12 bg-[#BB162B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#002C5F] mb-4">
            Категории запчастей
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Широкий ассортимент оригинальных запчастей для корейских
            автомобилей. Все детали проходят строгий контроль качества.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className={`group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-lg bg-[#002C5F]/5 flex items-center justify-center mb-4 group-hover:bg-[#BB162B] transition-colors duration-300">
                  <Icon className="w-7 h-7 text-[#002C5F] group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[#002C5F] mb-2 group-hover:text-[#BB162B] transition-colors">
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-4">
                  {category.description}
                </p>

                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
