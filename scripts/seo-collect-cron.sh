#!/usr/bin/env bash
# ⚠️ НА ПРОДЕ НЕ ИСПОЛЬЗУЕТСЯ. На VPS нет рабочей копии репозитория: прод
# собирается Coolify в Docker, каталога /var/www/kmotors/ не существует. В
# crontab стоит прямой curl к эндпоинту — таблица в CLAUDE.md. Строку установки
# ниже в crontab НЕ копировать: cron будет молча писать `not found` в лог, а
# задание не отработает ни разу. Скрипт оставлен для ручного запуска с локальной
# машины.
#
# Ежедневный сбор данных Search Console в seo_page_stats.
# Дёргает /api/seo/collect на проде с секретом. Вся работа идёт в Next-процессе,
# сам скрипт — это один curl (нагрузки на VPS нет).
#
# Секрет читается из окружения SEO_CRON_SECRET, иначе — из .env приложения.
# Настройки можно переопределить переменными окружения:
#   SEO_ENDPOINT   (по умолчанию https://www.kmotors.shop/api/seo/collect)
#   ENV_FILE       (по умолчанию /var/www/kmotors/.env — поправь под свой путь)

set -euo pipefail

SEO_ENDPOINT="${SEO_ENDPOINT:-https://www.kmotors.shop/api/seo/collect}"
ENV_FILE="${ENV_FILE:-/var/www/kmotors/.env}"

# Если секрет не передан в окружении — достаём из .env приложения
if [[ -z "${SEO_CRON_SECRET:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    SEO_CRON_SECRET="$(grep -m1 '^SEO_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  fi
fi

if [[ -z "${SEO_CRON_SECRET:-}" ]]; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: SEO_CRON_SECRET не найден (ни в env, ни в $ENV_FILE)" >&2
  exit 1
fi

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] POST $SEO_ENDPOINT"
HTTP_CODE=$(curl -fsS -o /tmp/seo-collect-resp.json -w '%{http_code}' \
  --max-time 300 \
  -X POST -H "x-seo-secret: ${SEO_CRON_SECRET}" \
  "$SEO_ENDPOINT") || {
    echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/seo-collect-resp.json >&2 || true
    exit 1
  }

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] HTTP $HTTP_CODE  $(cat /tmp/seo-collect-resp.json)"
