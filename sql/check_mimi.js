require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // Все "mimi" товары — полные названия
  const { rows } = await c.query(`
    SELECT name_en, price_krw,
           ROUND(price_krw::numeric / 1300) AS price_usd,
           subcategory_id
    FROM parts_products
    WHERE LOWER(name_en) LIKE '%mimi%'
    ORDER BY price_krw DESC
    LIMIT 80
  `);

  console.log('Всего "mimi" в базе: ' + rows.length + '\n');
  rows.forEach(r => {
    console.log('  [' + r.subcategory_id + ']  ₩' + String(r.price_krw).padStart(9) +
                '  ~$' + String(r.price_usd).padStart(5) + '  ' + r.name_en);
  });

  // Статистика по категориям
  console.log('\n── По категориям ──');
  const { rows: cats } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru,
           COUNT(*) AS cnt,
           ROUND(MIN(p.price_krw)) AS min_p,
           ROUND(AVG(p.price_krw)) AS avg_p,
           ROUND(MAX(p.price_krw)) AS max_p
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE LOWER(p.name_en) LIKE '%mimi%'
    GROUP BY p.subcategory_id, cat.name_ru
    ORDER BY cnt DESC
  `);
  cats.forEach(r => {
    console.log('  [' + r.subcategory_id + '] ' + (r.name_ru||'?').padEnd(32) +
                ' ' + String(r.cnt).padStart(4) + ' шт' +
                '  ₩' + r.min_p + ' – ₩' + r.max_p + '  avg ₩' + r.avg_p);
  });

  // Ценовые квантили для всех mimi
  const { rows: q } = await c.query(`
    SELECT
      PERCENTILE_CONT(0.1)  WITHIN GROUP (ORDER BY price_krw) AS p10,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price_krw) AS p25,
      PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY price_krw) AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price_krw) AS p75,
      PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY price_krw) AS p90,
      COUNT(*) AS cnt
    FROM parts_products
    WHERE LOWER(name_en) LIKE '%mimi%'
  `);
  const s = q[0];
  console.log('\nЦеновые квантили всех mimi:');
  console.log('  P10 ₩' + Math.round(s.p10) + '  (~$' + Math.round(s.p10/1300) + ')');
  console.log('  P25 ₩' + Math.round(s.p25) + '  (~$' + Math.round(s.p25/1300) + ')');
  console.log('  P50 ₩' + Math.round(s.p50) + '  (~$' + Math.round(s.p50/1300) + ')');
  console.log('  P75 ₩' + Math.round(s.p75) + '  (~$' + Math.round(s.p75/1300) + ')');
  console.log('  P90 ₩' + Math.round(s.p90) + '  (~$' + Math.round(s.p90/1300) + ')');

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
