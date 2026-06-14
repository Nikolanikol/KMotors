require('dotenv').config();
const { Client } = require('pg');
async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const { rows } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900999 AND LOWER(name_en) LIKE '%spare%'
    ORDER BY price_krw DESC
  `);
  rows.forEach(r => console.log('  w' + String(r.price_krw).padStart(6) + '  ' + r.name_en));
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
