#!/usr/bin/env bash
# Синхронизация каталога автоаукционов ВРУЧНУЮ, с локальной машины.
# Дёргает /api/showcase/sync на проде; вся работа идёт в Next-процессе.
#
# ⚠️ ПО РАСПИСАНИЮ это задание запускает НЕ ЭТОТ ФАЙЛ, а планировщик Coolify —
# задача «showcase» с командой `node ./scripts/cron/run.mjs showcase`. Там же
# видно расписание и историю прогонов, ради чего всё и переносилось из crontab.
# Этот скрипт остался для ручной проверки: он ходит снаружи, по публичному
# адресу, и потому заодно проверяет путь через Cloudflare, которого у задания
# в контейнере нет.
#
# ⚠️ Путь к этому файлу в crontab на VPS НЕ ставить: рабочей копии репозитория
# там нет (прод собирается Coolify в Docker), cron молча напишет «not found»,
# и снаружи это выглядит как «функция не работает». Так рассылка подписок
# простояла с первого дня.
#
# ─── Почему такое расписание ──────────────────────────────────────────────
#
# Расписания торгов площадки нам не присылают, и на витрине его нет. Но сама
# витрина держит по ОДНОЙ ближайшей дате торгов на площадку (замер 21.09.2026:
# SK и K Car — 22.09, Lotte — 21.09), а лоты исчезают, когда торги прошли:
# в 05:58 UTC в разделе было 2 315 лотов, в 06:15 — уже 1 470, Lotte
# осыпалась с 1 451 до 606 сразу после своего дедлайна в 04:00 UTC.
#
# Значит новая партия появляется НЕ по расписанию, которое мы знаем, а в
# неизвестный момент после окончания предыдущих торгов. Отсюда правило: ходить
# часто и дёшево, а не редко и по угадайке.
#
# Каждые 4 часа = 6 прогонов в сутки. Один прогон — 79 страниц и ~6 минут; для
# сайта, который сам публикует sitemap и в robots.txt закрывает только /api/,
# это меньше, чем один живой посетитель.
#
# ⚠️ Календарь собирается САМ: каждый прогон пишет в auction_sync_runs поле
# notes.dates с датами торгов по площадкам. Через неделю по этой истории видно
# и ритм торгов, и момент выкладки новой партии — тогда расписание можно
# сузить, опираясь на замер, а не на догадку. До тех пор частота важнее
# точности: пропущенная партия это сутки мёртвой витрины.
#
# Расписание живёт в Coolify (Application → Scheduled Tasks):
#
#   Name       showcase
#   Command    node ./scripts/cron/run.mjs showcase
#   Frequency  0 */4 * * *
#
# Переменные:
#   SHOWCASE_ENDPOINT  по умолчанию https://www.kmotors.shop/api/showcase/sync
#   ENV_FILE           файл с POSTER_CRON_SECRET (если его нет в окружении)
#   SHOWCASE_DRY       1 — обойти витрину и НЕ писать в базу (проверка парсера)
#   SHOWCASE_TIMEOUT   таймаут curl в секундах (по умолчанию 1200)

set -euo pipefail

SHOWCASE_ENDPOINT="${SHOWCASE_ENDPOINT:-https://www.kmotors.shop/api/showcase/sync}"
SHOWCASE_TIMEOUT="${SHOWCASE_TIMEOUT:-1200}"
ENV_FILE="${ENV_FILE:-}"

if [[ -z "${POSTER_CRON_SECRET:-}" && -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  POSTER_CRON_SECRET="$(grep -m1 '^POSTER_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
fi

if [[ -z "${POSTER_CRON_SECRET:-}" ]]; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: POSTER_CRON_SECRET не найден (ни в окружении, ни в ENV_FILE)" >&2
  exit 1
fi

URL="$SHOWCASE_ENDPOINT"
[[ "${SHOWCASE_DRY:-}" == "1" ]] && URL="${URL}?dry=1"

RESP="$(mktemp)"
trap 'rm -f "$RESP"' EXIT

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] GET $URL"

HTTP_CODE=$(curl -fsS -o "$RESP" -w '%{http_code}' \
  --max-time "$SHOWCASE_TIMEOUT" \
  -H "x-poster-secret: ${POSTER_CRON_SECRET}" \
  "$URL") || {
    echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] ERROR: curl упал (HTTP ${HTTP_CODE:-?})" >&2
    cat "$RESP" >&2 || true
    exit 1
  }

echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] HTTP $HTTP_CODE  $(cat "$RESP")"

# Эндпоинт отвечает 200 и при ok:false — например, когда витрина не отдала ни
# одной карточки. Крон обязан это заметить: иначе витрина будет показывать
# позавчерашние лоты, а в логе будет ровный ряд успешных строк.
if grep -q '"ok":false' "$RESP"; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] WARNING: обход вернул ok:false" >&2
  exit 2
fi

# Пустой unknownSource — признак, что все площадки распознаны. Появится
# четвёртый аукцион с незнакомым хостом картинок — его лоты не попадут в базу,
# и узнать об этом надо здесь, а не через неделю по жалобе.
if grep -qE '"unknownSource":[1-9]' "$RESP"; then
  echo "[$(date +%Y-%m-%dT%H:%M:%S%z)] WARNING: есть лоты с нераспознанной площадкой" >&2
  exit 3
fi
