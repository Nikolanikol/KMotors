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

export default function HowToBuyPage() {
  const { t } = useTranslation();

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('buy.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('buy.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-300 hidden md:block"></div>

          <div className="space-y-8 md:space-y-12">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative md:pl-32">
                  {/* Circle indicator */}
                  <div className="absolute left-0 top-0 w-16 h-16 bg-white border-4 border-orange-500 rounded-full flex items-center justify-center md:left-0 hidden md:flex shadow-lg">
                    <Icon className="w-8 h-8 text-orange-500" />
                  </div>

                  {/* Mobile circle */}
                  <div className="md:hidden w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-2 md:hidden">
                      <span className="text-xl font-bold text-orange-500">
                        {t('buy.step')} {step.number}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                      {t(`buy.steps.step${step.number}.title`)}
                    </h2>

                    <p className="text-gray-700 leading-relaxed mb-4">
                      {t(`buy.steps.step${step.number}.description`)}
                    </p>

                    {/* Highlight box */}
                    {step.hasHighlight && step.highlightType === "important" && (
                      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-blue-900">
                          <span className="font-bold">{t('buy.important')}:</span>{" "}
                          {t(`buy.steps.step${step.number}.highlight`)}
                        </p>
                      </div>
                    )}

                    {step.hasHighlight && step.highlightType === "note" && (
                      <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                        <p className="text-amber-900">
                          <span className="font-bold">{t('buy.note')}:</span>{" "}
                          {t(`buy.steps.step${step.number}.highlight`)}
                        </p>
                      </div>
                    )}

                    {step.hasHighlight && step.highlightType === "success" && (
                      <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-600 rounded">
                        <p className="text-green-900 font-semibold">
                          ✅ {t(`buy.steps.step${step.number}.highlight`)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step number - desktop */}
                  <div className="absolute -left-24 top-6 text-xl font-bold text-orange-500 hidden lg:block">
                    {t('buy.step')} {step.number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white text-center">
          <h2 className="text-2xl font-bold mb-3">{t('buy.ready')}</h2>
          <p className="text-orange-100 mb-6">
            {t('buy.readyDescription')}
          </p>
          <a
            href="/catalog"
            className="inline-block bg-white text-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            {t('buy.goToCatalog')}
          </a>
        </div>
      </div>
    </div>
  );
}
