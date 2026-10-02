-- Лоты carnect.biz: пять аукционов и HeyDealer в одной таблице.
-- Запустить в Supabase Dashboard → SQL Editor. Повторный запуск безопасен
-- (IF NOT EXISTS), существующие таблицы не трогает.
--
-- ─── Решения, которые потом дорого менять ────────────────────────────────
--
-- 1. ОТДЕЛЬНАЯ ТАБЛИЦА, а не auction_lots. На auction_lots живёт публичная
--    витрина /auction с данными dokanmazad. Новый источник обкатывается в
--    админке, и всё это время старая витрина обязана работать как работала.
--    При переключении витрина начинает читать отсюда, dokanmazad выключается,
--    auction_lots остаётся для истории K Car (auction_results — отдельно).
--
-- 2. ОДНА ТАБЛИЦА НА АУКЦИОНЫ И HeyDealer. Ради этого всё и затевалось:
--    общий фильтр по всем источникам — это один запрос к одной таблице, а
--    разбивка «где сколько» — GROUP BY по тем же условиям. Механика у
--    HeyDealer другая (нет дня торгов, своё окончание у каждой машины), и
--    это видно по колонкам: auction_date у него пуст, end_at заполнен.
--
-- 3. НОРМАЛИЗОВАННЫЕ КОЛОНКИ РЯДОМ С СЫРЫМ ОБЪЕКТОМ. Фильтр ходит только по
--    make / model_group / year / km / fuel / price_krw — они приведены к
--    общему виду в src/lib/carnect/normalize.ts. Всё, что прислал carnect,
--    лежит целиком в raw: поменяем правила нормализации — пересчитаем из
--    raw, не обходя источник заново.
--
-- 4. ЦЕНА С ВИДОМ. price_kind говорит, что это за число:
--      start — стартовая цена торгов (Autobell, K Car, SK, Autohub);
--      fixed — фиксированная цена выкупа (HeyDealer Instant);
--      none  — цены нет (Lotte — carnect её не отдаёт; HeyDealer Self и Zero —
--              только ставки). price_krw тогда NULL, а не 0.
--    Фильтр «до ₩N» обязан помнить про none: молча выкидывать такие лоты
--    значит прятать половину выдачи.
--
-- 5. «УШЁЛ» — ТОЛЬКО ПОСЛЕ ДВУХ ПОЛНЫХ ОБХОДОВ ПОДРЯД. Пока мы листаем
--    список, у carnect появляются и исчезают машины, страницы сдвигаются, и
--    живой лот можно пропустить. miss_count растёт на каждом ПОЛНОМ обходе,
--    где лота не было, и сбрасывается, когда он снова виден; gone_at ставится
--    при miss_count >= 2. Обход, прерванный ошибкой, счётчики не трогает.
--
-- Таблицу читает только серверный код через service-role ключ — тот же
-- режим, что у auction_lots и cars_seen. RLS не включаем.

CREATE TABLE IF NOT EXISTS carnect_lots (
  -- ─── Ключ ───
  -- Площадка в адресах carnect: glovis | kcar | lotte | sk | autohub | heydealer.
  house             text        NOT NULL,
  -- lotId аукциона ("SA~SA202609080018~3") или id машины HeyDealer ("lG2v2JjQ").
  external_id       text        NOT NULL,

  -- ─── Откуда ───
  -- Аукционный дом внутри площадки: код и название (Autobell: 1100 Bundang).
  venue_code        text,
  venue             text,
  -- Тип аукциона HeyDealer: self | customer_zero | fixed_price_zero.
  hey_type          text,

  -- ─── Для фильтра (нормализовано) ───
  make              text,         -- склеенная марка: «Chevrolet (Daewoo)» → Chevrolet
  model_group       text,         -- «Grandeur», «Carnival»; NULL — не распознали
  year              smallint,
  km                integer,
  fuel              text,         -- gasoline | diesel | hybrid | electric | lpg | other
  price_krw         bigint,       -- ВОНЫ; NULL при price_kind = none
  price_kind        text NOT NULL DEFAULT 'none',  -- start | fixed | none

  -- ─── Для показа ───
  title             text,         -- модель с комплектацией, как у источника
  grade             text,
  trans             text,
  photo_url         text,         -- главное фото, на CDN площадки
  auction_date      date,         -- день торгов (аукционы)
  end_at            timestamptz,  -- окончание торгов (HeyDealer)
  status            text,
  insp_grade        text,         -- оценка осмотра площадки; шкалы у всех разные
  lot_no            text,

  -- ─── Служебное ───
  raw               jsonb   NOT NULL,                -- объект carnect целиком
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  miss_count        smallint    NOT NULL DEFAULT 0,
  gone_at           timestamptz,

  PRIMARY KEY (house, external_id)
);

