-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 001: Add brand_id to parts_products
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Зачем:
--   Сейчас бренд продукта определяется через цепочку:
--     parts_fitment → parts_vehicle_models → parts_brands
--   Из 6204 продуктов только ~200-300 имеют fitment-записи.
--   Остальные 85% исчезают при выборе бренда в фильтре.
--
--   После миграции: brand_id напрямую в products → фильтр по бренду = O(1),
--   fitment используется только для фильтра по конкретной модели.
--
-- Порядок выполнения:
--   1. Запустить блок "ДИАГНОСТИКА ДО" — посмотреть данные
--   2. Запустить блок "МИГРАЦИЯ" — добавить колонку и заполнить
--   3. Запустить блок "ДИАГНОСТИКА ПОСЛЕ" — проверить результат
--   4. Запустить блок "ИНДЕКС" — добавить индекс
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 0. ДИАГНОСТИКА ДО ───────────────────────────────────────────────────────

-- Сколько продуктов имеют fitment-записи (и получат brand_id автоматически)?
SELECT
  COUNT(DISTINCT product_id)  AS products_with_fitment,
  COUNT(*)                     AS total_fitment_rows
FROM parts_fitment;

-- Какие бренды есть в таблице brands?
SELECT id, slug, name FROM parts_brands ORDER BY id;

-- Смотрим распределение брендов через fitment
SELECT
  pb.name           AS brand,
  pb.slug,
  COUNT(DISTINCT f.product_id) AS product_count
FROM parts_fitment f
JOIN parts_vehicle_models vm ON vm.id = f.vehicle_model_id
JOIN parts_brands pb          ON pb.id = vm.brand_id
GROUP BY pb.id, pb.name, pb.slug
ORDER BY product_count DESC;


-- ─── 1. МИГРАЦИЯ ─────────────────────────────────────────────────────────────

-- Шаг 1.1: Добавить колонку (nullable — пока не знаем brand для всех)
ALTER TABLE parts_products
  ADD COLUMN IF NOT EXISTS brand_id INT REFERENCES parts_brands(id);


-- Шаг 1.2: Заполнить brand_id из fitment-цепочки
--   Логика: product → fitment → vehicle_model → brand
--   Если продукт фитит модели нескольких брендов (редкий случай),
--   берём бренд с наибольшим количеством fitment-совпадений.
WITH brand_votes AS (
  SELECT
    f.product_id,
    vm.brand_id,
    COUNT(*)          AS votes,
    -- ROW_NUMBER: 1 = победивший бренд по количеству голосов
    ROW_NUMBER() OVER (
      PARTITION BY f.product_id
      ORDER BY COUNT(*) DESC,
               vm.brand_id ASC   -- ASC для детерминизма при равных голосах
    )                 AS rn
  FROM parts_fitment f
  JOIN parts_vehicle_models vm ON vm.id = f.vehicle_model_id
  GROUP BY f.product_id, vm.brand_id
)
UPDATE parts_products p
SET    brand_id = bv.brand_id
FROM   brand_votes bv
WHERE  p.id = bv.product_id
  AND  bv.rn = 1
  AND  p.brand_id IS NULL;


-- Шаг 1.3: ПРОВЕРКА ПЕРЕКРЁСТНЫХ БРЕНДОВ
-- Продукты с fitment под несколько брендов (нормально — универсальные детали)
SELECT
  f.product_id,
  p.part_number,
  p.name_ru,
  array_agg(DISTINCT pb.slug) AS brands
FROM parts_fitment f
JOIN parts_vehicle_models vm ON vm.id = f.vehicle_model_id
JOIN parts_brands pb          ON pb.id = vm.brand_id
JOIN parts_products p         ON p.id  = f.product_id
GROUP BY f.product_id, p.part_number, p.name_ru
HAVING COUNT(DISTINCT pb.id) > 1
ORDER BY f.product_id;

-- Если таких деталей много — возможно стоит добавить отдельный тип "universal"
-- или связь many-to-many (parts_product_brands). Для начала оставляем один бренд.


