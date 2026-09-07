-- Аукцион K Car (케이카 옥션): лоты предстоящих торгов и история проданных.
-- Запустить в Supabase Dashboard → SQL Editor.
--
-- Зачем вторая таблица с историей. Стартовая цена лота занижена относительно
-- того, за сколько он реально уходит: медиана превышения по 11 537 сделкам —
-- +8.2%, и она растёт с ухудшением класса кузова (A +7.5%, B +10.9%, F +11.5%).
-- Без истории мы можем показать только старт, то есть заведомо не ту цену,
-- по которой машину получится купить. kcar_sales — база для прогноза.
--
-- Почему ключ text, а не bigserial: CAR_ID вида CA20389939 — это идентификатор
-- лота у самого KCar. Он же зашит в пути к фотографиям, поэтому по нему
-- сходятся данные из публичного API аукциона и карточки с VIN и листом
-- осмотра. Свой суррогатный ключ здесь только мешал бы склейке.

-- ─────────────────────────────────────────────────────────────────────────
-- Лоты, выставленные на ближайшие торги
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kcar_lots (
  car_id            text        PRIMARY KEY,          -- CA20389939
  session           integer,                          -- номер сессии (회차)
  lane              text,                             -- A/B/C/D
  auction_code      text,                             -- AC20260902
  auction_date      date,
  auction_window    text,                             -- «2026-09-08 13:00~18:00»
  site              text,                             -- Осан / Седжон
  lot_no            integer,
  plate             text,                             -- госномер, 166호2966

  -- Названия храним и в латинице, и в оригинале: латиница для витрины,
  -- корейский — для переписки с площадкой и для поиска по лоту.
  maker             text,
  maker_ko          text,
  model             text,
  model_ko          text,
  trim              text,
  name_ko           text,

  year              integer,
  first_reg         date,
  mileage_km        integer,
  fuel              text,
  transmission      text,
  color             text,
  usage             text,                             -- дилерский / прокат / лизинг

  -- Оценка аукциона: кузов 1–9 и класс A–F. Это официальная оценка
  -- площадки, не наша.
  grade_ext         text,
  grade_int         text,
  defect_count      integer,
  defect_parts      text[]      NOT NULL DEFAULT '{}',
  mortgages         integer,                          -- залоги
  seizures          integer,                          -- аресты

  start_price_krw   bigint,
  reserve_price_krw bigint,
  status            text,

  -- ⚠️ Примечание аукциониста заполнено у 100% лотов и несёт половину
  -- сведений о состоянии: течи, стуки, коррозия, число ключей, сроки
  -- документов, запрет ставок экспортёрам. Держим и разобранный вид,
  -- и оригинал — разбор словарный и покрывает ~86% позиций.
  remarks           text,
  notices           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  conditions        text[]      NOT NULL DEFAULT '{}',
  blocked_export    boolean     NOT NULL DEFAULT false,
  doc_days          integer,

  -- Поля ниже приходят из карточки лота (VIN, лист осмотра, вся галерея).
  -- Публичный API аукциона их не отдаёт, поэтому они могут быть пустыми:
  -- витрина-источник иногда отстаёт от появления лота в торгах.
  vin               text,
  engine_cc         integer,
  body_type         text,
  seats             integer,
  drive             text,
  inspection        jsonb,                            -- {узел: статус}, только повреждённые
  photos            text[]      NOT NULL DEFAULT '{}',
  photo_count       integer     NOT NULL DEFAULT 0,
  diagram_url       text,                             -- схема повреждений
  source_url        text,                             -- карточка на kcarauction

  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kcar_lots_auction_date_idx ON kcar_lots (auction_date DESC, lot_no);
CREATE INDEX IF NOT EXISTS kcar_lots_maker_model_idx  ON kcar_lots (maker, model);
CREATE INDEX IF NOT EXISTS kcar_lots_price_idx        ON kcar_lots (start_price_krw);
CREATE INDEX IF NOT EXISTS kcar_lots_year_idx         ON kcar_lots (year);
CREATE INDEX IF NOT EXISTS kcar_lots_vin_idx          ON kcar_lots (vin) WHERE vin IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- История: чем закончились прошедшие торги
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kcar_sales (
  car_id            text        PRIMARY KEY,
  session           integer     NOT NULL,
  lane              text,
  auction_date      date,
  site              text,

  maker             text,
  model             text,
  trim              text,
  year              integer,
  mileage_km        integer,
  fuel              text,
  transmission      text,
  usage             text,

  grade_ext         text,
  grade_int         text,
  defect_count      integer,

  start_price_krw   bigint,
  reserve_price_krw bigint,
  -- ⚠️ У самого KCar цена молотка приходит в 만원 (десятки тысяч вон),
  -- а стартовая — в вонах. Здесь обе уже приведены к вонам; смешивать
  -- единицы в одной таблице нельзя, на этом легко потерять множитель 10 000.
  hammer_price_krw  bigint,
  sold              boolean     NOT NULL DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kcar_sales_model_idx   ON kcar_sales (maker, model, year);
CREATE INDEX IF NOT EXISTS kcar_sales_grade_idx   ON kcar_sales (grade_int);
CREATE INDEX IF NOT EXISTS kcar_sales_session_idx ON kcar_sales (session DESC);
CREATE INDEX IF NOT EXISTS kcar_sales_sold_idx    ON kcar_sales (sold) WHERE sold;

-- ─────────────────────────────────────────────────────────────────────────
-- Журнал запусков синхронизации
-- ─────────────────────────────────────────────────────────────────────────
-- Парсер ходит на чужие сайты без API-контракта. Молчаливая деградация здесь
-- опаснее падения: витрина продолжит показывать позавчерашние лоты, и никто
-- не заметит. Поэтому каждый запуск оставляет строку, а витрина может
-- показать возраст данных.
CREATE TABLE IF NOT EXISTS kcar_sync_runs (
  id            bigserial   PRIMARY KEY,
  kind          text        NOT NULL,                 -- lots | sales
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  ok            boolean,
  fetched       integer     NOT NULL DEFAULT 0,
  upserted      integer     NOT NULL DEFAULT 0,
  enriched      integer     NOT NULL DEFAULT 0,       -- сколько лотов получили VIN/осмотр
  error         text,
  notes         jsonb
);

CREATE INDEX IF NOT EXISTS kcar_sync_runs_recent_idx ON kcar_sync_runs (kind, started_at DESC);

-- Таблицы читает только серверный код через service-role ключ; анонимного
-- доступа к ним нет, как и у blog_posts. RLS не включаем — тот же режим,
-- что у остальных служебных таблиц проекта.
