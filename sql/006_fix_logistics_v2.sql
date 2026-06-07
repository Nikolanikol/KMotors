-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ v2: Три исправления логистической логики
--
-- Фикс 1: Упаковка зависит от веса
--   ≤ 30 кг  → картонная коробка: actual * 1.05 + 0.3
--   > 30 кг  → деревянная обрешётка: actual + 15
--
-- Фикс 2: Агрегаты >30 кг → всегда SEA (бизнес-правило)
--   Отправлять МКПП/АКПП авиа экономически нецелесообразно
--
-- Фикс 3: Данные — занижены габариты плоских кузовных деталей
--   Кузовные панели (крыло/дверь/капот): реалистичные ср. габариты
-- ═══════════════════════════════════════════════════════════════════

-- ── ШАГ 1: Обновить габариты кузовных панелей ─────────────────────
-- Было: 110×55×10 (занижено, vol=12.1кг)
-- Стало: 130×85×15 (реалистичный средний между крылом и дверью)
-- vol = 130*85*15/5000 = 33.15кг → EMS_PREMIUM
UPDATE public.parts_categories SET
  length_cm = 130,
  width_cm  = 85,
  height_cm = 15
WHERE id = 18001;

-- ── ШАГ 2: Пересоздать view ───────────────────────────────────────
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
    -- Объёмный вес
    ROUND((d.dim_l * d.dim_w * d.dim_h / 5000)::numeric, 3)
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
  -- billed: для EMS_PREMIUM max(packed, vol); для EMS = packed
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

-- ── ПРОВЕРКА (запустить тест из 005_logistics_tests.sql) ──────────
-- Ожидаемый результат: все строки ✓ PASS
