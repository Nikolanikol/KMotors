-- 048: история переписки бота и черновики ответов от Claude.
--
-- Bot API не умеет читать переписку задним числом, поэтому бот сам пишет сюда
-- каждое сообщение клиента и каждый ответ менеджера. По этой истории Claude
-- готовит черновик ответа, который менеджер отправляет кнопкой в теме клиента.
--
-- Пишет и читает только сервер (service role). RLS включён без политик.
-- Существующие таблицы не трогаем, кроме одной новой колонки в tg_bot_clients.
--
-- Откат:
--   drop table if exists tg_bot_drafts;
--   drop table if exists tg_bot_messages;
--   alter table tg_bot_clients drop column if exists offhours_ack_at;

create table if not exists tg_bot_messages (
  id          bigserial primary key,
  chat_id     bigint not null,
  role        text not null check (role in ('client', 'manager')),
  text        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists tg_bot_messages_chat_idx on tg_bot_messages (chat_id, id desc);

alter table tg_bot_messages enable row level security;

create table if not exists tg_bot_drafts (
  id                bigserial primary key,
  chat_id           bigint not null,
  text              text not null,
  -- pending — ждёт решения; sent — отправлен клиенту; dropped — «не надо»;
  -- superseded — менеджер ответил своими словами.
  status            text not null default 'pending'
                    check (status in ('pending', 'sent', 'dropped', 'superseded')),
  topic_message_id  integer,
  decided_by        text,
  decided_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists tg_bot_drafts_chat_idx on tg_bot_drafts (chat_id, status);

alter table tg_bot_drafts enable row level security;

-- Автоответ «нерабочее время» без цифр — не чаще одного раза на каждое новое
-- сообщение клиента (см. src/lib/tgbot/reminders.ts).
alter table tg_bot_clients add column if not exists offhours_ack_at timestamptz;
