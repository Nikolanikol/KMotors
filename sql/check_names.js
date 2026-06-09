require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Конкретный товар из скриншота
  console.log('=== Товар 2816437200 ===');
  const { rows: item } = await c.query(`
    SELECT id, part_number, name_ru, name_en, name_ko
    FROM parts_products WHERE part_number = '2816437200'
  `);
  item.forEach(r => console.log(JSON.stringify(r, null, 2)));

  // 2. Общая статистика по заполненности имён
  console.log('\n=== Заполненность имён ===');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE name_ru IS NOT NULL AND name_ru != '') AS has_ru,
      COUNT(*) FILTER (WHERE name_en IS NOT NULL AND name_en != '') AS has_en,
      COUNT(*) FILTER (WHERE name_ko IS NOT NULL AND name_ko != '') AS has_ko,
      COUNT(*) FILTER (WHERE name_ru IS NULL OR name_ru = '') AS no_ru,
      COUNT(*) FILTER (WHERE name_en IS NULL OR name_en = '') AS no_en,
      COUNT(*) FILTER (WHERE name_ru IS NULL AND name_en IS NULL) AS no_ru_no_en
    FROM parts_products
  `);
  const s = stats[0];
  console.log(`  Всего: ${s.total}`);
  console.log(`  name_ru: ${s.has_ru} есть, ${s.no_ru} нет`);
  console.log(`  name_en: ${s.has_en} есть, ${s.no_en} нет`);
  console.log(`  name_ko: ${s.has_ko} есть`);
  console.log(`  Нет ни ru ни en: ${s.no_ru_no_en}`);

  // 3. Примеры товаров без name_ru
  console.log('\n=== Примеры без name_ru (первые 10) ===');
  const { rows: noRu } = await c.query(`
    SELECT part_number, name_ru, name_en, name_ko
    FROM parts_products
    WHERE name_ru IS NULL OR name_ru = ''
    LIMIT 10
  `);
  noRu.forEach(r => console.log(`  ${r.part_number}: ru="${r.name_ru}" en="${r.name_en}" ko="${r.name_ko}"`));

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
