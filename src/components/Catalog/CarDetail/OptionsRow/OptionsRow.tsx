"use client";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
// Lucide — только то чего нет в Tabler
import {
  Shield, Sofa, Smartphone, Music, LayoutGrid,
  Package, DoorClosed, MoveHorizontal, Gamepad2, Moon,
  Lock, ArrowUpDown, Wifi, Users, UserRound, ShieldCheck,
  Car, Zap, Camera, Wind, AlignCenter, Armchair,
  Waves, BookMarked, MapPin, Monitor, Headphones, Eye,
  HandMetal, CloudRain, ScanEye, Bluetooth,
} from "lucide-react";
// Tabler — точные автомобильные иконки
import {
  TbSteeringWheel, TbSteeringWheelFilled,
  TbAirConditioning,
  TbCarFan, TbCarFan1, TbCarFan2,
  TbWiper, TbWiperWash,
  TbRadar, TbRadar2,
  TbNfc, TbCreditCard,
  TbBulb, TbBulbFilled,
  TbMassage,
  TbUsb,
  TbWheel,
  TbWindow,
  TbKey,
  TbLock,
  TbBluetooth,
  TbDisc,
  TbHeadphones,
  TbCamera,
  TbNavigation,
  TbShield, TbShieldCheck, TbShieldHalf, TbShieldCheckered,
  TbGauge,
  TbBan,
  TbActivity,
  TbAlertTriangle,
  TbFlame,
  TbSun, TbSunHigh,
  TbBookmark,
  TbSofa,
  TbParking,
  TbMapPin,
  TbPlug,
  TbEye,
  TbScan,
  TbScreenShare,
  TbCar,
  TbEngine,
} from "react-icons/tb";
import { catalog } from "./data";

interface OptionsRowProps {
  data: {
    standard: string[];
    choice?: string[];
  };
}

const S = "w-4 h-4"; // размер иконок

// Иконка для каждой опции по коду — приоритет Tabler (автомобильные), затем Lucide
const OPTION_ICONS: Record<string, React.ReactNode> = {
  // Кузов / экстерьер
  "010": <TbSunHigh        className={S} />, // Люк
  "029": <TbBulb           className={S} />, // Фары HID
  "075": <TbBulbFilled     className={S} />, // Фары LED
  "059": <Package          className={S} />, // Электропривод багажника
  "080": <DoorClosed       className={S} />, // Автозакрытие дверей
  "024": <ScanEye          className={S} />, // Электроскладываемые зеркала
  "017": <TbWheel          className={S} />, // Алюминиевые диски
  "062": <MoveHorizontal   className={S} />, // Рейлинги
  // Руль / управление
  "082": <TbSteeringWheel  className={S} />, // Рулевое с подогревом
  "083": <TbSteeringWheelFilled className={S} />, // Электрорегулировка руля
  "084": <TbSteeringWheel  className={S} />, // Подрулевые переключатели
  "031": <TbSteeringWheelFilled className={S} />, // Кнопки на руле
  "008": <TbSteeringWheel  className={S} />, // Электроусилитель руля
  "030": <Moon             className={S} />, // ECM зеркало (автозатемнение)
  // Замки / стёкла
  "057": <TbKey            className={S} />, // Смарт-ключ
  "015": <TbNfc            className={S} />, // Беспроводная блокировка
  "006": <TbLock           className={S} />, // Электрозамки
  "007": <TbWindow         className={S} />, // Электростеклоподъёмники
  // Подушки безопасности
  "026": <TbShieldCheck    className={S} />, // Подушка водителя
  "027": <TbShield         className={S} />, // Подушка пассажира
  "020": <TbShieldHalf     className={S} />, // Боковые подушки
  "056": <TbShieldCheckered className={S} />, // Шторки безопасности
  // Системы безопасности
  "001": <TbBan            className={S} />, // ABS
  "019": <TbGauge          className={S} />, // TCS
  "055": <TbActivity       className={S} />, // ESC
  "033": <TbWheel          className={S} />, // TPMS (давление шин)
  "088": <TbAlertTriangle  className={S} />, // LDWS (выход из полосы)
  "002": <Zap              className={S} />, // ECS (подвеска)
  "085": <TbRadar          className={S} />, // Передние парктроники
  "032": <TbRadar2         className={S} />, // Задние парктроники
  "086": <TbEye            className={S} />, // Слепые зоны
  "058": <TbCamera         className={S} />, // Камера заднего вида
  "087": <TbScan           className={S} />, // Камеры 360°
  "094": <TbParking        className={S} />, // EPB (электрохендбрейк)
  // Комфорт / климат
  "068": <TbGauge          className={S} />, // Круиз-контроль
  "079": <TbGauge          className={S} />, // Адаптивный круиз
  "095": <TbScreenShare    className={S} />, // HUD
  "023": <TbAirConditioning className={S} />, // Кондиционер
  "097": <TbSunHigh        className={S} />, // Автоосвещение
  "081": <TbWiperWash      className={S} />, // Датчик дождя
  "092": <AlignCenter      className={S} />, // Шторки задние
  "093": <AlignCenter      className={S} />, // Шторки заднее стекло
  // Сиденья
  "014": <TbSofa           className={S} />, // Кожаные сиденья
  "021": <TbSofa           className={S} />, // Электросиденье водителя
  "035": <TbSofa           className={S} />, // Электросиденье пассажира
  "089": <Armchair         className={S} />, // Электросиденье задних
  "022": <TbFlame          className={S} />, // Подогрев передних
  "063": <TbFlame          className={S} />, // Подогрев задних
  "034": <TbCarFan1        className={S} />, // Вентиляция водителя
  "077": <TbCarFan1        className={S} />, // Вентиляция пассажира
  "090": <TbCarFan2        className={S} />, // Вентиляция задних
  "091": <TbMassage        className={S} />, // Массажное сиденье
  "051": <TbBookmark       className={S} />, // Память сиденья водителя
  "078": <TbBookmark       className={S} />, // Память сиденья пассажира
  // Мультимедиа / технологии
  "005": <TbNavigation     className={S} />, // Навигация
  "004": <TbScreenShare    className={S} />, // AV-монитор передних
  "054": <Monitor          className={S} />, // AV-монитор задних
  "096": <TbBluetooth      className={S} />, // Bluetooth
  "003": <TbDisc           className={S} />, // CD
  "072": <TbUsb            className={S} />, // USB
  "071": <TbHeadphones     className={S} />, // AUX
  "074": <TbNfc            className={S} />, // Hi-Pass (оплата проезда)
};

