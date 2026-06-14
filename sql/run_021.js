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

  const sql = fs.readFileSync(path.join(__dirname, '021_levers_and_mimi.sql'), 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  const labels = [
    'Lever-Gear Shift (17899) → 18108 Консоль',
    'Mimi (17799) → 17702 Опоры двигателя',
    'Mimi (900909) → 17702 (откат случайного перемещения)',
  ];

  console.log('\nВыполняю патч 021...\n');
  let total = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      total += n;
      console.log(`  [${n > 0 ? '✓' : '·'}] ${labels[i].padEnd(48)} ${n} шт`);
    } catch (e) {
      console.error(`  [✗] ${labels[i]}: ${e.message}`);
    }
  }
  console.log(`\n  Итого перемещено: ${total} шт`);

  // Проверка результата
  console.log('\n── Проверка ──');
  const { rows } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (17899, 17799, 18108, 17702, 900909)
    GROUP BY cat.id, cat.name_ru
    ORDER BY cat.id
  `);
  rows.forEach(r => {
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(32)} ${r.cnt} шт`);
  });

  // Сколько mimi теперь в 17702
  console.log('\n── Mimi в 17702 (Опоры) ──');
  const { rows: mimi } = await c.query(`
    SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_p
    FROM parts_products
    WHERE subcategory_id = 17702
      AND LOWER(name_en) LIKE '%mimi%'
  `);
  console.log(`  ${mimi[0].cnt} шт  avg ₩${mimi[0].avg_p}`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
