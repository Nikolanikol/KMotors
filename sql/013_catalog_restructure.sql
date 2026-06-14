-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 013: Реструктуризация каталога
--
-- Проблемы:
--   1. Крепёж (болты, гайки, шайбы) рассыпан по всем категориям
--      с весом 1.5–4 кг вместо реальных 0.02–0.10 кг → ошибка доставки ×30–50
--   2. "Прочее" категории (17999, 17899, 18099) = 8503 товара без L3
--   3. Товары подвески/рулевого в "Прочее шасси" вместо правильных L3
--
-- План:
--   ФАЗА 0: Новые L3 категории
--   ФАЗА 1: Крепёж → cross-cutting L3 (все категории)
--   ФАЗА 2: 17999 Прочее шасси → существующие L3 подвески/рулевого
--   ФАЗА 3: 17999 Прочее шасси → новые L3
--   ФАЗА 4: 17899 Прочее КПП → новые L3
--   ФАЗА 5: 18099 Прочее кузов → новые L3
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── Родительская категория для крепежа ────────────────────────────────
INSERT INTO parts_categories (id, name_ru, name_en, slug, sort_order)
VALUES (19001, 'Крепёж и расходные', 'Fasteners & Hardware', 'fasteners-hardware', 99)
ON CONFLICT (id) DO NOTHING;

-- ── A. Cross-cutting L3: Крепёж ──────────────────────────────────────
INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900901, 19001, 'Болты, гайки, шпильки, шайбы',
   'Bolts, Nuts, Studs, Washers', 'fastener-hardware', 1,
   0.020, 0.050, 0.120, 4, 3, 2, 'EMS',
   'Мелкий крепёж. Реальный вес 20–120г. Ценовой диапазон ₩270–₩25000'),

  (900902, 19001, 'Клипсы, пины, фиксаторы',
   'Clips, Pins, Retainers', 'clips-pins-retainers', 2,
   0.010, 0.030, 0.060, 3, 2, 1, 'EMS',
   'Пластиковые/металлические фиксаторы'),

  (900903, 19001, 'Прокладки и уплотнения',
   'Gaskets & Seals', 'gaskets-seals', 3,
   0.020, 0.080, 0.250, 15, 12, 1, 'EMS',
   'Gasket, seal, o-ring, packing'),

  (900904, 19001, 'Заглушки и пробки',
   'Plugs & Caps', 'plugs-caps', 4,
   0.010, 0.050, 0.120, 4, 4, 3, 'EMS',
   'Drain plug, oil cap, заглушки. НЕ свечи зажигания')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg,
  weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ── B. Новые L3 для 17999 Прочее шасси ──────────────────────────────
INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (901001, 17999, 'Колёсные диски',
   'Alloy Wheels', 'alloy-wheels', 1,
   8.000, 11.000, 15.000, 60, 60, 22, 'EMS_PREMIUM',
   'Литые диски. Тяжёлые, объёмные'),

  (901002, 17999, 'Электрика шасси',
   'Chassis Electrical', 'chassis-electrical', 2,
   0.100, 0.250, 0.500, 10, 8, 5, 'EMS',
   'Датчики, переключатели, модули шасси'),

  (901003, 17999, 'Шланги и трубки шасси',
   'Chassis Hoses & Tubes', 'chassis-hoses', 3,
   0.150, 0.500, 1.500, 40, 8, 6, 'EMS',
   'Тормозные, гидравлические, вакуумные шланги'),

  (901004, 17999, 'Кронштейны и крепления',
   'Brackets & Mounts', 'chassis-brackets', 4,
   0.300, 1.000, 2.500, 20, 12, 8, 'EMS',
   'Металлические кронштейны, опоры'),

  (901005, 17999, 'Втулки и сайлентблоки',
   'Bushings & Silent Blocks', 'bushings-silentblocks', 5,
   0.050, 0.200, 0.500, 8, 6, 5, 'EMS',
   'Резинометаллические втулки подвески'),

  (901006, 17999, 'Крышки и кожухи шасси',
   'Chassis Covers & Guards', 'chassis-covers', 6,
   0.100, 0.350, 0.800, 18, 14, 6, 'EMS',
   'Защитные крышки, пыльники, кожухи'),

  (901007, 17999, 'Пружины шасси',
   'Chassis Springs', 'chassis-springs', 7,
   0.050, 0.150, 0.400, 8, 4, 3, 'EMS',
   'Возвратные пружины, пружины механизмов (НЕ подвески)')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg,
  weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ── C. Новые L3 для 17899 Прочее КПП ────────────────────────────────
INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (901101, 17899, 'ШРУС в сборе',
   'CV Joint Assembly', 'cv-joint', 1,
   3.000, 5.000, 7.000, 30, 15, 15, 'EMS',
   'Шарнир равных угловых скоростей'),

  (901102, 17899, 'Валы и полуоси',
   'Shafts & Axles', 'shafts-axles', 2,
   2.000, 6.000, 15.000, 80, 12, 12, 'EMS_PREMIUM',
   'Длинные детали. Приводные валы, полуоси'),

  (901103, 17899, 'Шестерни КПП',
   'Transmission Gears', 'trans-gears', 3,
   0.500, 2.000, 5.000, 18, 18, 8, 'EMS',
   'Шестерни, синхронизаторы'),

  (901104, 17899, 'Механизм переключения',
   'Shift Mechanism', 'shift-mechanism', 4,
   0.300, 1.000, 2.500, 25, 10, 10, 'EMS',
   'Рычаги, тяги, тросы переключения, рукоятка'),

  (901105, 17899, 'Пыльники ШРУС и КПП',
   'CV & Transmission Boots', 'cv-trans-boots', 5,
   0.100, 0.250, 0.500, 15, 12, 10, 'EMS',
   'Резиновые пыльники, комплекты'),

  (901106, 17899, 'Дифференциал',
   'Differential Parts', 'differential', 6,
   1.000, 3.500, 8.000, 25, 25, 15, 'EMS',
   'Шестерни, сателлиты, корпус дифференциала'),

  (901107, 17899, 'Подшипники КПП',
   'Transmission Bearings', 'trans-bearings', 7,
   0.300, 1.200, 3.000, 12, 12, 5, 'EMS',
   'Подшипники валов, выжимной подшипник'),

  (901108, 17899, 'Кольца и уплотнения КПП',
   'Transmission Rings & Seals', 'trans-rings', 8,
   0.030, 0.100, 0.300, 10, 10, 2, 'EMS',
   'Стопорные кольца, синхронизаторные кольца, сальники КПП'),

  (901109, 17899, 'Масло и фильтры КПП',
   'Transmission Oil & Filters', 'trans-oil', 9,
   0.300, 1.000, 2.500, 15, 10, 10, 'EMS',
   'Масло ATF, фильтры КПП, пробки слива')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg,
  weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ── D. Новые L3 для 18099 Прочее кузов ──────────────────────────────
INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (901201, 18099, 'Наклейки и маркировки',
   'Labels & Stickers', 'labels-stickers', 1,
   0.010, 0.020, 0.050, 12, 8, 0, 'EMS',
   'Эмиссионные наклейки, маркировки, шильдики'),

  (901202, 18099, 'Подрамник и усилители',
   'Subframe & Reinforcement', 'subframe-reinforcement', 2,
   10.000, 16.000, 25.000, 120, 60, 15, 'EMS_PREMIUM',
   'Тяжёлые силовые элементы кузова'),

  (901203, 18099, 'Шумоизоляция',
   'Sound Insulation', 'sound-insulation', 3,
   0.200, 0.500, 1.000, 40, 30, 2, 'EMS',
   'Шумо/виброизоляция, подкрылки'),

  (901204, 18099, 'Опоры и кронштейны кузова',
   'Body Brackets & Supports', 'body-brackets', 4,
   0.300, 1.000, 2.500, 20, 12, 8, 'EMS',
   'Кронштейны бампера, опоры радиатора')
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en,
  weight_min_kg = EXCLUDED.weight_min_kg, weight_avg_kg = EXCLUDED.weight_avg_kg,
  weight_max_kg = EXCLUDED.weight_max_kg,
  length_cm = EXCLUDED.length_cm, width_cm = EXCLUDED.width_cm, height_cm = EXCLUDED.height_cm,
  ship_method = EXCLUDED.ship_method, logistics_notes = EXCLUDED.logistics_notes;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: КРЕПЁЖ — cross-cutting по ВСЕМ категориям                   ║
-- ║                                                                     ║
-- ║ Порядок: болты → клипсы → прокладки → заглушки                      ║
-- ║ Каждый UPDATE не трогает уже перемещённые товары                     ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 1a. Болты, гайки, шпильки, шайбы, винты, заклёпки → 900901 ──────
UPDATE parts_products SET subcategory_id = 900901
WHERE name_en ~* '\m(bolt|screw|rivet|dowel)\M'
  AND name_en !~* '\mu[- ]?(shaped )?bolt'
  AND price_krw BETWEEN 1 AND 25000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900901
WHERE name_en ~* '\mnut\M'
  AND name_en !~* '\m(donut|doughnut|coconut|chestnut|peanut)\M'
  AND price_krw BETWEEN 1 AND 25000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900901
WHERE name_en ~* '\m(washer|stud)\M'
  AND name_en !~* '\m(stud bolt)\M'
  AND price_krw BETWEEN 1 AND 25000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

-- ── 1b. Клипсы, пины, фиксаторы → 900902 ────────────────────────────
UPDATE parts_products SET subcategory_id = 900902
WHERE name_en ~* '\m(clip|retainer|snap ring)\M'
  AND price_krw BETWEEN 1 AND 15000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900902
