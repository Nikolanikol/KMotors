-- Дедуп автопостинга авто с Encar в Telegram-канал.
-- Одна строка = одно авто, запощенное ботом-постером (/api/poster/run).
-- Таблица одновременно источник правды для:
--   • дедупа (не постить одно авто дважды) — PRIMARY KEY vehicle_id;
--   • дневного лимита — COUNT по posted_at за текущие сутки (KST);
--   • ротации пресетов — COUNT(*) % число_пресетов.

CREATE TABLE IF NOT EXISTS posted_vehicles (
  vehicle_id  TEXT        PRIMARY KEY,          -- encar vehicleId
  preset      TEXT,                             -- метка пресета выборки (напр. "Hyundai Avante")
  maker       TEXT,                             -- марка (корейская, как из выдачи)
  model       TEXT,                             -- модель (корейская)
  price_man   INTEGER,                          -- цена на момент поста, 만원
  posted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Быстрый подсчёт постов за сегодня (дневной лимит)
CREATE INDEX IF NOT EXISTS idx_posted_vehicles_posted_at ON posted_vehicles (posted_at DESC);
