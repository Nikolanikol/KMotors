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

  const cardStyle = { backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" };
  const triggerStyle = { color: "var(--axis-white)" };

  return (
    <div className="space-y-3">
      {/* Standard Options */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <Accordion type="single" defaultValue="standard-options" collapsible>
          <AccordionItem value="standard-options" className="border-0">
            <AccordionTrigger className="px-5 py-4 hover:no-underline" style={triggerStyle}>
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))", display: "inline-block" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>
                  {t("car.standardOptions")}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)" }}>
                  {standardOptions.length}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-4 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
              <div className="space-y-4 pt-4">
                {standardGroups.map(([category, options]) => (
                  <div key={category}>
                    <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--axis-gray)" }}>
                      {t(`car.optionCategory.${category}`)}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((option) => (
                        <div key={option.code} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ backgroundColor: "var(--axis-graphite)" }}>
                          <FaCheck className="text-xs flex-shrink-0" style={{ color: "#22c55e" }} />
                          <span className="text-xs" style={{ color: "var(--axis-white)" }}>{option.translatedValue}</span>
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
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <Accordion type="single" collapsible>
            <AccordionItem value="choice-options" className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline" style={triggerStyle}>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))", display: "inline-block" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>
                    {t("car.choiceOptions")}
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,69,0,0.12)", color: "var(--axis-orange)" }}>
                    {choiceOptions.length}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-4 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                <div className="space-y-4 pt-4">
                  {choiceGroups.map(([category, options]) => (
                    <div key={category}>
                      <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--axis-gray)" }}>
                        {t(`car.optionCategory.${category}`)}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {options.map((option) => (
                          <div key={option.code} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ backgroundColor: "var(--axis-graphite)" }}>
                            <FaCheck className="text-xs flex-shrink-0" style={{ color: "var(--axis-orange)" }} />
                            <span className="text-xs" style={{ color: "var(--axis-white)" }}>{option.translatedValue}</span>
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

    </div>
  );
}
