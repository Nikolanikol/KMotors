-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ 010: Полная переклассификация L3 подкатегорий
--
-- Проблема: предыдущие UPDATE паттерны были слишком грубыми —
-- петли капота попали в "Дверь", пыльники — в "Рулевую рейку",
-- 3600+ товаров (тормоза/подвеска) вообще не мигрированы.
--
-- План:
--   1. RESET: вернуть все L3 на L2
--   2. INSERT: новые L3 категории (барабаны, усилители, аксессуары...)
--   3. UPDATE: переклассификация от конкретного к общему
--   4. VERIFY: проверочные запросы
-- ═══════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: СБРОС всех L3 назначений обратно на L2                 ║
-- ╚═══════════════════════════════════════════════════════════════════╝

UPDATE parts_products SET subcategory_id = 17701 WHERE subcategory_id BETWEEN 900101 AND 900199;
UPDATE parts_products SET subcategory_id = 17901 WHERE subcategory_id BETWEEN 900201 AND 900299;
UPDATE parts_products SET subcategory_id = 17902 WHERE subcategory_id BETWEEN 900301 AND 900399;
UPDATE parts_products SET subcategory_id = 17703 WHERE subcategory_id BETWEEN 900401 AND 900499;
UPDATE parts_products SET subcategory_id = 18005 WHERE subcategory_id BETWEEN 900501 AND 900599;
UPDATE parts_products SET subcategory_id = 17903 WHERE subcategory_id BETWEEN 900601 AND 900699;
UPDATE parts_products SET subcategory_id = 18001 WHERE subcategory_id BETWEEN 900701 AND 900799;
UPDATE parts_products SET subcategory_id = 18003 WHERE subcategory_id BETWEEN 900801 AND 900899;

-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: Новые L3 категории                                     ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- Тормозная система — новые L3
INSERT INTO parts_categories (id, parent_id, name_ru, name_en, slug, sort_order,
  weight_min_kg, weight_avg_kg, weight_max_kg, length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900209, 17901, 'Тормозной барабан',          'Brake Drum',        'brake-drum',       9,  3.500, 5.500, 8.000, 32, 32, 14, 'EMS', ''),
  (900210, 17901, 'Колодки барабанные (к-т)',    'Brake Shoes Set',   'brake-shoes',     10,  0.600, 1.000, 1.500, 24, 14,  6, 'EMS', ''),
  (900211, 17901, 'Вакуумный усилитель',         'Brake Booster',     'brake-booster',   11,  2.000, 3.500, 5.000, 30, 30, 18, 'EMS', ''),
  (900212, 17901, 'Аксессуары тормозной системы','Brake Accessories', 'brake-accessories',12,  0.030, 0.200, 0.500, 12,  8,  4, 'EMS', 'Пружины, пыльники, болты, ремкомплекты')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, slug = EXCLUDED.slug,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg, weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;

-- Рулевое управление — новые L3
INSERT INTO parts_categories (id, parent_id, name_ru, name_en, slug, sort_order,
  weight_min_kg, weight_avg_kg, weight_max_kg, length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900607, 17903, 'Подушка безопасности руля',   'Steering Wheel Airbag', 'steering-airbag',   7, 1.500, 2.500, 3.500, 36, 26, 14, 'EMS', ''),
  (900608, 17903, 'Кнопки/переключатели руля',   'Steering Wheel Switch', 'steering-switch',   8, 0.050, 0.150, 0.300,  8,  6,  4, 'EMS', ''),
  (900609, 17903, 'Рулевой вал / кардан',        'Steering Shaft',        'steering-shaft',    9, 1.000, 2.000, 3.500, 50, 10, 10, 'EMS', '')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, slug = EXCLUDED.slug,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg, weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: КЛАССИФИКАЦИЯ — от конкретного к общему                ║
-- ║ Порядок КРИТИЧЕСКИ важен: каждый UPDATE работает только с       ║
-- ║ товарами, которые ещё НЕ были перемещены (остались на L2)       ║
-- ╚═══════════════════════════════════════════════════════════════════╝