WHERE name_en ~* '\mpin\M'
  AND name_en !~* '\m(pinion|piston pin|king ?pin|cotter)\M'
  AND price_krw BETWEEN 1 AND 15000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

-- ── 1c. Прокладки и уплотнения → 900903 ─────────────────────────────
UPDATE parts_products SET subcategory_id = 900903
WHERE name_en ~* '\m(gasket|packing)\M'
  AND price_krw BETWEEN 1 AND 50000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900903
WHERE name_en ~* '\m(o-ring|o ring|oil seal|seal ring|valve seal|valve stem seal)\M'
  AND price_krw BETWEEN 1 AND 40000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900903
WHERE name_en ~* '\mseal\M'
  AND name_en !~* '\m(sealed|sealer|seal beam)\M'
  AND name_en !~* '\m(weather ?seal)\M'
  AND price_krw BETWEEN 1 AND 40000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

UPDATE parts_products SET subcategory_id = 900903
WHERE name_en ~* '\mgrommet\M'
  AND price_krw BETWEEN 1 AND 15000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);

-- ── 1d. Заглушки и пробки → 900904 ──────────────────────────────────
UPDATE parts_products SET subcategory_id = 900904
WHERE name_en ~* '\mplug\M'
  AND name_en !~* '\m(spark plug|glow plug|plug wire|plug cable|plug set|plug cap)\M'
  AND price_krw BETWEEN 1 AND 15000
  AND (subcategory_id IS NULL OR subcategory_id NOT BETWEEN 900901 AND 900904);


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: 17999 ПРОЧЕЕ ШАССИ → существующие L3 подвески/рулевого     ║
-- ║                                                                     ║
-- ║ Товары, которые по ошибке попали в "Прочее шасси",                  ║
-- ║ но реально относятся к подвеске (17902) или рулевому (17903)        ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Амортизаторы/стойки → 900301
UPDATE parts_products SET subcategory_id = 900301
WHERE subcategory_id = 17999
  AND (name_en ~* '\m(shock|absorber)\M' OR name_en ~* '\mstrut\M')
  AND name_en !~* '\m(strut mount|strut support|strut bearing|strut bar|tower bar)\M'
  AND name_en !~* '\m(bolt|screw|nut|washer|bracket|mount|cover|boot|bushing|bump stop|spring seat)\M';

-- Рычаги подвески → 900303
UPDATE parts_products SET subcategory_id = 900303
WHERE subcategory_id = 17999
  AND name_en ~* '\m(control arm|lower arm|upper arm|trailing arm|lateral arm)\M'
  AND name_en !~* '\m(bolt|screw|nut|bushing|bracket|mount)\M';

-- Стойки стабилизатора → 900305
UPDATE parts_products SET subcategory_id = 900305
WHERE subcategory_id = 17999
  AND name_en ~* '\m(stabilizer|sway bar)\M'
  AND name_en ~* '\m(link|bar|rod)\M'
  AND name_en !~* '\m(bolt|screw|nut|bushing|bracket|mount|clamp)\M';

-- Рулевые тяги → 900603
UPDATE parts_products SET subcategory_id = 900603
WHERE subcategory_id = 17999
  AND name_en ~* '\mtie rod\M'
  AND name_en !~* '\mtie rod end\M';

-- Наконечники рулевых тяг → 900602
UPDATE parts_products SET subcategory_id = 900602
WHERE subcategory_id = 17999
  AND name_en ~* '\mtie rod end\M';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: 17999 ПРОЧЕЕ ШАССИ → новые L3                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Колёсные диски → 901001
UPDATE parts_products SET subcategory_id = 901001
WHERE subcategory_id = 17999
  AND (name_en ~* '\m(aluminum|alloy)\M' AND name_en ~* '\mwheel\M')
  OR (subcategory_id = 17999 AND name_en ~* '\mwheel\M'
      AND name_en ~* '\m(15|16|17|18|19|20|inch|rim)\M');

-- Электрика шасси (датчики, переключатели) → 901002
UPDATE parts_products SET subcategory_id = 901002
WHERE subcategory_id = 17999
  AND name_en ~* '\m(switch|sensor|relay|solenoid|actuator|motor)\M'
  AND name_en !~* '\m(wiper motor|window motor|seat motor|mirror motor)\M';

-- Шланги и трубки → 901003
UPDATE parts_products SET subcategory_id = 901003
WHERE subcategory_id = 17999
  AND name_en ~* '\m(hose|tube|pipe|line)\M'
  AND name_en !~* '\m(brake line|fuel line|fuel hose)\M';

-- Кронштейны и крепления → 901004
UPDATE parts_products SET subcategory_id = 901004
WHERE subcategory_id = 17999
  AND name_en ~* '\m(bracket|mounting|brace)\M'
  AND name_en !~* '\m(bolt|screw|nut)\M';

