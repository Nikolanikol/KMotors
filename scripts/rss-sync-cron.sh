#!/usr/bin/env bash
# Ежедневная синхронизация RSS-лент в blog_posts (новости).
# Дёргает /api/rss-sync на проде с секретом. Вся работа идёт в Next-процессе,
# сам скрипт — это один curl (нагрузки на VPS нет).
#
# ЗАЧЕМ ОН НУЖЕН: то же, что и у blog-generate-cron.sh — расписание лежало в
# vercel.json, а прод на Coolify/VPS, где краны Vercel не исполняются.
#
# Секрет читается из окружения POSTER_CRON_SECRET, иначе — из .env приложения.
# Тот же секрет и тот же заголовок, что у автопостера (/api/poster/run).
# Настройки можно переопределить переменными окружения:
#   RSS_ENDPOINT   (по умолчанию https://www.kmotors.shop/api/rss-sync)
#   ENV_FILE       (по умолчанию /var/www/kmotors/.env — поправь под свой путь)
#
# Установка (crontab -e), ежедневно в 09:00 — как было заявлено в vercel.json:
#   0 9 * * * /var/www/kmotors/scripts/rss-sync-cron.sh >> /var/log/rss-sync.log 2>&1

set -euo pipefail

RSS_ENDPOINT="${RSS_ENDPOINT:-https://www.kmotors.shop/api/rss-sync}"
ENV_FILE="${ENV_FILE:-/var/www/kmotors/.env}"

# Если секрет не передан в окружении — достаём из .env приложения
if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    POSTER_CRON_SECRET="$(grep -m1 '^POSTER_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  fi
fi

if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: POSTER_CRON_SECRET не найден (ни в env, ни в $ENV_FILE)" >&2
  exit 1
fi

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] GET $RSS_ENDPOINT"

# /api/rss-sync — метод GET (в отличие от blog-generate).
HTTP_CODE=$(curl -fsS -o /tmp/rss-sync-resp.json -w '%{http_code}' \
  --max-time 300 \
  -H "x-poster-secret: ${POSTER_CRON_SECRET}" \
  "$RSS_ENDPOINT") || {
    echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/rss-sync-resp.json >&2 || true
    exit 1
  }

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] HTTP $HTTP_CODE  $(cat /tmp/rss-sync-resp.json)"
