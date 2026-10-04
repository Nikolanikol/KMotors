#!/usr/bin/env node
/**
 * Снимает из Google Search Console артикулы запчастей, по которым Google РЕАЛЬНО
 * показывал наши страницы, и перезаписывает docs/parts-demand-top300.md.
 *
 * Запуск:  node scripts/seo/parts-demand.mjs
 *          DAYS=90 TOP=500 node scripts/seo/parts-demand.mjs
 *
 * Зачем: список доказанного спроса — основа для опыта по наполнению карточек.
 * Переделывать 48 700 страниц вслепую нельзя, а гадать о спросе незачем — он
 * измерен. Разбор, из которого это выросло, — в CLAUDE.md, раздел про тонкие
 * карточки запчастей.
 *
 * Только ЧТЕНИЕ: в базу ничего не пишет, прод не трогает. Единственный побочный
 * эффект — перезапись markdown-файла в docs/.
 *
 * Переменные окружения берутся из .env: GSC_SA_JSON (ключ сервисного аккаунта
 * одной строкой) и GSC_SITE_URL. Зависимостей нет, JWT подписывается node:crypto.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "../..");
const DAYS = Number(process.env.DAYS ?? 180);
const TOP = Number(process.env.TOP ?? 300);
const OUT = path.join(ROOT, "docs/parts-demand-top300.md");

// OEM-номера Mobis: начинаются с цифры, дальше буквы и цифры. Та же маска ловит и
// id объявлений Encar — их отсеиваем ниже по адресу страницы, а не по номеру.
const OEM_RE = "^[0-9][0-9a-zA-Z-]{6,}$";
const PARTS = /^\/[a-z]{2}\/parts\//;
const RU_EN = /^\/(ru|en)\//;

function env() {
  const txt = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  return Object.fromEntries(
    txt.split("\n")
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}

async function auth(sa) {
  const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`,
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("GSC не выдал токен: " + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

async function main() {
  const e = env();
  const token = await auth(JSON.parse(e.GSC_SA_JSON));
  const site = e.GSC_SITE_URL;
  const from = d(DAYS), to = d(0);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: from, endDate: to, dataState: "all",
        dimensions: ["query", "page"], rowLimit: 25000,
        // Корею НЕ исключаем: здесь важен сам факт показа, а не чистота трафика.
        dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "includingRegex", expression: OEM_RE }] }],
      }),
    }
  );
  const j = await res.json();
  if (j.error) throw new Error("GSC: " + JSON.stringify(j.error).slice(0, 300));

  const by = new Map();
  for (const r of j.rows ?? []) {
    const [q, page] = r.keys;
    const cur = by.get(q) ?? { q, imp: 0, clicks: 0, posSum: 0, pages: new Map() };
    cur.imp += r.impressions; cur.clicks += r.clicks; cur.posSum += r.position * r.impressions;
    cur.pages.set(page, (cur.pages.get(page) ?? 0) + r.impressions);
    by.set(q, cur);
  }

  const raw = [...by.values()].map((x) => ({
    part: x.q.toUpperCase(), imp: x.imp, clicks: x.clicks, pos: x.posSum / x.imp,
    page: [...x.pages.entries()].sort((a, b) => b[1] - a[1])[0][0].replace(/^https?:\/\/[^/]+/, ""),
  })).sort((a, b) => b.imp - a.imp || b.clicks - a.clicks);

  const all = raw.filter((x) => PARTS.test(x.page));
  const dropped = raw.length - all.length;
  const top = all.slice(0, TOP);
  if (top.length === 0) throw new Error("GSC не вернул ни одной карточки запчасти — проверить доступ и окно дат");

  const impTop = sum(top, (x) => x.imp), impAll = sum(all, (x) => x.imp);
  const other = top.filter((x) => !RU_EN.test(x.page)).length;
  const avgPos = (sum(top, (x) => x.pos * x.imp) / impTop).toFixed(1);

  const md = `# Запчасти с доказанным спросом — топ-${TOP} (снято ${to})

Это НЕ догадка о спросе, а факт: артикулы, по которым Google **реально показывал** наши
страницы живым людям за ${DAYS} дней (${from} → ${to}). Корея намеренно НЕ исключалась —
здесь важен сам факт показа, а не чистота трафика.

Список существует ради одного: опыт по наполнению карточек ставится на НЁМ, а не на всём
каталоге. Переделывать 48 700 страниц вслепую нельзя — это месяцы работы с неизвестным
результатом и риск попасть под то же обновление, которое уже ударило.

Пересобрать: \`node scripts/seo/parts-demand.mjs\` (только чтение, прод не трогает).

## Как снят

Search Console API, измерение \`query\` × \`page\`, фильтр по запросу \`${OEM_RE}\` — так
пишутся OEM-номера Mobis. Отброшено рядов, где под маску попали id объявлений Encar: ${dropped}
(у них адрес \`/catalog/\`, а не \`/parts/\`). Строки сведены по артикулу; в колонке «язык» —
тот префикс, который собрал по этому артикулу больше показов.

## Что в цифрах

| | |
|---|---|
| артикулов со спросом за ${DAYS} дней | ${all.length} |
| из них в этом списке | ${top.length} |
| показов у списка | ${impTop} из ${impAll} — **${(100 * impTop / impAll).toFixed(0)}% всего спроса** |
| кликов у списка | ${sum(top, (x) => x.clicks)} из ${sum(all, (x) => x.clicks)} |
| порог попадания | ${top[top.length - 1].imp} показа за ${DAYS} дней |
| средняя позиция по списку | ${avgPos} |

Хвост длинный и плоский: ${all.length} артикулов на ${impAll} показов, то есть в среднем
${(impAll / all.length).toFixed(1)} показа на артикул за полгода. ${TOP} — не круглое число ради
красоты, а точка, после которой строки перестают отличаться от шума.

⚠️ **Спрос у ${other} артикулов из ${top.length} пришёл на ka/ar.** Это ПРОТИВ предложения убрать
ka/ar из hreflang: страницы на этих языках показы получают. Немного, но не ноль, и решение
«оставить только ru+en» этим замером НЕ подтверждается — его надо принимать отдельно,
взвесив ${other} артикулов против экономии краул-бюджета.

⚠️ **Средняя позиция ${avgPos} — это позиция ТЕХ показов, которые случились.** Она не значит,
что по артикулу из списка нас видно всегда: у большинства строк 4–10 показов за полгода, то
есть страница выходит в выдачу редко. Путать «ранжируется хорошо» и «показывается часто»
здесь нельзя — именно на этом строился неверный вывод 02.10.2026.

## Список

| # | артикул | показы | клики | ср. позиция | язык |
|---|---|---|---|---|---|
${top.map((x, i) => `| ${i + 1} | \`${x.part}\` | ${x.imp} | ${x.clicks} | ${x.pos.toFixed(1)} | ${x.page.slice(1, 3)} |`).join("\n")}
`;

  fs.writeFileSync(OUT, md);
  console.log(`Записано ${path.relative(ROOT, OUT)}: ${top.length} артикулов из ${all.length}, ` +
    `${impTop} показов (${(100 * impTop / impAll).toFixed(0)}% спроса), отброшено не-запчастей ${dropped}`);
}

main().catch((err) => { console.error("Снятие спроса упало:", err.message); process.exit(1); });
