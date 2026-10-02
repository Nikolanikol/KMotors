#!/usr/bin/env node
// Единая точка входа для планировщика Coolify.
//
//   node ./scripts/cron/run.mjs showcase
//   node ./scripts/cron/run.mjs showcase --dry
//   node ./scripts/cron/run.mjs --list
//
// ─── Почему это файл в образе, а не строка curl в crontab ────────────────
//
// Задание Coolify выполняется ВНУТРИ контейнера приложения (docker exec), а
// не на хосте. Отсюда три следствия, каждое из которых ломает привычную
// строку crontab:
//
//   1. ⚠️ curl в образе НЕТ. Базовый образ node:20-alpine несёт busybox, а
//      curl ставится отдельным apk add, которого в нашем Dockerfile нет.
//      Команда с curl отработает ровно ноль раз, и в истории заданий это
//      будет выглядеть как «not found» — ровно тот сценарий, на котором
//      рассылка подписок простояла с первого дня.
//
//   2. ⚠️ global fetch здесь тоже не годится. У undici внутри Node стоит
//      headersTimeout 300 000 мс, а заголовки ответа приходят только когда
//      маршрут ДОСЧИТАЛ: обход витрины аукционов идёт ~6 минут. То есть
//      fetch отвалится по таймауту на работе, которая на сервере как раз
//      успешно завершится, и задание будет краснеть при живой синхронизации.
//      У клиента node:http таймаута по умолчанию нет вовсе — поэтому он.
//
//   3. Идём на 127.0.0.1, а не на https://www.kmotors.shop. Запрос не
//      выходит из контейнера: ни DNS, ни TLS, ни Cloudflare, ни правила WAF
//      (включая корейское) на него не влияют. Меньше звеньев — меньше
//      способов молча не сработать.
//
// Команда в интерфейсе Coolify получается короткой и без кавычек, поэтому её
// нечем испортить при копировании. Расписание и история прогонов видны там же
// в интерфейсе — ради этого всё и затевалось.
//
// ─── Коды возврата ───────────────────────────────────────────────────────
//
//   0  эндпоинт ответил 2xx и в теле нет признаков провала
//   1  не достучались, не 2xx, или задание не найдено
//   2  ответ содержит "ok":false — маршрут отработал, но работу не сделал
//   3  ответ содержит ненулевой unknownSource (только витрина аукционов)
//
// Код 2 существует потому, что эндпоинты отвечают 200 и когда делать было
// нечего, и когда источник не отдал ни строки. Без разведения этих случаев в
// истории заданий будет ровный ряд зелёных галочек над мёртвой витриной.

import http from "node:http";