-- Выборка всегда идёт по живым лотам, поэтому индексы частичные.
CREATE INDEX IF NOT EXISTS carnect_lots_live_model_idx
  ON carnect_lots (make, model_group, year) WHERE gone_at IS NULL;
CREATE INDEX IF NOT EXISTS carnect_lots_live_source_idx
  ON carnect_lots (house, venue_code, hey_type) WHERE gone_at IS NULL;
CREATE INDEX IF NOT EXISTS carnect_lots_live_price_idx
  ON carnect_lots (price_krw) WHERE gone_at IS NULL;
-- Обход помечает пропавших по (house, hey_type/venue) — индекс под это.
CREATE INDEX IF NOT EXISTS carnect_lots_seen_idx
  ON carnect_lots (house, last_seen_at);

COMMENT ON TABLE carnect_lots IS
  'Лоты аукционов (Autobell, K Car, Lotte, SK, Autohub) и машины HeyDealer '
  'с carnect.biz. Синк — src/lib/carnect/sync.ts, задания carnect-* в '
  'scripts/cron/run.mjs. Устройство источника — docs/carnect.md.';
COMMENT ON COLUMN carnect_lots.price_kind IS
  'start — стартовая цена торгов; fixed — фиксированная (HeyDealer Instant); '
  'none — цены нет (Lotte, HeyDealer Self/Zero), price_krw NULL.';
COMMENT ON COLUMN carnect_lots.miss_count IS
  'Сколько ПОЛНЫХ обходов подряд лота не было в списке. gone_at ставится '
  'при >= 2: один пропуск бывает от сдвига страниц посреди обхода.';

-- ═════════════════════════════════════════════════════════════════════════
-- Поиск: выдача + разбивка по источникам + списки марок и моделей
-- ═════════════════════════════════════════════════════════════════════════
--
-- Одна функция на всё, а не запрос выдачи плюс отдельные запросы счётчиков
-- в коде: условия фильтра обязаны быть ОДИНАКОВЫМИ для выдачи и для чисел
-- рядом с ней. Две копии условий разошлись бы при первой правке, и плашка
-- «Lotte 21» обещала бы не то, что показывает сетка.
--
-- ⚠️ СЧЁТЧИК ИЗМЕРЕНИЯ СЧИТАЕТСЯ БЕЗ ФИЛЬТРА ПО САМОМУ ИЗМЕРЕНИЮ (правило из
-- CLAUDE.md, «Фасет собирается БЕЗ СВОЕГО измерения»): разбивка по источникам —
-- без фильтра источников, марки — без марки и модели, модели — без модели.
-- Иначе после выбора Lotte остальные площадки показали бы 0, и переключиться
-- было бы не на что.
--
-- Источник в фильтре и в разбивке — строка-ключ:
--   'lotte'                 вся площадка;
--   'glovis:1100'           аукционный дом площадки (venue_code);
--   'heydealer:customer_zero' тип HeyDealer.
-- Ключ площадки целиком совпадает и с её домами/типами.
--
-- Параметры (jsonb, все необязательные): make, model_group, year_min,
-- year_max, km_max, fuel (массив), price_max, include_no_price (по умолчанию
-- true — лоты без цены НЕ выкидываются фильтром цены), src (массив ключей),
-- sort (new | price | year | km), limit (≤ 96), offset.
--
-- Динамического SQL нет: каждое условие — «параметр пуст ИЛИ совпадает»,
-- значения приходят только параметрами. Подстановка строк невозможна.

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
  'модели. Счётчик измерения — без фильтра по самому измерению. Вызывается '
  'из src/lib/carnect/query.ts.';
