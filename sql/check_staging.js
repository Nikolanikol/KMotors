require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Все "creep" — полные названия
  console.log('══ creep — полные названия ══');
  const { rows: creep } = await c.query(`
    SELECT name_en, price_krw
    FROM parts_products
    WHERE subcategory_id = 900999
      AND LOWER(name_en) LIKE '%creep%'
    ORDER BY price_krw DESC
  `);
  creep.forEach(r =>
    console.log('  ₩' + String(r.price_krw).padStart(6) + '  ' + r.name_en)
  );

  // 2. Топ-30 по уникальным префиксам с примерами
  console.log('\n══ Все префиксы в 900999 + примеры ══');
  const { rows: groups } = await c.query(`
    SELECT
      LOWER(split_part(name_en, '-', 1)) AS prefix,
      COUNT(*) AS cnt,
      ROUND(AVG(price_krw)) AS avg_p,
      MIN(name_en) AS example
    FROM parts_products
    WHERE subcategory_id = 900999
    GROUP BY prefix
    ORDER BY cnt DESC
    LIMIT 30
  `);
  groups.forEach(r =>
    console.log('  ' + String(r.cnt).padStart(4) + '  ' +
                (r.prefix||'?').padEnd(28) + ' avg₩' + String(r.avg_p).padStart(6) +
                '  ex: ' + (r.example||'').substring(0, 60))
  );

  // 3. Ценовое распределение — убедимся что всё < ₩3k
  const { rows: price } = await c.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE price_krw < 1000)  AS under_1k,
      COUNT(*) FILTER (WHERE price_krw < 2000)  AS under_2k,
      COUNT(*) FILTER (WHERE price_krw < 3000)  AS under_3k,
      MIN(price_krw) AS min_p,
      MAX(price_krw) AS max_p
    FROM parts_products
    WHERE subcategory_id = 900999
  `);
  const p = price[0];
  console.log('\n══ Ценовое распределение 900999 ══');
  console.log(`  Всего: ${p.total}  min ₩${p.min_p}  max ₩${p.max_p}`);
  console.log(`  < ₩1000: ${p.under_1k}  < ₩2000: ${p.under_2k}  < ₩3000: ${p.under_3k}`);

  // 4. Топ по ключевым словам внутри (для рассортировки)
  console.log('\n══ Ключевые слова (для рассортировки) ══');
  const keywords = [
    ['шайбы/прокладки',   "LOWER(name_en) SIMILAR TO '%(washer|washa|shim|gasket|sealing)%'"],
    ['пружины/кольца',    "LOWER(name_en) SIMILAR TO '%(spring|snap ring|circlip|retaining ring)%'"],
    ['втулки/сайлентблок',"LOWER(name_en) SIMILAR TO '%(bush|bushing|grommet|rubber insert)%'"],
    ['заглушки/крышки',   "LOWER(name_en) SIMILAR TO '%(cap|plug|stopper|blind plug)%'"],
    ['пыльники/чехлы',    "LOWER(name_en) SIMILAR TO '%(boot|dust cover|dust seal|bellows)%'"],
    ['скобы/клипсы',      "LOWER(name_en) SIMILAR TO '%(clip|clamp|bracket|holder|skirt)%'"],
    ['изоляторы',         "LOWER(name_en) SIMILAR TO '%(insulator|damper|cushion|pad)%'"],
  ];
  for (const [label, where] of keywords) {
    const { rows: kw } = await c.query(
      `SELECT COUNT(*) AS n FROM parts_products WHERE subcategory_id = 900999 AND ${where}`
    );
    console.log(`  ${label.padEnd(22)} ${kw[0].n} шт`);
  }

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
