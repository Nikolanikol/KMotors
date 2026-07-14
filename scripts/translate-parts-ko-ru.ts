/**
 * Перевод названий запчастей: name_ko → name_ru (Gemini 2.5 Flash, thinking off).
 * Переводим с КОРЕЙСКОГО (источник истины), а не с кривого английского.
 *
 * Идемпотентно: берёт только строки с пустым name_ru. Дедуп по name_ko —
 * одинаковые названия переводятся один раз и применяются ко всем дублям.
 *
 * Запуск:
 *   npx tsx scripts/translate-parts-ko-ru.ts --limit=200   # тест
 *   npx tsx scripts/translate-parts-ko-ru.ts                # все
 */
import * as dotenv from "dotenv"; dotenv.config();
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const argLimit = process.argv.find((a) => a.startsWith("--limit="));
const MAX_ROWS = argLimit ? parseInt(argLimit.split("=")[1], 10) : Infinity;
const FETCH_PAGE = Number.isFinite(MAX_ROWS) ? Math.min(500, MAX_ROWS as number) : 500;
const NAMES_PER_CALL = 50;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    // @ts-expect-error thinkingConfig есть у 2.5, но нет в типах SDK
    thinkingConfig: { thinkingBudget: 0 },
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= 3; i++) {
    try { return await fn(); }
    catch (e) { last = e; console.warn(`  retry ${label} ${i}/3:`, String(e).slice(0, 80)); await sleep(1500 * i); }
  }
  throw last;
}

async function translateNames(names: string[]): Promise<string[]> {
  const items = names.map((ko, i) => ({ i, ko }));
  const prompt = `Переведи корейские названия автозапчастей Hyundai/Kia/Genesis на русский.
ПРАВИЛА:
- Точный русский автотермин (тормозной диск, сайлентблок, жгут проводов, уплотнительное кольцо и т.п.).
- НИКАКИХ английских или корейских слов в ответе, без транслита.
- Бренды и модели (Hyundai, Kia, Genesis, Sonata...) — латиницей.
- Каталожный номер в скобках ИГНОРИРУЙ.
- Кратко, как название товара.
Верни СТРОГО JSON: {"t":[{"i":<индекс>,"ru":"<перевод>"}]}

Названия:
${JSON.stringify(items)}`;
  const r = await model.generateContent(prompt);
  const parsed = JSON.parse(r.response.text()) as { t: { i: number; ru: string }[] };
  const out = new Array(names.length).fill("");
  for (const x of parsed.t) if (x.i >= 0 && x.i < names.length) out[x.i] = String(x.ru || "");
  return out;
}

async function main() {
  let processed = 0, translated = 0, rowsUpdated = 0;
  const t0 = Date.now();

  while (processed < MAX_ROWS) {
    const { data: rows } = await sb
      .from("parts_products")
      .select("id, name_ko")
      .not("name_ko", "is", null)
      .is("name_ru", null)
      .limit(FETCH_PAGE);
    if (!rows?.length) break;

    const uniq = [...new Set(rows.map((r) => r.name_ko as string))];
    console.log(`\nСтраница: ${rows.length} строк, ${uniq.length} уникальных названий`);

    const map = new Map<string, string>();
    for (let i = 0; i < uniq.length; i += NAMES_PER_CALL) {
      const chunk = uniq.slice(i, i + NAMES_PER_CALL);
      const tr = await withRetry(() => translateNames(chunk), `chunk@${i}`);
      chunk.forEach((ko, j) => { if (tr[j]) map.set(ko, tr[j]); });
      translated += chunk.length;
      process.stdout.write(`  переведено уник: ${Math.min(i + NAMES_PER_CALL, uniq.length)}/${uniq.length}\r`);
      await sleep(400);
    }

    for (const [ko, ru] of map) {
      const { data: upd } = await sb.from("parts_products").update({ name_ru: ru }).eq("name_ko", ko).is("name_ru", null).select("id");
      rowsUpdated += upd?.length ?? 0;
    }

    processed += rows.length;
    console.log(`\n  всего: строк обработано ${processed}, строк обновлено ${rowsUpdated}`);
    if (rows.length < FETCH_PAGE) break;
  }

  console.log(`\n✅ Готово за ${Math.round((Date.now() - t0) / 1000)}с. Уникальных переведено: ${translated}, строк с name_ru проставлено: ${rowsUpdated}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
