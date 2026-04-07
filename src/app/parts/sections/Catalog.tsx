"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Cog, Car, Wrench, Disc, Settings, Zap, Filter, Lightbulb,
} from "lucide-react";

const ICONS = [Cog, Car, Wrench, Disc, Settings, Zap, Filter, Lightbulb];
const CAT_KEYS = ["cat0", "cat1", "cat2", "cat3", "cat4", "cat5", "cat6", "cat7"] as const;

export function Catalog() {
  const { t } = useTranslation();
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
    if (sectionRef.current) observer.observe(sectionRef.current);
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
              {t("parts.catalog.badge")}
            </span>
            <div className="h-px w-12 bg-[#BB162B]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#002C5F] mb-4">
            {t("parts.catalog.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("parts.catalog.subtitle")}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAT_KEYS.map((key, index) => {
            const Icon = ICONS[index];
            return (
              <div
                key={key}
                className={`group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
              >
                <div className="w-14 h-14 rounded-lg bg-[#002C5F]/5 flex items-center justify-center mb-4 group-hover:bg-[#BB162B] transition-colors duration-300">
                  <Icon className="w-7 h-7 text-[#002C5F] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-[#002C5F] mb-2 group-hover:text-[#BB162B] transition-colors">
                  {t(`parts.catalog.${key}.title`)}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t(`parts.catalog.${key}.desc`)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["i0", "i1", "i2", "i3"] as const).map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {t(`parts.catalog.${key}.${item}`)}
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
