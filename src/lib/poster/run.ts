// Оркестрация одного тика постера: выбрать пресет → найти → отфильтровать → запостить.
import { getCurrencyRates } from '@/utils/getCurrencyRates';
import { PRESETS, POST_CONFIG, GROUP_ID, CARS_TOPIC_ID, rotationSequence } from './config';
import { searchListings, fetchDetail, type Listing } from './encar';
import { prefilter, deepGate } from './quality';
import { buildCaption, usdLabel } from './caption';
import { optionHighlights } from './options';
import { filterUnposted, markPosted, totalCount } from './store';

export interface RunResult {
  posted: boolean;
  preset: string;
  listing?: Listing;
  caption?: string;
  photos?: string[];
  reason?: string;
  scanned: number;
  rejected: { id: string; reason: string }[];
}

export interface RunOptions {
  dryRun?: boolean;
  presetIndex?: number; // форс пресета (иначе — ротация по числу постов)
}

export async function runOnce(opts: RunOptions = {}): Promise<RunResult> {
  let idx = opts.presetIndex;
  if (idx === undefined) {
    const seq = rotationSequence();
    idx = seq[(await totalCount()) % seq.length];
  }
  const preset = PRESETS[idx];
  const rejected: { id: string; reason: string }[] = [];

  const listings = await searchListings(preset, POST_CONFIG.candidatesToScan);
  const posted = await filterUnposted(listings.map((l) => l.id));

  for (const l of listings) {
    if (posted.has(l.id)) {
      rejected.push({ id: l.id, reason: 'уже постили' });
      continue;
    }
    const pre = prefilter(l);
    if (!pre.pass) {
      rejected.push({ id: l.id, reason: pre.reason! });
      continue;
    }

    const detail = await fetchDetail(l.id, POST_CONFIG.photosPerPost);
    if (!detail) {
      rejected.push({ id: l.id, reason: 'не удалось получить detail' });
      continue;
    }
    const gate = deepGate(l, detail);
    if (!gate.pass) {
      rejected.push({ id: l.id, reason: gate.reason! });
      continue;
    }

    const { krwToUsd } = await getCurrencyRates();
    const options = optionHighlights(detail.optionCodes);
    const caption = buildCaption(l, usdLabel(l.priceMan, krwToUsd), gate.signals, options);

    if (opts.dryRun) {
      return { posted: false, preset: preset.label, listing: l, caption, photos: detail.photos, scanned: listings.length, rejected };
    }

    await sendMediaGroup(detail.photos, caption);
    await markPosted(l, preset.label);
    return { posted: true, preset: preset.label, listing: l, caption, photos: detail.photos, scanned: listings.length, rejected };
  }

  return {
    posted: false,
    preset: preset.label,
    reason: `нет годных кандидатов по пресету «${preset.label}»`,
    scanned: listings.length,
    rejected,
  };
}

async function sendMediaGroup(photos: string[], caption: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

  const media = photos.map((url, i) =>
    i === 0
      ? { type: 'photo', media: url, caption, parse_mode: 'HTML' }
      : { type: 'photo', media: url },
  );

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: GROUP_ID, message_thread_id: CARS_TOPIC_ID, media }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram sendMediaGroup: ${data.description ?? res.status}`);
}
