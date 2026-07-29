-- Подписки «пришлите похожие»: человек нажал кнопку на странице проданной
-- машины, и мы сами пишем ему в Telegram, когда подходящая появится у Encar.
-- Запустить в Supabase Dashboard → SQL Editor.
--
-- Зачем: на страницу проданной машины человек приходит из поиска, то есть
-- нужного ему СЕЙЧАС НЕТ в наличии. Без подписки такой лид остывает — менеджер
-- отвечает «напишу, если появится», и дальше всё держится на его памяти.
--
-- Подписка создаётся прямо в вебхуке из метки deep-link'а sold_<encar_id>:
-- по ней достаётся снимок из cars_seen и собирается поисковый запрос
-- (марка + модельная группа + год ±1 + цена ±15%, см. src/lib/similarCars.ts).
-- Поэтому здесь нет ни токенов, ни «ожидающих привязки» строк: chat_id
-- известен в тот же момент, что и предмет подписки.

CREATE TABLE IF NOT EXISTS saved_searches (
  id              bigserial PRIMARY KEY,
  chat_id         bigint      NOT NULL,
  -- Откуда пришла подписка — для разбора обращений и статистики.
  source_car_id   text,
  lang            text        NOT NULL DEFAULT 'ru',

  -- Готовая строка запроса к Encar, как её принимает getCars().
  query           text        NOT NULL,
  -- Человекочитаемое описание для сообщений: «Hyundai Palisade 2022».
  title           text,

  -- ⚠️ Основа механики. «Новая машина» определяется как Id, которого ещё нет в
  -- этом множестве, а НЕ по дате. У Encar ModifiedDate обновляется при каждом
  -- переподнятии объявления дилером, поэтому по дате подписчик получал бы
  -- «новинки», которые видел неделю назад, и отписался бы после второго раза.
  seen_ids        text[]      NOT NULL DEFAULT '{}',

  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz,
  last_sent_at    timestamptz,

  -- Повторное нажатие той же кнопки не плодит дубли, а обновляет строку.
  UNIQUE (chat_id, query)
);

-- Выборка кроном: только активные, и те, кому сегодня ещё не писали.
CREATE INDEX IF NOT EXISTS saved_searches_active_idx
  ON saved_searches (last_sent_at NULLS FIRST)
  WHERE active;

-- Пишет только сервер сервис-ключом; политик нет, значит публичного доступа нет.
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
