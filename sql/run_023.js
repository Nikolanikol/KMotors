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

  const sql = fs.readFileSync(path.join(__dirname, '023_sort_staging.sql'), 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  const labels = [
    'Garnish/молдинги → 18099 Прочее кузов',
    'Spare tire hardware → 17999 Прочее шасси',
    'Шайбы/резьба/пружины/болты → 900904 Крепёж',
    'Creep/bush/rubber/insulator → 900904 Крепёж',
    'Cap/boot/skirt/plug → 900910 Крышки',
    'Holder/guide/clip → 900909 Кронштейны',
    'Gasket/seal → 900904 Крепёж',
  ];

  console.log('\nРассортировка staging 900999...\n');
  let total = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      total += n;
      console.log(`  [${n > 0 ? '✓' : '·'}] ${labels[i].padEnd(44)} ${String(n).padStart(4)} шт`);
    } catch (e) {
      console.error(`  [✗] ${labels[i]}: ${e.message}`);
    }
  }
  console.log(`\n  Разобрано: ${total} шт`);

  // Остаток в staging
  const { rows: rem } = await c.query(`
    SELECT COUNT(*) AS n FROM parts_products WHERE subcategory_id = 900999
  `);
  console.log(`  Осталось в 900999: ${rem[0].n} шт`);

  // Что осталось нераспознанным?
  if (parseInt(rem[0].n) > 0) {
    console.log('\n  Нераспознанный остаток:');
    const { rows: left } = await c.query(`
      SELECT LOWER(split_part(name_en, '-', 1)) AS prefix,
             COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_p
      FROM parts_products
      WHERE subcategory_id = 900999
      GROUP BY prefix ORDER BY cnt DESC LIMIT 20
    `);
    left.forEach(r =>
      console.log('    ' + String(r.cnt).padStart(4) + '  ' + (r.prefix||'?').padEnd(28) + '  avg₩' + r.avg_p)
    );
  }

  // Финальный срез каталога
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ИТОГ: охват каталога (все патчи 013–023)');
  console.log('══════════════════════════════════════════════════════════');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id >= 900000)                     AS in_l3,
      COUNT(*) FILTER (WHERE subcategory_id IN (17799,18199,17999,17899,18099,900999)) AS in_prochee,
      COUNT(*)                                                              AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = v => (parseInt(v) / parseInt(s.total) * 100).toFixed(1);
  console.log(`  Всего товаров:               ${s.total}`);
  console.log(`  В L3 с ценовым весом:        ${s.in_l3}  (${pct(s.in_l3)}%)`);
  console.log(`  В catch-all Прочее:          ${s.in_prochee}  (${pct(s.in_prochee)}%)`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
