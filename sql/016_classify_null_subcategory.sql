-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 016: Классификация 31,879 товаров с NULL subcategory
--
-- Две L1: 181 Салон (19,577) и 177 Двигатель (12,302)
--
-- Стратегия:
--   1. Прямое назначение в существующие L3 (освещение, охлаждение)
--   2. Назначение в существующие L2
--   3. Новые L2 для крупных кластеров
--   4. Остаток → "Прочее"
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L2 КАТЕГОРИИ                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── Салон (181) — новые L2 ────────────────────────────────────────────
INSERT INTO parts_categories (id, parent_id, name_ru, name_en, slug, sort_order, weight_avg_kg)
VALUES
  (18106, 181, 'Двери и компоненты',      'Doors & Components',        'doors-components',    6,  2.500),
  (18107, 181, 'Замки и ручки',           'Locks & Handles',           'locks-handles',       7,  0.400),
  (18108, 181, 'Консоль и подлокотники',  'Console & Armrests',        'console-armrests',    8,  1.500),
  (18109, 181, 'Козырьки и потолок',      'Visors & Headliner',        'visors-headliner',    9,  0.800),
  (18110, 181, 'Зеркала',                 'Mirrors',                   'mirrors-interior',   10,  2.500),
  (18111, 181, 'Освещение',               'Lighting',                  'lighting-interior',  11,  1.000),
  (18112, 181, 'Бампер и аксессуары',     'Bumper & Accessories',      'bumper-accessories', 12,  1.500),
  (18113, 181, 'Стёкла',                  'Windows & Glass',           'windows-glass',      13,  5.000)
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, weight_avg_kg = EXCLUDED.weight_avg_kg;

-- ── Двигатель (177) — новые L2 ───────────────────────────────────────
INSERT INTO parts_categories (id, parent_id, name_ru, name_en, slug, sort_order, weight_avg_kg)
VALUES
  (17710, 177, 'Выхлопная система',       'Exhaust System',            'exhaust-system',     10, 6.000),
  (17711, 177, 'Турбонаддув',             'Turbocharger System',       'turbo-system',       11, 6.000),
  (17712, 177, 'Стартер и генератор',     'Starter & Alternator',      'starter-alternator', 12, 5.000),
  (17713, 177, 'Кондиционер',            'A/C System',                'ac-system',          13, 4.000),
  (17714, 177, 'Шланги и патрубки',       'Engine Hoses & Pipes',      'engine-hoses',       14, 0.500),
  (17715, 177, 'Электрика двигателя',     'Engine Electronics',        'engine-electronics', 15, 0.500)
ON CONFLICT (id) DO UPDATE SET
  name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, weight_avg_kg = EXCLUDED.weight_avg_kg;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: ПРЯМОЕ НАЗНАЧЕНИЕ В СУЩЕСТВУЮЩИЕ L3                        ║
-- ║ Даёт сразу per-product weight_kg через v_product_weight             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 181 Салон → L3 Освещение ─────────────────────────────────────────
UPDATE parts_products SET subcategory_id = 900501  -- Фара передняя
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(headlight|headlamp|head lamp)\M';

UPDATE parts_products SET subcategory_id = 900502  -- Фонарь задний
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(tail light|tail lamp|rear lamp|rear light|rear combination)\M';

UPDATE parts_products SET subcategory_id = 900503  -- Противотуманная
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(fog light|fog lamp)\M';

UPDATE parts_products SET subcategory_id = 900506  -- Указатель поворота
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(turn signal|side marker|indicator lamp)\M';

UPDATE parts_products SET subcategory_id = 900504  -- Лампа
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(bulb)\M';

-- ── 177 Двигатель → L3 Охлаждение ───────────────────────────────────
UPDATE parts_products SET subcategory_id = 900401  -- Термостат
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(thermostat)\M';

UPDATE parts_products SET subcategory_id = 900402  -- Радиатор
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(radiator)\M'
  AND name_en !~* '\m(hose|cap|shroud|fan|mount|bracket|support)\M';

