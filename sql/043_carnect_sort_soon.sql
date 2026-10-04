-- 043: сортировка «скоро торги» в carnect_search (04.10.2026).
--
-- Выполняется ВРУЧНУЮ в Supabase SQL Editor, как и 042. Меняется только
-- функция: тело то же, что в 042, плюс ветка sort = 'soon' в ORDER BY.
-- Таблицу и данные не трогает; откат — выполнить функцию из 042 заново.
--
-- Порядок выкладки любой: до выполнения неизвестный sort = 'soon' не
-- совпадает ни с одной веткой ORDER BY, и выдача идёт как «новые».

CREATE OR REPLACE FUNCTION carnect_search(p jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH f AS (
  SELECT
    nullif(p->>'make', '')                                   AS make,
    nullif(p->>'model_group', '')                            AS model_group,
    (p->>'year_min')::int                                    AS year_min,
    (p->>'year_max')::int                                    AS year_max,
    (p->>'km_max')::int                                      AS km_max,
    (p->>'price_max')::bigint                                AS price_max,
    coalesce((p->>'include_no_price')::boolean, true)        AS include_no_price,
    CASE WHEN jsonb_typeof(p->'fuel') = 'array' AND jsonb_array_length(p->'fuel') > 0
         THEN ARRAY(SELECT jsonb_array_elements_text(p->'fuel')) END AS fuel,
    CASE WHEN jsonb_typeof(p->'src') = 'array' AND jsonb_array_length(p->'src') > 0
         THEN ARRAY(SELECT jsonb_array_elements_text(p->'src')) END  AS src,
    coalesce(nullif(p->>'sort', ''), 'new')                  AS sort,
    least(coalesce((p->>'limit')::int, 24), 96)              AS lim,
    greatest(coalesce((p->>'offset')::int, 0), 0)            AS off
),
-- Живые лоты с ключом источника и флагами каждого условия по отдельности:
-- так любой счётчик берёт «все условия, кроме своего», не повторяя их.
base AS (
  SELECT l.*,
    l.house || CASE
      WHEN l.hey_type   IS NOT NULL THEN ':' || l.hey_type
      WHEN l.venue_code IS NOT NULL THEN ':' || l.venue_code
      ELSE '' END                                                         AS src_key,
    (f.make IS NULL OR l.make = f.make)                                    AS ok_make,
    (f.model_group IS NULL OR l.model_group = f.model_group)               AS ok_model,
    (f.year_min IS NULL OR l.year >= f.year_min)
      AND (f.year_max IS NULL OR l.year <= f.year_max)
      AND (f.km_max IS NULL OR l.km <= f.km_max)
      AND (f.fuel IS NULL OR l.fuel = ANY (f.fuel))
      AND (f.price_max IS NULL
           OR l.price_krw <= f.price_max
           OR (l.price_krw IS NULL AND f.include_no_price))                AS ok_rest,
    (f.src IS NULL OR l.house = ANY (f.src)
      OR (l.house || ':' || coalesce(l.hey_type, l.venue_code, '')) = ANY (f.src)) AS ok_src
  FROM carnect_lots l, f
  WHERE l.gone_at IS NULL
),
hit AS (SELECT * FROM base WHERE ok_make AND ok_model AND ok_rest AND ok_src)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM hit),
  'rows', coalesce((
    SELECT jsonb_agg(to_jsonb(r) - 'raw' - 'ok_make' - 'ok_model' - 'ok_rest' - 'ok_src')
    FROM (
      SELECT h.* FROM hit h, f
      ORDER BY
        CASE WHEN f.sort = 'price' THEN h.price_krw END ASC NULLS LAST,
        CASE WHEN f.sort = 'year'  THEN h.year      END DESC NULLS LAST,
        CASE WHEN f.sort = 'km'    THEN h.km        END ASC NULLS LAST,
        -- «Скоро торги»: сперва то, что ещё впереди, ближайшее первым.
        -- Точное время — end_at (конец торгов HeyDealer, выход лота K Car и
        -- др.); у остальных только день, он считается по корейской полуночи.
        -- Прошедшими считаем: точное время в прошлом или день торгов закончился.
        CASE WHEN f.sort = 'soon' THEN
          coalesce(h.end_at, (h.auction_date + 1)::timestamp AT TIME ZONE 'Asia/Seoul') < now()
        END ASC NULLS LAST,
        CASE WHEN f.sort = 'soon' THEN
          coalesce(h.end_at, h.auction_date::timestamp AT TIME ZONE 'Asia/Seoul')
        END ASC NULLS LAST,
        h.first_seen_at DESC,
        -- Второй ключ обязателен (CLAUDE.md, «.range()/.limit() по
        -- неуникальному ключу»): first_seen_at одинаков у целой партии
        -- upsert, без него строки терялись бы между страницами.
        h.house, h.external_id
      LIMIT (SELECT lim FROM f) OFFSET (SELECT off FROM f)
    ) r
  ), '[]'::jsonb),
  -- Разбивка по источникам: все условия, КРОМЕ src.
  'by_source', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'house', house, 'venue_code', venue_code, 'venue', venue, 'hey_type', hey_type, 'n', n)
      ORDER BY house, venue_code, hey_type)
    FROM (
      SELECT house, venue_code, max(venue) AS venue, hey_type, count(*) AS n
      FROM base WHERE ok_make AND ok_model AND ok_rest
      GROUP BY house, venue_code, hey_type
    ) s
  ), '[]'::jsonb),
  -- Марки: все условия, КРОМЕ марки и модели.
  'makes', coalesce((
    SELECT jsonb_agg(jsonb_build_object('v', make, 'n', n) ORDER BY n DESC)
    FROM (SELECT make, count(*) AS n FROM base
          WHERE ok_rest AND ok_src AND make IS NOT NULL GROUP BY make) m
  ), '[]'::jsonb),
  -- Модели выбранной марки: все условия, КРОМЕ модели. Без марки — пусто:
  -- 170 моделей одним списком никто не листает.
  'models', coalesce((
    SELECT jsonb_agg(jsonb_build_object('v', model_group, 'n', n) ORDER BY n DESC)
    -- ⚠️ Псевдоним b обязателен: model_group есть и у лота, и у параметров
    -- фильтра (f), и без него Postgres отказывается («ambiguous»).
    FROM (SELECT b.model_group, count(*) AS n FROM base b, f
          WHERE f.make IS NOT NULL AND b.ok_make AND b.ok_rest AND b.ok_src AND b.model_group IS NOT NULL
          GROUP BY b.model_group) m
  ), '[]'::jsonb)
);
$$;

COMMENT ON FUNCTION carnect_search(jsonb) IS
  'Поиск по carnect_lots: выдача, total, разбивка по источникам, марки и '
  'модели. Сортировки new | price | year | km | soon. Счётчик измерения — без фильтра по самому измерению. Вызывается '
  'из src/lib/carnect/query.ts.';
