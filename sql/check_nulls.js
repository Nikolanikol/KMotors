require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. NULL category_id / subcategory_id
  const { rows: nulls } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE category_id IS NULL)    AS no_category,
      COUNT(*) FILTER (WHERE subcategory_id IS NULL) AS no_subcategory,
      COUNT(*) FILTER (WHERE category_id IS NULL AND subcategory_id IS NULL) AS both_null,
      COUNT(*) AS total
    FROM parts_products
  `);
  const n = nulls[0];
  console.log('══ NULL проверка ══');
  console.log(`  Всего товаров:           ${n.total}`);
  console.log(`  Без category_id:         ${n.no_category}`);
  console.log(`  Без subcategory_id:      ${n.no_subcategory}`);
  console.log(`  Оба NULL:                ${n.both_null}`);

  // 2. Subcategory_id есть, но категория не существует в parts_categories
  const { rows: orphan } = await c.query(`
    SELECT COUNT(*) AS cnt
    FROM parts_products p
    WHERE p.subcategory_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM parts_categories c WHERE c.id = p.subcategory_id
      )
  `);
  console.log(`  subcategory_id → несуществующая категория: ${orphan[0].cnt}`);

  // 3. category_id есть, но категория не существует
  const { rows: orphan2 } = await c.query(`
    SELECT COUNT(*) AS cnt
    FROM parts_products p
    WHERE p.category_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM parts_categories c WHERE c.id = p.category_id
      )
  `);
  console.log(`  category_id → несуществующая категория:    ${orphan2[0].cnt}`);

  // 4. Если есть NULL subcategory — показать примеры
  if (parseInt(n.no_subcategory) > 0) {
    const { rows: examples } = await c.query(`
      SELECT p.id, p.part_number, p.name_en, p.category_id,
             cat.name_ru AS cat_name
      FROM parts_products p
      LEFT JOIN parts_categories cat ON cat.id = p.category_id
      WHERE p.subcategory_id IS NULL
      ORDER BY p.id
      LIMIT 20
    `);
    console.log(`\n  Примеры без subcategory_id:`);
    examples.forEach(r =>
      console.log(`  [cat:${r.category_id}/${r.cat_name||'?'}] ${r.name_en || r.part_number}`)
    );
  }

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
