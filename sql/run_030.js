const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  // ── Снапшот ДО ──────────────────────────────────────────────────────
  const { rows: b } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17701) AS oils,
      COUNT(*) FILTER (WHERE subcategory_id = 17999) AS chassis,
      COUNT(*) FILTER (WHERE subcategory_id = 17899) AS trans,
      COUNT(*) FILTER (WHERE subcategory_id = 18099) AS body,
      COUNT(*) FILTER (WHERE subcategory_id = 18199) AS interior
    FROM parts_products
  `);
  const { rows: catBef } = await c.query(`
    SELECT id, weight_avg_kg
    FROM parts_categories
    WHERE id IN (17701, 17999, 17899, 18099, 18199)
    ORDER BY id
  `);
  const wBef = Object.fromEntries(catBef.map(r => [r.id, r.weight_avg_kg]));

  console.log('══ ПАТЧ 030: Масло/Фильтры NULL вес + Прочее разбивка ══════════');
  console.log('  ДО:');
  console.log(`    [17701] Масло и фильтры:  ${String(b[0].oils).padStart(5)} шт  | weight_avg=${wBef[17701] ?? 'NULL'}`);
  console.log(`    [17999] Прочее шасси:     ${String(b[0].chassis).padStart(5)} шт  | weight_avg=${wBef[17999]}`);
  console.log(`    [17899] Прочее КПП:       ${String(b[0].trans).padStart(5)} шт  | weight_avg=${wBef[17899]}`);
  console.log(`    [18099] Прочее кузов:     ${String(b[0].body).padStart(5)} шт  | weight_avg=${wBef[18099]}`);
  console.log(`    [18199] Прочее салон:     ${String(b[0].interior).padStart(5)} шт  | weight_avg=${wBef[18199]}`);
  console.log('');

  // ── Выполняем SQL ───────────────────────────────────────────────────
  const sql = fs.readFileSync(path.join(__dirname, '030_prochee_split.sql'), 'utf8');
  const stmts = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'UPDATE [17701] weight_avg_kg = 0.30кг (было NULL)',     // 0
    'INSERT L3 900937–900944 (8 категорий)',                  // 1
    'UPDATE [17999] weight_avg_kg → 1.5кг',                  // 2
    'UPDATE [17899] weight_avg_kg → 1.5кг',                  // 3
    'UPDATE [18099] weight_avg_kg → 1.0кг',                  // 4
    'UPDATE [18199] weight_avg_kg → 1.0кг',                  // 5
    '[17999] → 900937 мелкие (price < ₩15k)',                // 6  MOVE
    '[17999] → 900938 тяжёлые (keywords / price > ₩500k)',   // 7  MOVE
    '[17899] → 900939 мелкие (price < ₩15k)',                // 8  MOVE
    '[17899] → 900940 трансмиссии (keywords / price > ₩800k)',//9  MOVE
    '[18099] → 900941 мелкие (price < ₩8k)',                 // 10 MOVE
    '[18099] → 900942 панели (keywords / price > ₩200k)',    // 11 MOVE
    '[18199] → 900943 мелкие (price < ₩12k)',                // 12 MOVE
    '[18199] → 900944 сборки (keywords / price > ₩200k)',    // 13 MOVE
  ];

  let totalMoved = 0;
  for (let i = 0; i < stmts.length; i++) {
    try {
      const r = await c.query(stmts[i]);
      const n = r.rowCount || 0;
      const isMove = i >= 6;
      if (isMove) totalMoved += n;
      const icon = (i === 1 || n > 0) ? '✓' : '·';
      const suffix = isMove ? `  ${String(n).padStart(4)} шт` : '';
      console.log(`  [${icon}] ${(labels[i] || 'stmt ' + i).padEnd(56)}${suffix}`);
    } catch (e) {
      console.error(`  [✗] ${labels[i] || 'stmt ' + i}: ${e.message}`);
      process.exit(1);
    }
  }

  // ── Снапшот ПОСЛЕ ───────────────────────────────────────────────────
  const { rows: a } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17999) AS chassis,
      COUNT(*) FILTER (WHERE subcategory_id = 17899) AS trans,
      COUNT(*) FILTER (WHERE subcategory_id = 18099) AS body,
      COUNT(*) FILTER (WHERE subcategory_id = 18199) AS interior,
      COUNT(*) FILTER (WHERE subcategory_id = 900937) AS c937,
      COUNT(*) FILTER (WHERE subcategory_id = 900938) AS c938,
      COUNT(*) FILTER (WHERE subcategory_id = 900939) AS c939,
      COUNT(*) FILTER (WHERE subcategory_id = 900940) AS c940,
      COUNT(*) FILTER (WHERE subcategory_id = 900941) AS c941,
      COUNT(*) FILTER (WHERE subcategory_id = 900942) AS c942,
      COUNT(*) FILTER (WHERE subcategory_id = 900943) AS c943,
      COUNT(*) FILTER (WHERE subcategory_id = 900944) AS c944
    FROM parts_products
  `);
  const { rows: catAft } = await c.query(`
    SELECT id, weight_avg_kg
    FROM parts_categories
    WHERE id IN (17701, 17999, 17899, 18099, 18199)
    ORDER BY id
  `);
  const wAft = Object.fromEntries(catAft.map(r => [r.id, r.weight_avg_kg]));

  const af = a[0];
  console.log('');
  console.log('  ── Результат ──────────────────────────────────────────────────');
  console.log(`  [17701] weight_avg: NULL → ${wAft[17701]}кг  (786 товаров получили вес)`);
  console.log(`  [17999] Прочее шасси:  ${b[0].chassis} → ${af.chassis} шт (avg: ${wBef[17999]}→${wAft[17999]}кг)`);
  console.log(`          ↳ 900937 мелкие 0.08кг:          ${String(af.c937).padStart(4)} шт`);
  console.log(`          ↳ 900938 тяжёлые агрегаты 15кг:  ${String(af.c938).padStart(4)} шт`);
  console.log(`  [17899] Прочее КПП:    ${b[0].trans} → ${af.trans} шт (avg: ${wBef[17899]}→${wAft[17899]}кг)`);
  console.log(`          ↳ 900939 мелкие 0.08кг:          ${String(af.c939).padStart(4)} шт`);
  console.log(`          ↳ 900940 трансмиссии SEA 70кг:   ${String(af.c940).padStart(4)} шт`);
  console.log(`  [18099] Прочее кузов:  ${b[0].body} → ${af.body} шт (avg: ${wBef[18099]}→${wAft[18099]}кг)`);
  console.log(`          ↳ 900941 мелкие 0.04кг:          ${String(af.c941).padStart(4)} шт`);
  console.log(`          ↳ 900942 кузовные панели 12кг:   ${String(af.c942).padStart(4)} шт`);
  console.log(`  [18199] Прочее салон:  ${b[0].interior} → ${af.interior} шт (avg: ${wBef[18199]}→${wAft[18199]}кг)`);
  console.log(`          ↳ 900943 мелкие 0.07кг:          ${String(af.c943).padStart(4)} шт`);
  console.log(`          ↳ 900944 крупные сборки 8кг:     ${String(af.c944).padStart(4)} шт`);
  console.log(`  Итого перемещено: ${totalMoved} шт`);

  // ── Spot-check: что попало в тяжёлые ───────────────────────────────
  console.log('');
  console.log('  ── 900938 Тяжёлые агрегаты шасси (топ-8) ────────────────────');
  const { rows: h938 } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900938
    ORDER BY price_krw DESC LIMIT 8
  `);
  if (h938.length === 0) console.log('    (пусто)');
  h938.forEach(r => console.log(
    `    ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,65)}`
  ));

  console.log('');
  console.log('  ── 900940 Трансмиссии в сборе (топ-8) ───────────────────────');
  const { rows: h940 } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900940
    ORDER BY price_krw DESC LIMIT 8
  `);
  if (h940.length === 0) console.log('    (пусто)');
  h940.forEach(r => console.log(
    `    ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,65)}`
  ));

  console.log('');
  console.log('  ── 900942 Кузовные панели (топ-6) ───────────────────────────');
  const { rows: h942 } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900942
    ORDER BY price_krw DESC LIMIT 6
  `);
  if (h942.length === 0) console.log('    (пусто)');
  h942.forEach(r => console.log(
    `    ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,65)}`
  ));

  console.log('');
  console.log('  ── 900944 Крупные сборки салона (топ-6) ─────────────────────');
  const { rows: h944 } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900944
    ORDER BY price_krw DESC LIMIT 6
  `);
  if (h944.length === 0) console.log('    (пусто)');
  h944.forEach(r => console.log(
    `    ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,65)}`
  ));

  // ── Проверяем нет ли осиротевших дорогих товаров в остатках ────────
  console.log('');
  console.log('  ── Остатки: самые дорогие (ещё не в L3, проверка) ──────────');
  const { rows: rem } = await c.query(`
    SELECT p.name_en, p.price_krw, cat.id AS cat_id, cat.name_ru
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id IN (17999, 17899, 18099, 18199)
    ORDER BY p.price_krw DESC
    LIMIT 10
  `);
  if (rem.length === 0) console.log('    (все разобраны)');
  rem.forEach(r => console.log(
    `    [${r.cat_id}] ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,55)}`
  ));

  console.log('');
  console.log('  ⚑ Следующий шаг: node sql/014_refresh_and_fill.js');

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
