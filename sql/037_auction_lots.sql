-- Аукционы Кореи: лоты предстоящих торгов и история проданных.
-- Запустить в Supabase Dashboard → SQL Editor.
--
-- ─── Три решения, которые потом дорого менять ────────────────────────────
--
-- 1. ПРЕФИКС `auction_`, а не `kcar_`. В проекте уже есть cars_seen и
--    car_names — снимки объявлений Encar, то есть совсем другой домен с
--    похожим словом «car» в имени. Аукционные лоты к ним отношения не имеют:
--    у них другой жизненный цикл (торги в конкретный день), другие цены
--    (старт и молоток вместо цены объявления) и другой источник. Префикс
--    домена ставит границу так же, как parts_* и blog_* у соседей.
--
-- 2. КОЛОНКА `source` С ПЕРВОГО ДНЯ, хотя пока подключён один KCar. Замер
--    09.2026 по витрине-источнику: KCar 371 лот, Lotte 917, SK 403 — три
--    площадки в одном разделе. Схема под одну площадку означала бы миграцию
--    с переносом данных, как только добавится вторая. Ключ составной
--    (source, external_id), потому что идентификаторы у площадок свои:
--    у KCar это CA20389939, у Lotte и SK формат другой.
--
-- 3. ДВЕ ТАБЛИЦЫ, И ДЕЛЕНИЕ ПО ВЕСУ, А НЕ ПО ВРЕМЕНИ. auction_lots несёт
--    фотографии (44 ссылки на лот ≈ 5 КБ) и лист осмотра; при ~600 лотах в
--    неделю за пять лет это под гигабайт. auction_results — тонкая строка
--    без фото и осмотра, только цены и оценка: её читает прогноз молотка, и
--    хранить её можно вечно. Рабочий набор чистится по дате, история — нет.
--
-- ⚠️ ЕДИНИЦЫ ЦЕН. Площадка отдаёт стартовую цену в ВОНАХ, а цену молотка
-- в 만원 (×10 000). Здесь ВСЁ приведено к вонам — в базе смешения единиц нет.
-- Это тот же класс ошибки, что стоил проекту двух дефектов на ценах Encar
-- (CLAUDE.md, «Цены и курсы»); нормализация живёт в src/lib/kcar/normalize.ts
-- и больше нигде.

-- ═════════════════════════════════════════════════════════════════════════
-- Лоты, выставленные на торги
-- ═════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS auction_lots (
  source            text        NOT NULL,
  external_id       text        NOT NULL,

  session           integer,
  lane              text,
  auction_code      text,
  auction_date      date,
  auction_window    text,
  site              text,
  lot_no            integer,
  plate             text,

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
  usage             text,

  grade_ext         text,
  grade_int         text,
  defect_count      integer,
  defect_parts      text[]      NOT NULL DEFAULT '{}',
  mortgages         integer,
  seizures          integer,

  start_price_krw   bigint,
  reserve_price_krw bigint,
  hammer_price_krw  bigint,
  status            text,

  remarks           text,
  notices           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  conditions        text[]      NOT NULL DEFAULT '{}',
  blocked_export    boolean     NOT NULL DEFAULT false,
  doc_days          integer,

  vin               text,
  engine_cc         integer,
  body_type         text,
  seats             integer,
  drive             text,
  inspection        jsonb,
  photos            text[]      NOT NULL DEFAULT '{}',
  photo_count       integer     NOT NULL DEFAULT 0,
  diagram_url       text,
  source_url        text,

  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (source, external_id)
);

COMMENT ON TABLE auction_lots IS
  'Лоты корейских автоаукционов, выставленные на ближайшие торги. Рабочий '
  'набор витрины: спецификация, оценка площадки, лист осмотра, фотографии, '
  'стартовая цена. Обновляется кроном раз в сутки через /api/kcar/sync. '
  'Строки старых торгов можно чистить по auction_date — итоги сделок '
  'остаются в auction_results.';

