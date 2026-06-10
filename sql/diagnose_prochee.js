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
    { id: 18099, name: 'Прочее кузов' },
  ];

  for (const cat of prochee) {
    // Top-30 by first word of name_en
    const { rows } = await c.query(`
      SELECT
        LOWER(split_part(name_en, '-', 1)) AS prefix,
        COUNT(*) AS cnt,
        ROUND(AVG(price_krw)) AS avg_price
      FROM parts_products
      WHERE subcategory_id = $1
      GROUP BY LOWER(split_part(name_en, '-', 1))
      ORDER BY cnt DESC
      LIMIT 30
    `, [cat.id]);

    const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
    console.log('\n══════════════════════════════════════════════════');
    console.log('  [' + cat.id + '] ' + cat.name + ' (' + total + ' шт)');
    console.log('══════════════════════════════════════════════════');
    rows.forEach(r => {
      console.log('  ' + String(r.cnt).padStart(4) + '  ' + (r.prefix || '?').padEnd(30) + ' avg₩' + r.avg_price);
    });

    // Also show a few full examples from top groups
    if (rows.length > 0) {
      const topGroup = rows[0].prefix;
      const { rows: examples } = await c.query(`
        SELECT name_en, price_krw FROM parts_products
        WHERE subcategory_id = $1
          AND LOWER(split_part(name_en, '-', 1)) = $2
        ORDER BY price_krw DESC
        LIMIT 5
      `, [cat.id, topGroup]);
      console.log('  -- Примеры "' + topGroup + '":');
      examples.forEach(e => console.log('     · ' + e.name_en + ' (₩' + e.price_krw + ')'));
    }
  }

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
