/**
 * Translate parts_products.name_en → name_ru using a local dictionary.
 * Covers ~90%+ of auto parts names without API calls.
 *
 * Run:   npx tsx scripts/translate-parts-dict.ts
 * Dry:   npx tsx scripts/translate-parts-dict.ts --dry
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DRY_RUN = process.argv.includes("--dry");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Exact matches (case-insensitive) ─────────────────────────────────────────
const EXACT: Record<string, string> = {
  "Bolt": "Болт",
  "O-ring": "О-кольцо",
  "Nut": "Гайка",
  "Clip": "Клипса",
  "Clamp": "Хомут",
  "Label": "Наклейка",
  "Emblem": "Эмблема",
  "Bezel": "Безель",
  "Radiator": "Радиатор",
  "Alternator": "Генератор",
  "Starter": "Стартер",
  "Turbocharger": "Турбокомпрессор",
  "Thermostat": "Термостат",
  "Compressor": "Компрессор",
  "Condenser": "Конденсатор",
  "Evaporator": "Испаритель",
  "Wiring Loop": "Жгут проводов",
  "Wiring Harness": "Жгут проводов",
  "Extension cord": "Удлинитель",
  "Oxygen sensor": "Датчик кислорода",
  "Steering wheel": "Рулевое колесо",
  "Wheel steering": "Рулевое колесо",
  "Engine cover": "Крышка двигателя",
  "Radiator grille": "Решётка радиатора",
  "Brake master cylinder": "Главный тормозной цилиндр",
  "Rear muffler": "Задний глушитель",
  "Aluminum wheels": "Алюминиевые диски",
  "Connector": "Разъём",
  "Resistor": "Резистор",
  "Hose Clamp": "Хомут",
  "Tapping Screw": "Саморез",
  "Screw": "Винт",
  "Washer": "Шайба",
  "Stud": "Шпилька",
  "Relay": "Реле",
  "Fuse": "Предохранитель",
  "Antenna": "Антенна",
  "Horn": "Звуковой сигнал",
  "Flywheel": "Маховик",
  "Muffler": "Глушитель",
  "Spoiler": "Спойлер",
};

// ── Phrase dictionary (longer → shorter, matched greedily) ───────────────────
const PHRASES: [RegExp, string][] = [
  // Mirrors
  [/\bSide mirror \(rearview mirror\)/gi, "Боковое зеркало"],
  [/\bOutside Rearview Mirror/gi, "Наружное зеркало заднего вида"],
  [/\bRearview Mirror/gi, "Зеркало заднего вида"],
  [/\brearview mirror/gi, "зеркало заднего вида"],
  [/\bSide [Mm]irror [Cc]over/gi, "Накладка бокового зеркала"],
  [/\bSide [Mm]irror/gi, "Боковое зеркало"],

  // Body moldings
  [/\bSide sill molding \(side skirt\)/gi, "Молдинг порога"],
  [/\bSide sill molding/gi, "Молдинг порога"],
  [/\bside skirt/gi, "накладка порога"],
  [/\bInterior sun visor/gi, "Солнцезащитный козырёк"],
  [/\bSun [Vv]isor/gi, "Солнцезащитный козырёк"],

  // Door handles
  [/\bDoor exterior handle \(front door exterior handle\/door catch\)/gi, "Наружная ручка двери"],
  [/\bfront door exterior handle/gi, "наружная ручка передней двери"],
  [/\bdoor catch/gi, "ручка двери"],
  [/\bDoor exterior handle/gi, "Наружная ручка двери"],
  [/\bexterior handle/gi, "наружная ручка"],
  [/\bFront Door Exterior Handle/gi, "Наружная ручка передней двери"],
  [/\bDoor handle—rear door/gi, "Ручка задней двери"],
  [/\bDoor handle,?\s*outside/gi, "Наружная ручка двери"],
  [/\bDoor [Hh]andle/gi, "Ручка двери"],
  [/\bdoor latch/gi, "замок двери"],

  // Door/panel trim
  [/\bFront Door Trim/gi, "Обшивка передней двери"],
  [/\bRear Door Trim/gi, "Обшивка задней двери"],
  [/\bDoor Trim/gi, "Обшивка двери"],
  [/\bCrash Pad/gi, "Панель приборов"],
  [/\bMolding Sub-?Back Panel/gi, "Молдинг задней панели"],
  [/\bBack Panel/gi, "Задняя панель"],
  [/\bPanel Assembly/gi, "Панель в сборе"],

  // Steering
  [/\bSteering [Ww]heel remote control switch/gi, "Кнопка управления на руле"],
  [/\bhand switch on the steering wheel remote control/gi, "Кнопка управления на руле"],
  [/\bsteering wheel remote control/gi, "пульт управления на руле"],
  [/\bremote control switch/gi, "кнопка управления"],
  [/\bremote control/gi, "пульт управления"],
  [/\bBody-Steering Wheel/gi, "Рулевое колесо (корпус)"],
  [/\bModule - Steering Wheel Airbag/gi, "Модуль подушки безопасности руля"],
  [/\bSteering [Ww]heel/gi, "Рулевое колесо"],
  [/\bPower [Ss]teering/gi, "Гидроусилитель"],

  // Brakes
  [/\bOEM Brake Pad Kit \(Front Set\)/gi, "Тормозные колодки (передний комплект)"],
  [/\bOEM Brake Pad Kit \(Rear Set\)/gi, "Тормозные колодки (задний комплект)"],
  [/\bBrake Pad Kit/gi, "Комплект тормозных колодок"],
  [/\bFront Brake Caliper Kit/gi, "Передний тормозной суппорт"],
  [/\bRear Brake Caliper Kit/gi, "Задний тормозной суппорт"],
  [/\bBrake Caliper/gi, "Тормозной суппорт"],
  [/\bFront brake disc \(rotor drum\)/gi, "Передний тормозной диск"],
  [/\brotor drum/gi, "тормозной диск"],
  [/\bFront brake hose/gi, "Передний тормозной шланг"],
  [/\bBrake booster hose \(vacuum hose\)/gi, "Шланг вакуумного усилителя тормозов"],
  [/\bvacuum hose/gi, "вакуумный шланг"],
  [/\bBrake [Bb]ooster/gi, "Усилитель тормозов"],
  [/\bBrake [Hh]ose/gi, "Тормозной шланг"],
  [/\bBrake [Dd]isc/gi, "Тормозной диск"],
  [/\bBrake [Pp]ad/gi, "Тормозная колодка"],
  [/\bBrake [Dd]rum/gi, "Тормозной барабан"],
  [/\bBrake [Ll]ine/gi, "Тормозная трубка"],
  [/\bBrake [Ff]luid/gi, "Тормозная жидкость"],
  [/\bBrake [Mm]aster [Cc]ylinder/gi, "Главный тормозной цилиндр"],

  // Suspension / chassis
  [/\bOEM shock absorber spring for the rear wheel/gi, "Пружина заднего амортизатора"],
  [/\bFront Shock Absorber Spring/gi, "Пружина переднего амортизатора"],
  [/\bShock [Aa]bsorber/gi, "Амортизатор"],
  [/\bRear Spring/gi, "Задняя пружина"],
  [/\bStrut \(Shock Absorber\)/gi, "Стойка (амортизатор)"],
  [/\bStrut [Mm]ount/gi, "Опора стойки"],
  [/\bConstant-velocity joint \(drive shaft\)/gi, "ШРУС (приводной вал)"],
  [/\bconstant-velocity joint/gi, "ШРУС"],
  [/\bdrive shaft/gi, "приводной вал"],
  [/\bEngine Mount \(Engine Mounting Bracket\)/gi, "Подушка двигателя"],
  [/\bEngine Mounting Bracket/gi, "Кронштейн подушки двигателя"],
  [/\bEngine Mount/gi, "Подушка двигателя"],
  [/\bMission Mimi \(Transmission Mounting Bracket\)/gi, "Подушка КПП"],
  [/\bTransmission Mounting Bracket/gi, "Кронштейн подушки КПП"],
  [/\bTransmission Mimi/gi, "Подушка КПП"],
  [/\bCenter Mimi/gi, "Центральная подушка"],
  [/\bEngine Mimi/gi, "Подушка двигателя"],
  [/\bEngine Mimi \+ Transmission Mimi \+ Center Mimi 3-Piece Set/gi, "Комплект подушек 3 шт"],
  [/\b3-Piece Set/gi, "комплект 3 шт"],
  [/\btie rod end/gi, "наконечник рулевой тяги"],
  [/\btie rod/gi, "рулевая тяга"],
  [/\bLower Arm Assy/gi, "Нижний рычаг в сборе"],
  [/\bLower Arm/gi, "Нижний рычаг"],
  [/\bUpper Arm/gi, "Верхний рычаг"],
  [/\bControl Arm/gi, "Рычаг подвески"],
  [/\bBall Joint/gi, "Шаровая опора"],
  [/\bStabilizer [Ll]ink/gi, "Стойка стабилизатора"],
  [/\bStabilizer [Bb]ar/gi, "Стабилизатор"],
  [/\bHub Bearing/gi, "Ступичный подшипник"],
  [/\bWheel Bearing/gi, "Ступичный подшипник"],
  [/\bCV Joint/gi, "ШРУС"],
  [/\bBoot Kit/gi, "Пыльник (комплект)"],
  [/\bFront Axle/gi, "Передняя ось"],
  [/\bRear Axle/gi, "Задняя ось"],
  [/\bRoll Rod Bracket/gi, "Кронштейн реактивной тяги"],
  [/\bSway Bar/gi, "Стабилизатор"],

  // Engine
  [/\bEngine Oil Level Gauge/gi, "Щуп уровня масла"],
  [/\bEngine Oil Pan/gi, "Поддон двигателя"],
  [/\bEngine Oil Cap/gi, "Крышка маслозаливной горловины"],
  [/\bEngine Oil Filter/gi, "Масляный фильтр двигателя"],
  [/\bOil Filter/gi, "Масляный фильтр"],
  [/\bAir Filter/gi, "Воздушный фильтр"],
  [/\bFuel Filter/gi, "Топливный фильтр"],
  [/\bCabin Filter/gi, "Салонный фильтр"],
  [/\bSpark Plug/gi, "Свеча зажигания"],
  [/\bGlow Plug/gi, "Свеча накала"],
  [/\bIgnition Coil/gi, "Катушка зажигания"],
  [/\bTiming Belt/gi, "Ремень ГРМ"],
  [/\bTiming Chain/gi, "Цепь ГРМ"],
  [/\bDrive Belt Set/gi, "Комплект приводных ремней"],
  [/\bDrive Belt/gi, "Приводной ремень"],
  [/\bV-Ribbed Belt/gi, "Поликлиновой ремень"],
  [/\bFan Belt/gi, "Ремень вентилятора"],
  [/\bBelt Tensioner/gi, "Натяжитель ремня"],
  [/\bAutomatic Belt Tensioner/gi, "Автоматический натяжитель ремня"],
  [/\bWater Pump/gi, "Водяной насос"],
  [/\bFuel Pump/gi, "Топливной насос"],
  [/\bOil Pump/gi, "Масляный насос"],
  [/\bHigh Pressure Fuel Pump/gi, "ТНВД"],
  [/\bPower Steering Pump/gi, "Насос ГУР"],
  [/\bRocker Cover/gi, "Клапанная крышка"],
  [/\bCylinder Head/gi, "Головка блока цилиндров"],
  [/\bIntake Manifold/gi, "Впускной коллектор"],
  [/\bExhaust [Mm]anifold/gi, "Выпускной коллектор"],
  [/\bThrottle Body Assy/gi, "Дроссельная заслонка в сборе"],
  [/\bThrottle Body/gi, "Дроссельная заслонка"],
  [/\bCrankshaft Position Sensor/gi, "Датчик положения коленвала"],
  [/\bCamshaft Position Sensor/gi, "Датчик положения распредвала"],
  [/\bKnock Sensor/gi, "Датчик детонации"],
  [/\bMAP Sensor/gi, "Датчик давления"],
  [/\bMass Air Flow/gi, "Расходомер воздуха"],
  [/\bEGR Valve/gi, "Клапан EGR"],
  [/\bPCV Valve/gi, "Клапан PCV"],
  [/\bFlow Control Valve/gi, "Клапан регулировки потока"],
  [/\bSolenoid Valve/gi, "Электромагнитный клапан"],
  [/\bFuel Injector/gi, "Топливная форсунка"],
  [/\bFuel Filler Cap/gi, "Крышка бензобака"],
  [/\bFuel Tank/gi, "Топливный бак"],
  [/\bFuel Sender/gi, "Датчик уровня топлива"],
  [/\bFuel Pump & Sender Module/gi, "Топливный модуль с насосом"],
  [/\bFuel Tank Pressure Sensor/gi, "Датчик давления топливного бака"],
  [/\bAir Intake Hose/gi, "Патрубок воздухозаборника"],
  [/\bAir Intake/gi, "Воздухозаборник"],
  [/\bAir Cleaner/gi, "Воздушный фильтр (корпус)"],
  [/\bBlow-by Hose/gi, "Шланг вентиляции картера"],
  [/\bBlower Motor/gi, "Мотор отопителя"],
  [/\bCoolant Hose/gi, "Патрубок охлаждения"],
  [/\bCoolant Pipe/gi, "Труба охлаждения"],
  [/\bCoolant Tank/gi, "Расширительный бачок"],
  [/\bOil Cooler/gi, "Масляный радиатор"],
  [/\bOil Pan/gi, "Поддон картера"],
  [/\bSnap Ring/gi, "Стопорное кольцо"],
  [/\bPiston[,]? Pin/gi, "Поршень, палец"],

  // Catalytic / exhaust
  [/\bCatalytic [Cc]onverter/gi, "Каталитический нейтрализатор"],
  [/\bRear [Mm]uffler/gi, "Задний глушитель"],
  [/\bFront [Mm]uffler/gi, "Передний глушитель"],
  [/\bExhaust [Pp]ipe/gi, "Выхлопная труба"],

  // Transmission / clutch
  [/\bClutch [Dd]isc/gi, "Диск сцепления"],
  [/\bClutch [Kk]it/gi, "Комплект сцепления"],
  [/\bClutch [Mm]aster/gi, "Главный цилиндр сцепления"],
  [/\bGear Shift Knob/gi, "Ручка КПП"],
  [/\bAutomatic Gear Shift Knob/gi, "Ручка АКПП"],
  [/\bShift Cable/gi, "Трос переключения передач"],
  [/\bTransfer Case/gi, "Раздаточная коробка"],

  // Cooling / HVAC
  [/\bHose-Radiator,?\s*Upper/gi, "Верхний патрубок радиатора"],
  [/\bHose-Radiator,?\s*Lower/gi, "Нижний патрубок радиатора"],
  [/\bHose-Air Intake/gi, "Патрубок воздухозаборника"],
  [/\bRadiator [Ff]an/gi, "Вентилятор радиатора"],
  [/\bRadiator [Hh]ose/gi, "Патрубок радиатора"],
  [/\bHeater [Hh]ose/gi, "Шланг отопителя"],
  [/\bHeater [Cc]ore/gi, "Радиатор отопителя"],
  [/\bA\/C Compressor/gi, "Компрессор кондиционера"],
  [/\bAC Compressor/gi, "Компрессор кондиционера"],
  [/\bExpansion Valve/gi, "Расширительный клапан"],
  [/\bReceiver Drier/gi, "Ресивер-осушитель"],
  [/\bCabin Air/gi, "Салонный воздушный"],

  // Body
  [/\bFront Bumper/gi, "Передний бампер"],
  [/\bRear Bumper/gi, "Задний бампер"],
  [/\bFender [Ll]iner/gi, "Подкрылок"],
  [/\bFender side/gi, "боковина крыла"],
  [/\bCutter Side/gi, "боковой молдинг"],
  [/\bFender/gi, "Крыло"],
  [/\bTailgate/gi, "Дверь багажника"],
  [/\bTrunk [Ll]id/gi, "Крышка багажника"],
  [/\bHood/gi, "Капот"],
  [/\bWeatherstrip/gi, "Уплотнитель"],
  [/\bWindow [Rr]egulator/gi, "Стеклоподъёмник"],
  [/\bDoor [Ll]ock/gi, "Замок двери"],
  [/\bDoor [Hh]inge/gi, "Петля двери"],
  [/\bDoor [Cc]heck/gi, "Ограничитель двери"],
  [/\bWiper [Bb]lade/gi, "Щётка стеклоочистителя"],
  [/\bWiper [Aa]rm/gi, "Поводок стеклоочистителя"],
  [/\bWiper [Mm]otor/gi, "Мотор стеклоочистителя"],
  [/\bRoof [Rr]ack/gi, "Багажник на крышу"],
  [/\bLuggage [Rr]ack/gi, "Багажник"],
  [/\bRoof [Rr]ail/gi, "Рейлинг"],

  // Interior
  [/\bCenter console box lid \(armrest\)/gi, "Крышка подлокотника"],
  [/\bConsole [Bb]ox/gi, "Бокс консоли"],
  [/\bTop of the console/gi, "Верхняя крышка консоли"],
  [/\bRear Console/gi, "Задняя консоль"],
  [/\bFloor Mats/gi, "Коврики"],
  [/\bFloor Mat/gi, "Коврик"],
  [/\bMat-Front Floor/gi, "Коврик передний"],
  [/\bMatt-Leer Floor/gi, "Коврик"],
  [/\bMatt-Front Floor/gi, "Коврик передний"],
  [/\bCover-Fuse Box/gi, "Крышка блока предохранителей"],
  [/\bFuse Box/gi, "Блок предохранителей"],
  [/\bTrim Package Tray/gi, "Полка багажника"],
  [/\bPackage Tray/gi, "Полка багажника"],
  [/\bRear [Pp]illar/gi, "Задняя стойка"],
  [/\bFront [Pp]illar/gi, "Передняя стойка"],
  [/\bCenter [Pp]illar/gi, "Средняя стойка"],
  [/\bSeat [Bb]elt/gi, "Ремень безопасности"],
  [/\bSeat [Cc]over/gi, "Чехол сиденья"],
  [/\bSeat [Cc]ushion/gi, "Подушка сиденья"],
  [/\bAll Seats/gi, "Все сиденья"],
  [/\b(armrest)/gi, "(подлокотник)"],

  // Electrical / lights
  [/\bUltrasonic Sensor - Parking Assist System/gi, "Парктроник (датчик)"],
  [/\bParking Assist System/gi, "Парктроник"],
  [/\bParking Sensor/gi, "Датчик парковки"],
  [/\bTurn [Ss]ignal [Bb]ulb/gi, "Лампа поворотника"],
  [/\bTurn [Ss]ignal/gi, "Указатель поворота"],
  [/\bHalogen [Hh]eadlight [Bb]ulb/gi, "Галогенная лампа фары"],
  [/\bHalogen [Hh]eadlight/gi, "Галогенная фара"],
  [/\bHalogen [Bb]ulb/gi, "Галогенная лампа"],
  [/\bHeadlight [Bb]ulb/gi, "Лампа фары"],
  [/\bHeadlight [Aa]ssembly/gi, "Фара в сборе"],
  [/\bHeadlight/gi, "Фара"],
  [/\bTail [Ll]ight/gi, "Задний фонарь"],
  [/\bFog [Ll]ight/gi, "Противотуманная фара"],
  [/\bLight [Bb]ulb/gi, "Лампочка"],
  [/\bDRL/gi, "ДХО"],
  [/\bLED Bulb/gi, "Светодиодная лампа"],
  [/\bWindow [Ss]witch/gi, "Кнопка стеклоподъёмника"],

  // Wheel
  [/\bWheel [Cc]over/gi, "Колпак колеса"],
  [/\bWheel [Nn]ut/gi, "Гайка колеса"],
  [/\bLug [Nn]ut/gi, "Гайка колеса"],
  [/\bWheel [Cc]ap/gi, "Колпачок колеса"],

  // Misc
  [/\bGenuine OEM/gi, "Оригинал"],
  [/\bGenuine/gi, "Оригинальный"],
  [/\bOEM/gi, ""],
  [/\bComplete/gi, "Полный"],
  [/\bNew Model/gi, "Новая модель"],
  [/\bNew Generation/gi, "Новое поколение"],
  [/\bFull Set/gi, "Полный комплект"],
  [/\bSet of/gi, "Комплект из"],
  [/\bAssy/gi, "в сборе"],
  [/\bASSY/gi, "в сборе"],

  // Rubber / seals
  [/\bRubber [Ss]eal/gi, "Резиновый сальник"],
  [/\bRubber [Bb]ush/gi, "Резиновая втулка"],
  [/\bRubber [Mm]ount/gi, "Резиновая опора"],
  [/\bDust [Cc]over/gi, "Пыльник"],
  [/\bDust [Bb]oot/gi, "Пыльник"],
  [/\bBoot/gi, "Пыльник"],

  // Plate / support / guide
  [/\bMounting [Bb]racket/gi, "Монтажный кронштейн"],
  [/\bMounting [Pp]late/gi, "Монтажная пластина"],
  [/\bMounting [Ii]nsulator/gi, "Монтажный изолятор"],
  [/\bMounting/gi, "Крепление"],
  [/\bReinforcement/gi, "Усилитель"],
  [/\bSupport/gi, "Опора"],
  [/\bGuide/gi, "Направляющая"],
  [/\bSpacer/gi, "Проставка"],
  [/\bRetainer/gi, "Фиксатор"],
];

// ── Word-level dictionary ────────────────────────────────────────────────────
const WORDS: Record<string, string> = {
  // Parts — core
  "Panel": "Панель", "Cover": "Крышка", "Hose": "Шланг",
  "Bracket": "Кронштейн", "Garnish": "Молдинг", "Trim": "Обшивка",
  "Gasket": "Прокладка", "Switch": "Выключатель", "Sensor": "Датчик",
  "Tube": "Трубка", "Pipe": "Труба", "Pad": "Накладка",
  "Molding": "Молдинг", "Bush": "Сайлентблок", "Cap": "Крышка",
  "Piston": "Поршень", "Generator": "Генератор", "Strut": "Стойка",
  "Spring": "Пружина", "Cable": "Трос", "Shaft": "Вал",
  "Holder": "Держатель", "Insulator": "Изолятор", "Actuator": "Привод",
  "Pin": "Палец", "Reservoir": "Бачок", "Valve": "Клапан",
  "Housing": "Корпус", "Pump": "Насос", "Duct": "Воздуховод",
  "Grille": "Решётка", "Bearing": "Подшипник", "Filter": "Фильтр",
  "Relay": "Реле", "Nozzle": "Форсунка", "Tray": "Лоток",
  "Spoiler": "Спойлер", "Bumper": "Бампер", "Mirror": "Зеркало",
  "Caliper": "Суппорт", "Rotor": "Ротор", "Drum": "Барабан",
  "Belt": "Ремень", "Pulley": "Шкив", "Damper": "Демпфер",
  "Bushing": "Втулка", "Seal": "Сальник", "Ring": "Кольцо",
  "Plug": "Заглушка", "Lamp": "Лампа", "Bulb": "Лампочка",
  "Motor": "Мотор", "Module": "Модуль", "Unit": "Блок",
  "Assembly": "В сборе", "Set": "Комплект", "Kit": "Комплект",
  "Plate": "Пластина", "Link": "Тяга", "Rod": "Тяга",
  "Lever": "Рычаг", "Arm": "Рычаг", "Bar": "Штанга",
  "Tank": "Бак", "Solenoid": "Соленоид", "Harness": "Жгут",
  "Wiring": "Проводка", "Connector": "Разъём",
  "Compressor": "Компрессор", "Radiator": "Радиатор",
  "Muffler": "Глушитель", "Manifold": "Коллектор",
  "Regulator": "Регулятор", "Handle": "Ручка",
  "Guard": "Защита", "Shield": "Щиток", "Baffle": "Отражатель",
  "Protector": "Защита", "Deflector": "Дефлектор",
  "Clamp": "Хомут", "Clip": "Клипса", "Bolt": "Болт",
  "Nut": "Гайка", "Washer": "Шайба", "Stud": "Шпилька",
  "Screw": "Винт", "Plug": "Заглушка", "Stopper": "Ограничитель",
  "Battery": "Аккумулятор", "Antenna": "Антенна",
  "Horn": "Сигнал", "Speaker": "Динамик", "Amplifier": "Усилитель",
  "Heater": "Отопитель", "Blower": "Вентилятор",
  "Fan": "Вентилятор", "Cooler": "Охладитель",
  "Latch": "Замок", "Lock": "Замок", "Key": "Ключ",
  "Hinge": "Петля", "Striker": "Защёлка",
  "Emblem": "Эмблема", "Badge": "Шильдик", "Decal": "Наклейка",
  "Seat": "Сиденье", "Console": "Консоль",
  "Headrest": "Подголовник", "Armrest": "Подлокотник",
  "Frame": "Рама", "Body": "Кузов", "Pillar": "Стойка",
  "Roof": "Крыша", "Floor": "Пол", "Trunk": "Багажник",
  "Door": "Дверь", "Window": "Стекло",
  "Engine": "Двигатель", "Transmission": "КПП",
  "Clutch": "Сцепление", "Brake": "Тормоз",
  "Exhaust": "Выхлоп", "Intake": "Впуск",
  "Coolant": "Охлаждающая жидкость", "Oil": "Масло",
  "Fuel": "Топливо", "Air": "Воздушный",
  "Rubber": "Резиновый", "Plastic": "Пластиковый",
  "Chrome": "Хромированный", "Steel": "Стальной",
  "Main": "Основной", "Sub": "Доп.",
  "Assy": "в сборе",
  // Position / side
  "Left": "левый", "Right": "правый",
  "Front": "передний", "Rear": "задний",
  "Upper": "верхний", "Lower": "нижний",
  "Inner": "внутренний", "Outer": "наружный",
  "Center": "центральный",
  "left": "левый", "right": "правый",
  "Exterior": "Наружный", "Interior": "Внутренний",
  // Side descriptors
  "passenger side": "сторона пассажира",
  "Passenger Side": "сторона пассажира",
  "driver's side": "сторона водителя",
  "Driver's Side": "сторона водителя",
  "left side": "левая сторона",
  "right side": "правая сторона",
  "Left Side": "Левая сторона",
  "Right Side": "Правая сторона",
};

// Words to strip (not significant for translation)
const STOP_WORDS = new Set([
  "the", "a", "an", "of", "for", "and", "or", "on", "in", "to",
  "with", "from", "at", "by", "is", "it", "its", "this", "that",
  "side", "type", "style", "part", "pc", "pcs", "pc.", "ea",
]);

function translateName(en: string): string | null {
  if (!en) return null;
  const trimmed = en.trim();

  // 1. Exact match
  const exactKey = Object.keys(EXACT).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactKey) return EXACT[exactKey];

  // 2. Phrase replacements
  let result = trimmed;
  let matched = false;
  for (const [re, ru] of PHRASES) {
    if (re.test(result)) {
      result = result.replace(re, ru);
      matched = true;
    }
  }

  // 3. Multi-word patterns from WORDS (longer first)
  const multiWordKeys = Object.keys(WORDS)
    .filter((k) => k.includes(" "))
    .sort((a, b) => b.length - a.length);
  for (const key of multiWordKeys) {
    const wordRe = new RegExp(`\\b${key.replace(/'/g, "'")}\\b`, "g");
    if (wordRe.test(result)) {
      result = result.replace(wordRe, WORDS[key]);
      matched = true;
    }
  }

  // 4. Single-word replacements
  const singleWordKeys = Object.keys(WORDS).filter((k) => !k.includes(" "));
  for (const key of singleWordKeys) {
    const wordRe = new RegExp(`\\b${key}\\b`, "g");
    if (wordRe.test(result)) {
      result = result.replace(wordRe, WORDS[key]);
      matched = true;
    }
  }

  // 5. Clean up
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/^[\s,\-–]+/, "").replace(/[\s,\-–]+$/, "");

  // 6. Check remaining English (ignore stop words, abbreviations, numbers, model names)
  let check = result;
  // Remove known acceptable patterns
  check = check.replace(/\b(OEM|ABS|EPS|TPMS|LED|CVVT|GDI|MPI|CRDi|VGT|LPG|EGR|PCV|DRL|DOHC|SOHC|TDI|AWD|4WD)\b/gi, "");
  check = check.replace(/\b\d+(\.\d+)?\s*(kg|mm|cm|pc|pcs|ea)?\b/gi, "");
  check = check.replace(/\([A-Z0-9]+\)/g, "");
  // Remove car model names
  check = check.replace(/\b(Hyundai|Kia|Genesis|Sonata|Tucson|Elantra|Avante|Accent|Santa Fe|Sorento|Sportage|Creta|Venue|Palisade|Telluride|Ioniq|Stinger|K[3-9]|Rexton|SsangYong|Tivoli|Korando|Mohave|Grandeur|Azera)\b/gi, "");
  // Remove stop words
  for (const sw of STOP_WORDS) {
    check = check.replace(new RegExp(`\\b${sw}\\b`, "gi"), "");
  }
  // Remove parenthesized model info like "(2014.3)"
  check = check.replace(/\(\d{4}\.\d+\)/g, "");
  check = check.replace(/\b\d{4}\.\d+\b/g, "");

  const hasEnglish = /[a-zA-Z]{3,}/.test(check.trim());

  if (!matched || hasEnglish) return null;
  return result;
}

async function main() {
  const { count } = await supabase
    .from("parts_products")
    .select("*", { count: "exact", head: true })
    .not("name_en", "is", null)
    .not("name_en", "eq", "")
    .or("name_ru.is.null,name_ru.eq.");

  if (!count) {
    console.log("All rows already have name_ru.");
    return;
  }

  console.log(`${count} rows without name_ru.`);
  if (DRY_RUN) console.log("DRY RUN — no writes.\n");

  let translated = 0;
  let skipped = 0;
  let offset = 0;
  const PAGE = 1000;
  const missed: string[] = [];

  while (true) {
    const { data: rows, error } = await supabase
      .from("parts_products")
      .select("id, name_en")
      .not("name_en", "is", null)
      .not("name_en", "eq", "")
      .or("name_ru.is.null,name_ru.eq.")
      .order("id")
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }
    if (!rows?.length) break;

    const updates: { id: number; name_ru: string }[] = [];

    for (const row of rows) {
      const ru = translateName(row.name_en);
      if (ru) {
        updates.push({ id: row.id, name_ru: ru });
      } else {
        skipped++;
        if (missed.length < 100) missed.push(row.name_en);
      }
    }

    if (!DRY_RUN && updates.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(
          batch.map((u) =>
            supabase
              .from("parts_products")
              .update({ name_ru: u.name_ru })
              .eq("id", u.id)
          )
        );
      }
    }

    translated += updates.length;

    if (DRY_RUN) {
      offset += PAGE;
    }

    process.stdout.write(
      `\r  translated: ${translated}, skipped: ${skipped}, total: ${translated + skipped}/${count}`
    );

    if (rows.length < PAGE) break;
  }

  console.log(`\n\nDone. Translated: ${translated}, skipped: ${skipped}`);
  if (missed.length > 0) {
    const unique = [...new Set(missed)].slice(0, 40);
    console.log(`\nSample unmatched (${unique.length}):`);
    for (const m of unique) console.log(`  - ${m}`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
