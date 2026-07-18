#!/usr/bin/env bash
# Тик автопостинга авто с Encar в Telegram-канал.
# Дёргает /api/poster/run на проде с секретом. Вся работа идёт в Next-процессе,
# сам скрипт — один curl (нагрузки на VPS нет). Окно (9–21 KST) и дневной
# лимит проверяются внутри роута, поэтому таймер может тикать чаще безопасно.
#
# Секрет читается из окружения POSTER_CRON_SECRET, иначе — из .env приложения.
# Переопределяемые переменные:
#   POSTER_ENDPOINT (по умолчанию https://www.kmotors.shop/api/poster/run)
#   ENV_FILE        (по умолчанию /var/www/kmotors/.env — поправь под свой путь)

set -euo pipefail

POSTER_ENDPOINT="${POSTER_ENDPOINT:-https://www.kmotors.shop/api/poster/run}"
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

echo "[$(date -Is)] POST $POSTER_ENDPOINT"
HTTP_CODE=$(curl -fsS -o /tmp/poster-run-resp.json -w '%{http_code}' \
  --max-time 120 \
  -X POST -H "x-poster-secret: ${POSTER_CRON_SECRET}" \
  "$POSTER_ENDPOINT") || {
    echo "[$(date -Is)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/poster-run-resp.json >&2 || true
    exit 1
  }

echo "[$(date -Is)] HTTP $HTTP_CODE  $(cat /tmp/poster-run-resp.json)"
