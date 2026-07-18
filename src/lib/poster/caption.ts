// Сборка продающей HTML-подписи под медиагруппу.
import { translateModelName, translateGradeText, MANUFACTURER_MAP } from './translations';
import { kmotorsUrl, type Listing } from './encar';
import { POST_CONFIG } from './config';

// Топливо/КПП → русский (аудитория канала русскоязычная)
const FUEL_RU: Record<string, string> = {
  '가솔린': 'Бензин', '디젤': 'Дизель', 'LPG': 'Газ (LPG)',
  '하이브리드': 'Гибрид', '가솔린+전기': 'Гибрид', '디젤+전기': 'Гибрид',
  '전기': 'Электро', '수소': 'Водород',
};
const TRANS_RU: Record<string, string> = {
  '오토': 'Автомат', '수동': 'Механика', 'CVT': 'CVT', '세미오토': 'Робот',
};
const REGION_RU: Record<string, string> = {
  '서울': 'Сеул', '경기': 'Кёнгидо', '인천': 'Инчхон', '부산': 'Пусан',
  '대구': 'Тэгу', '대전': 'Тэджон', '광주': 'Кванджу', '울산': 'Ульсан',
  '세종': 'Седжон', '강원': 'Канвондо', '충북': 'Чхунчхон-Пукто',
  '충남': 'Чхунчхон-Намдо', '전북': 'Чолла-Пукто', '전남': 'Чолла-Намдо',
  '경북': 'Кёнсан-Пукто', '경남': 'Кёнсан-Намдо', '제주': 'Чеджу',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Год YYYYMM → "2020.10". */
function formatYear(ym: number): string {
  const s = String(ym);
  return s.length >= 6 ? `${s.slice(0, 4)}.${s.slice(4, 6)}` : s.slice(0, 4);
}

/**
 * @param usdLabel уже посчитанная цена в USD (напр. "$10,700")
 * @param signals плюс-сигналы доверия из квалити-гейта
 */
export function buildCaption(l: Listing, usdLabel: string, signals: string[]): string {
  const maker = MANUFACTURER_MAP[l.manufacturerKo] ?? translateModelName(l.manufacturerKo);
  // Убираем корейские слова топлива из названия — топливо показываем отдельной строкой
  const model = translateModelName(l.modelKo)
    .replace(/하이브리드|가솔린|디젤|전기|수소|플러그인/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const grade = translateGradeText(l.badgeKo);
  const fuel = FUEL_RU[l.fuelKo] ?? l.fuelKo;
  const trans = TRANS_RU[l.transKo] ?? l.transKo;
  const region = REGION_RU[l.city] ?? l.city;
  const km = l.mileage.toLocaleString('ru-RU').replace(/,/g, ' ');

  const lines: string[] = [];
  lines.push(`🚗 <b>${esc(`${maker} ${model}`.trim())}</b>`);
  if (grade) lines.push(`<i>${esc(grade)}</i>`);
  lines.push('');
  lines.push(`📅 ${formatYear(l.year)}   🛣 ${km} км`);
  lines.push(`⛽️ ${esc(fuel)}   ⚙️ ${esc(trans)}`);
  if (region) lines.push(`📍 Корея · ${esc(region)}`);
  lines.push('');
  lines.push(`💰 <b>${usdLabel}</b>`);
  lines.push('');
  for (const s of signals) lines.push(`✅ ${esc(s)}`);
  lines.push('✅ Пригон под ключ из Кореи');
  lines.push('');
  lines.push(`📩 Расчёт до Владивостока — @${POST_CONFIG.contactUsername}`);
  lines.push(`🔗 <a href="${kmotorsUrl(l.id)}">Подробнее на KMotors</a>`);

  const hashModel = model
    .replace(/\(.*?\)/g, '')
    .replace(/\b(All New|The New|New|Next)\b/gi, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .trim();
  const hashMaker = maker.replace(/[^A-Za-z0-9]/g, '');
  lines.push('');
  lines.push([`#${hashMaker}`, hashModel && `#${hashModel}`, '#АвтоИзКореи'].filter(Boolean).join(' '));

  return lines.join('\n');
}

/** Конвертирует цену в 만원 в подпись USD "$10,700" по курсу krwToUsd. */
export function usdLabel(priceMan: number, krwToUsd: number): string {
  const usd = priceMan * 10000 * krwToUsd;
  const rounded = Math.round(usd / 100) * 100;
  return '$' + rounded.toLocaleString('en-US');
}