// Расписания продублированы здесь НАМЕРЕННО: они задаются в интерфейсе
// Coolify, и без копии в репозитории сверить «что реально крутится» можно
// только глазами в чужой панели. Расходятся — правда за Coolify.
const JOBS = {
  cars: {
    path: "/api/cars/sync",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 6 * * *",
    about: "снимки машин Encar в cars_seen — источник сайтмапа каталога",
  },
  showcase: {
    path: "/api/showcase/sync",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 */4 * * *",
    about: "лоты автоаукционов с витрины-посредника, ~6 минут",
  },
  poster: {
    path: "/api/poster/run",
    method: "POST",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 */2 * * *",
    about: "автопостинг авто в телеграм-канал",
  },
  "poster-parts": {
    path: "/api/poster/parts/run",
    method: "POST",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "30 */2 * * *",
    about: "автопостинг запчастей",
  },
  blog: {
    path: "/api/blog-generate",
    method: "POST",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 10 */3 * *",
    about: "черновик статьи блога (публикуется отдельно, кнопкой в телеграме)",
  },
  rss: {
    path: "/api/rss-sync",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 9 * * *",
    about: "синхронизация RSS-новостей",
  },
  "seo-collect": {
    path: "/api/seo/collect",
    method: "POST",
    secretEnv: "SEO_CRON_SECRET",
    header: "x-seo-secret",
    schedule: "35 4 * * *",
    about: "статистика Google Search Console",
  },
  "seo-generate": {
    path: "/api/seo/generate?limit=15",
    method: "POST",
    secretEnv: "SEO_CRON_SECRET",
    header: "x-seo-secret",
    schedule: "0 5 * * *",
    about: "черновики SEO-описаний (публикация — после одобрения в телеграме)",
  },
  subscriptions: {
    path: "/api/subscriptions/run",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "0 11 * * *",
    about: "рассылка подписок «пришлём похожие»",
  },
  // ─── carnect.biz → carnect_lots ───
  // Каждая площадка — своё задание (решение владельца 02.10.2026): партии
  // выкладываются в разные дни, за ~2 дня до торгов, у Autohub — сильно
  // заранее. Расписание НЕ угадывает эти дни: задание идёт дважды в сутки, а
  // если у площадки ничего не изменилось, синк останавливается на первой
  // странице — один запрос вместо обхода (src/lib/carnect/sync.ts,
  // «ничего не изменилось»). Раз в сутки обход полный в любом случае.
  //
  // Время (UTC): 05:xx — сразу после дедлайна торгов 13:00 KST (= 04:00 UTC),
  // когда площадки снимают проданное; 20:xx — ночью по Корее (~05:00 KST),
  // чтобы утром каталог был свежим. Минуты разнесены: очередь client.ts одна
  // на процесс, одновременные задания просто стояли бы друг за другом.
  // Лимит синка у площадки — 8 минут; таймаут задачи в Coolify ставить 10.
  "carnect-lotte": {
    path: "/api/carnect/sync?feed=lotte",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "5 5,20 * * *",
    about: "Lotte с carnect.biz, ~3 минуты (или один запрос, если ничего не изменилось)",
  },
  "carnect-sk": {
    path: "/api/carnect/sync?feed=sk",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "12 5,20 * * *",
    about: "SK с carnect.biz, ~1.5 минуты (или один запрос)",
  },
  "carnect-glovis": {
    path: "/api/carnect/sync?feed=glovis",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "17 5,20 * * *",
    about: "Autobell (Hyundai Glovis) с carnect.biz, ~2 минуты (или один запрос)",
  },
  "carnect-kcar": {
    path: "/api/carnect/sync?feed=kcar",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "22 5,20 * * *",
    about: "K Car с carnect.biz, ~1 минута (или один запрос)",
  },
  "carnect-autohub": {
    path: "/api/carnect/sync?feed=autohub",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "26 5,20 * * *",
    about: "Autohub с carnect.biz, секунды",
  },
  // ⚠️ ЛЕГАСИ: все пять площадок одним обходом. Заменено пятью заданиями выше;
  // из Coolify удалить. Вместе с ними НЕ запускать — площадки обойдутся дважды.
  "carnect-auctions": {
    path: "/api/carnect/sync?feed=auctions",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "—",
    about: "ЛЕГАСИ, не запускать: все пять площадок разом (заменено carnect-lotte … carnect-autohub)",
  },
  "carnect-hey-instant": {
    path: "/api/carnect/sync?feed=hey-instant",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "25 7,20 * * *",
    about: "HeyDealer Instant (фиксированная цена), ~4 минуты — ⚠️ НЕ включать до замера полноты (docs/carnect.md)",
  },
  "carnect-hey-self": {
    path: "/api/carnect/sync?feed=hey-self",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "35 7,20 * * *",
    about: "HeyDealer Self (фото от продавца, ставки), ~8 минут — ⚠️ НЕ включать до замера полноты (docs/carnect.md)",
  },
  "carnect-hey-zero": {
    path: "/api/carnect/sync?feed=hey-zero",
    method: "GET",
    secretEnv: "POSTER_CRON_SECRET",
    header: "x-poster-secret",
    schedule: "50 7,20 * * *",
    about: "HeyDealer Zero (осмотр инспектором, ставки), ~10 минут — ⚠️ НЕ включать до замера полноты (docs/carnect.md)",
  },
};

