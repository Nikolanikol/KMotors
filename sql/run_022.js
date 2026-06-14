require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const sql = fs.readFileSync(path.join(__dirname, '022_strut_mounts.sql'), 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  const labels = [
    'INSERT L3 (900915 Опоры стоек, 900999 Мелкие детали staging)',
    'Strut mount/insulator (17999) → 900915',
    'Cheap < ₩3k (17799 Прочее двигатель) → 900999',
    'Cheap < ₩3k (17899 Прочее КПП) → 900999',
    'Cheap < ₩3k (17999 Прочее шасси) → 900999',
    'Cheap < ₩3k (18199 Прочее салон) → 900999',
  ];

  console.log('\nВыполняю патч 022...\n');
  let total = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      total += n;
      console.log(`  [${n > 0 ? '✓' : '·'}] ${labels[i].padEnd(52)} ${n} шт`);
    } catch (e) {
      console.error(`  [✗] ${labels[i]}: ${e.message}`);
    }
  }
  console.log(`\n  Итого перемещено: ${total} шт`);

  // Staging 900999 — что там за товары?
  console.log('\n══ Staging 900999: топ-20 префиксов ══');
  const { rows: top } = await c.query(`
    SELECT LOWER(split_part(name_en, '-', 1)) AS prefix,
           COUNT(*) AS cnt,
           ROUND(AVG(price_krw)) AS avg_p
    FROM parts_products
    WHERE subcategory_id = 900999
    GROUP BY prefix
    ORDER BY cnt DESC
    LIMIT 20
  `);
  top.forEach(r =>
    console.log('  ' + String(r.cnt).padStart(4) + '  ' + (r.prefix||'?').padEnd(30) + '  avg ₩' + r.avg_p)
  );

  // Опоры стоек — сколько поймали
  console.log('\n══ 900915 Опоры стоек ══');
  const { rows: strut } = await c.query(`
    SELECT COUNT(*) AS cnt, ROUND(MIN(price_krw)) AS min_p,
           ROUND(AVG(price_krw)) AS avg_p, ROUND(MAX(price_krw)) AS max_p
    FROM parts_products WHERE subcategory_id = 900915
  `);
  const s = strut[0];
  console.log(`  ${s.cnt} шт   ₩${s.min_p} – ₩${s.max_p}  avg ₩${s.avg_p}`);

  // Итоговый остаток в Прочее
  console.log('\n══ Остаток в Прочее ══');
  const { rows: rem } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (17799, 18199, 17999, 17899, 18099)
    GROUP BY cat.id, cat.name_ru ORDER BY cnt DESC
  `);
  let totalP = 0;
  rem.forEach(r => {
    const f = r.cnt < 500 ? '✓' : r.cnt < 1500 ? '△' : '⚠';
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(28)} ${String(r.cnt).padStart(5)} шт ${f}`);
    totalP += parseInt(r.cnt);
  });
  console.log(`  ${'ИТОГО'.padEnd(28)} ${String(totalP).padStart(5)} шт`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
