-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ: Исправление логики расчёта логистики
-- Три исправления:
--   1. Авто-сортировка габаритов: L = самая длинная сторона
--   2. EMS Standard: тарифицируется только по packed_weight (без объёмного)
--   3. Упаковка: actual * 1.05 + 0.3 вместо actual * 1.12
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_category_logistics AS
WITH dims AS (
  SELECT
    c.*,
    -- Сортировка сторон: L = макс, H = мин, W = средняя
    GREATEST(c.length_cm, c.width_cm, c.height_cm) AS dim_l,
    (c.length_cm + c.width_cm + c.height_cm
      - GREATEST(c.length_cm, c.width_cm, c.height_cm)
      - LEAST(c.length_cm, c.width_cm, c.height_cm))  AS dim_w,
    LEAST(c.length_cm, c.width_cm, c.height_cm)        AS dim_h
  FROM public.parts_categories c
  WHERE c.weight_avg_kg IS NOT NULL
)
SELECT
  d.id,
  d.parent_id,
  d.name_ru,
  d.name_en,
  d.slug,
  d.weight_avg_kg,
  d.weight_min_kg,
  d.weight_max_kg,
  d.dim_l AS length_cm,
  d.dim_w AS width_cm,
  d.dim_h AS height_cm,

  -- Объёмный вес (только для курьерских служб)
  ROUND((d.dim_l * d.dim_w * d.dim_h / 5000)::numeric, 3)
    AS vol_weight_kg,

  -- Расчётный вес с упаковкой: actual * 1.05 + 0.3 кг (коробка)
  ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3)
    AS packed_weight_kg,

  -- Billed weight для EMS Premium (курьер): max(packed, vol)
  GREATEST(
    ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3),
    ROUND((d.dim_l * d.dim_w * d.dim_h / 5000)::numeric, 3)
  ) AS billed_weight_kg,

  -- size_formula по отсортированным габаритам
  ROUND((d.dim_l + (d.dim_w + d.dim_h) * 2)::numeric, 1)
    AS size_formula_cm,

  -- Метод доставки (пересчитываем по исправленной логике)
  CASE
    -- EMS Standard: только packed_weight, без объёмного
    WHEN ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3) <= 30
     AND ROUND((d.dim_l + (d.dim_w + d.dim_h) * 2)::numeric, 1) <= 300
     AND d.dim_l <= 150
    THEN 'EMS'
    -- EMS Premium: max(packed, vol)
    WHEN GREATEST(
           ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3),
           ROUND((d.dim_l * d.dim_w * d.dim_h / 5000)::numeric, 3)
         ) <= 70
     AND ROUND((d.dim_l + (d.dim_w + d.dim_h) * 2)::numeric, 1) <= 419
     AND d.dim_l <= 270
    THEN 'EMS_PREMIUM'
    ELSE 'SEA'
  END AS ship_method,

  d.logistics_notes,
  d.requires_l3,
  CASE
    WHEN d.parent_id IS NULL THEN 1
    WHEN EXISTS (SELECT 1 FROM public.parts_categories p WHERE p.id = d.parent_id AND p.parent_id IS NULL) THEN 2
    ELSE 3
  END AS level

FROM dims d;

-- ── Проверка после применения ────────────────────────────────────
-- SELECT name_ru, weight_avg_kg, packed_weight_kg, vol_weight_kg,
--        billed_weight_kg, size_formula_cm, ship_method
-- FROM v_category_logistics
-- ORDER BY level, id;
