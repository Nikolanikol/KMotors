require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const r1 = await c.query(`
    UPDATE parts_products SET subcategory_id = 900904
    WHERE subcategory_id = 900999
      AND LOWER(name_en) SIMILAR TO '%(fastener|nippul|battery terminal|씰)%'
  `);
  console.log('→ 900904 Крепёж:', r1.rowCount);

  const r2 = await c.query(`
    UPDATE parts_products SET subcategory_id = 18199
    WHERE subcategory_id = 900999
      AND LOWER(name_en) SIMILAR TO '%(bezel|ornament|anchor button|child anchor)%'
  `);
  console.log('→ 18199 Прочее салон:', r2.rowCount);

  const r3 = await c.query(
    'SELECT COUNT(*) AS n FROM parts_products WHERE subcategory_id = 900999'
  );
  console.log('\nОсталось в 900999 (staging):', r3.rows[0].n, 'шт');
  console.log('→ Вес 0.05кг правильный, оставляем как generic small parts');

  // Финальный итог
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id >= 900000)                              AS in_l3,
      COUNT(*) FILTER (WHERE subcategory_id IN (17799,18199,17999,17899,18099,900999)) AS in_prochee,
      COUNT(*)                                                                       AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = v => (parseInt(v) / parseInt(s.total) * 100).toFixed(1);
  console.log('\n── Финал ──');
  console.log(`В L3 с ценовым весом:  ${s.in_l3}  (${pct(s.in_l3)}%)`);
  console.log(`В catch-all Прочее:    ${s.in_prochee}  (${pct(s.in_prochee)}%)`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