const FALLBACK_ICON = <LayoutGrid className="w-4 h-4" />;

// Иконки категорий
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  comfort:       <Sofa       className="w-3.5 h-3.5" />,
  safety:        <Shield     className="w-3.5 h-3.5" />,
  entertainment: <Music      className="w-3.5 h-3.5" />,
  technology:    <Smartphone className="w-3.5 h-3.5" />,
  other:         <LayoutGrid className="w-3.5 h-3.5" />,
};

export default function OptionsRow({ data }: OptionsRowProps) {
  const { t } = useTranslation("common");

  const getOptionsWithDetails = (codes: string[]) => {
    return codes
      .map((code) => {
        const catalogItem = catalog.find((i) => i.code === code);
        return catalogItem ? { ...catalogItem, code } : null;
      })
      .filter(Boolean);
  };

  const standardOptions = getOptionsWithDetails(data.standard);
  const choiceOptions   = getOptionsWithDetails(data.choice || []);

  const groupOptions = (options: any[]) => {
    const groups: Record<string, any[]> = {
      comfort: [], safety: [], entertainment: [], technology: [], other: [],
    };
    options.forEach((option) => {
      const name = option.translatedValue.toLowerCase();
      if (
        name.includes("круиз") || name.includes("кожан") ||
        name.includes("сиденье") || name.includes("сиденья") ||
        name.includes("подогрев") || name.includes("вентиляц") ||
        name.includes("электросиденье") || name.includes("массаж") ||
        name.includes("память") || name.includes("кондицион") ||
        name.includes("рулевое") || name.includes("подрулев") ||
        name.includes("кнопки управл")
      ) {
        groups.comfort.push(option);
      } else if (
        name.includes("подушка") || name.includes("шторки безопас") ||
        name.includes("abs") || name.includes("tcs") || name.includes("esc") ||
        name.includes("антиблок") || name.includes("пробуксов") ||
        name.includes("стабилизац") || name.includes("давления в шин") ||
        name.includes("ldws") || name.includes("полос") ||
        name.includes("ecs") || name.includes("подвеск") ||
        name.includes("парковочн") || name.includes("парктрон") ||
        name.includes("слепых зон") || name.includes("камера") ||
        name.includes("кругового") || name.includes("epb") ||
        name.includes("стояночн")
      ) {
        groups.safety.push(option);
      } else if (
        name.includes("аудио") || name.includes("музыка") ||
        name.includes("звук") || name.includes("cd")
      ) {
        groups.entertainment.push(option);
      } else if (
        name.includes("bluetooth") || name.includes("навигац") ||
        name.includes("монитор") || name.includes("usb") ||
        name.includes("aux") || name.includes("hi-pass") ||
        name.includes("оплаты проезда") || name.includes("hud") ||
        name.includes("проекцион")
      ) {
        groups.technology.push(option);
      } else {
        groups.other.push(option);
      }
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  };

  const standardGroups = groupOptions(standardOptions);
  const choiceGroups   = groupOptions(choiceOptions);

  const cardStyle = {
    backgroundColor: "var(--axis-charcoal)",
    border: "1px solid rgba(74,74,74,0.3)",
  };

  const renderGroups = (groups: [string, any[]][], accentColor: string) => (
    <div className="divide-y" style={{ borderColor: "rgba(74,74,74,0.15)" }}>
      {groups.map(([category, options]) => (
        <Accordion key={category} type="single" collapsible>
          <AccordionItem value={category} className="border-0">
            <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                >
                  {CATEGORY_ICONS[category]}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>
                  {t(`car.optionCategory.${category}`)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold ml-1"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                  {options.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {options.map((option: any) => (
                  <div
                    key={option.code}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(74,74,74,0.2)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      {OPTION_ICONS[option.code] ?? FALLBACK_ICON}
                    </span>
                    <span className="text-xs leading-tight" style={{ color: "var(--axis-white)" }}>
                  {option.translatedValue}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Standard Options */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <Accordion type="single" defaultValue="standard-options" collapsible>
          <AccordionItem value="standard-options" className="border-0">
            <AccordionTrigger className="px-5 py-4 hover:no-underline" style={{ color: "var(--axis-white)" }}>
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

            <AccordionContent className="px-5 pb-5 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
              {renderGroups(standardGroups, "#22c55e")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Choice Options */}
      {choiceOptions.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <Accordion type="single" collapsible>
            <AccordionItem value="choice-options" className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline" style={{ color: "var(--axis-white)" }}>
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

              <AccordionContent className="px-5 pb-5 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                {renderGroups(choiceGroups, "var(--axis-orange)")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
