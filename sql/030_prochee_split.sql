-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 030: NULL вес Масло/Фильтры + Прочее-категории разбивка
--
-- ПРОБЛЕМА 1: [17701] Масло и фильтры — weight_avg_kg = NULL
--   786 товаров совсем без веса → калькулятор получает NULL
--   FIX: плоский weight_avg_kg = 0.30кг (фильтры 0.1-0.8кг типичный диапазон)
--
-- ПРОБЛЕМА 2: Прочее-категории с ratio > 30x (мелочь + тяжёлые агрегаты)
--   17999 Прочее шасси:   1,283 шт, ratio=103x, avg=3кг
--   17899 Прочее КПП:       427 шт, ratio=107x, avg=4кг  (Transaxle ₩3.9M→4кг!)
--   18099 Прочее кузов:     312 шт, ratio=78x,  avg=3кг
--   18199 Прочее салон:   1,458 шт, ratio=32x,  avg=2кг
--
-- РЕШЕНИЕ: из каждой Прочее вырезаем два слоя:
--   - мелкие (по цене <₩8-15k) → L3 ~0.05-0.08кг
--   - тяжёлые сборки (по ключевым словам + цена) → L3 тяжёлая весовая группа
--   - средний остаток → остаётся в L2 с пониженным weight_avg_kg
-- ═══════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗ 0A: FIX NULL WEIGHT — Масло и фильтры [17701]                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

UPDATE parts_categories
SET weight_avg_kg   = 0.30,
    weight_min_kg   = 0.05,
    weight_max_kg   = 4.00,
    ship_method     = COALESCE(ship_method, 'EMS'),
    logistics_notes = COALESCE(logistics_notes,
      'Масляные, воздушные, топливные, салонные фильтры. Avg 0.3кг. Масла до 4кг.')
WHERE id = 17701
  AND weight_avg_kg IS NULL;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗ 0B: НОВЫЕ L3 КАТЕГОРИИ (900937–900944)                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES

  -- ──── 17999 ПРОЧЕЕ ШАССИ ─────────────────────────────────────────────
  -- Клипсы, болты, втулки, малые кронштейны шасси
  (900937, 19001,
   'Мелкие детали шасси',
   'Small Chassis Parts',
   'small-chassis-parts', 37,
   0.01, 0.08, 0.30,
   25, 15, 5, 'EMS',
   'Клипсы, болты, втулки, малые кронштейны шасси. Цена < ₩15k.'),

  -- Дифференциал, раздатка, балка заднего моста, подрамник, рейка
  (900938, 19001,
   'Тяжёлые агрегаты шасси',
   'Heavy Chassis Assemblies',
   'heavy-chassis-assemblies', 38,
   3.0, 15.0, 50.0,
   70, 45, 35, 'EMS',
   'Дифференциал, раздаточная коробка, балка, подрамник, рулевая рейка. 3-50кг.'),

  -- ──── 17899 ПРОЧЕЕ КПП ───────────────────────────────────────────────
  -- Прокладки, сальники, уплотнения, болты КПП
  (900939, 19001,
   'Мелкие детали КПП',
   'Small Transmission Parts',
   'small-transmission-parts', 39,
   0.01, 0.08, 0.30,
   20, 15, 5, 'EMS',
   'Прокладки, сальники, уплотнения, болты КПП. Цена < ₩15k.'),

  -- CVT, АКПП, МКПП в сборе — ТОЛЬКО МОРЕМ
  (900940, 19001,
   'Трансмиссия в сборе',
   'Transmission Assembly',
   'transmission-assembly', 40,
   30.0, 70.0, 120.0,
   85, 55, 45, 'SEA',
   'CVT, АКПП, МКПП, transaxle в сборе. Реальный вес 30-120кг. Только морем.'),

  -- ──── 18099 ПРОЧЕЕ КУЗОВ ─────────────────────────────────────────────
  -- Клипсы, скобы, хомуты, малые уплотнители кузова
  (900941, 19001,
   'Мелкие детали кузова',
   'Small Body Clips & Fasteners',
   'small-body-clips', 41,
   0.005, 0.04, 0.15,
   20, 10, 3, 'EMS',
   'Клипсы, скобы, хомуты, малые уплотнители кузова. Цена < ₩8k.'),

  -- Двери, капот, крылья, крышка багажника, пороги
  (900942, 19001,
   'Кузовные панели',
   'Body Panels',
   'body-panels', 42,
   3.0, 12.0, 25.0,
   160, 90, 15, 'EMS',
   'Двери, капот, крылья, крышка багажника, пороги. Вес 3-25кг.'),

  -- ──── 18199 ПРОЧЕЕ САЛОН ─────────────────────────────────────────────
  -- Клипсы, заглушки, малые накладки, кнопки
  (900943, 19001,
   'Мелкие детали салона',
   'Small Interior Clips & Covers',
   'small-interior-clips', 43,
   0.01, 0.07, 0.25,
   20, 10, 3, 'EMS',
   'Клипсы, заглушки, малые накладки, кнопки. Цена < ₩12k.'),

  -- Сиденья в сборе, подушки безопасности, панели приборов
  (900944, 19001,
   'Крупные сборки салона',
   'Interior Assemblies',
   'interior-assemblies', 44,
   2.0, 8.0, 20.0,
   90, 60, 25, 'EMS',
   'Сиденья в сборе, модули подушек безопасности, панели приборов. 2-20кг.')

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


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗ 0C: СНИЖАЕМ weight_avg_kg ОСТАТКОВ (после вырезания мелочи)    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- После разбивки остаток — «средние» детали (рычаги, шестерни, молдинги)
-- Реальный avg у остатка ниже исходного плоского веса