-- ─────────────────────────────────────────────────────────────────────
-- 17901 ТОРМОЗНАЯ СИСТЕМА (2295 товаров)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Аксессуары (пружины, болты, ремкомплекты) — СНАЧАЛА, чтобы убрать мелочь
UPDATE parts_products SET subcategory_id = 900212
WHERE subcategory_id = 17901
  AND (
    name_en ILIKE '%spring%'
    OR name_en ILIKE '%bolt%'
    OR name_en ILIKE '%clip%'
    OR name_en ILIKE '%shim%'
    OR name_en ILIKE '%washer%'
    OR name_en ILIKE '%o-ring%'
    OR name_en ILIKE '%rubber pad%'
    OR name_en ILIKE '%pedal pad%'
    OR (name_en ILIKE '%dust%' AND name_en ILIKE '%cover%')
    OR (name_en ILIKE '%dust%' AND name_en ILIKE '%boot%')
  );

-- 2) Колодки передние
UPDATE parts_products SET subcategory_id = 900201
WHERE subcategory_id = 17901
  AND name_en ILIKE '%pad%'
  AND name_en ILIKE '%front%';

-- 3) Колодки задние
UPDATE parts_products SET subcategory_id = 900202
WHERE subcategory_id = 17901
  AND name_en ILIKE '%pad%'
  AND name_en ILIKE '%rear%';

-- 4) Диск/ротор передний (исключаем пыльники, пистоны, ремкомплекты)
UPDATE parts_products SET subcategory_id = 900203
WHERE subcategory_id = 17901
  AND (name_en ILIKE '%disc%' OR name_en ILIKE '%rotor%')
  AND name_en ILIKE '%front%'
  AND name_en NOT ILIKE '%cover%'
  AND name_en NOT ILIKE '%piston%'
  AND name_en NOT ILIKE '%seal%'
  AND name_en NOT ILIKE '%kit%'
  AND name_en NOT ILIKE '%bolt%';

-- 5) Диск/ротор задний
UPDATE parts_products SET subcategory_id = 900204
WHERE subcategory_id = 17901
  AND (name_en ILIKE '%disc%' OR name_en ILIKE '%rotor%')
  AND name_en ILIKE '%rear%'
  AND name_en NOT ILIKE '%cover%'
  AND name_en NOT ILIKE '%piston%'
  AND name_en NOT ILIKE '%seal%'
  AND name_en NOT ILIKE '%kit%'
  AND name_en NOT ILIKE '%bolt%';

-- 6) Суппорт (только сам суппорт, не ремкомплект)
UPDATE parts_products SET subcategory_id = 900205
WHERE subcategory_id = 17901
  AND name_en ILIKE '%caliper%'
  AND name_en NOT ILIKE '%kit%'
  AND name_en NOT ILIKE '%pin%'
  AND name_en NOT ILIKE '%guide%'
  AND name_en NOT ILIKE '%slider%'
  AND name_en NOT ILIKE '%bracket%'
  AND name_en NOT ILIKE '%bushing%'
  AND name_en NOT ILIKE '%spring%'
  AND name_en NOT ILIKE '%seal%';

-- 7) Тормозные шланги
UPDATE parts_products SET subcategory_id = 900206
WHERE subcategory_id = 17901
  AND (name_en ILIKE '%hose%' OR name_en ILIKE '%tube%' OR name_en ILIKE '%line%');

-- 8) Главный тормозной цилиндр
UPDATE parts_products SET subcategory_id = 900207
WHERE subcategory_id = 17901
  AND name_en ILIKE '%master cylinder%';

-- 9) ABS (датчик + блок)
UPDATE parts_products SET subcategory_id = 900208
WHERE subcategory_id = 17901
  AND (name_en ILIKE '%abs%' OR name_en ILIKE '%anti-lock%');

-- 10) Тормозной барабан
UPDATE parts_products SET subcategory_id = 900209
WHERE subcategory_id = 17901
  AND name_en ILIKE '%drum%'
  AND name_en NOT ILIKE '%shoe%';

-- 11) Колодки барабанные (shoes)
UPDATE parts_products SET subcategory_id = 900210
WHERE subcategory_id = 17901
  AND name_en ILIKE '%shoe%';

-- 12) Вакуумный усилитель
UPDATE parts_products SET subcategory_id = 900211
WHERE subcategory_id = 17901
  AND (name_en ILIKE '%booster%' OR name_en ILIKE '%vacuum%');

