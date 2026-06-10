-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 019: Доочистка категорий "Прочее"
--
-- Проблемы:
-- 1. Колёсные диски (187 шт) в Прочее шасси → вес 3кг вместо 10кг
-- 2. Педали (~145 шт) в Прочее двигатель → неправильная система
-- 3. Рукоятки КПП (~127 шт) в Прочее КПП → нужно в Консоль
-- 4. ШРУСы/полуоси (~97 шт) в Прочее КПП → нужно в Приводные валы
-- 5. Спойлеры (~92) и эмблемы (~91) в Прочее салон → нужно в Кузов
-- 6. Провода из Прочее шасси → уже есть 900908
-- 7. Canister из Прочее двигатель → уже есть Топливная система
-- 8. Рычаги подвески из Прочее кузов → нужно в Шасси
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Колёсные диски: 16-20" алюм/сталь. 1 диск ≈ 8-14кг
  (900913, 19001, 'Колёсные диски',
   'Wheels & Rims', 'wheels-rims', 13,
   7.0, 10.0, 18.0, 55, 55, 24, 'EMS',
   'Алюминиевые и стальные диски 16-20 дюймов (без шин)'),

  -- Педали: резиновые накладки и сборки. 0.1-1.5кг
  (900914, 19001, 'Педали',
   'Pedals', 'pedals', 14,
   0.05, 0.40, 1.50, 22, 15, 10, 'EMS',
   'Педали тормоза, газа, сцепления и резиновые накладки')
ON CONFLICT (id) DO UPDATE SET
  name_ru        = EXCLUDED.name_ru,
  name_en        = EXCLUDED.name_en,
  weight_min_kg  = EXCLUDED.weight_min_kg,
  weight_avg_kg  = EXCLUDED.weight_avg_kg,
  weight_max_kg  = EXCLUDED.weight_max_kg,
  length_cm      = EXCLUDED.length_cm,
  width_cm       = EXCLUDED.width_cm,
  height_cm      = EXCLUDED.height_cm,
  ship_method    = EXCLUDED.ship_method,
  logistics_notes = EXCLUDED.logistics_notes;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 1: РЕКЛАСИФИКАЦИЯ                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- ── 1. Колёсные диски: Прочее шасси (17999) → 900913 ─────────────────
-- Явные паттерны: aluminum wheel, alloy wheel, steel wheel, oem/original wheel
UPDATE parts_products SET subcategory_id = 900913
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO
    '%(aluminum wheel|aluminium wheel|alloy wheel|steel wheel|oem.*wheel|original.*wheel|stock.*wheel)%'
  AND LOWER(name_en) NOT SIMILAR TO
    '%(steering|wheel guard|wheel arch|spare wheel carrier|wheel hub|wheel bearing|wheel cylinder|wheel speed)%';

-- ── 2. Педали: Прочее двигатель (17799) → 900914 ─────────────────────
UPDATE parts_products SET subcategory_id = 900914
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(pedal|foot rest|footrest)%';

-- ── 3. Рукоятки КПП: Прочее КПП (17899) → Консоль (18108) ───────────
UPDATE parts_products SET subcategory_id = 18108
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO '%(gear.*knob|shift.*knob|knob.*gear|knob.*shift|gear knob|gear lever knob)%';

-- ── 4. ШРУСы/полуоси: Прочее КПП (17899) → Приводные валы (17905) ────
UPDATE parts_products SET subcategory_id = 17905
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO
    '%(constant velocity|cv joint|drive shaft|driveshaft|half shaft|axle shaft|propeller shaft|oem constant)%';

-- ── 5. Спойлеры: Прочее салон (18199) → Бампер и аксессуары (18112) ──
UPDATE parts_products SET subcategory_id = 18112
WHERE subcategory_id = 18199
  AND LOWER(name_en) LIKE '%spoiler%';

-- ── 6. Эмблемы: Прочее салон (18199) → Бампер и аксессуары (18112) ───
UPDATE parts_products SET subcategory_id = 18112
WHERE subcategory_id = 18199
  AND LOWER(name_en) LIKE '%emblem%';

-- ── 7. Защита арок: Прочее салон (18199) → Прочее кузов (18099) ──────
UPDATE parts_products SET subcategory_id = 18099
WHERE subcategory_id = 18199
  AND LOWER(name_en) SIMILAR TO '%(wheel guard|fender liner|wheel arch|mud guard|mudguard|inner fender)%';

-- ── 8. Провода: Прочее шасси (17999) → Провода и жгуты (900908) ──────
UPDATE parts_products SET subcategory_id = 900908
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(extension cord|wiring harness|wire harness|cable assembly|electrical harness)%'
  AND price_krw < 100000;

-- ── 9. Пыльники ШРУСов: Прочее шасси (17999) → Приводные валы (17905) ─
UPDATE parts_products SET subcategory_id = 17905
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(cv boot|axle boot|boot kit|drive shaft boot)%';

-- ── 10. Canister: Прочее двигатель (17799) → Топливная система (17707) ─
UPDATE parts_products SET subcategory_id = 17707
WHERE subcategory_id = 17799
  AND LOWER(name_en) LIKE '%canister%';

-- ── 11. Рычаги подвески: Прочее кузов (18099) → Прочее шасси (17999) ──
UPDATE parts_products SET subcategory_id = 17999
WHERE subcategory_id = 18099
  AND LOWER(name_en) SIMILAR TO
    '%(lower arm|control arm|lower control arm|trailing arm|upper arm|suspension arm)%';

-- ── 12. Коленвал: Прочее кузов (18099) → Прочее двигатель (17799) ────
UPDATE parts_products SET subcategory_id = 17799
WHERE subcategory_id = 18099
  AND LOWER(name_en) LIKE '%crankshaft%';