UPDATE parts_products SET subcategory_id = 900403  -- Водяной насос
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(water pump)\M';

UPDATE parts_products SET subcategory_id = 900404  -- Вентилятор
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(cooling fan|radiator fan|fan motor|fan shroud|fan assembly)\M';

UPDATE parts_products SET subcategory_id = 900406  -- Патрубок
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(coolant hose|radiator hose|heater hose|bypass hose)\M';

UPDATE parts_products SET subcategory_id = 900407  -- Крышка радиатора
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(radiator cap|coolant cap|reservoir cap|expansion tank cap)\M';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: 177 ДВИГАТЕЛЬ → L2                                         ║
-- ║ Порядок: от конкретного к общему                                    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Стартер и генератор → 17712
UPDATE parts_products SET subcategory_id = 17712
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(starter|alternator|generator)\M'
  AND name_en !~* '\m(starter cable|starter wire)\M';

-- Турбонаддув → 17711
UPDATE parts_products SET subcategory_id = 17711
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(turbo|turbocharger|intercooler|wastegate|boost)\M';

-- Кондиционер → 17713
UPDATE parts_products SET subcategory_id = 17713
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(compressor|condenser|evaporator|a/c|receiver drier|expansion valve)\M'
  AND name_en !~* '\m(engine|oil|fuel)\M';

-- Выхлоп → 17710
UPDATE parts_products SET subcategory_id = 17710
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(exhaust|catalytic|catalyst|muffler|resonator|dpf|egr)\M';

-- Зажигание → 17705
UPDATE parts_products SET subcategory_id = 17705
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(spark plug|ignition coil|glow plug|ignition|distributor)\M';

-- Топливная → 17707
UPDATE parts_products SET subcategory_id = 17707
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(fuel|injector|throttle|carburetor)\M';

-- Ремни, ролики → 17704
UPDATE parts_products SET subcategory_id = 17704
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(belt|pulley|tensioner|idler|timing chain|timing kit)\M';

-- Датчики → 17706
UPDATE parts_products SET subcategory_id = 17706
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(sensor)\M';

-- Масло и фильтры → 17701
UPDATE parts_products SET subcategory_id = 17701
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(oil|filter|dipstick|oil pan|oil pump|oil cooler)\M'
  AND name_en !~* '\m(fuel filter|air filter|cabin filter|a/c)\M';

-- Впуск и воздух → 17708
UPDATE parts_products SET subcategory_id = 17708
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(intake|air cleaner|air filter|air duct|manifold|air box)\M';

-- Клапаны и уплотнения → 17709
UPDATE parts_products SET subcategory_id = 17709
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(valve|camshaft|crankshaft|piston|cylinder head|head gasket|rocker)\M';

-- Охлаждение (остаток) → 17703
UPDATE parts_products SET subcategory_id = 17703
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(coolant|cooling|water outlet|water inlet|thermostat housing|overflow)\M';

-- Опоры и крепления → 17702
UPDATE parts_products SET subcategory_id = 17702
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(engine mount|motor mount|transmission mount)\M';

-- Шланги и патрубки → 17714
UPDATE parts_products SET subcategory_id = 17714
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(hose|pipe|tube|line)\M'
  AND name_en !~* '\m(exhaust pipe|tail pipe)\M';

-- Электрика → 17715
UPDATE parts_products SET subcategory_id = 17715
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(wire|wiring|harness|cable|connector|relay|fuse|switch|module|ecu|control unit)\M';

-- Кронштейны → 17702
UPDATE parts_products SET subcategory_id = 17702
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(bracket|mount|support|brace|hanger)\M';

-- Крышки → 17799
UPDATE parts_products SET subcategory_id = 17799
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(cover|cap|shield|guard|protector|insulator|plate|pan|tray)\M';

-- Насосы (остаток) → 17799
UPDATE parts_products SET subcategory_id = 17799
WHERE subcategory_id IS NULL AND category_id = 177
  AND name_en ~* '\m(pump|motor|actuator|solenoid)\M';

