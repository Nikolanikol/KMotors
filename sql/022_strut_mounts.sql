-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 022: L3 "Опоры стоек и пружины подвески" + ценовой порог
--
-- Проблема 1: strut mount / strut insulator / shock mount (~56 шт)
--   в Прочее шасси (17999, вес 3кг). Реальный вес 0.5–1.5кг → EMS.
--
-- Проблема 2: товары < ₩3000 в тяжёлых Прочее категориях получают
--   завышенный вес (1.5–4кг вместо <0.1кг для клипс/шайб/резинок).
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3                                                    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Опоры стоек: strut mount, strut insulator, shock absorber mount
  -- Резиновая опора + металлический стакан. Вес 0.3–2кг
  (900915, 19001, 'Опоры стоек и подвески',
   'Strut Mounts & Insulators', 'strut-mounts', 15,
   0.30, 0.80, 2.00, 18, 18, 8, 'EMS',
   'Опоры стоек, опорные подшипники, отбойники, резиновые буферы подвески'),

  -- Мелкие детали до ₩3000 — клипсы, скобы, гайки, шайбы, заглушки
  -- Это staging-категория для последующей рассортировки
  (900999, 19001, 'Мелкие детали (staging)',
   'Small Parts - Staging', 'small-parts-staging', 99,
   0.01, 0.05, 0.20, 6, 4, 2, 'EMS',
   'Временная категория: клипсы, скобы, шайбы, заглушки < ₩3000. Требует рассортировки.')
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
-- ║ ФАЗА 1: ОПОРЫ СТОЕК                                                 ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900915
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO
    '%(strut mount|strut insulator|shock mount|shock insulator|' ||
    'top mount|upper mount|suspension insulator|spring insulator|' ||
    'bump stop|bump rubber|rebound buffer|jounce bumper)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: ЦЕНОВОЙ ПОРОГ — собираем мусор < ₩3000                     ║
-- ║ Только из тяжёлых Прочее категорий (weight_avg > 1.5кг)             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Из Прочее двигатель (17799, weight 1.5кг)
UPDATE parts_products SET subcategory_id = 900999
WHERE subcategory_id = 17799
  AND price_krw < 3000
  AND price_krw > 0;

-- Из Прочее КПП (17899, weight 4.0кг)
UPDATE parts_products SET subcategory_id = 900999
WHERE subcategory_id = 17899
  AND price_krw < 3000
  AND price_krw > 0;

-- Из Прочее шасси (17999, weight 3.0кг)
UPDATE parts_products SET subcategory_id = 900999
WHERE subcategory_id = 17999
  AND price_krw < 3000
  AND price_krw > 0;

-- Из Прочее салон (18199, weight 2.0кг)
UPDATE parts_products SET subcategory_id = 900999
WHERE subcategory_id = 18199
  AND price_krw < 3000
  AND price_krw > 0;
