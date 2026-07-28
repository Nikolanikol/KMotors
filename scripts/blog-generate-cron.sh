#!/usr/bin/env bash
# Генерация очередной статьи блога (черновик + кнопки в Telegram).
# Дёргает /api/blog-generate на проде с секретом. Вся работа идёт в Next-процессе,
# сам скрипт — это один curl (нагрузки на VPS нет).
#
# ЗАЧЕМ ОН НУЖЕН: расписание раньше жило только в vercel.json, а прод крутится
# на Coolify/VPS — краны Vercel там не исполняются, и генерация просто стояла
# (июнь-июль 2026: 2 поста в месяц вместо ожидаемых 10). Планировщик здесь —
# системный cron, а не хостинг.
#
# Секрет читается из окружения CRON_SECRET, иначе — из .env приложения.
# Настройки можно переопределить переменными окружения:
#   BLOG_ENDPOINT  (по умолчанию https://www.kmotors.shop/api/blog-generate)
#   ENV_FILE       (по умолчанию /var/www/kmotors/.env — поправь под свой путь)
#
# Установка (crontab -e), каждые 3 дня в 10:00 — как было заявлено в vercel.json:
#   0 10 */3 * * /var/www/kmotors/scripts/blog-generate-cron.sh >> /var/log/blog-generate.log 2>&1

set -euo pipefail

BLOG_ENDPOINT="${BLOG_ENDPOINT:-https://www.kmotors.shop/api/blog-generate}"
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

echo "[$(date -Is)] POST $BLOG_ENDPOINT"

# --max-time 300: генерация это два вызова Gemini (статья + перевод) с ретраями.
# Замер на проде — 45 сек, но при ретраях бывает дольше.
HTTP_CODE=$(curl -fsS -o /tmp/blog-generate-resp.json -w '%{http_code}' \
  --max-time 300 \
  -X POST -H "Authorization: Bearer ${CRON_SECRET}" \
  "$BLOG_ENDPOINT") || {
    echo "[$(date -Is)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat /tmp/blog-generate-resp.json >&2 || true
    exit 1
  }

echo "[$(date -Is)] HTTP $HTTP_CODE  $(cat /tmp/blog-generate-resp.json)"
