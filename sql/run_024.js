const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  // Снапшот ДО
  const { rows: before } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17801) AS akpp,
      COUNT(*) FILTER (WHERE subcategory_id = 17710) AS exhaust,
      COUNT(*) FILTER (WHERE subcategory_id = 18101) AS seats
    FROM parts_products
  `);
  const b = before[0];
  console.log('══ ПАТЧ 024: Критические весовые ошибки ══');
  console.log(`  ДО: АКПП=${b.akpp} | Выхлоп=${b.exhaust} | Сиденья=${b.seats}`);
  console.log('');

  const sql = fs.readFileSync(path.join(__dirname, '024_critical_weight_fixes.sql'), 'utf8');
  // Разбиваем на блоки по пустым строкам между командами, убираем комментарии
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'INSERT L3 900916/900917/900918',
    'АКПП 17801 → 900916 (< ₩30k)',
    'Выхлоп 17710 → 900917 (gaskets/sensors/< ₩20k)',
    'Сиденья 18101 → 900918 (< ₩15k)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      totalMoved += (i > 0 ? n : 0);
      const label = labels[i] || `stmt ${i + 1}`;
      const icon = i === 0 ? '✚' : (n > 0 ? '✓' : '·');
      console.log(`  [${icon}] ${label.padEnd(48)} ${i > 0 ? String(n).padStart(4) + ' шт' : ''}`);
    } catch (e) {
      console.error(`  [✗] ${labels[i] || `stmt ${i}`}: ${e.message}`);
    }
  }

  // Снапшот ПОСЛЕ
  const { rows: after } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17801) AS akpp,
      COUNT(*) FILTER (WHERE subcategory_id = 17710) AS exhaust,
      COUNT(*) FILTER (WHERE subcategory_id = 18101) AS seats,
      COUNT(*) FILTER (WHERE subcategory_id = 900916) AS l3_akpp,
      COUNT(*) FILTER (WHERE subcategory_id = 900917) AS l3_exhaust,
      COUNT(*) FILTER (WHERE subcategory_id = 900918) AS l3_seats
    FROM parts_products
  `);
  const a = after[0];

  console.log('');
  console.log('  ── Результат ──────────────────────────────────────');
  console.log(`  АКПП:    ${b.akpp} → ${a.akpp} шт остало + ${a.l3_akpp} → L3 900916 (было 70кг, станет 0.3кг)`);
  console.log(`  Выхлоп:  ${b.exhaust} → ${a.exhaust} шт остало + ${a.l3_exhaust} → L3 900917 (было 6кг, станет 0.12кг)`);
  console.log(`  Сиденья: ${b.seats} → ${a.seats} шт остало + ${a.l3_seats} → L3 900918 (было 18кг, станет 0.1кг)`);
  console.log(`  Итого перемещено: ${totalMoved} шт`);

  // Проверка — показываем примеры
  console.log('');
  console.log('  ── Примеры перемещённых товаров ─────────────────');
  const { rows: ex } = await c.query(`
    SELECT subcategory_id, name_en, price_krw,
      CASE subcategory_id
        WHEN 900916 THEN 'АКПП→0.3кг'
        WHEN 900917 THEN 'Выхлоп→0.12кг'
        WHEN 900918 THEN 'Сиденья→0.1кг'
      END AS new_cat
    FROM parts_products
    WHERE subcategory_id IN (900916, 900917, 900918)
    ORDER BY subcategory_id, price_krw
    LIMIT 12
  `);
  ex.forEach(r =>
    console.log(`  [${r.new_cat}] ₩${String(r.price_krw).padStart(7)} | ${(r.name_en || '').substring(0, 60)}`)
  );

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
