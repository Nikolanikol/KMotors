-- Дедуп автопостинга запчастей из parts_products в тему Telegram-группы.
-- Одна строка = одна запчасть, запощенная ботом (/api/poster/parts/run).
-- Источник правды для дедупа (не постить дважды) и дневного лимита.

CREATE TABLE IF NOT EXISTS posted_parts (
  part_id     BIGINT      PRIMARY KEY,          -- parts_products.id
  part_number TEXT,
  name        TEXT,                             -- name_ru на момент поста
  price_krw   INTEGER,
  posted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posted_parts_posted_at ON posted_parts (posted_at DESC);
