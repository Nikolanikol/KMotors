require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const prochee = [
    { id: 17799, name: 'Прочее двигатель' },
    { id: 18199, name: 'Прочее салон' },
    { id: 17999, name: 'Прочее шасси' },
    { id: 17899, name: 'Прочее КПП' },
  ];

  for (const cat of prochee) {
    const { rows: total } = await c.query(
      'SELECT COUNT(*) AS n FROM parts_products WHERE subcategory_id = $1', [cat.id]
    );

    // Top prefixes (first segment before dash)
    const { rows } = await c.query(`
      SELECT
        LOWER(split_part(name_en, '-', 1)) AS prefix,
        COUNT(*) AS cnt,
        ROUND(AVG(price_krw)) AS avg_price
      FROM parts_products
      WHERE subcategory_id = $1
      GROUP BY prefix
      ORDER BY cnt DESC
      LIMIT 25
    `, [cat.id]);

    console.log('\n══════════════════════════════════════════════════════');
    console.log('  [' + cat.id + '] ' + cat.name + ' (' + total[0].n + ' шт)');
    console.log('══════════════════════════════════════════════════════');
    rows.forEach(r => {
      console.log('  ' + String(r.cnt).padStart(4) + '  ' + (r.prefix || '?').padEnd(34) + '  avg₩' + r.avg_price);
    });
  }

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
