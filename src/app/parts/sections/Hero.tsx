"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const parallaxElement = heroRef.current.querySelector(
          ".parallax-bg",
        ) as HTMLElement;
        if (parallaxElement) {
          parallaxElement.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Parallax Background */}
      <div className="parallax-bg absolute inset-0 w-full h-[120%] -top-[10%]">
        <img
          src="/hero-bg.jpg"
          alt="Auto parts warehouse"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#002C5F]/95 via-[#002C5F]/90 to-[#002C5F]/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="space-y-8 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-[#BB162B]" />
              <span className="text-white/80 text-sm font-medium tracking-wider uppercase">
                Прямые поставки из Кореи
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Оригинальные <span className="text-[#BB162B]">запчасти</span>
              <br />
              из Кореи
            </h1>

            <p className="text-lg text-white/80 max-w-xl">
              Hyundai, Kia и другие корейские бренды с доставкой по всему миру.
              Прямые поставки из Южной Кореи. Гарантия оригинальности.
              Конкурентные цены.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => scrollToSection("contacts")}
                className="bg-[#BB162B] hover:bg-[#9B1220] text-white px-8 py-6 text-base font-semibold group"
              >
                Оставить заявку
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("catalog")}
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold"
              >
                Смотреть каталог
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold text-white">10+</div>
                <div className="text-sm text-white/60">Лет опыта</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">5000+</div>
                <div className="text-sm text-white/60">Запчастей</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-sm text-white/60">Оригинал</div>
              </div>
            </div>
          </div>

          {/* Right Column - Brand Logos */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <div className="relative">
              {/* Hyundai Logo */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6 transform hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white italic tracking-tight">
                    HYUNDAI
                  </div>
                  <div className="text-sm text-white/60 mt-2">
                    New Thinking. New Possibilities.
                  </div>
                </div>
              </div>

              {/* Kia Logo */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white tracking-wider">
                    KIA
                  </div>
                  <div className="text-sm text-white/60 mt-2">
                    Movement that inspires
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-[#BB162B]/30 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#BB162B]/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <button
          onClick={() => scrollToSection("catalog")}
          className="text-white/60 hover:text-white transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
}
