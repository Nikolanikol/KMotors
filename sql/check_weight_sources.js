const { getClient } = require('./db');

async function main() {
  const c = getClient();
  await c.connect();

  // ══ 1. Три источника веса ══════════════════════════════════════════════
  const { rows: t } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE p.weight_kg IS NOT NULL)                                AS has_l3,
      COUNT(*) FILTER (WHERE p.weight_kg IS NULL AND cat.weight_avg_kg IS NOT NULL)  AS fallback_cat,
      COUNT(*) FILTER (WHERE p.weight_kg IS NULL AND cat.weight_avg_kg IS NULL)      AS no_weight_at_all,
      COUNT(*)                                                                        AS total
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
  `);
  const r = t[0];
  const pct = v => (parseInt(v) / parseInt(r.total) * 100).toFixed(1);

  console.log('══ ИСТОЧНИКИ ВЕСА ДЛЯ 48,689 ТОВАРОВ ══════════════════════');
  console.log(`  1. L3 price-interpolation (weight_kg заполнен): ${r.has_l3.toString().padStart(6)}  (${pct(r.has_l3)}%)`);
  console.log(`  2. L2 cat.weight_avg_kg (плоский fallback):     ${r.fallback_cat.toString().padStart(6)}  (${pct(r.fallback_cat)}%)`);
  console.log(`  3. НЕТ ВЕСА ВООБЩЕ (оба NULL):                  ${r.no_weight_at_all.toString().padStart(6)}  (${pct(r.no_weight_at_all)}%)  ← ?`);
  console.log(`  Итого:                                           ${r.total.toString().padStart(6)}`);

  // ══ 2. Категории без weight_avg_kg ════════════════════════════════════
  if (parseInt(r.no_weight_at_all) > 0) {
    const { rows: nullCats } = await c.query(`
      SELECT cat.id, cat.name_ru, cat.weight_avg_kg,
             COUNT(p.id) AS cnt
      FROM parts_categories cat
      JOIN parts_products p ON p.subcategory_id = cat.id
      WHERE cat.weight_avg_kg IS NULL
        AND p.weight_kg IS NULL
      GROUP BY cat.id, cat.name_ru, cat.weight_avg_kg
      ORDER BY cnt DESC
    `);
    console.log(`\n  Категории с NULL weight_avg_kg (нет вообще никакого веса):`);
    nullCats.forEach(r =>
      console.log(`    [${r.id}] ${(r.name_ru||'?').padEnd(34)} ${r.cnt} шт`)
    );
  } else {
    console.log(`\n  ✓ Все товары имеют хотя бы один источник веса`);
  }

  // ══ 3. Топ L2 категорий — плоский fallback ════════════════════════════
  console.log('\n══ ТОП-30 L2 КАТЕГОРИЙ (плоский вес, нет L3) ══════════════');
  const { rows: cats } = await c.query(`
    SELECT
      cat.id,
      cat.name_ru,
      cat.weight_avg_kg                               AS flat_w,
      COUNT(p.id)                                     AS cnt,
      ROUND(MIN(p.price_krw))                         AS min_p,
      ROUND(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY p.price_krw)) AS p10,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY p.price_krw)) AS p90,
      ROUND(MAX(p.price_krw))                         AS max_p
    FROM parts_categories cat
    JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE p.weight_kg IS NULL
      AND cat.weight_avg_kg IS NOT NULL
      AND cat.id < 900000
    GROUP BY cat.id, cat.name_ru, cat.weight_avg_kg
    ORDER BY COUNT(p.id) DESC
    LIMIT 30
  `);

  cats.forEach(r => {
    const ratio = r.p10 > 0 ? Math.round(r.p90 / r.p10) : '?';
    const flag = ratio > 30 ? ' ⚠ ratio>' + ratio + 'x' : '';
    console.log(
      `  [${r.id}] ${(r.name_ru||'?').padEnd(33)}` +
      ` ${String(r.cnt).padStart(5)} шт` +
      ` | ${String(r.flat_w).padStart(5)}кг` +
      ` | P10₩${String(r.p10).padStart(7)} P90₩${String(r.p90).padStart(8)}${flag}`
    );
  });

  // ══ 4. Экстремальные случаи в L2-fallback ═════════════════════════════
  console.log('\n══ САМЫЕ ДОРОГИЕ ТОВАРЫ НА ПЛОСКОМ ВЕСЕ ════════════════════');
  console.log('  (Важно: дорогой товар = вероятно тяжёлый, а вес плоский)');
  const { rows: expCats } = await c.query(`
    SELECT p.name_en, p.price_krw,
           cat.weight_avg_kg, cat.name_ru
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.weight_kg IS NULL
      AND cat.weight_avg_kg IS NOT NULL
    ORDER BY p.price_krw DESC
    LIMIT 20
  `);
  expCats.forEach(r =>
    console.log(`  flat=${String(r.weight_avg_kg).padStart(5)}кг | ₩${String(r.price_krw).padStart(10)} | [${(r.name_ru||'?').substring(0,20)}] ${(r.name_en||'').substring(0,52)}`)
  );

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
