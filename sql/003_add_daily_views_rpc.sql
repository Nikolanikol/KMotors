-- Агрегация просмотров по дням — заменяет выборку 50к строк в JS
-- Запустить в Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION get_daily_views(since_date timestamptz, tz text DEFAULT 'Asia/Seoul')
RETURNS TABLE(day date, views bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    (created_at AT TIME ZONE tz)::date AS day,
    COUNT(*)                           AS views
  FROM page_views
  WHERE created_at >= since_date
  GROUP BY 1
  ORDER BY 1;
$$;
