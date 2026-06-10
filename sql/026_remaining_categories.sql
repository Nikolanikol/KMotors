-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 026: L3 для остальных приоритетных категорий
--
-- Четыре категории со средним и высоким ratio:
--   1. Электрика двигателя (17715): 248 шт, avg=0.5кг, ratio=86x
--      → L3 разъёмы/датчики мелкие (0.08кг) — ratio высокий, но avg и так мал
--   2. Освещение    (18111): 194 шт, avg=1кг,   ratio=48x
--      → L3 лампы и мелкие компоненты (0.06кг)
--   3. Турбо/нагнетатель (17711): 249 шт, avg=6кг, ratio=39x (P90=₩1.2M!)
--      → L3 мелкие детали турбины (0.15кг)
--   4. Сцепление    (17804): 219 шт, avg=8кг,   ratio=29x
--      → L3 мелкие детали сцепления (0.10кг)
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Разъёмы, датчики, предохранители, мелкие сенсоры двигателя
  -- ratio=86x: дешёвые разъёмы ₩3k vs ECU/генератор ₩229k
  (900923, 19001,
   'Разъёмы и датчики двигателя',
   'Engine Electrical Connectors & Sensors',
   'engine-connectors-sensors', 23,
   0.01, 0.08, 0.30,
   10, 8, 4, 'EMS',
   'Разъёмы, датчики, предохранители, реле, сенсоры двигателя. Цена < ₩10k'),

  -- Лампы, светодиоды, патроны, мелкие компоненты освещения
  -- Лампочка = 0.02-0.05кг, патрон = 0.05кг
  (900924, 19001,
   'Лампы и компоненты освещения',
   'Lighting Bulbs & Small Components',
   'lighting-bulbs-small', 24,
   0.01, 0.06, 0.20,
   10, 6, 4, 'EMS',
   'Лампы накаливания, светодиодные модули, патроны, мелкие компоненты фар'),

  -- Прокладки, уплотнения, хомуты, датчики турбины
  -- Сама турбина P90=₩1.2M остаётся в L2 со своим весом
  (900925, 19001,
   'Мелкие детали турбонаддува',
   'Turbocharger Small Parts',
   'turbo-small-parts', 25,
   0.02, 0.15, 0.60,
   15, 10, 5, 'EMS',
   'Прокладки, уплотнения, хомуты, датчики давления турбонаддува'),

  -- Пружины, клипсы, болты, мелкая фурнитура сцепления
  -- Диск сцепления (8кг) остаётся в L2
  (900926, 19001,
   'Мелкие детали сцепления',
   'Clutch Small Hardware',
   'clutch-small-hardware', 26,
   0.01, 0.10, 0.50,
   14, 8, 5, 'EMS',
   'Пружины, клипсы, болты, пальцы, мелкая фурнитура сцепления. Цена < ₩15k')
ON CONFLICT (id) DO UPDATE SET
  name_ru         = EXCLUDED.name_ru,
  name_en         = EXCLUDED.name_en,
  weight_min_kg   = EXCLUDED.weight_min_kg,
  weight_avg_kg   = EXCLUDED.weight_avg_kg,
  weight_max_kg   = EXCLUDED.weight_max_kg,
  length_cm       = EXCLUDED.length_cm,
  width_cm        = EXCLUDED.width_cm,
  height_cm       = EXCLUDED.height_cm,
  ship_method     = EXCLUDED.ship_method,
  logistics_notes = EXCLUDED.logistics_notes;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: ЭЛЕКТРИКА 17715 → 900923 (разъёмы/датчики < ₩10k)         ║
-- ║ При ratio=86x дешёвые разъёмы (₩3k) получают 0.5кг вместо 0.01кг  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900923
WHERE subcategory_id = 17715
  AND price_krw > 0
  AND (
    price_krw < 10000
    OR LOWER(name_en) SIMILAR TO
      '%(connector|plug connector|wire connector|sensor connector|' ||
      'fuse|relay|terminal|wiring clip|cable clip|harness clip|' ||
      'engine sensor|knock sensor|coolant sensor|map sensor|' ||
      'crankshaft sensor|camshaft sensor|oil pressure sensor|' ||
      'throttle sensor|iat sensor|maf sensor|temp sensor)%'
  )
  -- Тяжёлые компоненты остаются в L2
  AND LOWER(name_en) NOT SIMILAR TO
    '%(alternator|generator|starter|starter motor|ecu|ecm|pcm|' ||
    'ignition coil pack|coil pack assembly|distributor)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: ОСВЕЩЕНИЕ 18111 → 900924 (лампы и мелкое)                 ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900924
WHERE subcategory_id = 18111
  AND price_krw > 0
  AND (
    -- Лампочки всегда лёгкие независимо от цены
    LOWER(name_en) SIMILAR TO
      '%(bulb|lamp|light bulb|led|halogen|xenon bulb|hid bulb|' ||
      'dome light|socket bulb|festoon|turn bulb|stop bulb|' ||
      'daytime running|drl bulb|fog lamp bulb|backup bulb)%'
    -- Ценовой порог для прочих мелких компонентов
    OR price_krw < 8000
  )
  -- Фары в сборе остаются в L2
  AND LOWER(name_en) NOT SIMILAR TO
    '%(headlamp assembly|headlight assembly|tail lamp assembly|' ||
    'fog lamp assembly|combination lamp|rear combination)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: ТУРБО 17711 → 900925 (мелкие детали)                      ║
-- ║ Сама турбина дорогая (P90=₩1.2M, >5кг) — остаётся в L2             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900925
WHERE subcategory_id = 17711
  AND price_krw > 0
  AND (
    -- Прокладки и уплотнения турбины
    LOWER(name_en) SIMILAR TO
      '%(turbo gasket|turbine gasket|turbo seal|turbo o.ring|' ||
      'turbo o ring|turbocharger gasket|turbo inlet gasket|' ||
      'turbo outlet gasket|compressor gasket|wastegate gasket)%'
    -- Мелкие хомуты и датчики
    OR LOWER(name_en) SIMILAR TO
      '%(turbo clamp|boost sensor|boost pressure|turbo sensor|' ||
      'intercooler hose clamp|charge pipe clamp|vgt solenoid|' ||
      'wastegate actuator spring|turbo oil feed|turbo oil line)%'
    -- Ценовой порог
    OR price_krw < 30000
  )
  -- Сами турбины остаются в L2
  AND LOWER(name_en) NOT SIMILAR TO
    '%(turbocharger assy|turbocharger assembly|turbo assembly|' ||
    'turbocharger unit|complete turbo|turbo complete)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: СЦЕПЛЕНИЕ 17804 → 900926 (мелкая фурнитура < ₩15k)        ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900926
WHERE subcategory_id = 17804
  AND price_krw BETWEEN 1 AND 14999;
