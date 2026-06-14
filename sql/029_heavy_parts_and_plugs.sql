-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 029: Тяжёлые агрегаты, маховики, свечи, ABS-гидроблок
--
-- ПРОБЛЕМА 1 — Прочее двигатель (17799, avg=1.5кг):
--   Short engine/блок двигателя (80-200кг) → 1.5кг  ← критическое занижение
--   Traction motor / Battery System (20-400кг) → 1.5кг ← катастрофа
--   Flywheel/маховик (5-15кг) → 1.5кг
--
-- ПРОБЛЕМА 2 — Система зажигания (17705, avg=0.7кг):
--   Spark plug / Glow plug (0.05-0.15кг) → 0.7кг ← 5-14x завышение
--
-- ПРОБЛЕМА 3 — Датчик АБС (900208, max=0.35кг):
--   ABS Module Hydraulic Unit (2-5кг) → 0.35кг ← занижение в 6-14x
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Крупные силовые агрегаты: двигатель, электромотор, батарея HV, инвертор
  -- Только SEA — > 20кг не влезет в EMS ни при каких условиях
  (900933, 19001,
   'Тяжёлые агрегаты двигателя',
   'Heavy Powertrain Assemblies',
   'heavy-powertrain', 33,
   20.0, 60.0, 200.0,
   80, 50, 50, 'SEA',
   'Короткий двигатель, блок цилиндров, тяговый мотор, HV батарея, инвертор. Только морем.'),

  -- Маховик / двухмассовый маховик
  -- Диск 35-40см, 5-15кг. Умещается в EMS (< 30кг, размер ок)
  (900934, 19001,
   'Маховик',
   'Flywheel & Dual-Mass Flywheel',
   'flywheel', 34,
   4.0, 9.0, 15.0,
   45, 45, 12, 'EMS',
   'Маховик (обычный и двухмассовый). Реальный вес 5-15кг, размер 35-45см'),

  -- Свечи зажигания и накаливания (одиночные и наборы)
  -- 1 свеча = 0.05кг, набор из 4 = 0.20кг
  (900935, 19001,
   'Свечи зажигания и накаливания',
   'Spark Plugs & Glow Plugs',
   'spark-glow-plugs', 35,
   0.04, 0.10, 0.30,
   12, 8, 4, 'EMS',
   'Свечи зажигания (бензин/LPG) и накаливания (дизель), наборы свечей до 8 шт'),

  -- Гидравлический блок ABS (насос + модулятор + ЭБУ в сборе)
  -- Попадали в "Датчик АБС" (900208) с max 0.35кг — ошибка классификации
  (900936, 19001,
   'Гидравлический блок ABS',
   'ABS Hydraulic Unit',
   'abs-hydraulic-unit', 36,
   1.5, 3.0, 5.0,
   22, 18, 14, 'EMS',
   'Гидравлический блок ABS (насос+модулятор+ЭБУ в сборе). Реальный вес 2-5кг.')
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
-- ║ ФАЗА 1: ТЯЖЁЛЫЕ АГРЕГАТЫ 17799 → 900933                           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900933
WHERE subcategory_id = 17799
  AND (
    -- Короткий/длинный двигатель, блок цилиндров
    LOWER(name_en) SIMILAR TO
      '%(short engine|short block|long engine|long block|engine.short|' ||
      'engine short|block.cylinder|cylinder block|engine assembly|' ||
      'engine.block|engine complete|complete engine)%'
    -- Тяговый электромотор и трансмиссионный агрегат EV
    OR LOWER(name_en) SIMILAR TO
      '%(traction motor|motor.gear drive|motor gear drive|drive unit|' ||
      'e.axle|electric motor drive|electric drive unit)%'
    -- Тяговая батарея HV/EV
    OR LOWER(name_en) SIMILAR TO
      '%(battery system|battery pack|hv battery|high.voltage battery|' ||
      'traction battery|battery module|battery assembly)%'
    -- Силовая электроника EV
    OR LOWER(name_en) SIMILAR TO
      '%(multi.inverter|power inverter|inverter assembly|' ||
      'motor inverter|drive inverter)%'
    -- Ценовой порог — > ₩2M в Прочее двигатель почти всегда тяжёлый агрегат
    -- Исключаем маховики и насосы высокого давления (обрабатываются отдельно)
    OR (price_krw > 2000000
        AND LOWER(name_en) NOT SIMILAR TO '%(flywheel|pump|sensor|valve|injector)%')
  );


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: МАХОВИКИ 17799 → 900934                                    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900934
WHERE subcategory_id = 17799
  AND LOWER(name_en) LIKE '%flywheel%'
  AND LOWER(name_en) NOT LIKE '%bolt%'
  AND LOWER(name_en) NOT LIKE '%sensor%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: СВЕЧИ 17705 → 900935                                       ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900935
WHERE subcategory_id = 17705
  AND (
    LOWER(name_en) SIMILAR TO
      '%(spark plug|glow plug|glowplug|spark.plug|glow.plug|' ||
      'set of.+plug|plug set|plug.spark)%'
    -- Мелкие компоненты свечей (провода катушек и т.п.) по цене
    OR price_krw < 10000
  )
  AND LOWER(name_en) NOT SIMILAR TO
    '%(wire set|wiring|harness|coil|distributor|ignition coil|relay|switch|capacitor)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: ABS ГИДРОБЛОК 900208 → 900936                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900936
WHERE subcategory_id = 900208
  AND LOWER(name_en) SIMILAR TO
    '%(abs module|hydraulic unit|abs hydraulic|abs unit|abs assembly|' ||
    'abs actuator|modulator abs|abs modulator|brake modulator|' ||
    'abs pump|anti.lock.+module|antilock.+unit)%';
