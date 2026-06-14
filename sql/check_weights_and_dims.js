const { getClient } = require('./db');

async function main() {
  const c = getClient();
  await c.connect();

  // ══ 1. КОЛОНКИ ТАБЛИЦЫ — есть ли габариты? ══════════════════════════
  console.log('══ 1. СТРУКТУРА parts_products ══════════════════════════════');
  const { rows: cols } = await c.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'parts_products'
    ORDER BY ordinal_position
  `);
  const dimCols = cols.filter(r =>
    /weight|dim|length|width|height|size|volume|box|cm|kg|mm/i.test(r.column_name)
  );
  console.log('  Всего колонок:', cols.length);
  console.log('  Колонки с весом/габаритами:');
  dimCols.forEach(r => console.log(`    ${r.column_name.padEnd(30)} ${r.data_type}`));
  console.log('  Прочие:');
  cols.filter(r => !dimCols.includes(r)).forEach(r =>
    console.log(`    ${r.column_name.padEnd(30)} ${r.data_type}`)
  );

  // ══ 2. ЗАПОЛНЕННОСТЬ РАЗМЕРНЫХ КОЛОНОК ════════════════════════════════
  console.log('\n══ 2. ЗАПОЛНЕННОСТЬ РАЗМЕРНЫХ КОЛОНОК ═══════════════════════');
  const dimNames = dimCols.map(r => r.column_name);
  if (dimNames.length > 0) {
    const selects = dimNames.map(col =>
      `COUNT(*) FILTER (WHERE ${col} IS NOT NULL) AS "${col}_filled"`
    ).join(',\n      ');
    const { rows: fill } = await c.query(`
      SELECT COUNT(*) AS total, ${selects}
      FROM parts_products
    `);
    const f = fill[0];
    console.log(`  Всего товаров: ${f.total}`);
    dimNames.forEach(col => {
      const n = f[col + '_filled'] || 0;
      const pct = (parseInt(n) / parseInt(f.total) * 100).toFixed(1);
      console.log(`  ${col.padEnd(30)} ${String(n).padStart(6)} (${pct}%)`);
    });
  }

  // ══ 3. АНОМАЛИИ ВЕСОВ — нулевые, отрицательные, экстремальные ════════
  console.log('\n══ 3. АНОМАЛИИ В weight_kg ══════════════════════════════════');
  const { rows: anomaly } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE weight_kg = 0)               AS zero_w,
      COUNT(*) FILTER (WHERE weight_kg < 0)               AS negative_w,
      COUNT(*) FILTER (WHERE weight_kg > 100)             AS over_100kg,
      COUNT(*) FILTER (WHERE weight_kg > 30 AND weight_kg <= 100) AS heavy_30_100,
      COUNT(*) FILTER (WHERE weight_kg > 0 AND weight_kg < 0.01)  AS tiny_under_10g,
      MIN(weight_kg)  AS min_w,
      MAX(weight_kg)  AS max_w,
      ROUND(AVG(weight_kg)::numeric, 3) AS avg_w,
      COUNT(*) FILTER (WHERE weight_kg IS NOT NULL) AS has_w
    FROM parts_products
  `);
  const a = anomaly[0];
  console.log(`  Нулевые (= 0кг):          ${a.zero_w}`);
  console.log(`  Отрицательные (< 0кг):    ${a.negative_w}`);
  console.log(`  Экстремально тяжёлые (> 100кг): ${a.over_100kg}`);
  console.log(`  Тяжёлые 30-100кг:         ${a.heavy_30_100}`);
  console.log(`  Микро (< 10г):            ${a.tiny_under_10g}`);
  console.log(`  Диапазон: ${a.min_w} кг – ${a.max_w} кг`);
  console.log(`  Среднее (все с весом):    ${a.avg_w} кг`);

  // Примеры сверхтяжёлых
  if (parseInt(a.over_100kg) > 0 || parseInt(a.heavy_30_100) > 0) {
    const { rows: heavy } = await c.query(`
      SELECT p.name_en, p.price_krw, p.weight_kg,
             cat.name_ru AS cat
      FROM parts_products p
      JOIN parts_categories cat ON cat.id = p.subcategory_id
      WHERE p.weight_kg > 30
      ORDER BY p.weight_kg DESC LIMIT 15
    `);
    console.log('\n  Самые тяжёлые товары (> 30кг):');
    heavy.forEach(r =>
      console.log(`    ${String(r.weight_kg).padStart(8)}кг | ₩${String(r.price_krw).padStart(8)} | [${(r.cat||'?').substring(0,20).padEnd(20)}] ${(r.name_en||'').substring(0,50)}`)
    );
  }

  // ══ 4. SPOT-CHECK: РЕАЛЬНЫЕ ТОВАРЫ И ИХ ВЕСА ═════════════════════════
  console.log('\n══ 4. SPOT-CHECK — ПРИМЕРЫ ПО КЛЮЧЕВЫМ ТИПАМ ══════════════');
  const checks = [
    { name: 'Свеча зажигания',    kw: '%spark plug%',   expect: '0.05-0.15кг' },
    { name: 'Тормозной диск',     kw: '%brake disc%',   expect: '5-12кг' },
    { name: 'Воздушный фильтр',   kw: '%air filter%',   expect: '0.2-0.8кг' },
    { name: 'Катализатор',        kw: '%catalytic%',    expect: '3-8кг' },
    { name: 'Колодки тормозные',  kw: '%brake pad%',    expect: '0.5-1.5кг' },
    { name: 'Подшипник ступицы',  kw: '%hub bearing%',  expect: '1-3кг' },
    { name: 'Болт крепления',     kw: '%bolt%',         expect: '< 0.1кг' },
    { name: 'Прокладка ГБЦ',      kw: '%head gasket%',  expect: '0.2-0.5кг' },
    { name: 'Маховик',            kw: '%flywheel%',     expect: '5-12кг' },
    { name: 'Помпа охлаждения',   kw: '%water pump%',   expect: '1-3кг' },
  ];

  for (const chk of checks) {
    const { rows: ex } = await c.query(`
      SELECT p.name_en, p.price_krw, p.weight_kg,
             COALESCE(p.weight_kg, cat.weight_avg_kg) AS eff_weight,
             CASE WHEN p.weight_kg IS NOT NULL THEN 'L3' ELSE 'L2-avg' END AS src
      FROM parts_products p
      JOIN parts_categories cat ON cat.id = p.subcategory_id
      WHERE LOWER(p.name_en) LIKE $1
      ORDER BY p.price_krw
      LIMIT 3
    `, [chk.kw]);
    if (ex.length === 0) { console.log(`  [${chk.name}] нет товаров`); continue; }
    console.log(`\n  ${chk.name} (ожид: ${chk.expect})`);
    ex.forEach(r =>
      console.log(`    [${r.src}] ${String(r.eff_weight||'?').padStart(6)}кг | ₩${String(r.price_krw).padStart(8)} | ${(r.name_en||'').substring(0,55)}`)
    );
  }

  // ══ 5. РАСХОЖДЕНИЯ L3 vs L2 ════════════════════════════════════════════
  console.log('\n══ 5. ТОВАРЫ ГДЕ L3-ВЕС СИЛЬНО ОТЛИЧАЕТСЯ ОТ L2-avg ═══════');
  console.log('  (Разница > 5x — потенциальная ошибка классификации)');
  const { rows: mismatch } = await c.query(`
    SELECT
      p.name_en,
      p.price_krw,
      p.weight_kg                       AS l3_weight,
      cat.weight_avg_kg                 AS l2_avg,
      ROUND((p.weight_kg / NULLIF(cat.weight_avg_kg, 0))::numeric, 1) AS ratio,
      cat.name_ru
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.weight_kg IS NOT NULL
      AND cat.weight_avg_kg IS NOT NULL
      AND cat.weight_avg_kg > 0
      AND (p.weight_kg / cat.weight_avg_kg > 8
        OR p.weight_kg / cat.weight_avg_kg < 0.05)
    ORDER BY (p.weight_kg / cat.weight_avg_kg) DESC
    LIMIT 20
  `);
  if (mismatch.length === 0) {
    console.log('  Расхождений > 8x не найдено — хорошо!');
  } else {
    console.log(`  Найдено ${mismatch.length} товаров с аномальным соотношением:`);
    mismatch.forEach(r =>
      console.log(`    ratio=${String(r.ratio).padStart(6)}x | L3=${r.l3_weight}кг vs L2=${r.l2_avg}кг | [${(r.cat_ru||r.name_ru||'?').substring(0,18)}] ₩${r.price_krw} ${(r.name_en||'').substring(0,40)}`)
    );
  }

  // ══ 6. L3 КАТЕГОРИИ — РАЗБРОС ВНУТРИ ═══════════════════════════════════
  console.log('\n══ 6. РАЗБРОС ВЕСОВ ВНУТРИ L3 КАТЕГОРИЙ ════════════════════');
  const { rows: l3spread } = await c.query(`
    SELECT
      cat.id,
      cat.name_ru,
      cat.weight_min_kg,
      cat.weight_max_kg,
      COUNT(p.id)                            AS cnt,
      ROUND(MIN(p.weight_kg)::numeric, 3)   AS actual_min,
      ROUND(MAX(p.weight_kg)::numeric, 3)   AS actual_max,
      ROUND(AVG(p.weight_kg)::numeric, 3)   AS actual_avg
    FROM parts_categories cat
    JOIN parts_products p ON p.subcategory_id = cat.id AND p.weight_kg IS NOT NULL
    WHERE cat.id >= 900000 AND cat.id != 900999
    GROUP BY cat.id, cat.name_ru, cat.weight_min_kg, cat.weight_max_kg
    ORDER BY (ROUND(MAX(p.weight_kg)::numeric, 3) / NULLIF(ROUND(MIN(p.weight_kg)::numeric, 3), 0)) DESC NULLS LAST
    LIMIT 25
  `);
  l3spread.forEach(r => {
    const ok = r.actual_min >= r.weight_min_kg * 0.5 && r.actual_max <= r.weight_max_kg * 1.5;
    const flag = ok ? '✓' : '⚠';
    console.log(
      `  [${flag}] [${r.id}] ${(r.name_ru||'').padEnd(36)}` +
      ` шт=${String(r.cnt).padStart(4)}` +
      ` | норм=[${r.weight_min_kg}–${r.weight_max_kg}]кг` +
      ` | факт=[${r.actual_min}–${r.actual_max}]кг avg=${r.actual_avg}`
    );
  });

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
