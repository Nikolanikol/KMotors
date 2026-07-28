#!/usr/bin/env bash
# Ежедневная синхронизация RSS-лент в blog_posts (новости).
# Дёргает /api/rss-sync на проде с секретом. Вся работа идёт в Next-процессе,
# сам скрипт — это один curl (нагрузки на VPS нет).
#
# ЗАЧЕМ ОН НУЖЕН: то же, что и у blog-generate-cron.sh — расписание лежало в
# vercel.json, а прод на Coolify/VPS, где краны Vercel не исполняются.
#
# Секрет читается из окружения CRON_SECRET, иначе — из .env приложения.
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
if [[ -z "${CRON_SECRET:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    CRON_SECRET="$(grep -m1 '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  fi
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "[$(date -Is)] ERROR: CRON_SECRET не найден (ни в env, ни в $ENV_FILE)" >&2
  exit 1
fi

echo "[$(date -Is)] GET $RSS_ENDPOINT"

# /api/rss-sync — метод GET (в отличие от blog-generate).
HTTP_CODE=$(curl -fsS -o /tmp/rss-sync-resp.json -w '%{http_code}' \
  --max-time 300 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "$RSS_ENDPOINT") || {
    echo "[$(date -Is)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/rss-sync-resp.json >&2 || true
    exit 1
  }

echo "[$(date -Is)] HTTP $HTTP_CODE  $(cat /tmp/rss-sync-resp.json)"
