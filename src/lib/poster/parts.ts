// Автопостинг запчастей из parts_products в тему «Запчасти» Telegram-группы.
import { createServerClient } from '@/lib/supabase';
import { getCurrencyRates } from '@/utils/getCurrencyRates';
import { GROUP_ID, PARTS_TOPIC_ID, PARTS_CONFIG } from './config';

export interface Part {
  id: number;
  part_number: string | null;
  name_ru: string | null;
  name_en: string | null;
  name_ko: string | null;
  manufacturer: string | null;
  price_krw: number | null;
  image_url: string | null;
  image_storage_url: string | null;
}

const COLS =
  'id, part_number, name_ru, name_en, name_ko, manufacturer, price_krw, image_url, image_storage_url';

/** Чистая копия из Storage приоритетнее оригинального хотлинка. */
function resolveImage(p: Part): string | null {
  return p.image_storage_url || p.image_url || null;
}

/** Ссылка на карточку товара KMotors (slug = артикул). */
function partUrl(p: Part): string {
  const slug = p.part_number || `id-${p.id}`;
  return `https://www.kmotors.shop/ru/parts/${slug}`;
}

function partName(p: Part): string {
  return p.name_ru || p.name_en || p.name_ko || `Запчасть ${p.part_number ?? p.id}`;
}

// ─── Выбор товара ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseQuery(sb: any, select: string, opts?: any) {
  let q = sb.from('parts_products').select(select, opts);
  if (PARTS_CONFIG.onlyPosterOk) {
    q = q.eq('poster_ok', true); // курированные к посту (с фото), помечены на бэке
  }
  if (PARTS_CONFIG.minPriceKrw) {
    q = q.gte('price_krw', PARTS_CONFIG.minPriceKrw); // отсекаем «копейки»
  }
  return q;
}

/** Множество уже запощенных id из списка (один запрос). */
async function filterPostedParts(ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const sb = createServerClient();
  const { data } = await sb.from('posted_parts').select('part_id').in('part_id', ids);
  return new Set((data ?? []).map((r: { part_id: number }) => r.part_id));
}

/** Начало текущих суток KST в ISO. */
function kstDayStartIso(): string {
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  const y = nowKst.getUTCFullYear();
  const m = nowKst.getUTCMonth();
  const d = nowKst.getUTCDate();
  return new Date(Date.UTC(y, m, d) - 9 * 3600 * 1000).toISOString();
}

export async function todayPartsCount(): Promise<number> {
  const sb = createServerClient();
  const { count } = await sb
    .from('posted_parts')
    .select('part_id', { count: 'exact', head: true })
    .gte('posted_at', kstDayStartIso());
  return count ?? 0;
}

/** Берёт случайный батч товаров и возвращает первый не запощенный. */
async function pickPart(): Promise<Part | null> {
  const sb = createServerClient();
  const { count } = await baseQuery(sb, 'id', { count: 'exact', head: true });
  const total = count ?? 0;
  if (!total) return null;

  const batch = PARTS_CONFIG.batchScan;
  const off = Math.floor(Math.random() * Math.max(1, total - batch));
  const { data } = await baseQuery(sb, COLS).range(off, off + batch - 1);
  const rows: Part[] = data ?? [];
  const posted = await filterPostedParts(rows.map((r) => r.id));
  return rows.find((r) => !posted.has(r.id)) ?? null;
}

async function markPostedPart(p: Part): Promise<void> {
  const sb = createServerClient();
  await sb.from('posted_parts').insert({
    part_id: p.id,
    part_number: p.part_number,
    name: partName(p),
    price_krw: p.price_krw,
  });
}

// ─── Подпись ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function usdFromKrw(priceKrw: number, krwToUsd: number): string {
  return '$' + Math.max(1, Math.round(priceKrw * krwToUsd)).toLocaleString('en-US');
}

function buildPartCaption(p: Part, usd: string | null): string {
  const lines: string[] = [];
  lines.push(`🔧 <b>${esc(partName(p))}</b>`);
  if (p.part_number) lines.push(`🏷 Артикул: <code>${esc(p.part_number)}</code>`);
  if (p.manufacturer) lines.push(`🏭 ${esc(p.manufacturer)}`);
  lines.push('');
  lines.push(usd ? `💰 <b>${usd}</b>` : '💬 Цена по запросу');
  lines.push('');
  lines.push('✅ Оригинал / OEM из Кореи');
  lines.push('✅ Отправка по РФ и СНГ');
  lines.push('');
  lines.push(`📩 Наличие и заказ — @${PARTS_CONFIG.contactUsername}`);
  lines.push(`🔗 <a href="${partUrl(p)}">Открыть на KMotors</a>`);
  const hashMaker = (p.manufacturer || '').replace(/[^A-Za-z0-9]/g, '');
  lines.push('');
  lines.push(['#Запчасти', '#АвтозапчастиИзКореи', hashMaker && `#${hashMaker}`].filter(Boolean).join(' '));
  return lines.join('\n');
}

// ─── Отправка ─────────────────────────────────────────────────────────────────

async function sendPart(image: string | null, caption: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

  const common = { chat_id: GROUP_ID, message_thread_id: PARTS_TOPIC_ID, parse_mode: 'HTML' };
  const [method, body] = image
    ? ['sendPhoto', { ...common, photo: image, caption }]
    : ['sendMessage', { ...common, text: caption }];

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? res.status}`);
}

// ─── Оркестрация ──────────────────────────────────────────────────────────────

export interface PartsRunResult {
  posted: boolean;
  part?: Part;
  caption?: string;
  image?: string | null;
  reason?: string;
}

export async function runPartsOnce(opts: { dryRun?: boolean } = {}): Promise<PartsRunResult> {
  const part = await pickPart();
  if (!part) return { posted: false, reason: 'нет подходящих запчастей в выборке' };

  const image = resolveImage(part);
  const { krwToUsd } = await getCurrencyRates();
  const usd = part.price_krw ? usdFromKrw(part.price_krw, krwToUsd) : null;
  const caption = buildPartCaption(part, usd);

  if (opts.dryRun) return { posted: false, part, caption, image };

  await sendPart(image, caption);
  await markPostedPart(part);
  return { posted: true, part, caption, image };
}
