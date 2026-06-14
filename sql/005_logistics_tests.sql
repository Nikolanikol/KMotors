-- ═══════════════════════════════════════════════════════════════════
-- ТЕСТЫ логистической логики
-- Запускать ПОСЛЕ применения 005_fix_logistics_v2.sql
-- Все тесты должны пройти (ship_method = expected_method)
-- ═══════════════════════════════════════════════════════════════════

WITH test_cases AS (
  SELECT * FROM (VALUES
    -- (name_ru,                         expected_method,  reason)

    -- ── АГРЕГАТЫ: всегда SEA (weight_avg > 30) ───────────────────
    ('АКПП',                             'SEA',  'Агрегат >30кг → всегда море'),
    ('МКПП',                             'SEA',  'Агрегат >30кг → всегда море'),

    -- ── SEA по ГАБАРИТАМ (размер > лимита) ───────────────────────
    ('Бамперы',                          'SEA',  'vol=85кг + size=379>300 → море'),

    -- ── EMS_PREMIUM ───────────────────────────────────────────────
    -- (нет агрегатов, но vol или packed между 30-70, размер OK)
    -- После фикса данных кузовных панелей ожидаем EMS_PREMIUM:
    ('Кузовные панели',                  'EMS_PREMIUM', 'Реальный vol ~30-54кг → EMS_PREMIUM'),

    -- ── EMS (лёгкие/средние, всё в пределах) ─────────────────────
    ('Датчики',                          'EMS',  '0.3кг, мелкие'),
    ('Масляный фильтр',                  'EMS',  '0.4кг, мелкий'),
    ('Колодки тормозные передние (к-т)', 'EMS',  '2кг, компактные'),
    ('Диск тормозной передний',          'EMS',  '9кг, плоский диск'),
    ('Амортизатор / стойка (1 шт)',      'EMS',  '6кг, длинный но packed≤30'),
    ('Приводные валы',                   'EMS',  '7кг, L=90 длинный'),
    ('Сцепление',                        'EMS',  '8кг, компакт'),
    ('Опоры двигателя и КПП',           'EMS',  '3.5кг'),
    ('Зеркала',                          'EMS',  '2кг, хрупкие но EMS')

  ) AS t(name_ru, expected_method, reason)
),
results AS (
  SELECT
    tc.name_ru,
    tc.expected_method,
    tc.reason,
    vl.ship_method        AS actual_method,
    vl.weight_avg_kg,
    vl.packed_weight_kg,
    vl.vol_weight_kg,
    vl.billed_weight_kg,
    vl.size_formula_cm,
    CASE WHEN vl.ship_method = tc.expected_method THEN '✓ PASS' ELSE '✗ FAIL' END AS result
  FROM test_cases tc
  LEFT JOIN public.v_category_logistics vl ON vl.name_ru = tc.name_ru
)
SELECT
  result,
  name_ru,
  expected_method,
  actual_method,
  weight_avg_kg,
  packed_weight_kg,
  vol_weight_kg,
  size_formula_cm,
  reason
FROM results
ORDER BY result DESC, name_ru;

-- ── Итоговый счёт ─────────────────────────────────────────────────
-- SELECT
--   COUNT(*) FILTER (WHERE ship_method = expected_method) AS passed,
--   COUNT(*) AS total
-- FROM results;