COMMENT ON COLUMN auction_lots.source IS
  'Площадка: kcar | lotte | sk. Идентификаторы у них не пересекаются, '
  'поэтому ключ составной.';
COMMENT ON COLUMN auction_lots.external_id IS
  'Идентификатор лота у площадки. У KCar это CA20389939 — он же зашит в '
  'пути к фотографиям, по нему сходятся данные API аукциона и карточки лота.';
COMMENT ON COLUMN auction_lots.start_price_krw IS
  'Стартовая цена торгов, ВОНЫ. Систематически ниже цены продажи: медиана '
  'превышения +8.2% по 11 537 сделкам, поэтому показывать её как цену '
  'машины нельзя — нужен прогноз из auction_results.';
COMMENT ON COLUMN auction_lots.reserve_price_krw IS 'Резерв продавца, ВОНЫ.';
COMMENT ON COLUMN auction_lots.hammer_price_krw IS
  'Цена молотка, ВОНЫ. Заполняется после торгов; до них NULL.';
COMMENT ON COLUMN auction_lots.grade_ext IS
  'Оценка кузова площадкой, 1–9. Официальная оценка аукциона, не наша.';
COMMENT ON COLUMN auction_lots.grade_int IS
  'Класс лота площадкой, A–F. Влияет на премию к старту: A +7.5%, F +11.5%.';
COMMENT ON COLUMN auction_lots.usage IS
  'Происхождение: Дилерский | Прокат | Такси/коммерческая | Лизинг | '
  'Государственная. Прокатные и коммерческие уходят дешевле.';
COMMENT ON COLUMN auction_lots.remarks IS
  'Примечание аукциониста, оригинал. Заполнено у 100% лотов и несёт половину '
  'сведений о состоянии свободным текстом. Разобранный вид — в notices и '
  'conditions; словарь покрывает ~86% позиций, поэтому оригинал храним.';
COMMENT ON COLUMN auction_lots.notices IS
  'Условия сделки и история: [{"text": "Была в прокате", "level": "warn"}]. '
  'level: block | bad | warn | info.';
COMMENT ON COLUMN auction_lots.conditions IS
  'Опись состояния из примечания: «стук по днищу», «ключей: 2».';
COMMENT ON COLUMN auction_lots.blocked_export IS
  'Площадка запретила ставки экспортёрам (수출회원 입찰금지). Такой лот '
  'показывать в каталоге бессмысленно — купить его мы не можем.';
COMMENT ON COLUMN auction_lots.inspection IS
  'Лист осмотра кузова: {"капот": "заменено"}. ТОЛЬКО повреждённые узлы, '
  'остальные считаются целыми. NULL означает, что акт не получен.';
COMMENT ON COLUMN auction_lots.photos IS
  '⚠️ ПРЯМЫЕ ССЫЛКИ на сервер площадки, а не наши копии. Могут перестать '
  'открываться в любой момент — для витрины перезаливать в своё хранилище.';
COMMENT ON COLUMN auction_lots.diagram_url IS
  'Схема повреждений из акта осмотра: рисунок кузова с отметками X/W/★.';
COMMENT ON COLUMN auction_lots.vin IS
  'Публичный API аукциона VIN не отдаёт — он добирается отдельно и может '
  'отсутствовать. Лот без VIN всё равно полезен.';

CREATE INDEX IF NOT EXISTS auction_lots_date_idx   ON auction_lots (auction_date DESC, lot_no);
CREATE INDEX IF NOT EXISTS auction_lots_model_idx  ON auction_lots (maker, model);
CREATE INDEX IF NOT EXISTS auction_lots_price_idx  ON auction_lots (start_price_krw);
CREATE INDEX IF NOT EXISTS auction_lots_year_idx   ON auction_lots (year);
CREATE INDEX IF NOT EXISTS auction_lots_source_idx ON auction_lots (source, auction_date DESC);
CREATE INDEX IF NOT EXISTS auction_lots_vin_idx    ON auction_lots (vin) WHERE vin IS NOT NULL;
-- Лоты с запретом экспорта отсекаются на каждом запросе каталога.
CREATE INDEX IF NOT EXISTS auction_lots_biddable_idx
  ON auction_lots (auction_date DESC) WHERE NOT blocked_export;

