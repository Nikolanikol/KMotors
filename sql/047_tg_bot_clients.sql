-- 047: клиенты Telegram-бота @KMOTORS_form_bot и их диалоги в закрытой группе.
--
-- Одна строка = один клиент (личный чат с ботом). У клиента своя тема в закрытой
-- форум-группе менеджеров (TELEGRAM_INBOX_CHAT_ID): всё, что он пишет боту,
-- копируется в тему, а то, что менеджер пишет в теме, бот пересылает клиенту.
--
-- Здесь же статус заявки и отметки времени для напоминаний (/api/bot/reminders):
-- кто ждёт ответа, кому уже напомнили, кому отправили «остались вопросы?».
--
-- Пишет и читает только сервер (service role). RLS включён без политик — для
-- anon-ключа таблица закрыта целиком. Существующие таблицы не трогаем.
--
-- Откат: drop table if exists tg_bot_clients;

create table if not exists tg_bot_clients (
  chat_id              bigint primary key,
  first_name           text,
  last_name            text,
  username             text,
  lang                 text not null default 'ru' check (lang in ('ru', 'en')),

  -- С чем пришёл: параметр /start (car_123, sold_123, part_X, website) и что смотрел.
  source               text,
  car_id               text,
  car_name             text,
  part_number          text,

  -- Ответы на вопросы бота.
  country              text,
  budget               text,
  timeframe            text,
  -- Шаг диалога, на котором бот ждёт ответа (например await_part).
  step                 text,

  -- Тема в группе менеджеров и сообщение-шапка с кнопками статуса.
  topic_id             integer,
  header_message_id    integer,

  status               text not null default 'new'
                       check (status in ('new', 'in_work', 'deal', 'lost')),
  taken_by             text,
  -- Клиент заблокировал бота: писать ему бесполезно.
  blocked              boolean not null default false,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  last_client_msg_at   timestamptz,
  last_manager_msg_at  timestamptz,
  -- «Сообщение передано менеджеру» — не чаще раза в 30 минут.
  ack_at               timestamptz,
  -- Напоминание менеджеру о неотвеченном клиенте.
  manager_reminded_at  timestamptz,
  -- Клиент получил карточку с ценой; через сутки молчания — один «дожим».
  offered_at           timestamptz,
  followup_sent_at     timestamptz
);

create unique index if not exists tg_bot_clients_topic_uidx
  on tg_bot_clients (topic_id) where topic_id is not null;

create index if not exists tg_bot_clients_status_idx
  on tg_bot_clients (status, last_client_msg_at);

alter table tg_bot_clients enable row level security;