UPDATE parts_categories SET weight_avg_kg = 1.5 WHERE id = 17999;

UPDATE parts_categories SET weight_avg_kg = 1.5 WHERE id = 17899;

UPDATE parts_categories SET weight_avg_kg = 1.0 WHERE id = 18099;

UPDATE parts_categories SET weight_avg_kg = 1.0 WHERE id = 18199;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: ПРОЧЕЕ ШАССИ 17999 → 900937 (мелкие) / 900938 (тяжёлые)   ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 1a. Мелкие по цене (сначала — иначе часть мелочи поймает фильтр >₩500k нет)
UPDATE parts_products
SET subcategory_id = 900937
WHERE subcategory_id = 17999
  AND price_krw < 15000;

-- 1b. Тяжёлые агрегаты: ключевые слова + ценовой порог
UPDATE parts_products
SET subcategory_id = 900938
WHERE subcategory_id = 17999
  AND (
    LOWER(name_en) LIKE '%differential%'
    OR LOWER(name_en) LIKE '%e-lsd%'
    OR LOWER(name_en) LIKE '%limited slip%'
    OR LOWER(name_en) LIKE '%transfer case%'
    OR LOWER(name_en) LIKE '%transfer assy%'
    OR LOWER(name_en) LIKE '%transfer-assy%'
    OR LOWER(name_en) LIKE '%subframe%'
    OR LOWER(name_en) LIKE '%sub-frame%'
    OR LOWER(name_en) LIKE '%crossmember%'
    OR LOWER(name_en) LIKE '%cross member%'
    OR LOWER(name_en) LIKE '%cross-member%'
    OR LOWER(name_en) LIKE '%steering rack%'
    OR LOWER(name_en) LIKE '%rack and pinion%'
    OR LOWER(name_en) LIKE '%rack-and-pinion%'
    OR LOWER(name_en) LIKE '%rear axle%'
    OR LOWER(name_en) LIKE '%axle housing%'
    OR LOWER(name_en) LIKE '%axle beam%'
    OR LOWER(name_en) LIKE '%torsion beam%'
    OR LOWER(name_en) LIKE '%twist beam%'
    OR LOWER(name_en) LIKE '%drive axle%'
    OR LOWER(name_en) LIKE '%axle assy%'
    OR price_krw > 500000
  );


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: ПРОЧЕЕ КПП 17899 → 900939 (мелкие) / 900940 (агрегаты)    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 2a. Мелкие (прокладки, сальники, уплотнения)
UPDATE parts_products
SET subcategory_id = 900939
WHERE subcategory_id = 17899
  AND price_krw < 15000;

