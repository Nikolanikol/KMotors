-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ 011: Per-product вес через ценовую интерполяцию
--
-- Метод: weight = weight_min + price_percentile × (weight_max - weight_min)
-- price_percentile = (price - P10) / (P90 - P10) внутри L3 категории
-- P10/P90 отсекают выбросы (аксессуары в L3, Brembo-комплекты)
-- ═══════════════════════════════════════════════════════════════════

DROP MATERIALIZED VIEW IF EXISTS v_product_weight;

CREATE MATERIALIZED VIEW v_product_weight AS
WITH price_bounds AS (
  SELECT
    subcategory_id,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY price_krw) AS p10,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY price_krw) AS p90
  FROM parts_products
  WHERE price_krw > 0
    AND subcategory_id >= 900000
  GROUP BY subcategory_id
)
SELECT
  p.id AS product_id,
  p.subcategory_id,
  p.price_krw,
  cat.weight_min_kg,
  cat.weight_max_kg,
  pb.p10,
  pb.p90,
  -- Percentile clamped to [0, 1]
  LEAST(1.0, GREATEST(0.0,
    CASE WHEN pb.p90 > pb.p10
      THEN (p.price_krw - pb.p10) / (pb.p90 - pb.p10)
      ELSE 0.5
    END
  )) AS price_pct,
  -- Interpolated weight
  ROUND((
    cat.weight_min_kg + LEAST(1.0, GREATEST(0.0,
      CASE WHEN pb.p90 > pb.p10
        THEN (p.price_krw - pb.p10) / (pb.p90 - pb.p10)
        ELSE 0.5
      END
    )) * (cat.weight_max_kg - cat.weight_min_kg)
  )::numeric, 2) AS estimated_weight_kg
FROM parts_products p
JOIN parts_categories cat ON cat.id = p.subcategory_id
JOIN price_bounds pb ON pb.subcategory_id = p.subcategory_id
WHERE p.price_krw > 0
  AND cat.weight_min_kg IS NOT NULL
  AND cat.weight_max_kg IS NOT NULL;

CREATE UNIQUE INDEX ON v_product_weight (product_id);
CREATE INDEX ON v_product_weight (subcategory_id);

-- Для товаров БЕЗ L3 (на L2 или NULL) — fallback к category avg
-- Frontend logic: v_product_weight → if miss → v_category_logistics
