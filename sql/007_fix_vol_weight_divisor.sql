-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ 007: Исправить делитель объёмного веса 5000 → 6000
--
-- Korea Post EMS использует формулу: L × W × H / 6000
-- Источник: https://ems.epost.go.kr (официальный калькулятор)
--
-- Делитель 5000 — стандарт IATA для авиагрузовых перевозчиков,
-- он занижает допустимый вес и ошибочно переводит часть товаров
-- в EMS_PREMIUM/SEA вместо EMS.
--
-- Затронутые категории (пограничные случаи):
--   - Кузовные панели (18001): vol 5000=33.2кг → 6000=27.6кг (EMS_PREMIUM→EMS_PREMIUM, без изм.)
--   - Фары (260201):           vol 5000=10.5кг → 6000=8.75кг
--   - Ковры (310101):          vol 5000=2.9кг  → 6000=2.4кг
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
    ROUND((d.dim_l * d.dim_w * d.dim_h / 6000.0)::numeric, 3)
      AS vol_w,
    -- Упаковка: лёгкая коробка vs деревянная обрешётка
    CASE
      WHEN d.weight_avg_kg > 30
        THEN ROUND((d.weight_avg_kg + 15)::numeric, 3)
      ELSE
        ROUND((d.weight_avg_kg * 1.05 + 0.3)::numeric, 3)
    END AS packed_w,
    -- size formula по отсортированным сторонам
    ROUND((d.dim_l + (d.dim_w + d.dim_h) * 2)::numeric, 1)
      AS size_f
  FROM dims d
)
SELECT
  c.id,
  c.parent_id,
  c.name_ru,
  c.name_en,
  c.slug,
  c.weight_avg_kg,
  c.weight_min_kg,
  c.weight_max_kg,
  c.dim_l AS length_cm,
  c.dim_w AS width_cm,
  c.dim_h AS height_cm,
  c.vol_w           AS vol_weight_kg,
  c.packed_w        AS packed_weight_kg,
  GREATEST(c.packed_w, c.vol_w) AS billed_weight_kg,
  c.size_f          AS size_formula_cm,

  -- ── Маршрутизация ─────────────────────────────────────────────
  CASE
    -- Правило 0: агрегаты >30 кг физического веса → всегда море
    WHEN c.weight_avg_kg > 30
      THEN 'SEA'

    -- EMS Standard: тарифицируется по packed (без объёмного)
    WHEN c.packed_w <= 30
     AND c.size_f  <= 300
     AND c.dim_l   <= 150
      THEN 'EMS'

    -- EMS Premium (курьер): max(packed, vol)
    WHEN GREATEST(c.packed_w, c.vol_w) <= 70
     AND c.size_f <= 419
     AND c.dim_l  <= 270
      THEN 'EMS_PREMIUM'

    ELSE 'SEA'
  END AS ship_method,

  c.logistics_notes,
  c.requires_l3,
  CASE
    WHEN c.parent_id IS NULL THEN 1
    WHEN EXISTS (
      SELECT 1 FROM public.parts_categories p
      WHERE p.id = c.parent_id AND p.parent_id IS NULL
    ) THEN 2
    ELSE 3
  END AS level

FROM calcs c;
