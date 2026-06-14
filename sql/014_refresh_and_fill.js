const { getClient } = require('./db');

async function main() {
  const c = getClient();
  await c.connect();

  // 1. Recreate v_product_weight (DROP + CREATE, not just REFRESH)
  //    because new L3 categories (9009xx, 9010xx, 9011xx, 9012xx) need to be included
  console.log('=== Шаг 1: Пересоздание v_product_weight ===');
  await c.query(`DROP MATERIALIZED VIEW IF EXISTS v_product_weight`);
  await c.query(`
    CREATE MATERIALIZED VIEW v_product_weight AS
    WITH price_bounds AS (
      SELECT
        subcategory_id,
        PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY price_krw) AS p10,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY price_krw) AS p90
      FROM parts_products
      WHERE price_krw > 0
        AND subcategory_id >= 900000
      GROUP BY subcategory_id
    )
    SELECT
      p.id AS product_id,
      p.subcategory_id,
      p.price_krw,
      cat.weight_min_kg,
      cat.weight_max_kg,
      pb.p10,
      pb.p90,
      LEAST(1.0, GREATEST(0.0,
        CASE WHEN pb.p90 > pb.p10
          THEN (p.price_krw - pb.p10) / (pb.p90 - pb.p10)
          ELSE 0.5
        END
      )) AS price_pct,
      ROUND((
        cat.weight_min_kg + LEAST(1.0, GREATEST(0.0,
          CASE WHEN pb.p90 > pb.p10
            THEN (p.price_krw - pb.p10) / (pb.p90 - pb.p10)
            ELSE 0.5
          END
        )) * (cat.weight_max_kg - cat.weight_min_kg)
      )::numeric, 3) AS estimated_weight_kg
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    JOIN price_bounds pb ON pb.subcategory_id = p.subcategory_id
    WHERE p.price_krw > 0
      AND cat.weight_min_kg IS NOT NULL
      AND cat.weight_max_kg IS NOT NULL
  `);
  await c.query(`CREATE UNIQUE INDEX ON v_product_weight (product_id)`);
  await c.query(`CREATE INDEX ON v_product_weight (subcategory_id)`);
  console.log('  View пересоздан.');

  const { rows: viewCount } = await c.query(`SELECT COUNT(*) AS cnt FROM v_product_weight`);
  console.log(`  Товаров в view: ${viewCount[0].cnt}`);

  // 2. Reset ALL weight_kg (clear old values before re-fill)
  console.log('\n=== Шаг 2: Сброс weight_kg ===');
  const resetRes = await c.query(`UPDATE parts_products SET weight_kg = NULL WHERE weight_kg IS NOT NULL`);
  console.log(`  Сброшено: ${resetRes.rowCount}`);

  // 3. Fill weight_kg from updated view
  console.log('\n=== Шаг 3: Заполнение weight_kg ===');
  const fillRes = await c.query(`
    UPDATE parts_products p
    SET weight_kg = w.estimated_weight_kg
    FROM v_product_weight w
    WHERE w.product_id = p.id
      AND w.estimated_weight_kg IS NOT NULL
  `);
  console.log(`  Заполнено: ${fillRes.rowCount}`);

  // 4. Stats
  console.log('\n=== Шаг 4: Статистика ===');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE weight_kg IS NOT NULL) AS has_weight,
      COUNT(*) FILTER (WHERE weight_kg IS NULL) AS no_weight,
      COUNT(*) AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = ((s.has_weight / s.total) * 100).toFixed(1);
  console.log(`  weight_kg заполнен: ${s.has_weight} / ${s.total} (${pct}%)`);
  console.log(`  Без weight_kg: ${s.no_weight}`);

  // 5. Breakdown by category type
  console.log('\n=== Шаг 5: Покрытие по типам ===');
  const { rows: breakdown } = await c.query(`
    SELECT
      CASE
        WHEN subcategory_id IS NULL THEN 'NULL subcategory'
        WHEN subcategory_id >= 900000 THEN 'L3 (с weight_kg)'
        ELSE 'L2 (без weight_kg)'
      END AS cat_type,
      COUNT(*) AS cnt,
      COUNT(*) FILTER (WHERE weight_kg IS NOT NULL) AS with_weight
    FROM parts_products
    GROUP BY 1
    ORDER BY cnt DESC
  `);
  breakdown.forEach(r => {
    console.log(`  ${r.cat_type.padEnd(22)} ${String(r.cnt).padStart(6)} шт, weight_kg: ${r.with_weight}`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