-- 13) Остаток тормозных → аксессуары (пыльники дисков, ремкомплекты суппортов, и т.д.)
UPDATE parts_products SET subcategory_id = 900212
WHERE subcategory_id = 17901
  AND (
    name_en ILIKE '%kit%'
    OR name_en ILIKE '%seal%'
    OR name_en ILIKE '%piston%'
    OR name_en ILIKE '%cover%'
    OR name_en ILIKE '%shield%'
    OR name_en ILIKE '%pin%'
    OR name_en ILIKE '%guide%'
    OR name_en ILIKE '%slider%'
    OR name_en ILIKE '%bushing%'
    OR name_en ILIKE '%bracket%'
    OR name_en ILIKE '%mounting%'
    OR name_en ILIKE '%chamber%'
    OR name_en ILIKE '%valve%'
    OR name_en ILIKE '%switch%'
    OR name_en ILIKE '%sensor%'
    OR name_en ILIKE '%indicator%'
    OR name_en ILIKE '%cylinder%'
    OR name_en ILIKE '%caliper%'
    OR name_en ILIKE '%disc%'
    OR name_en ILIKE '%rotor%'
    OR name_en ILIKE '%pad%'
    OR name_en ILIKE '%drum%'
  );


-- ─────────────────────────────────────────────────────────────────────
-- 17902 ПОДВЕСКА (1308 товаров)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Шаровая опора
UPDATE parts_products SET subcategory_id = 900304
WHERE subcategory_id = 17902
  AND name_en ILIKE '%ball joint%';

-- 2) Втулка стабилизатора
UPDATE parts_products SET subcategory_id = 900306
WHERE subcategory_id = 17902
  AND name_en ILIKE '%bushing%';

-- 3) Стойка стабилизатора (link)
UPDATE parts_products SET subcategory_id = 900305
WHERE subcategory_id = 17902
  AND name_en ILIKE '%stabilizer%'
  AND name_en ILIKE '%link%';

-- 4) Опора стойки (mount/support/bearing на стойке)
UPDATE parts_products SET subcategory_id = 900307
WHERE subcategory_id = 17902
  AND (name_en ILIKE '%strut mount%' OR name_en ILIKE '%strut support%' OR name_en ILIKE '%strut bearing%');

-- 5) Рычаг (control arm, lower arm, upper arm)
UPDATE parts_products SET subcategory_id = 900303
WHERE subcategory_id = 17902
  AND (name_en ILIKE '%control arm%' OR name_en ILIKE '%lower arm%' OR name_en ILIKE '%upper arm%' OR name_en ILIKE '%trailing arm%');

-- 6) Пружина (spring/coil, но НЕ shock absorber spring — это combo)
UPDATE parts_products SET subcategory_id = 900302
WHERE subcategory_id = 17902
  AND (name_en ILIKE '%spring%' OR name_en ILIKE '%coil%')
  AND name_en NOT ILIKE '%shock%'
  AND name_en NOT ILIKE '%absorber%';

-- 7) Амортизатор / стойка (shock, absorber, strut, включая combo с пружиной)
UPDATE parts_products SET subcategory_id = 900301
WHERE subcategory_id = 17902
  AND (name_en ILIKE '%shock%' OR name_en ILIKE '%absorber%' OR name_en ILIKE '%strut%');

-- 8) Стойка стабилизатора — оставшиеся link/stabilizer без уточнения
UPDATE parts_products SET subcategory_id = 900305
WHERE subcategory_id = 17902
  AND (name_en ILIKE '%stabilizer%' OR name_en ILIKE '%sway%' OR name_en ILIKE '%link%');


-- ─────────────────────────────────────────────────────────────────────
-- 17903 РУЛЕВОЕ УПРАВЛЕНИЕ (1365 товаров)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Подушка безопасности руля
UPDATE parts_products SET subcategory_id = 900607
WHERE subcategory_id = 17903
  AND name_en ILIKE '%airbag%';

-- 2) Кнопки/переключатели на руле
UPDATE parts_products SET subcategory_id = 900608
WHERE subcategory_id = 17903
  AND (name_en ILIKE '%switch%' OR name_en ILIKE '%remote control%');

-- 3) Рулевая рейка / gear
UPDATE parts_products SET subcategory_id = 900601
WHERE subcategory_id = 17903
  AND (name_en ILIKE '%steering rack%' OR name_en ILIKE '%steering gear%' OR name_en ILIKE '%gear box%');

-- 4) Наконечник рулевой тяги (tie rod end)
UPDATE parts_products SET subcategory_id = 900602
WHERE subcategory_id = 17903
  AND name_en ILIKE '%tie rod end%';

