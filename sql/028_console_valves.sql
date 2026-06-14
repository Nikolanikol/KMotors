-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 028: Консоль и Клапаны
--
-- [18108] Консоль: ratio=37x, 1,523 шт, P10=₩8k → avg 1.5кг
--   Мелкие накладки, клипсы, рамки ₩8k получают 1.5кг
--
-- [17709] Клапаны: ratio=24x, 509 шт, P10=₩3.2k → avg 0.4кг
--   Маленькие клапанные пружины/клипсы ₩3k получают 0.4кг
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Мелкие накладки и фурнитура консоли: клипсы, рамки, заглушки < ₩12k
  (900931, 19001,
   'Мелкие детали консоли',
   'Console Small Parts',
   'console-small-parts', 31,
   0.01, 0.10, 0.40,
   12, 8, 3, 'EMS',
   'Клипсы, рамки, накладки, заглушки, мелкая фурнитура консоли/подлокотника. Цена < ₩12k'),

  -- Мелкие клапаны, пружины, уплотнители клапанной группы < ₩8k
  (900932, 19001,
   'Мелкие детали клапанного механизма',
   'Valve Train Small Parts',
   'valve-small-parts', 32,
   0.01, 0.06, 0.20,
   10, 6, 3, 'EMS',
   'Пружины клапанов, сухари, маслосъёмные колпачки, мелкие уплотнения. Цена < ₩8k')
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


-- Консоль → 900931 (< ₩12k)
UPDATE parts_products
SET subcategory_id = 900931
WHERE subcategory_id = 18108
  AND price_krw BETWEEN 1 AND 11999;


-- Клапаны → 900932 (< ₩8k)
UPDATE parts_products
SET subcategory_id = 900932
WHERE subcategory_id = 17709
  AND price_krw BETWEEN 1 AND 7999;
