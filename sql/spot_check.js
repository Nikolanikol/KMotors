require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const check = async (id, label) => {
    const { rows } = await c.query("SELECT name_en, price_krw FROM parts_products WHERE subcategory_id = $1 ORDER BY price_krw LIMIT 5", [id]);
    const { rows: hi } = await c.query("SELECT name_en, price_krw FROM parts_products WHERE subcategory_id = $1 ORDER BY price_krw DESC LIMIT 5", [id]);
    console.log('\n=== ' + id + ' ' + label + ' ===');
    console.log('  CHEAPEST:');
    rows.forEach(r => console.log('    ₩' + String(r.price_krw).padEnd(8), r.name_en));
    console.log('  PRICIEST:');
    hi.forEach(r => console.log('    ₩' + String(r.price_krw).padEnd(8), r.name_en));
  };

  await check(900201, 'Front pads');
  await check(900203, 'Front disc');
  await check(900205, 'Caliper');
  await check(900301, 'Shock absorber');
  await check(900601, 'Steering rack');
  await check(900606, 'Steering wheel');
  await check(900702, 'Door');
  await check(900703, 'Hood');
  await check(900212, 'Brake accessories');

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