-- 5) Рулевая тяга (tie rod, НО НЕ tie rod end)
UPDATE parts_products SET subcategory_id = 900603
WHERE subcategory_id = 17903
  AND name_en ILIKE '%tie rod%';

-- 6) Насос ГУР (power steering pump)
UPDATE parts_products SET subcategory_id = 900604
WHERE subcategory_id = 17903
  AND name_en ILIKE '%power steering%'
  AND (name_en ILIKE '%pump%' OR name_en ILIKE '%motor%');

-- 7) Рулевая колонка
UPDATE parts_products SET subcategory_id = 900605
WHERE subcategory_id = 17903
  AND (name_en ILIKE '%steering column%' OR name_en ILIKE '%column%');

-- 8) Рулевой вал / кардан / шарнир
UPDATE parts_products SET subcategory_id = 900609
WHERE subcategory_id = 17903
  AND (name_en ILIKE '%shaft%' OR name_en ILIKE '%joint%' OR name_en ILIKE '%coupling%')
  AND name_en NOT ILIKE '%ball joint%';

-- 9) Рулевое колесо (steering wheel, wheel steering, body-steering)
UPDATE parts_products SET subcategory_id = 900606
WHERE subcategory_id = 17903
  AND (
    name_en ILIKE '%steering wheel%'
    OR name_en ILIKE '%wheel steering%'
    OR name_en ILIKE '%body-steering%'
    OR name_en ILIKE '%wheel-steering%'
  );

-- 10) Остаток рулевого (power steering hoses, covers, brackets и т.д.)
--     → насос ГУР / прочее рулевое — оставляем на L2 17903


-- ─────────────────────────────────────────────────────────────────────
-- 17703 СИСТЕМА ОХЛАЖДЕНИЯ (18 товаров — мало, но чиним)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Термостат
UPDATE parts_products SET subcategory_id = 900401
WHERE subcategory_id = 17703
  AND name_en ILIKE '%thermostat%';

-- 2) Радиатор
UPDATE parts_products SET subcategory_id = 900402
WHERE subcategory_id = 17703
  AND name_en ILIKE '%radiator%'
  AND name_en NOT ILIKE '%cap%'
  AND name_en NOT ILIKE '%hose%';

-- 3) Водяной насос
UPDATE parts_products SET subcategory_id = 900403
WHERE subcategory_id = 17703
  AND (name_en ILIKE '%water pump%' OR name_en ILIKE '%coolant pump%');

-- 4) Вентилятор
UPDATE parts_products SET subcategory_id = 900404
WHERE subcategory_id = 17703
  AND name_en ILIKE '%fan%';

-- 5) Расширительный бачок
UPDATE parts_products SET subcategory_id = 900405
WHERE subcategory_id = 17703
  AND (name_en ILIKE '%reservoir%' OR name_en ILIKE '%expansion%' OR name_en ILIKE '%overflow%');

-- 6) Патрубок охлаждения
UPDATE parts_products SET subcategory_id = 900406
WHERE subcategory_id = 17703
  AND (name_en ILIKE '%hose%' OR name_en ILIKE '%pipe%' OR name_en ILIKE '%tube%');

-- 7) Крышка радиатора
UPDATE parts_products SET subcategory_id = 900407
WHERE subcategory_id = 17703
  AND (name_en ILIKE '%cap%' OR name_en ILIKE '%lid%');


-- ─────────────────────────────────────────────────────────────────────
-- 18005 ОСВЕЩЕНИЕ (21 товар)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Фара передняя
UPDATE parts_products SET subcategory_id = 900501
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%headlight%' OR name_en ILIKE '%headlamp%' OR name_en ILIKE '%head lamp%');

-- 2) Фонарь задний
UPDATE parts_products SET subcategory_id = 900502
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%tail light%' OR name_en ILIKE '%tail lamp%' OR name_en ILIKE '%rear lamp%' OR name_en ILIKE '%rear light%');

-- 3) Противотуманная фара
UPDATE parts_products SET subcategory_id = 900503
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%fog%');

-- 4) Указатель поворота
UPDATE parts_products SET subcategory_id = 900506
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%turn%' OR name_en ILIKE '%signal%' OR name_en ILIKE '%indicator%');

-- 5) Подсветка номера
UPDATE parts_products SET subcategory_id = 900507
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%license%' OR name_en ILIKE '%number plate%');

