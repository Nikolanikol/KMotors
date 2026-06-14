-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ 008: billed_weight_kg зависит от метода доставки
--
-- Проблема: GREATEST(packed, vol) применялся для всех методов,
-- но Korea Post EMS Standard тарифицирует ТОЛЬКО по фактическому
-- весу (объёмный вес у них не применяется для EMS).
--
-- Исправление:
--   EMS         → billed = packed_w  (только физический)
--   EMS_PREMIUM → billed = GREATEST(packed_w, vol_w)
--   SEA         → billed = GREATEST(packed_w, vol_w)
--
-- Решение: добавить CTE `routed` — считаем ship_method раньше,
-- затем используем его для вычисления billed_weight_kg.
-- ═══════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.v_category_logistics;

CREATE VIEW public.v_category_logistics AS
WITH dims AS (
  SELECT
    c.*,
    GREATEST(c.length_cm, c.width_cm, c.height_cm) AS dim_l,
    (c.length_cm + c.width_cm + c.height_cm
      - GREATEST(c.length_cm, c.width_cm, c.height_cm)
      - LEAST(c.length_cm, c.width_cm, c.height_cm))  AS dim_w,
    LEAST(c.length_cm, c.width_cm, c.height_cm)        AS dim_h
  FROM public.parts_categories c
  WHERE c.weight_avg_kg IS NOT NULL
),
calcs AS (
  SELECT
    d.*,
    -- Объёмный вес по формуле Korea Post EMS: L×W×H / 6000
    ROUND((d.dim_l * d.dim_w * d.dim_h / 6000.0)::numeric, 3) AS vol_w,
    -- Упаковка
    CASE
      WHEN d.weight_avg_kg > 30
        THEN ROUND((d.weight_avg_kg + 15)::numeric, 3)
      ELSE
        ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3)
    END AS packed_w,
    -- size formula
    ROUND((d.dim_l + (d.dim_w + d.dim_h) * 2)::numeric, 1) AS size_f
  FROM dims d
),
routed AS (
  SELECT
    c.*,
    CASE
      WHEN c.weight_avg_kg > 30                              THEN 'SEA'
      WHEN c.packed_w <= 30
       AND c.size_f   <= 300
       AND c.dim_l    <= 150                                 THEN 'EMS'
      WHEN GREATEST(c.packed_w, c.vol_w) <= 70
       AND c.size_f   <= 419
       AND c.dim_l    <= 270                                 THEN 'EMS_PREMIUM'
      ELSE                                                        'SEA'
    END AS route_method
  FROM calcs c
)
SELECT
  r.id,
  r.parent_id,
  r.name_ru,
  r.name_en,
  r.slug,
  r.weight_avg_kg,
  r.weight_min_kg,
  r.weight_max_kg,
  r.dim_l AS length_cm,
  r.dim_w AS width_cm,
  r.dim_h AS height_cm,
  r.vol_w    AS vol_weight_kg,
  r.packed_w AS packed_weight_kg,
  -- billed зависит от метода: EMS не учитывает объёмный вес
  CASE r.route_method
    WHEN 'EMS'         THEN r.packed_w
    ELSE                    GREATEST(r.packed_w, r.vol_w)
  END AS billed_weight_kg,
  r.size_f AS size_formula_cm,
  r.route_method AS ship_method,
  r.logistics_notes,
  r.requires_l3,
  CASE
    WHEN r.parent_id IS NULL THEN 1
    WHEN EXISTS (
      SELECT 1 FROM public.parts_categories p
      WHERE p.id = r.parent_id AND p.parent_id IS NULL
    ) THEN 2
    ELSE 3
  END AS level

FROM routed r;
