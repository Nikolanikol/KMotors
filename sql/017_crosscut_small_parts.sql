-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 017: Кросс-категорийные L3 для мелких деталей
--
-- Проблема: sensor/actuator/switch/relay попадают в тяжёлые L2
-- (Стартер 5кг, Выхлоп 6кг, АКПП 70кг) и получают завышенный вес.
-- Результат: "Только морем" для детали размером с ладонь.
--
-- Решение: кросс-категорийные L3 по ТИПУ детали (как для крепежа).
-- Применяется поверх текущей классификации.
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ (под 19001 Крепёж и расходные)           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900905, 19001, 'Датчики и актуаторы',
   'Sensors & Actuators', 'sensors-actuators', 5,
   0.050, 0.200, 0.500, 8, 5, 4, 'EMS',
   'Датчики давления/температуры/скорости, соленоиды, актуаторы'),

  (900906, 19001, 'Электронные модули и реле',
   'Modules & Relays', 'modules-relays', 6,
   0.100, 0.400, 1.000, 14, 10, 5, 'EMS',
   'ECU, блоки управления, реле, контроллеры'),

  (900907, 19001, 'Переключатели',
   'Switches', 'switches', 7,
   0.030, 0.120, 0.300, 8, 5, 4, 'EMS',
   'Выключатели, переключатели, кнопки всех систем'),

  (900908, 19001, 'Провода и жгуты',
   'Wiring & Harnesses', 'wiring-harnesses', 8,
   0.100, 0.500, 1.500, 30, 15, 8, 'EMS',
   'Жгуты проводов, кабели, разъёмы'),

  (900909, 19001, 'Кронштейны мелкие',
   'Small Brackets & Mounts', 'small-brackets', 9,
   0.100, 0.400, 1.000, 15, 10, 5, 'EMS',
   'Мелкие кронштейны, крепления, опоры (< ₩30k)'),

  (900910, 19001, 'Крышки и кожухи мелкие',
   'Small Covers & Caps', 'small-covers', 10,
   0.050, 0.250, 0.600, 16, 12, 4, 'EMS',
   'Защитные крышки, колпачки, кожухи (< ₩25k)'),

  (900911, 19001, 'Шланги и патрубки мелкие',
   'Small Hoses & Tubes', 'small-hoses', 11,
   0.080, 0.300, 0.800, 30, 6, 4, 'EMS',
   'Мелкие шланги, патрубки, трубки (< ₩30k)'),

  (900912, 19001, 'Электромоторы мелкие',
   'Small Electric Motors', 'small-motors', 12,
   0.200, 0.600, 1.200, 12, 8, 8, 'EMS',
   'Моторчики стеклоподъёмников, зеркал, заслонок')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg,
  weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: РЕКЛАСИФИКАЦИЯ                                             ║
-- ║                                                                     ║
-- ║ Перемещаем ТОЛЬКО из категорий с weight_avg > 1 кг                  ║
-- ║ НЕ трогаем товары уже в кросс-категорийных L3 (900901–900999)       ║
-- ║ Порядок: от самого конкретного к общему                             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 1. Датчики и актуаторы → 900905 ─────────────────────────────────
-- Сенсоры: всегда мелкие (0.05–0.5 кг)
UPDATE parts_products p SET subcategory_id = 900905
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) LIKE '%sensor%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999
  AND p.price_krw < 200000;

-- Актуаторы и соленоиды
UPDATE parts_products p SET subcategory_id = 900905
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(actuator|solenoid)%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999
  AND p.price_krw < 200000;

-- ── 2. Переключатели → 900907 ───────────────────────────────────────
UPDATE parts_products p SET subcategory_id = 900907
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) LIKE '%switch%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999
  AND p.price_krw < 100000;

-- ── 3. Электронные модули и реле → 900906 ───────────────────────────
UPDATE parts_products p SET subcategory_id = 900906
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(relay|fuse box)%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999
  AND p.price_krw < 100000;

-- Модули / ECU — дороже, но лёгкие
UPDATE parts_products p SET subcategory_id = 900906
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(module|ecu|control unit)%'
  AND LOWER(p.name_en) NOT SIMILAR TO '%(airbag|air bag)%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1.5
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;

-- ── 4. Провода и жгуты → 900908 ─────────────────────────────────────
UPDATE parts_products p SET subcategory_id = 900908
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(wire|wiring|harness|cable|connector)%'
  AND LOWER(p.name_en) NOT SIMILAR TO '%(speedometer cable|clutch cable|throttle cable)%'
  AND COALESCE(cat.weight_avg_kg, 2) > 1.5
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;

-- ── 5. Кронштейны мелкие → 900909 ───────────────────────────────────
-- Только дешёвые (< ₩30k) из тяжёлых категорий (> 2кг)
UPDATE parts_products p SET subcategory_id = 900909
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(bracket|mounting brace)%'
  AND p.price_krw < 30000
  AND COALESCE(cat.weight_avg_kg, 2) > 2
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;

-- ── 6. Крышки и кожухи мелкие → 900910 ──────────────────────────────
UPDATE parts_products p SET subcategory_id = 900910
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(cover|cap|shield|guard)%'
  AND LOWER(p.name_en) NOT SIMILAR TO '%(valve cover|timing cover|engine cover|seat cover)%'
  AND p.price_krw < 25000
  AND COALESCE(cat.weight_avg_kg, 2) > 2
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;

-- ── 7. Шланги мелкие → 900911 ───────────────────────────────────────
UPDATE parts_products p SET subcategory_id = 900911
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) SIMILAR TO '%(hose|tube|pipe|line)%'
  AND LOWER(p.name_en) NOT SIMILAR TO '%(exhaust pipe|tail pipe|down pipe|propeller)%'
  AND p.price_krw < 30000
  AND COALESCE(cat.weight_avg_kg, 2) > 2
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;

-- ── 8. Электромоторы мелкие → 900912 ────────────────────────────────
-- Моторчики стеклоподъёмников, зеркал и т.д.
UPDATE parts_products p SET subcategory_id = 900912
FROM parts_categories cat
WHERE cat.id = p.subcategory_id
  AND LOWER(p.name_en) LIKE '%motor%'
  AND LOWER(p.name_en) NOT SIMILAR TO '%(starter motor|engine motor)%'
  AND p.price_krw < 80000
  AND COALESCE(cat.weight_avg_kg, 2) > 1.5
  AND p.subcategory_id NOT BETWEEN 900901 AND 900999;