-- 6) Лампа
UPDATE parts_products SET subcategory_id = 900504
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%bulb%' OR name_en ILIKE '%lamp%' OR name_en ILIKE '%led%');

-- 7) Блок управления светом — оставшееся
UPDATE parts_products SET subcategory_id = 900505
WHERE subcategory_id = 18005
  AND (name_en ILIKE '%control%' OR name_en ILIKE '%module%' OR name_en ILIKE '%ballast%');


-- ─────────────────────────────────────────────────────────────────────
-- 18001 КУЗОВНЫЕ ПАНЕЛИ (242 товара)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Крыло переднее
UPDATE parts_products SET subcategory_id = 900701
WHERE subcategory_id = 18001
  AND name_en ILIKE '%fender%';

-- 2) Дверь в сборе + дверные компоненты (петли, уплотнители, стёкла дверей)
UPDATE parts_products SET subcategory_id = 900702
WHERE subcategory_id = 18001
  AND name_en ILIKE '%door%'
  AND name_en NOT ILIKE '%hood%'
  AND name_en NOT ILIKE '%bonnet%'
  AND name_en NOT ILIKE '%fuel filler%';

-- 3) Капот / Bonnet (петли капота, тросы, замки)
UPDATE parts_products SET subcategory_id = 900703
WHERE subcategory_id = 18001
  AND (name_en ILIKE '%hood%' OR name_en ILIKE '%bonnet%')
  AND name_en NOT ILIKE '%door%';

-- 4) Крышка багажника / Tailgate
UPDATE parts_products SET subcategory_id = 900704
WHERE subcategory_id = 18001
  AND (name_en ILIKE '%trunk%' OR name_en ILIKE '%tailgate%' OR name_en ILIKE '%liftgate%');

-- 5) Порог
UPDATE parts_products SET subcategory_id = 900705
WHERE subcategory_id = 18001
  AND (name_en ILIKE '%rocker%' OR name_en ILIKE '%sill%');

-- 6) Лючок бензобака (fuel filler door)
UPDATE parts_products SET subcategory_id = 900704
WHERE subcategory_id = 18001
  AND name_en ILIKE '%fuel filler%';


-- ─────────────────────────────────────────────────────────────────────
-- 18003 ОСТЕКЛЕНИЕ (1 товар — просто проверяем)
-- ─────────────────────────────────────────────────────────────────────

UPDATE parts_products SET subcategory_id = 900801
WHERE subcategory_id = 18003
  AND (name_en ILIKE '%windshield%' OR name_en ILIKE '%front window%' OR name_en ILIKE '%front glass%');

UPDATE parts_products SET subcategory_id = 900802
WHERE subcategory_id = 18003
  AND (name_en ILIKE '%rear window%' OR name_en ILIKE '%rear glass%' OR name_en ILIKE '%back glass%');

UPDATE parts_products SET subcategory_id = 900803
WHERE subcategory_id = 18003
  AND (name_en ILIKE '%side window%' OR name_en ILIKE '%side glass%' OR name_en ILIKE '%door glass%');

UPDATE parts_products SET subcategory_id = 900804
WHERE subcategory_id = 18003
  AND (name_en ILIKE '%vent window%' OR name_en ILIKE '%quarter%');


-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: ПРОВЕРКА                                               ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- Счётчик по L3
-- SELECT
--   c.id, c.name_ru,
--   COUNT(p.id) AS product_count,
--   c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
-- FROM parts_categories c
-- LEFT JOIN parts_products p ON p.subcategory_id = c.id
-- WHERE c.id >= 900000
-- GROUP BY c.id, c.name_ru, c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
-- ORDER BY c.id;

-- Остаток на L2 (не классифицировано)
-- SELECT subcategory_id, COUNT(*) as cnt
-- FROM parts_products
-- WHERE subcategory_id IN (17901, 17902, 17903, 17703, 18005, 18001, 18003, 17701)
-- GROUP BY subcategory_id
-- ORDER BY cnt DESC;

-- Выборочная проверка: тормозные аксессуары (должны быть пружины, болты, ремкомплекты)
-- SELECT name_en, subcategory_id FROM parts_products
-- WHERE subcategory_id = 900212 LIMIT 20;

-- Выборочная проверка: суппорты (должны быть ТОЛЬКО суппорты в сборе)
-- SELECT name_en, subcategory_id FROM parts_products
-- WHERE subcategory_id = 900205 LIMIT 20;