-- Втулки и сайлентблоки → 901005
UPDATE parts_products SET subcategory_id = 901005
WHERE subcategory_id = 17999
  AND name_en ~* '\m(bush|bushing|silent ?block|rubber mount)\M';

-- Крышки и кожухи → 901006
UPDATE parts_products SET subcategory_id = 901006
WHERE subcategory_id = 17999
  AND name_en ~* '\m(cover|guard|shield|protector|cap)\M'
  AND name_en !~* '\m(valve cover|timing cover|engine cover)\M';

-- Пружины механизмов (не подвески) → 901007
UPDATE parts_products SET subcategory_id = 901007
WHERE subcategory_id = 17999
  AND name_en ~* '\m(spring|coil)\M'
  AND name_en !~* '\m(coil spring|suspension spring|shock spring)\M';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: 17899 ПРОЧЕЕ КПП → новые L3                                ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Пыльники (СНАЧАЛА — убираем мелочь) → 901105
UPDATE parts_products SET subcategory_id = 901105
WHERE subcategory_id = 17899
  AND name_en ~* '\m(boot|dust cover)\M';

-- ШРУС в сборе → 901101
UPDATE parts_products SET subcategory_id = 901101
WHERE subcategory_id = 17899
  AND (name_en ~* '\m(constant velocity|cv joint|cv assy)\M'
       OR (name_en ~* '\mjoint\M' AND name_en ~* '\m(drive|shaft|axle|outer|inner)\M'));

-- Валы и полуоси → 901102
UPDATE parts_products SET subcategory_id = 901102
WHERE subcategory_id = 17899
  AND name_en ~* '\m(shaft|axle|propeller|drive shaft|half shaft)\M'
  AND name_en !~* '\m(shift shaft|selector shaft|fork shaft)\M';

-- Шестерни → 901103
UPDATE parts_products SET subcategory_id = 901103
WHERE subcategory_id = 17899
  AND name_en ~* '\m(gear|synchronizer|synchro)\M'
  AND name_en !~* '\m(gear shift|gear lever|gear knob|gear box)\M';

-- Механизм переключения → 901104
UPDATE parts_products SET subcategory_id = 901104
WHERE subcategory_id = 17899
  AND name_en ~* '\m(shift|lever|knob|cable|linkage|selector)\M'
  AND name_en !~* '\m(shaft|gear|bearing)\M';

-- Дифференциал → 901106
UPDATE parts_products SET subcategory_id = 901106
WHERE subcategory_id = 17899
  AND name_en ~* '\m(differential|diff|side gear|pinion gear|spider gear|satellite)\M';

-- Подшипники → 901107
UPDATE parts_products SET subcategory_id = 901107
WHERE subcategory_id = 17899
  AND name_en ~* '\m(bearing|roller)\M'
  AND name_en !~* '\m(sealed bearing)\M';

-- Кольца и уплотнения КПП → 901108
UPDATE parts_products SET subcategory_id = 901108
WHERE subcategory_id = 17899
  AND name_en ~* '\m(ring|snap ring|circlip|retaining ring)\M';

-- Масло и фильтры КПП → 901109
UPDATE parts_products SET subcategory_id = 901109
WHERE subcategory_id = 17899
  AND name_en ~* '\m(oil|fluid|filter|strainer|atf|cvtf)\M'
  AND name_en !~* '\m(oil seal)\M';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 5: 18099 ПРОЧЕЕ КУЗОВ → новые L3                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Наклейки и маркировки → 901201
UPDATE parts_products SET subcategory_id = 901201
WHERE subcategory_id = 18099
  AND name_en ~* '\m(label|sticker|emblem|badge|emission|caution|decal|nameplate)\M';

-- Подрамник и усилители → 901202
UPDATE parts_products SET subcategory_id = 901202
WHERE subcategory_id = 18099
  AND name_en ~* '\m(crossmember|cross member|subframe|sub frame|reinforcement|member complete)\M';

-- Шумоизоляция → 901203
UPDATE parts_products SET subcategory_id = 901203
WHERE subcategory_id = 18099
  AND name_en ~* '\m(insulator|insulation|deadener|sound proof|undercover|fender liner)\M';

-- Опоры и кронштейны кузова → 901204
UPDATE parts_products SET subcategory_id = 901204
WHERE subcategory_id = 18099
  AND name_en ~* '\m(bracket|support|mounting|brace)\M'
  AND name_en !~* '\m(bolt|screw|nut)\M';

-- Крылья → в существующий 900701
UPDATE parts_products SET subcategory_id = 900701
WHERE subcategory_id = 18099
  AND name_en ~* '\mfender\M'
  AND name_en !~* '\m(fender liner|fender shield|fender bracket)\M';
