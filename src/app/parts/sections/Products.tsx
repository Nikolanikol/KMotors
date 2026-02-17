"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Свеча зажигания Hyundai/Kia",
    partNumber: "18855-10060",
    price: 12000,
    image: "/parts/spark-plug.jpg",
    brand: "Hyundai Mobis",
    inStock: true,
  },
  {
    id: 2,
    name: "Масляный фильтр оригинал",
    partNumber: "26300-35505",
    price: 8500,
    image: "/parts/oil-filter.jpg",
    brand: "Hyundai Mobis",
    inStock: true,
  },
  {
    id: 3,
    name: "Тормозные колодки передние",
    partNumber: "58101-1GA00",
    price: 45000,
    image: "/parts/brake-pads.jpg",
    brand: "Mando",
    inStock: true,
  },
  {
    id: 4,
    name: "Амортизатор передний",
    partNumber: "54651-3X100",
    price: 89000,
    image: "/parts/shock-absorber.jpg",
    brand: "Hyundai Mobis",
    inStock: true,
  },
  {
    id: 5,
    name: "Радиатор охлаждения",
    partNumber: "25310-1R000",
    price: 156000,
    image: "/parts/radiator.jpg",
    brand: "Hyundai Mobis",
    inStock: false,
  },
  {
    id: 6,
    name: "Генератор в сборе",
    partNumber: "37300-2B400",
    price: 245000,
    image: "/parts/alternator.jpg",
    brand: "Valeo",
    inStock: true,
  },
];

export function Products() {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const scrollToContacts = () => {
    const element = document.getElementById("contacts");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="products" ref={sectionRef} className="py-24 bg-[#F5F7FA]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#BB162B]" />
            <span className="text-[#BB162B] text-sm font-medium tracking-wider uppercase">
              Популярные товары
            </span>
            <div className="h-px w-12 bg-[#BB162B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#002C5F] mb-4">
            Хиты продаж
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Самые востребованные запчасти для корейских автомобилей. Все позиции
            в наличии на складе в Сеуле.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Image */}
              <div className="relative h-56 bg-gray-50 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
                {product.inStock ? (
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Check className="w-3 h-3" />В наличии
                  </div>
                ) : (
                  <div className="absolute top-4 left-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                    Под заказ
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-[#002C5F] text-white px-3 py-1 rounded-full text-xs font-medium">
                  {product.brand}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-xs text-gray-400 mb-2">
                  Артикул: {product.partNumber}
                </div>
                <h3 className="text-lg font-semibold text-[#002C5F] mb-3 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-[#BB162B]">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">₩</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={scrollToContacts}
                    className="bg-[#002C5F] hover:bg-[#001f45] text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Заказать
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Не нашли нужную запчасть? Свяжитесь с нами — поможем с подбором!
          </p>
          <Button
            onClick={scrollToContacts}
            variant="outline"
            className="border-2 border-[#002C5F] text-[#002C5F] hover:bg-[#002C5F] hover:text-white"
          >
            Оставить запрос
          </Button>
        </div>
      </div>
    </section>
  );
}