-- 2b. Трансмиссионные агрегаты в сборе
UPDATE parts_products
SET subcategory_id = 900940
WHERE subcategory_id = 17899
  AND (
    LOWER(name_en) LIKE '%transaxle%'
    OR LOWER(name_en) LIKE '%trans-axle%'
    OR LOWER(name_en) LIKE '%transmission assembly%'
    OR LOWER(name_en) LIKE '%transmission assy%'
    OR LOWER(name_en) LIKE '%transmission comp%'
    OR LOWER(name_en) LIKE '%gearbox assy%'
    OR LOWER(name_en) LIKE '%gearbox assembly%'
    OR LOWER(name_en) LIKE '%cvt assy%'
    OR LOWER(name_en) LIKE '%cvt assembly%'
    OR LOWER(name_en) LIKE '%cvt-assy%'
    OR LOWER(name_en) LIKE '%e-cvt%'
    OR LOWER(name_en) LIKE '%hybrid transaxle%'
    OR LOWER(name_en) LIKE '%transmission-assy%'
    OR price_krw > 800000
  );


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: ПРОЧЕЕ КУЗОВ 18099 → 900941 (мелкие) / 900942 (панели)    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 3a. Мелкие (клипсы, скобы, хомуты)
UPDATE parts_products
SET subcategory_id = 900941
WHERE subcategory_id = 18099
  AND price_krw < 8000;

-- 3b. Кузовные панели: ключевые слова + цена
UPDATE parts_products
SET subcategory_id = 900942
WHERE subcategory_id = 18099
  AND (
    LOWER(name_en) LIKE '%door assy%'
    OR LOWER(name_en) LIKE '%door comp%'
    OR LOWER(name_en) LIKE '%door panel%'
    OR LOWER(name_en) LIKE '%hood assy%'
    OR LOWER(name_en) LIKE '%hood comp%'
    OR LOWER(name_en) LIKE '%hood panel%'
    OR LOWER(name_en) LIKE '%engine hood%'
    OR LOWER(name_en) LIKE '%bonnet%'
    OR LOWER(name_en) LIKE '%fender%'
    OR LOWER(name_en) LIKE '%trunk lid%'
    OR LOWER(name_en) LIKE '%trunk-lid%'
    OR LOWER(name_en) LIKE '%tailgate%'
    OR LOWER(name_en) LIKE '%tail gate%'
    OR LOWER(name_en) LIKE '%liftgate%'
    OR LOWER(name_en) LIKE '%quarter panel%'
    OR LOWER(name_en) LIKE '%roof panel%'
    OR LOWER(name_en) LIKE '%rocker panel%'
    OR LOWER(name_en) LIKE '%floor pan%'
    OR LOWER(name_en) LIKE '%pillar%'
    OR (price_krw > 200000
        AND LOWER(name_en) NOT LIKE '%clip%'
        AND LOWER(name_en) NOT LIKE '%bracket%'
        AND LOWER(name_en) NOT LIKE '%seal%'
        AND LOWER(name_en) NOT LIKE '%moulding%'
        AND LOWER(name_en) NOT LIKE '%molding%'
        AND LOWER(name_en) NOT LIKE '%garnish%'
        AND LOWER(name_en) NOT LIKE '%sensor%')
  );


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: ПРОЧЕЕ САЛОН 18199 → 900943 (мелкие) / 900944 (сборки)    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 4a. Мелкие (клипсы, заглушки, малые накладки)
UPDATE parts_products
SET subcategory_id = 900943
WHERE subcategory_id = 18199
  AND price_krw < 12000;

-- 4b. Крупные сборки: ключевые слова + цена
UPDATE parts_products
SET subcategory_id = 900944
WHERE subcategory_id = 18199
  AND (
    LOWER(name_en) LIKE '%seat assembly%'
    OR LOWER(name_en) LIKE '%seat assy%'
    OR LOWER(name_en) LIKE '%seat comp%'
    OR LOWER(name_en) LIKE '%bench seat%'
    OR LOWER(name_en) LIKE '%front seat%'
    OR LOWER(name_en) LIKE '%rear seat%'
    OR LOWER(name_en) LIKE '%airbag module%'
    OR LOWER(name_en) LIKE '%air bag module%'
    OR LOWER(name_en) LIKE '%airbag assy%'
    OR LOWER(name_en) LIKE '%curtain airbag%'
    OR LOWER(name_en) LIKE '%instrument panel%'
    OR LOWER(name_en) LIKE '%dashboard%'
    OR LOWER(name_en) LIKE '%headliner%'
    OR LOWER(name_en) LIKE '%door trim assy%'
    OR LOWER(name_en) LIKE '%floor carpet%'
    OR (price_krw > 200000
        AND LOWER(name_en) NOT LIKE '%clip%'
        AND LOWER(name_en) NOT LIKE '%bolt%'
        AND LOWER(name_en) NOT LIKE '%screw%'
        AND LOWER(name_en) NOT LIKE '%cover%'
        AND LOWER(name_en) NOT LIKE '%sensor%'
        AND LOWER(name_en) NOT LIKE '%switch%')
  );
