"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Truck, Shield, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const ADV_ICONS = [Truck, Shield, Clock, Users];
const ADV_KEYS = ["adv0", "adv1", "adv2", "adv3"] as const;
const FEATURE_KEYS = ["f0", "f1", "f2", "f3"] as const;

export function About() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible] = useState(true);

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-[var(--pn-bg)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Image */}
          <div
            className={`relative transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
              <Image
                src="/warehouse.jpg"
                alt="K-Axis warehouse"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">2015</div>
                    <div className="text-xs sm:text-sm text-white/70">{t("parts.about.statFounded")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">2000+</div>
                    <div className="text-xs sm:text-sm text-white/70">{t("parts.about.statClients")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">50+</div>
                    <div className="text-xs sm:text-sm text-white/70">{t("parts.about.statCountries")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-[var(--pn-orange)]" />
              <span className="text-[var(--pn-orange)] text-sm font-medium tracking-wider uppercase">
                {t("parts.about.badge")}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--pn-deep-navy)] mb-6">
              {t("parts.about.title")}
              <br />
              <span className="text-[var(--pn-orange)]">{t("parts.about.titleHighlight")}</span>
            </h2>

            <p className="text-[var(--pn-dark-gray)] text-lg mb-6 leading-relaxed">
              {t("parts.about.para1")}
            </p>
            <p className="text-[var(--pn-dark-gray)] mb-8 leading-relaxed">
              {t("parts.about.para2")}
            </p>

            <div className="space-y-3 mb-10">
              {FEATURE_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--pn-success)]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[var(--pn-success)]" />
                  </div>
                  <span className="text-[var(--pn-deep-navy)]">{t(`parts.about.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advantages Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-20">
          {ADV_KEYS.map((key, index) => {
            const Icon = ADV_ICONS[index];
            return (
              <div
                key={key}
                className={`bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-6 text-center hover:border-[var(--pn-orange)] group transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: isVisible ? `${400 + index * 100}ms` : "0ms" }}
              >
                <div className="w-14 h-14 rounded-full bg-[var(--pn-surface-3)] flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--pn-orange)] transition-colors">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--pn-text)] mb-2">
                  {t(`parts.about.${key}title`)}
                </h3>
                <p className="text-sm text-[var(--pn-text-muted)]">
                  {t(`parts.about.${key}desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