-- Всё остальное двигатель → 17799
UPDATE parts_products SET subcategory_id = 17799
WHERE subcategory_id IS NULL AND category_id = 177;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: 181 САЛОН → L2                                              ║
-- ║ Порядок: конкретное → общее. Door handle ДО door.                   ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Замки и ручки → 18107 (СНАЧАЛА — чтобы door handle не попал в "Двери")
UPDATE parts_products SET subcategory_id = 18107
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(handle|lock|latch|striker|key|cylinder|actuator)\M'
  AND name_en !~* '\m(seat|console|hood|trunk|tailgate|fuel)\M';

-- Зеркала → 18110
UPDATE parts_products SET subcategory_id = 18110
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(mirror|rearview|rear view|side view)\M';

-- Сиденья → 18101
UPDATE parts_products SET subcategory_id = 18101
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(seat|headrest|head rest|seat belt|seat back|seat cushion)\M'
  AND name_en !~* '\m(seat cover)\M';

-- Панель приборов → 18102
UPDATE parts_products SET subcategory_id = 18102
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(dashboard|instrument|cluster|gauge|speedometer|tachometer|odometer|display|meter)\M';

-- Климат-контроль → 18103
UPDATE parts_products SET subcategory_id = 18103
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(heater|blower|climate|defrost|defroster|hvac|vent|air condition|a/c)\M';

-- Бамперы → 18112
UPDATE parts_products SET subcategory_id = 18112
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(bumper|grille|grill|fog|skid plate)\M';

-- Стёкла → 18113
UPDATE parts_products SET subcategory_id = 18113
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(windshield|window|glass|quarter|vent window|sunroof|moonroof|panoramic)\M'
  AND name_en !~* '\m(window switch|window motor|window regulator|power window)\M';

-- Освещение → 18111
UPDATE parts_products SET subcategory_id = 18111
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(light|lamp|led|illuminat|license plate light|courtesy|dome|reading|trunk light|cargo light)\M';

-- Двери (общий — handle/lock уже убраны выше) → 18106
UPDATE parts_products SET subcategory_id = 18106
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(door|regulator|window motor|power window|window switch)\M';

-- Молдинги → 18006
UPDATE parts_products SET subcategory_id = 18006
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(molding|moulding|weather ?strip|rubber seal|door seal)\M';

-- Консоль → 18108
UPDATE parts_products SET subcategory_id = 18108
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(console|armrest|arm rest|cup holder|storage|glove ?box|ashtray)\M';

-- Козырьки и потолок → 18109
UPDATE parts_products SET subcategory_id = 18109
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(visor|sun visor|headliner|headlining|roof|ceiling|overhead)\M';

-- Ковры, обшивка, трим → 18104
UPDATE parts_products SET subcategory_id = 18104
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(trim|panel|garnish|carpet|floor|mat|pillar|scuff|sill|kick)\M';

-- Электрика салона → 18105
UPDATE parts_products SET subcategory_id = 18105
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(sensor|wire|wiring|harness|switch|relay|module|fuse|connector|antenna|speaker|radio|audio|navigation|camera|horn|buzzer)\M';

-- Уплотнители → 18006
UPDATE parts_products SET subcategory_id = 18006
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(seal|weather|rubber|gasket|grommet)\M';

-- Крышки и кожухи → 18199
UPDATE parts_products SET subcategory_id = 18199
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(cover|cap|shield|guard|protector|plate|emblem|badge|logo|nameplate|ornament|decal|sticker)\M';

-- Кронштейны → 18199
UPDATE parts_products SET subcategory_id = 18199
WHERE subcategory_id IS NULL AND category_id = 181
  AND name_en ~* '\m(bracket|mounting|brace|support|hanger|hook|clip|holder|retainer|stay)\M';

-- Всё остальное салон → 18199
UPDATE parts_products SET subcategory_id = 18199
WHERE subcategory_id IS NULL AND category_id = 181;
