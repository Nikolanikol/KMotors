-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 024: L3 для критических весовых ошибок
--
-- Три категории где avg_weight L2 многократно завышает вес мелких деталей:
--   1. АКПП     (17801): avg=70кг  — прокладки/клапаны < ₩30k → реально 0.05-1кг
--   2. Выхлоп   (17710): avg=6кг   — прокладки/датчики < ₩20k → реально 0.02-0.5кг
--   3. Сиденья  (18101): avg=18кг  — болты/клипсы      < ₩15k → реально 0.01-0.5кг
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Прокладки, уплотнения, клапаны, пружины, фильтры АКПП
  -- Вместо 70кг (весь АКПП) → правильные 0.05-1.0кг
  (900916, 19001,
   'Мелкие детали АКПП',
   'AT Transmission Small Parts',
   'at-small-parts', 16,
   0.05, 0.30, 1.00,
   15, 10, 5, 'EMS',
   'Прокладки, уплотнения, клапаны, фильтры, пружины, соленоиды АКПП. Цена < ₩30k'),

  -- Прокладки, хомуты, кронштейны, датчики O2/лямбда выхлопной системы
  -- Вместо 6кг → правильные 0.02-0.5кг
  (900917, 19001,
   'Прокладки и датчики выхлопа',
   'Exhaust Gaskets & Sensors',
   'exhaust-gaskets-sensors', 17,
   0.02, 0.12, 0.50,
   20, 15, 3, 'EMS',
   'Прокладки, хомуты, кронштейны, подвески, датчики O2/лямбда выхлопной системы'),

  -- Болты, клипсы, направляющие, пружины, мелкая фурнитура сидений
  -- Вместо 18кг → правильные 0.01-0.5кг
  (900918, 19001,
   'Мелкие детали сидений',
   'Seat Small Hardware',
   'seat-small-hardware', 18,
   0.01, 0.10, 0.50,
   12, 8, 4, 'EMS',
   'Болты, клипсы, направляющие, пружины, мелкая фурнитура крепления сидений. Цена < ₩15k')
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
-- ║ ФАЗА 1: АКПП 17801 → 900916 (мелкие детали < ₩30k)                ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900916
WHERE subcategory_id = 17801
  AND price_krw BETWEEN 1 AND 29999;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: ВЫХЛОП 17710 → 900917 (прокладки/датчики)                  ║
-- ║ Комбинация: ключевые слова (могут быть дорогими) OR цена < ₩20k      ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900917
WHERE subcategory_id = 17710
  AND price_krw > 0
  AND (
    -- Прокладки: всегда лёгкие независимо от цены
    LOWER(name_en) SIMILAR TO
      '%(gasket|exhaust gasket|manifold gasket|flange gasket|' ||
      'pipe gasket|ring seal|exhaust ring)%'
    -- Датчики кислорода: ~0.1-0.3кг
    OR LOWER(name_en) SIMILAR TO
      '%(o2 sensor|o\.2 sensor|oxygen sensor|lambda sensor|' ||
      'exhaust sensor|egr sensor)%'
    -- Подвески и хомуты выхлопа: 0.05-0.3кг
    OR LOWER(name_en) SIMILAR TO
      '%(exhaust hanger|exhaust bracket|muffler hanger|pipe hanger|' ||
      'exhaust clamp|exhaust clip|exhaust mount|pipe bracket)%'
    -- Ценовой порог — дешёвые детали любого типа
    OR price_krw < 20000
  );


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: СИДЕНЬЯ 18101 → 900918 (мелкая фурнитура < ₩15k)           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900918
WHERE subcategory_id = 18101
  AND price_krw BETWEEN 1 AND 14999;
