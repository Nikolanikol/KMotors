-- Исправление ключа auction_results и признака «продан».
-- Запустить в Supabase Dashboard → SQL Editor ПОСЛЕ 037.
--
-- ─── Что было не так ─────────────────────────────────────────────────────
--
-- 1. КЛЮЧ ТЕРЯЛ НАБЛЮДЕНИЯ. Ключ (source, external_id) исходил из того, что
--    лот выставляется один раз. Это неверно: непроданный лот возвращается на
--    следующие торги с ТЕМ ЖЕ идентификатором. Замер по сессиям 975–995:
--    11 720 наблюдений, но лишь 8 798 уникальных id — 1 950 лотов
--    встречаются по 2–11 раз. Живой пример, CA20379817: 11 наблюдений за
--    975–995 — это ДЕСЯТЬ НЕДЕЛЬ, с 25.06 по 03.09. Шаг между появлениями
--    ровно 7 дней во всех одиннадцати случаях: торги идут дважды в неделю
--    (вторник — чётные сессии, четверг — нечётные), а лот ходит только в
--    четверговой серии. Продавец снижал цену с 35.5 до 30.5 млн вон и всё
--    равно не продал — к сессии 997 лот выставлен в двенадцатый раз.
--    При загрузке upsert молча оставлял последнее наблюдение, 2 922 строки
--    исчезали без следа. Ключ стал (source, external_id, session):
--    одно наблюдение — одна строка.
--
-- 2. ПРИЗНАК «ПРОДАН» БЫЛ ЛОЖНЫМ. Считалось: есть цена молотка — значит
--    продан. Но площадка заполняет это поле и у НЕПРОДАННЫХ лотов, подставляя
--    туда стартовую цену. Проверка: молоток равен старту в 16% всех строк, а
--    среди лотов, которые позже выставились снова (то есть точно не ушли), —
--    в 50%. И ни одной строки, где молоток НИЖЕ старта, во всей выборке:
--    у настоящих торгов так не бывает, а у несостоявшихся цена просто
--    копируется.
--
--    Надёжный признак — не цена, а ПОВТОРНОЕ ПОЯВЛЕНИЕ. Если тот же
--    external_id встречается в более поздней сессии, тогда он не продался.
--    Это факт из данных, а не эвристика по цене.
--
-- ⚠️ Цена этой ошибки — 5.6 процентных пункта в главной цифре модуля.
--    Медианная премия к старту: 8.2% по всем строкам (непроданные тянут её
--    вниз нулями) против 13.8% по настоящим сделкам. На лоте в 10 млн вон
--    это 560 000 ₩ разницы в прогнозе — то есть ставка ниже рынка и лот
--    уходит другому.

DROP TABLE IF EXISTS auction_results;

CREATE TABLE auction_results (
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

  relisted_later    boolean     NOT NULL DEFAULT false,
  sold              boolean     NOT NULL DEFAULT false,

  created_at        timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (source, external_id, session)
);

COMMENT ON TABLE auction_results IS
  'Наблюдения за лотами на прошедших торгах — база для прогноза цены '
  'молотка. Одна строка = один лот на одних торгах; непроданный лот '
  'возвращается на следующие с тем же external_id, поэтому session входит '
  'в ключ. Тонкая таблица без фотографий и листа осмотра: хранится '
  'бессрочно, растёт примерно на 600 строк в неделю.';

COMMENT ON COLUMN auction_results.session IS
  'Номер торгов у площадки (회차), сквозная нумерация. Входит в ключ: тот же '
  'лот на разных торгах — разные наблюдения с разной стартовой ценой.';
COMMENT ON COLUMN auction_results.hammer_price_krw IS
  '⚠️ Цена в ВОНАХ (площадка отдаёт 만원, ×10 000 — пересчёт в normalize.ts). '
  'НЕ является признаком продажи: у непроданных лотов сюда попадает '
  'стартовая цена. Смотреть на sold.';
COMMENT ON COLUMN auction_results.relisted_later IS
  'Тот же лот встречается в более поздней сессии — значит на этих торгах он '
  'НЕ ушёл. Пересчитывается функцией auction_results_refresh_sold().';
COMMENT ON COLUMN auction_results.sold IS
  'Лот действительно продан: последнее наблюдение и цена молотка есть. '
  '⚠️ У самой свежей загруженной сессии признак завышен — её лоты ещё не '
  'успели появиться повторно. Выравнивается сам по мере загрузки следующих.';

CREATE INDEX auction_results_model_idx   ON auction_results (maker, model, year);
CREATE INDEX auction_results_grade_idx   ON auction_results (grade_int);
CREATE INDEX auction_results_session_idx ON auction_results (source, session DESC);
CREATE INDEX auction_results_lot_idx     ON auction_results (source, external_id);
CREATE INDEX auction_results_premium_idx ON auction_results (maker, model) WHERE sold;

-- ═════════════════════════════════════════════════════════════════════════
-- Пересчёт признаков после загрузки
-- ═════════════════════════════════════════════════════════════════════════
-- Живёт в SQL, а не в приложении, потому что решение по строке зависит от
-- ВСЕЙ истории лота: одну строку в отрыве от остальных разметить нельзя.
-- Вызывается из syncSales после каждого upsert'а.
CREATE OR REPLACE FUNCTION auction_results_refresh_sold()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  touched integer;
BEGIN
  WITH latest AS (
    SELECT source, external_id, max(session) AS last_session
      FROM auction_results
     GROUP BY source, external_id
  )
  UPDATE auction_results r
     SET relisted_later = (r.session < l.last_session),
         sold           = (r.session = l.last_session)
                          AND r.hammer_price_krw IS NOT NULL
    FROM latest l
   WHERE r.source = l.source
     AND r.external_id = l.external_id
     AND (
           r.relisted_later IS DISTINCT FROM (r.session < l.last_session)
        OR r.sold IS DISTINCT FROM (
             (r.session = l.last_session) AND r.hammer_price_krw IS NOT NULL
           )
         );
  GET DIAGNOSTICS touched = ROW_COUNT;
  RETURN touched;
END;
$$;

COMMENT ON FUNCTION auction_results_refresh_sold() IS
  'Размечает relisted_later и sold по всей истории лота. Возвращает число '
  'изменённых строк. Идемпотентна: повторный вызов без новых данных вернёт 0.';

-- ═════════════════════════════════════════════════════════════════════════
-- Поправка к комментариям из 037: цифра премии там была занижена
-- ═════════════════════════════════════════════════════════════════════════
COMMENT ON COLUMN auction_lots.start_price_krw IS
  'Стартовая цена торгов, ВОНЫ. Систематически ниже цены продажи: медиана '
  'превышения +13.8% по 8 750 состоявшимся сделкам (сессии 975–995). '
  'Показывать её как цену машины нельзя — нужен прогноз из auction_results.';
COMMENT ON COLUMN auction_lots.grade_int IS
  'Класс лота площадкой, A–F. Влияет на премию к старту: по замеру 09.2026 '
  'A +11.1%, B +16.1%, C +13.3%, D и F +15.4% — чем хуже класс, тем сильнее '
  'занижен старт.';
