#!/usr/bin/env node
/**
 * Снимает сопоставимый срез видимости сайта в Google и печатает его блоком,
 * который кладётся в docs/indexation-log.md.
 *
 * Запуск:  node scripts/seo/indexation-snapshot.mjs
 *          WEEKS=16 node scripts/seo/indexation-snapshot.mjs
 *
 * ⚠️ ЧИСЛО ПРОИНДЕКСИРОВАННЫХ СТРАНИЦ ЭТОТ СКРИПТ НЕ ВИДИТ. Отчёт «Страницы»
 * (бывший Coverage) в API Search Console НЕ ОТДАЁТСЯ — ни числа в индексе, ни
 * разбивки причин. Его выгружает только человек: Search Console → Индексирование
 * → Страницы → Экспорт. Поэтому журнал замеров состоит из двух половин, и вторую
 * без выгрузки заполнить нечем — см. docs/indexation-log.md.
 *
 * Только ЧТЕНИЕ: ни база, ни прод не затрагиваются, файлы не переписываются.
 *
 * Переменные из .env: GSC_SA_JSON, GSC_SITE_URL. Зависимостей нет.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "../..");
const WEEKS = Number(process.env.WEEKS ?? 12);
// Так пишутся OEM-номера Mobis. По ним меряется ШИРОТА охвата — главный
// показатель: позиция всё время держалась 7–9, падала именно широта.
const OEM_RE = "^[0-9][0-9a-zA-Z-]{6,}$";
const NO_KR = [{ filters: [{ dimension: "country", operator: "notEquals", expression: "kor" }] }];

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
    exp: now + 3600, iat: now,
  })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("GSC не выдал токен: " + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

async function main() {
  const e = env();
  const token = await auth(JSON.parse(e.GSC_SA_JSON));
  const site = e.GSC_SITE_URL;
  const q = async (body) => {
    const r = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dataState: "all", ...body }) }
    );
    const j = await r.json();
    if (j.error) throw new Error("GSC: " + JSON.stringify(j.error).slice(0, 300));
    return j.rows ?? [];
  };

  console.log(`## Замер ${d(0)}\n`);

  // 1. Недельная динамика. ⚠️ Тоталы берутся по измерению `date`, а НЕ по `page`:
  // группировка по страницам режется порогом приватности и занижает в десятки раз.
  console.log("Показы и клики по неделям (Корея исключена — это собственный трафик владельца):\n");
  console.log("```");
  console.log("неделя                  клики  показы  ср.поз   артикулов");
  for (let w = WEEKS; w >= 1; w--) {
    const s = d(w * 7), en = d(w * 7 - 6);
    const tot = await q({ startDate: s, endDate: en, dimensionFilterGroups: NO_KR, dimensions: ["date"], rowLimit: 10 });
    const oem = await q({
      startDate: s, endDate: en, dimensions: ["query"], rowLimit: 5000,
      dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "includingRegex", expression: OEM_RE }] }],
    });
    const c = sum(tot, (r) => r.clicks), i = sum(tot, (r) => r.impressions);
    const pos = i ? sum(tot, (r) => r.position * r.impressions) / i : 0;
    console.log(`${s}…${en}  ${String(c).padStart(5)}  ${String(i).padStart(6)}   ${pos.toFixed(1).padStart(5)}   ${String(oem.length).padStart(7)}`);
  }
  console.log("```\n");

  // 2. Что сейчас в выдаче. Проверять руками из Кореи БЕСПОЛЕЗНО: Google берёт
  // регион по IP, и владелец видит корейскую выдачу, а не выдачу своих клиентов.
  const now = await q({
    startDate: d(14), endDate: d(0), dimensions: ["query", "country", "page"], rowLimit: 20,
    dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "includingRegex", expression: OEM_RE }] }],
  });
  console.log("Артикулы, по которым Google показывал страницы за 14 дней:\n");
  console.log("```");
  console.log("показы поз  страна  артикул           адрес");
  for (const r of now.slice(0, 15)) {
    const [qq, c, p] = r.keys;
    console.log(`${String(r.impressions).padStart(5)} ${r.position.toFixed(0).padStart(4)}  ${c}     ${qq.toUpperCase().padEnd(16)} ${p.replace(/^https?:\/\/[^/]+/, "")}`);
  }
  if (now.length === 0) console.log("(ни одного — это само по себе результат)");
  console.log("```\n");

  console.log("Число страниц в индексе: ВЫГРУЗИТЬ РУКАМИ (в API его нет) —");
  console.log("Search Console → Индексирование → Страницы → Экспорт,");
  console.log(`затем положить в data/gsc/coverage-chart-${d(0)}.csv\n`);
}

main().catch((err) => { console.error("Замер упал:", err.message); process.exit(1); });
