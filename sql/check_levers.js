require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // Все lever из 17899 — полные названия + цена
  const { rows } = await c.query(`
    SELECT name_en, price_krw,
           ROUND(price_krw::numeric / 1300) AS price_usd
    FROM parts_products
    WHERE subcategory_id = 17899
      AND LOWER(name_en) SIMILAR TO '%(lever|lever complete)%'
    ORDER BY price_krw DESC
  `);

  console.log('Всего lever в 17899: ' + rows.length);
  console.log('');
  rows.forEach(r => {
    const bar = '₩' + String(r.price_krw).padStart(8) + '  ~$' + String(r.price_usd).padStart(4);
    console.log('  ' + bar + '  ' + r.name_en);
  });

  // Ценовые квантили
  const { rows: q } = await c.query(`
    SELECT
      MIN(price_krw)                                          AS min_p,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price_krw) AS p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY price_krw) AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price_krw) AS p75,
      MAX(price_krw)                                          AS max_p,
      COUNT(*)                                                AS cnt
    FROM parts_products
    WHERE subcategory_id = 17899
      AND LOWER(name_en) SIMILAR TO '%(lever|lever complete)%'
  `);
  const s = q[0];
  console.log('\nЦеновые квантили:');
  console.log('  min ₩' + s.min_p);
  console.log('  P25 ₩' + Math.round(s.p25));
  console.log('  P50 ₩' + Math.round(s.p50) + '  (~$' + Math.round(s.p50/1300) + ')');
  console.log('  P75 ₩' + Math.round(s.p75));
  console.log('  max ₩' + s.max_p);

  // Вес категории 17899
  const { rows: cat } = await c.query(`
    SELECT weight_min_kg, weight_avg_kg, weight_max_kg
    FROM parts_categories WHERE id = 17899
  `);
  const wt = cat[0];
  console.log('\nКатегория 17899 (Прочее КПП):');
  console.log('  weight: ' + wt.weight_min_kg + ' – ' + wt.weight_max_kg + ' кг  (avg ' + wt.weight_avg_kg + ' кг)');

  // Сравним: вес 18108 Консоль
  const { rows: cons } = await c.query(`
    SELECT weight_min_kg, weight_avg_kg, weight_max_kg
    FROM parts_categories WHERE id = 18108
  `);
  const c2 = cons[0];
  console.log('Категория 18108 (Консоль):');
  console.log('  weight: ' + c2.weight_min_kg + ' – ' + c2.weight_max_kg + ' кг  (avg ' + c2.weight_avg_kg + ' кг)');

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
