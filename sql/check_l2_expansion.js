const { getClient } = require('./db');

async function main() {
  const c = getClient();
  await c.connect();

  // L2 категории: товары БЕЗ per-product weight (subcategory_id < 900000)
  // Показываем разброс цен и неоднородность
  const { rows } = await c.query(`
    SELECT
      cat.id,
      cat.name_ru,
      cat.weight_avg_kg,
      COUNT(p.id)                                          AS cnt,
      ROUND(MIN(p.price_krw))                              AS min_p,
      ROUND(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY p.price_krw)) AS p10,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p.price_krw)) AS p50,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY p.price_krw)) AS p90,
      ROUND(MAX(p.price_krw))                              AS max_p,
      -- Коэффициент неоднородности: P90/P10 (чем выше — тем разнороднее)
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY p.price_krw) /
        NULLIF(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY p.price_krw), 0)) AS ratio
    FROM parts_categories cat
    JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id < 900000        -- только L2 (не L3)
      AND cat.id NOT IN (        -- исключаем Прочее (уже знаем)
        17799, 18199, 17999, 17899, 18099
      )
    GROUP BY cat.id, cat.name_ru, cat.weight_avg_kg
    HAVING COUNT(p.id) >= 100    -- только крупные категории
    ORDER BY COUNT(p.id) DESC
  `);

  console.log('══════════════════════════════════════════════════════════════════════════');
  console.log('  L2 КАТЕГОРИИ С ТОВАРАМИ БЕЗ L3 (кандидаты на расширение)');
  console.log('  ratio = P90/P10 цены — выше 20x → высокая неоднородность → нужна L3');
  console.log('══════════════════════════════════════════════════════════════════════════');
  console.log('');

  rows.forEach(r => {
    const flag = r.ratio > 50  ? ' 🔴 HIGH' :
                 r.ratio > 20  ? ' 🟡 MED'  : ' 🟢 OK';
    console.log(
      `  [${r.id}] ${(r.name_ru||'').padEnd(32)}` +
      ` ${String(r.cnt).padStart(5)} шт` +
      ` | avg_w=${(r.weight_avg_kg||'?')}кг` +
      ` | ratio=${String(r.ratio).padStart(4)}x` +
      ` | P10₩${String(r.p10).padStart(7)} P50₩${String(r.p50).padStart(7)} P90₩${String(r.p90).padStart(8)}` +
      flag
    );
  });

  // Итог
  const totalL2 = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
  const highPriority = rows.filter(r => r.ratio > 20);
  console.log('');
  console.log(`  Всего в этих L2: ${totalL2} товаров`);
  console.log(`  Высокий приоритет (ratio>20x): ${highPriority.length} категорий, ` +
    `${highPriority.reduce((s,r)=>s+parseInt(r.cnt),0)} товаров`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