-- ═════════════════════════════════════════════════════════════════════════
-- История: чем закончились прошедшие торги
-- ═════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS auction_results (
  source            text        NOT NULL,
  external_id       text        NOT NULL,

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
  hammer_price_krw  bigint,
  sold              boolean     NOT NULL DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (source, external_id)
);

COMMENT ON TABLE auction_results IS
  'Итоги прошедших торгов — база для прогноза цены молотка. Тонкая таблица '
  'без фотографий и листа осмотра: строка дешёвая, поэтому история хранится '
  'бессрочно и растёт примерно на 600 записей в неделю. Наполняется '
  'запросом /api/kcar/sync?sessions=NNN, догнать историю — прогнать '
  'диапазон сессий.';

COMMENT ON COLUMN auction_results.hammer_price_krw IS
  '⚠️ Цена продажи, ВОНЫ. Площадка отдаёт её в 만원 (1490 = 14 900 000 ₩); '
  'пересчёт делает normalize.ts, в базу попадают только воны.';
COMMENT ON COLUMN auction_results.sold IS
  'Лот ушёл с молотка. Непроданные (~2%) остаются со sold=false и в расчёт '
  'премии не идут — иначе медиана поедет вниз на лотах, которых никто не взял.';
COMMENT ON COLUMN auction_results.session IS
  'Номер торгов у площадки (회차), сквозная нумерация: 995, 996, … По нему '
  'же догоняется история диапазоном.';

CREATE INDEX IF NOT EXISTS auction_results_model_idx   ON auction_results (maker, model, year);
CREATE INDEX IF NOT EXISTS auction_results_grade_idx   ON auction_results (grade_int);
CREATE INDEX IF NOT EXISTS auction_results_session_idx ON auction_results (source, session DESC);
-- Прогноз читает только проданные — частичный индекс режет ~2% мусора
-- и оставляет ровно те колонки, что нужны расчёту премии.
CREATE INDEX IF NOT EXISTS auction_results_premium_idx
  ON auction_results (maker, model) WHERE sold;

-- ═════════════════════════════════════════════════════════════════════════
-- Журнал запусков синхронизации
-- ═════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS auction_sync_runs (
  id            bigserial   PRIMARY KEY,
  source        text        NOT NULL DEFAULT 'kcar',
  kind          text        NOT NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  ok            boolean,
  fetched       integer     NOT NULL DEFAULT 0,
  upserted      integer     NOT NULL DEFAULT 0,
  enriched      integer     NOT NULL DEFAULT 0,
  error         text,
  notes         jsonb
);

COMMENT ON TABLE auction_sync_runs IS
  'Журнал прогонов синхронизации. Парсер ходит на чужие сайты без '
  'API-контракта, и молчаливая деградация здесь опаснее падения: витрина '
  'продолжит показывать позавчерашние лоты, и никто не заметит. По этой '
  'таблице видно возраст данных и причину сбоя.';
COMMENT ON COLUMN auction_sync_runs.kind IS 'lots — лоты торгов, sales — итоги.';
COMMENT ON COLUMN auction_sync_runs.enriched IS
  'Скольким лотам добрали VIN, лист осмотра и галерею. Заметно меньше '
  'fetched — это норма, а не сбой.';

CREATE INDEX IF NOT EXISTS auction_sync_runs_recent_idx
  ON auction_sync_runs (source, kind, started_at DESC);

-- Таблицы читает только серверный код через service-role ключ, анонимного
-- доступа нет — тот же режим, что у blog_posts и cars_seen. RLS не включаем.
