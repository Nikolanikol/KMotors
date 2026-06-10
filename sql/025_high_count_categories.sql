-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 025: L3 для категорий с высокой численностью
--
-- Три крупные категории с ratio > 50x:
--   1. Двери (18106): 2,465 шт, avg=2.5кг, ratio=71x
--      → L3 ручки/замки (0.4кг) + L3 уплотнители (0.25кг)
--   2. Бампер (18112): 1,286 шт, avg=1.5кг, ratio=72x
--      → L3 мелкие аксессуары < ₩10k (0.06кг)
--   3. Топливо (17707): 1,311 шт, avg=1.5кг, ratio=52x
--      → L3 мелкие детали < ₩12k (0.10кг)
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 0: НОВЫЕ L3 КАТЕГОРИИ                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

INSERT INTO parts_categories
  (id, parent_id, name_ru, name_en, slug, sort_order,
   weight_min_kg, weight_avg_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  -- Ручки, замки, петли, тяги, регуляторы стекол дверей
  -- Диапазон 0.1-2кг (ручка = 0.3кг, петля = 1.5кг, регулятор = 0.8кг)
  (900919, 19001,
   'Ручки и замки дверей',
   'Door Handles & Locks',
   'door-handles-locks', 19,
   0.10, 0.40, 2.00,
   28, 10, 8, 'EMS',
   'Наружные/внутренние ручки, замки, петли, тяги, электроприводы, регуляторы стекол дверей'),

  -- Уплотнители, молдинги, направляющие стёкол дверей
  -- Резиновые профили: 0.05-1кг, длинные → упаковка 50см
  (900920, 19001,
   'Уплотнители дверей',
   'Door Seals & Weatherstrips',
   'door-seals-weatherstrips', 20,
   0.05, 0.25, 1.00,
   50, 4, 3, 'EMS',
   'Уплотнители, молдинги, резиновые профили, направляющие стёкол, ремни дверей'),

  -- Эмблемы, клипсы, значки, мелкая фурнитура бампера (< ₩10k)
  -- Попали сюда из патчей 019-020 (emblems, small trim)
  (900921, 19001,
   'Мелкие аксессуары бампера',
   'Bumper Small Accessories',
   'bumper-small-accessories', 21,
   0.01, 0.06, 0.20,
   10, 6, 3, 'EMS',
   'Эмблемы, клипсы, значки, мелкие накладки бампера. Цена < ₩10k'),

  -- O-кольца, клипсы, заглушки, фитинги, мелкие детали топливной системы
  (900922, 19001,
   'Мелкие детали топливной системы',
   'Fuel System Small Parts',
   'fuel-small-parts', 22,
   0.01, 0.10, 0.40,
   14, 8, 4, 'EMS',
   'O-кольца, клипсы, заглушки, фитинги, крышки, мелкие уплотнения топливной системы')
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
-- ║ ФАЗА 1: ДВЕРИ → 900919 (ручки, замки, петли, регуляторы)           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900919
WHERE subcategory_id = 18106
  AND LOWER(name_en) SIMILAR TO
    '%(door handle|outer handle|inner handle|inside handle|outside handle|' ||
    'front handle|rear handle|handle assy|handle assembly|' ||
    'door latch|door lock|lock assembly|latch assembly|' ||
    'door actuator|lock actuator|door hinge|hinge assembly|' ||
    'door checker|door strap|door stopper|door stay|' ||
    'window regulator|glass regulator|door regulator|' ||
    'window motor|door motor|regulator motor|power window)%'
  -- Исключаем панели дверей — они остаются в L2
  AND LOWER(name_en) NOT SIMILAR TO
    '%(outer panel|inner panel|door panel|door skin|door shell|door assembly)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 2: ДВЕРИ → 900920 (уплотнители, молдинги, направляющие)       ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900920
WHERE subcategory_id = 18106
  AND LOWER(name_en) SIMILAR TO
    '%(door seal|door weather|weatherstrip|weather strip|weather-strip|' ||
    'door sealing|door rubber|door moulding|door molding|' ||
    'door trim strip|door strip|belt line|belt seal|belt moulding|' ||
    'glass run|door glass run|run channel|window channel|' ||
    'door sash|sash seal|upper seal|lower seal door)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 3: БАМПЕР → 900921 (мелкие аксессуары < ₩10k)                ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900921
WHERE subcategory_id = 18112
  AND price_krw BETWEEN 1 AND 9999;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ ФАЗА 4: ТОПЛИВО → 900922 (мелкие детали)                           ║
-- ║ Комбинация: ценовой порог OR конкретные мелкие компоненты            ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

UPDATE parts_products
SET subcategory_id = 900922
WHERE subcategory_id = 17707
  AND price_krw > 0
  AND (
    -- Ценовой порог — явно мелкое
    price_krw < 12000
    -- Конкретные мелкие детали (могут стоить дороже ₩12k)
    OR LOWER(name_en) SIMILAR TO
      '%(fuel o.ring|fuel o ring|fuel clip|fuel cap|fuel plug|' ||
      'fuel fitting|fuel joint|fuel connector|fuel pipe clip|' ||
      'fuel line clip|injector o.ring|injector clip|fuel seal)%'
  );
