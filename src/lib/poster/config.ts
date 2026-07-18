// Конфиг автопостинга авто с Encar в Telegram-канал.

// ─── Telegram ────────────────────────────────────────────────────────────────
// Постит тот же бот, что и лид-формы (@KMOTORS_form_bot) — реюз TELEGRAM_BOT_TOKEN.
// Новый env только под ID публичного канала «Авто из Кореи | Николай».
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003889045726';

// ─── Пресеты выборки ─────────────────────────────────────────────────────────
// Марка/модель — корейскими названиями (как требует поиск Encar).
export interface Preset {
  label: string;
  manufacturerKo: string; // 현대, 기아, ...
  modelGroupKo: string;   // 아반떼, K5, ...
  yearFrom?: number;      // YYYY (форм-год)
  priceMaxMan?: number;   // 만원
  mileageMax?: number;    // км
}

// Ротация: пресет выбирается по (число уже запощенных) % длины массива.
export const PRESETS: Preset[] = [
  { label: 'Hyundai Avante', manufacturerKo: '현대', modelGroupKo: '아반떼', yearFrom: 2018, priceMaxMan: 2000, mileageMax: 100000 },
  { label: 'Kia K5',         manufacturerKo: '기아', modelGroupKo: 'K5',    yearFrom: 2019, priceMaxMan: 2500, mileageMax: 100000 },
  { label: 'Hyundai Sonata', manufacturerKo: '현대', modelGroupKo: '쏘나타', yearFrom: 2019, priceMaxMan: 2500, mileageMax: 100000 },
  { label: 'Hyundai Tucson', manufacturerKo: '현대', modelGroupKo: '투싼',  yearFrom: 2019, priceMaxMan: 3000, mileageMax: 100000 },
  { label: 'Kia Sorento',    manufacturerKo: '기아', modelGroupKo: '쏘렌토', yearFrom: 2020, priceMaxMan: 4000, mileageMax: 100000 },
];

// ─── Правила публикации ──────────────────────────────────────────────────────
export const POST_CONFIG = {
  photosPerPost: 9,          // фото в медиагруппе (Telegram максимум 10)
  candidatesToScan: 30,      // сколько свежих объявлений просматриваем
  maxPostsPerDay: 5,         // дневной лимит (проверяется по posted_vehicles)
  windowStartHourKst: 9,     // не постить раньше 09:00 KST
  windowEndHourKst: 21,      // и позже 21:00 KST
  contactUsername: 'caparts',
};

/** Текущий час по KST (0–23). Окно проверяем TZ-независимо от сервера. */
export function currentKstHour(): number {
  return new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
}
export function withinPostingWindow(): boolean {
  const h = currentKstHour();
  return h >= POST_CONFIG.windowStartHourKst && h < POST_CONFIG.windowEndHourKst;
}

// ─── Квалити-гейт ────────────────────────────────────────────────────────────
export const QUALITY = {
  minPhotos: 5,
  requireInspection: true, // требуем пройденную диагностику Encar
  rejectAccident: true,    // отсекаем авто с ДТП в записи
  rejectDuplicate: true,   // отсекаем авто-дубли (ServiceCopyCar: DUPLICATION)
};