-- Шаг 1.4: Продукты БЕЗ fitment — смотрим что есть
SELECT
  id,
  part_number,
  name_ru,
  name_en,
  manufacturer,
  category_id
FROM parts_products
WHERE brand_id IS NULL
ORDER BY id
LIMIT 100;

-- Сколько таких продуктов?
SELECT COUNT(*) AS unassigned FROM parts_products WHERE brand_id IS NULL;


-- Шаг 1.5: Попытка назначить бренд по полю manufacturer
-- (Hyundai Mobis производит для всех трёх брендов, но иногда manufacturer указывает конкретно)
UPDATE parts_products
SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'hyundai' LIMIT 1)
WHERE brand_id IS NULL
  AND manufacturer ILIKE '%hyundai%'
  AND manufacturer NOT ILIKE '%kia%'
  AND manufacturer NOT ILIKE '%genesis%';

UPDATE parts_products
SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'kia' LIMIT 1)
WHERE brand_id IS NULL
  AND manufacturer ILIKE '%kia%';

UPDATE parts_products
SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'genesis' LIMIT 1)
WHERE brand_id IS NULL
  AND manufacturer ILIKE '%genesis%';


-- Шаг 1.6: Поиск по номеру детали
-- Некоторые серии номеров специфичны для одного бренда.
-- Примеры (уточнить под реальные данные):
--
-- Kia: номера часто начинаются с K, например K0Y13-XXXXX
-- UPDATE parts_products
-- SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'kia' LIMIT 1)
-- WHERE brand_id IS NULL AND part_number ~ '^K[0-9A-Z]';
--
-- Genesis: GEX-prefixed или специфические серии
-- UPDATE parts_products
-- SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'genesis' LIMIT 1)
-- WHERE brand_id IS NULL AND (part_number ILIKE 'GEX%' OR part_number ILIKE 'G8%');


-- Шаг 1.7: Назначить Hyundai всем оставшимся без бренда
-- (Hyundai = самый крупный бренд, большинство Mobis-деталей для них)
-- ВНИМАНИЕ: Раскомментировать только если проверили диагностику выше
-- и убедились что неназначенные действительно Hyundai-детали.
--
-- UPDATE parts_products
-- SET brand_id = (SELECT id FROM parts_brands WHERE slug = 'hyundai' LIMIT 1)
-- WHERE brand_id IS NULL;


-- ─── 2. ДИАГНОСТИКА ПОСЛЕ ────────────────────────────────────────────────────

-- Итоговое распределение по брендам
SELECT
  COALESCE(pb.name, '⚠️  не назначен') AS brand,
  COUNT(p.id)                            AS product_count,
  ROUND(COUNT(p.id)::numeric / (SELECT COUNT(*) FROM parts_products) * 100, 1) AS pct
FROM parts_products p
LEFT JOIN parts_brands pb ON pb.id = p.brand_id
GROUP BY pb.id, pb.name
ORDER BY product_count DESC;

-- Остаток без бренда (для ручного назначения)
SELECT
  id,
  part_number,
  name_ru,
  name_en,
  category_id
FROM parts_products
WHERE brand_id IS NULL
ORDER BY id;


-- ─── 3. ИНДЕКС + ФИНАЛ ───────────────────────────────────────────────────────

-- Индекс для быстрой фильтрации по бренду (WHERE brand_id = X)
CREATE INDEX IF NOT EXISTS idx_parts_products_brand_id
  ON parts_products (brand_id);

-- Составной индекс: бренд + категория (для страницы бренда)
CREATE INDEX IF NOT EXISTS idx_parts_products_brand_cat
  ON parts_products (brand_id, category_id);

-- (Опционально) После проверки — сделать NOT NULL если все заполнены
-- ALTER TABLE parts_products ALTER COLUMN brand_id SET NOT NULL;


-- ─── 4. ROLLBACK (если что-то пошло не так) ──────────────────────────────────
-- ALTER TABLE parts_products DROP COLUMN IF EXISTS brand_id;
-- DROP INDEX IF EXISTS idx_parts_products_brand_id;
-- DROP INDEX IF EXISTS idx_parts_products_brand_cat;