const stamp = () => new Date().toISOString();
const log = (msg) => console.log(`[${stamp()}] ${msg}`);
const fail = (msg, code) => {
  console.error(`[${stamp()}] ${msg}`);
  process.exit(code);
};

function printJobs() {
  const width = Math.max(...Object.keys(JOBS).map((k) => k.length));
  for (const [name, job] of Object.entries(JOBS)) {
    console.log(`${name.padEnd(width)}  ${job.schedule.padEnd(12)}  ${job.method.padEnd(4)} ${job.path}`);
    console.log(`${" ".repeat(width)}  ${job.about}`);
  }
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--list") || args.includes("-l")) {
  printJobs();
  process.exit(args.length === 0 ? 1 : 0);
}

const name = args[0];
const job = JOBS[name];
if (!job) {
  console.error(`Неизвестное задание: ${name}. Доступные:`);
  printJobs();
  process.exit(1);
}

const secret = process.env[job.secretEnv];
if (!secret) {
  fail(`ERROR: ${job.secretEnv} не задан в окружении контейнера`, 1);
}

// Значение заголовка обязано быть ASCII без переводов строки. Иначе node:http
// бросает ERR_INVALID_CHAR ещё до запроса, и в истории заданий вместо причины
// оказывается стек-трейс. Ловится это только так: секрет приходит из чужого
// поля ввода, где легко оставить перевод строки или кириллицу из раскладки.
if (!/^[\x21-\x7e]+$/.test(secret)) {
  fail(`ERROR: ${job.secretEnv} содержит недопустимые для заголовка символы (пробел, перевод строки или не-ASCII)`, 1);
}

// Порт берём из окружения: его же читает server.js, так что разъехаться
// они не могут. HOSTNAME в Dockerfile — 0.0.0.0, значит петля доступна.
const port = Number(process.env.PORT || 3000);
let path = job.path;
if (args.includes("--dry")) path += (path.includes("?") ? "&" : "?") + "dry=1";

// Таймаут только как защита от зависшего сокета: обход витрины идёт ~6 минут,
// и обрезать его мы не хотим. Планировщик Coolify может иметь собственный
// лимит — если он убьёт exec, работа на сервере всё равно доедет до конца,
// проверять её тогда по таблице auction_sync_runs, а не по истории заданий.
const timeoutMs = Number(process.env.CRON_TIMEOUT_MS || 30 * 60 * 1000);

log(`${job.method} http://127.0.0.1:${port}${path}`);

const req = http.request(
  {
    host: "127.0.0.1",
    port,
    path,
    method: job.method,
    headers: { [job.header]: secret, "content-length": "0" },
  },
  (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      // Ответы крон-эндпоинтов — компактный JSON; режем на случай, если
      // маршрут однажды вернёт html-страницу ошибки, чтобы не залить лог.
      if (body.length < 8000) body += chunk;
    });
    res.on("end", () => {
      const code = res.statusCode ?? 0;
      log(`HTTP ${code}  ${body.trim()}`);
      if (code < 200 || code >= 300) fail(`ERROR: эндпоинт ответил ${code}`, 1);
      if (/"ok"\s*:\s*false/.test(body)) fail("WARNING: задание вернуло ok:false", 2);
      if (/"unknownSource"\s*:\s*[1-9]/.test(body)) {
        fail("WARNING: есть лоты с нераспознанной площадкой", 3);
      }
      process.exit(0);
    });
  },
);

req.setTimeout(timeoutMs, () => {
  req.destroy();
  fail(`ERROR: нет ответа за ${Math.round(timeoutMs / 1000)} с`, 1);
});
req.on("error", (err) => fail(`ERROR: запрос не прошёл — ${err.message}`, 1));
req.end();
