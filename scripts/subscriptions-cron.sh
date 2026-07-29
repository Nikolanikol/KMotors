#!/usr/bin/env bash
# Ежедневная рассылка подписок «пришлите похожие»: дёргает /api/subscriptions/run
# на проде с секретом. Вся работа идёт в Next-процессе, сам скрипт — один curl.
#
# ЗАЧЕМ ОН НУЖЕН: то же, что и у rss-sync-cron.sh и blog-generate-cron.sh —
# прод крутится на Coolify/VPS, а краны Vercel там не исполняются. Расписание
# обязано жить в системном планировщике, а не в vercel.json.
#
# Секрет читается из окружения POSTER_CRON_SECRET, иначе — из .env приложения.
# Тот же секрет и заголовок, что у автопостера и rss-sync.
# Настройки можно переопределить переменными окружения:
#   SUBS_ENDPOINT  (по умолчанию https://www.kmotors.shop/api/subscriptions/run)
#   ENV_FILE       (по умолчанию /var/www/kmotors/.env — поправь под свой путь)
#
# Установка (crontab -e), раз в сутки в 11:00 — днём по Корее, чтобы новинки
# приходили человеку в разумное время, а не ночью:
#   0 11 * * * /var/www/kmotors/scripts/subscriptions-cron.sh >> /var/log/subscriptions.log 2>&1
#
# Проверить без отправки сообщений:
#   SUBS_ENDPOINT="https://www.kmotors.shop/api/subscriptions/run?dry=1" ./scripts/subscriptions-cron.sh

set -euo pipefail

SUBS_ENDPOINT="${SUBS_ENDPOINT:-https://www.kmotors.shop/api/subscriptions/run}"
ENV_FILE="${ENV_FILE:-/var/www/kmotors/.env}"

if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    POSTER_CRON_SECRET="$(grep -m1 '^POSTER_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  fi
fi

if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  echo "[$(date -Is)] ERROR: POSTER_CRON_SECRET не найден (ни в env, ни в $ENV_FILE)" >&2
  exit 1
fi

echo "[$(date -Is)] GET $SUBS_ENDPOINT"

HTTP_CODE=$(curl -fsS -o /tmp/subscriptions-resp.json -w '%{http_code}' \
  --max-time 300 \
  -H "x-poster-secret: ${POSTER_CRON_SECRET}" \
  "$SUBS_ENDPOINT") || {
    echo "[$(date -Is)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/subscriptions-resp.json >&2 || true
    exit 1
  }

echo "[$(date -Is)] HTTP $HTTP_CODE  $(cat /tmp/subscriptions-resp.json)"
