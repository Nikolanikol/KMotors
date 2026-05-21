"use client";

import {
  Search,
  FileText,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle,
  Anchor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

export default function HowToBuyPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const steps = [
    {
      number: 1,
      icon: Search,
      hasHighlight: false,
    },
    {
      number: 2,
      icon: CreditCard,
      hasHighlight: true,
      highlightType: "important",
    },
    {
      number: 3,
      icon: FileText,
      hasHighlight: false,
    },
    {
      number: 4,
      icon: CreditCard,
      hasHighlight: false,
    },
    {
      number: 5,
      icon: Anchor,
      hasHighlight: false,
    },
    {
      number: 6,
      icon: Truck,
      hasHighlight: true,
      highlightType: "note",
    },
    {
      number: 7,
      icon: MapPin,
      hasHighlight: false,
    },
    {
      number: 8,
      icon: CheckCircle,
      hasHighlight: true,
      highlightType: "success",
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--axis-white)" }}>
            {t('buy.title')}
          </h1>
          <p className="text-base" style={{ color: "var(--axis-gray)" }}>{t('buy.subtitle')}</p>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px hidden md:block" style={{ background: "linear-gradient(to bottom, var(--axis-orange), transparent)" }} />

          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative md:pl-28">
                  <div className="absolute left-0 top-0 w-16 h-16 rounded-full hidden md:flex items-center justify-center border-2 flex-shrink-0"
                    style={{ backgroundColor: "var(--axis-graphite)", borderColor: "var(--axis-orange)" }}>
                    <Icon className="w-7 h-7" style={{ color: "var(--axis-orange)" }} />
                  </div>

                  <div className="md:hidden w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: "var(--axis-orange)" }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="rounded-2xl p-5 md:p-6" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
                    <div className="flex items-center gap-2 mb-1 md:hidden">
                      <span className="text-sm font-bold" style={{ color: "var(--axis-orange)" }}>{t('buy.step')} {step.number}</span>
                    </div>
                    <h2 className="text-lg font-bold mb-2" style={{ color: "var(--axis-white)" }}>
                      {t(`buy.steps.step${step.number}.title`)}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--axis-gray)" }}>
                      {t(`buy.steps.step${step.number}.description`)}
                    </p>

                    {step.hasHighlight && step.highlightType === "important" && (
                      <div className="mt-3 p-3 rounded-lg border-l-2 text-sm" style={{ backgroundColor: "rgba(255,69,0,0.08)", borderColor: "var(--axis-orange)", color: "var(--axis-white)" }}>
                        <span className="font-bold" style={{ color: "var(--axis-orange)" }}>{t('buy.important')}: </span>
                        {t(`buy.steps.step${step.number}.highlight`)}
                      </div>
                    )}
                    {step.hasHighlight && step.highlightType === "note" && (
                      <div className="mt-3 p-3 rounded-lg border-l-2 text-sm" style={{ backgroundColor: "rgba(255,140,0,0.08)", borderColor: "var(--axis-amber)", color: "var(--axis-white)" }}>
                        <span className="font-bold" style={{ color: "var(--axis-amber)" }}>{t('buy.note')}: </span>
                        {t(`buy.steps.step${step.number}.highlight`)}
                      </div>
                    )}
                    {step.hasHighlight && step.highlightType === "success" && (
                      <div className="mt-3 p-3 rounded-lg border-l-2 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.08)", borderColor: "#22c55e", color: "#22c55e" }}>
                        ✅ {t(`buy.steps.step${step.number}.highlight`)}
                      </div>
                    )}
                  </div>

                  <div className="absolute -left-16 top-5 text-xs font-bold hidden lg:block" style={{ color: "var(--axis-orange)" }}>
                    {t('buy.step')} {step.number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 p-8 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))" }}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('buy.ready')}</h2>
          <p className="text-white/80 mb-6 text-sm">{t('buy.readyDescription')}</p>
          <a href={`/${lang}/catalog`}
            className="inline-block font-bold py-3 px-8 rounded-full transition-colors text-sm"
            style={{ backgroundColor: "var(--axis-black)", color: "var(--axis-white)" }}>
            {t('buy.goToCatalog')}
          </a>
        </div>
      </div>
    </div>
  );
}
