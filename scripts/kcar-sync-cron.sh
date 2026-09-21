#!/usr/bin/env bash
# Синхронизация аукциона K Car. Дёргает /api/kcar/sync на проде с секретом.
# Вся работа идёт в Next-процессе, сам скрипт — это один curl.
#
# ⚠️ В ОТЛИЧИЕ от rss-sync-cron.sh этот скрипт РАССЧИТАН на VPS, но пути к
# репозиторию у него нет и быть не должно: на машине нет рабочей копии, прод
# собирается Coolify в Docker. Секрет берём из окружения самого cron или из
# файла, путь к которому задан явно через ENV_FILE.
#
# Переменные:
#   KCAR_ENDPOINT   по умолчанию https://www.kmotors.shop/api/kcar/sync
#   ENV_FILE        файл с POSTER_CRON_SECRET (если его нет в окружении)
#   KCAR_SESSIONS   номера сессий для истории: «996» или «975-995»
#   KCAR_ENRICH     1 — добирать VIN, лист осмотра и галерею (долго, ~35 мин)
#   KCAR_TIMEOUT    таймаут curl в секундах (по умолчанию 600)
#
# Расписание (crontab -e). Три разные задачи, НЕ объединять:
#
#   # лоты ближайших торгов — ежедневно в 07:10
#   10 7 * * *  /path/kcar-sync-cron.sh >> /var/log/kcar-lots.log 2>&1
#
#   # результаты прошедших торгов — по пятницам в 03:30, ОБЕ сессии недели
#   30 3 * * 5  KCAR_SESSIONS=996-997 /path/kcar-sync-cron.sh >> /var/log/kcar-sales.log 2>&1
#
#   # добор VIN и осмотра — по воскресеньям ночью, отдельно от всего
#   0 2 * * 0   KCAR_ENRICH=1 KCAR_TIMEOUT=3000 /path/kcar-sync-cron.sh >> /var/log/kcar-enrich.log 2>&1
#
# ⚠️ В KCAR_SESSIONS обязан стоять ДИАПАЗОН, а не один номер. Торги идут
# ДВАЖДЫ в неделю: вторник (чётные сессии) и четверг (нечётные), шаг 2 и 5
# дней попеременно — замерено по 990–997 (18.08–10.09.2026). Прогон в среду
# с одним номером забирал бы только вторник, а четверг — сессия ВДВОЕ
# крупнее: по этим восьми сессиям четверги дали 2 561 наблюдение против
# 1 353 у вторников, то есть терялось бы 65% выборки. И терялось бы молча:
# крон получил бы ok:true с валидным JSON, а премия к старту считалась бы по
# смещённой половине рынка — мелким лотам вторника.
#
# ⚠️ Номер сессии придётся сдвигать руками: площадка нумерует торги подряд
# (995, 996, …), переменной «последняя сессия» у крона нет. Можно держать
# заведомо широкий хвост вроде 990-1010 — несуществующие номера отдают
# пустой ответ, а не ошибку (проверено на 998–1000), upsert идемпотентен.

set -euo pipefail

KCAR_ENDPOINT="${KCAR_ENDPOINT:-https://www.kmotors.shop/api/kcar/sync}"
KCAR_TIMEOUT="${KCAR_TIMEOUT:-600}"
ENV_FILE="${ENV_FILE:-}"

if [[ -z "${POSTER_CRON_SECRET:-}" && -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  POSTER_CRON_SECRET="$(grep -m1 '^POSTER_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
fi

if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: POSTER_CRON_SECRET не найден (ни в окружении, ни в ENV_FILE)" >&2
  exit 1
fi

URL="$KCAR_ENDPOINT"
SEP="?"
if [[ -n "${KCAR_SESSIONS:-}" ]]; then
  URL="${URL}${SEP}sessions=${KCAR_SESSIONS}"
  SEP="&"
fi
if [[ "${KCAR_ENRICH:-}" == "1" ]]; then
  URL="${URL}${SEP}enrich=1"
fi

RESP="$(mktemp)"
trap 'rm -f "$RESP"' EXIT

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] GET $URL"

HTTP_CODE=$(curl -fsS -o "$RESP" -w '%{http_code}' \
  --max-time "$KCAR_TIMEOUT" \
  -H "x-poster-secret: ${POSTER_CRON_SECRET}" \
  "$URL") || {
    echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat "$RESP" >&2 || true
    exit 1
  }

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] HTTP $HTTP_CODE  $(cat "$RESP")"

# Эндпоинт отвечает 200 и при ok:false (например, площадка не ответила).
# Крон должен это заметить, иначе деградация останется незамеченной.
if grep -q '"ok":false' "$RESP"; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] WARNING: синхронизация вернула ok:false" >&2
  exit 2
fi
