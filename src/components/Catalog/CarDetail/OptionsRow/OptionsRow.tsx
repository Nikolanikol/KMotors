"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FaCheck } from "react-icons/fa";
import {
  Zap,
  Smartphone,
  Music,
  Shield,
  Wind,
  Gauge,
  Lightbulb,
  Lock,
  Volume2,
  Navigation,
  Sofa,
  Wifi,
} from "lucide-react";
import { catalog } from "./data";
interface OptionsRowProps {
  data: {
    standard: string[];
    choice?: string[];
  };
  catalog: Array<{
    code: string;
    translatedValue: string;
  }>;
}

// Маппинг опций на иконки
const optionIcons: Record<string, React.ReactNode> = {
  sunroof: <Zap className="w-5 h-5" />,
  smartphone: <Smartphone className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  safety: <Shield className="w-5 h-5" />,
  climate: <Wind className="w-5 h-5" />,
  cruise: <Gauge className="w-5 h-5" />,
  lights: <Lightbulb className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  sound: <Volume2 className="w-5 h-5" />,
  gps: <Navigation className="w-5 h-5" />,
  seats: <Sofa className="w-5 h-5" />,
  wifi: <Wifi className="w-5 h-5" />,
};

export default function OptionsRow({ data }: OptionsRowProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "standard-options",
  ]);
  const { t } = useTranslation("common");

  // Получаем опции с информацией из каталога
  const getOptionsWithDetails = (codes: string[]) => {
    return codes
      .map((code) => {
        const catalogItem = catalog.find((i) => i.code === code);
        return catalogItem ? { code, ...catalogItem } : null;
      })
      .filter(Boolean);
  };

  const standardOptions = getOptionsWithDetails(data.standard);
  const choiceOptions = getOptionsWithDetails(data.choice || []);

  // Группируем опции по категориям (ключи — английские для стабильности логики)
  const groupOptions = (options: any[]) => {
    const groups: Record<string, any[]> = {
      comfort: [],
      safety: [],
      entertainment: [],
      technology: [],
      other: [],
    };

    options.forEach((option) => {
      const name = option.translatedValue.toLowerCase();
      if (
        name.includes("климат") ||
        name.includes("круиз") ||
        name.includes("сиденье") ||
        name.includes("обогрев") ||
        name.includes("climate") ||
        name.includes("cruise") ||
        name.includes("seat") ||
        name.includes("heat")
      ) {
        groups["comfort"].push(option);
      } else if (
        name.includes("airbag") ||
        name.includes("abs") ||
        name.includes("esp") ||
        name.includes("контроль") ||
        name.includes("безопас") ||
        name.includes("safety") ||
        name.includes("control")
      ) {
        groups["safety"].push(option);
      } else if (
        name.includes("аудио") ||
        name.includes("музыка") ||
        name.includes("звук") ||
        name.includes("audio") ||
        name.includes("music") ||
        name.includes("sound")
      ) {
        groups["entertainment"].push(option);
      } else if (
        name.includes("bluetooth") ||
        name.includes("смартфон") ||
        name.includes("gps") ||
        name.includes("навига") ||
        name.includes("wifi") ||
        name.includes("smartphone") ||
        name.includes("navigation")
      ) {
        groups["technology"].push(option);
      } else {
        groups["other"].push(option);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const standardGroups = groupOptions(standardOptions);
  const choiceGroups = groupOptions(choiceOptions);

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">{t("car.specs")}</h2>
        <p className="text-orange-100">
          {t("car.totalOptions")}: {standardOptions.length + choiceOptions.length}
        </p>
      </div>

      {/* Standard Options */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-md overflow-hidden">
        <Accordion type="single" defaultValue="standard-options" collapsible>
          <AccordionItem value="standard-options" className="border-0">
            <AccordionTrigger className="px-8 py-6 hover:bg-orange-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xl font-bold text-gray-900">
                  {t("car.standardOptions")}
                </span>
                <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {standardOptions.length}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-8 py-6 bg-gradient-to-b from-green-50 to-white border-t-2 border-green-200">
              <div className="space-y-6">
                {standardGroups.map(([category, options]) => (
                  <div key={category}>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
                      {t(`car.optionCategory.${category}`)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {options.map((option) => (
                        <div
                          key={option.code}
                          className="flex items-center gap-3 bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md hover:border-green-400 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FaCheck className="text-green-600 text-sm" />
                          </div>
                          <span className="text-gray-900 font-medium flex-1">
                            {option.translatedValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Choice Options */}
      {choiceOptions.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-md overflow-hidden">
          <Accordion type="single" collapsible>
            <AccordionItem value="choice-options" className="border-0">
              <AccordionTrigger className="px-8 py-6 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xl font-bold text-gray-900">
                    {t("car.choiceOptions")}
                  </span>
                  <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {choiceOptions.length}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-8 py-6 bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-200">
                <div className="space-y-6">
                  {choiceGroups.map(([category, options]) => (
                    <div key={category}>
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
                        {t(`car.optionCategory.${category}`)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {options.map((option) => (
                          <div
                            key={option.code}
                            className="flex items-center gap-3 bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FaCheck className="text-blue-600 text-sm" />
                            </div>
                            <span className="text-gray-900 font-medium flex-1">
                              {option.translatedValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase">
            {t("car.standardEquipment")}
          </p>
          <p className="text-4xl font-bold text-green-600">
            {standardOptions.length}
          </p>
          <p className="text-xs text-gray-600 mt-2">{t("car.optionsIncluded")}</p>
        </div>

        {choiceOptions.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase">
              {t("car.additionalOptions")}
            </p>
            <p className="text-4xl font-bold text-blue-600">
              {choiceOptions.length}
            </p>
            <p className="text-xs text-gray-600 mt-2">{t("car.optionsAvailable")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
