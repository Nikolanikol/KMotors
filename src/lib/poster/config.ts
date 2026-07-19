// Конфиг автопостинга авто с Encar в Telegram-канал.

// ─── Telegram ────────────────────────────────────────────────────────────────
// Постит тот же бот, что и лид-формы (@KMOTORS_form_bot) — реюз TELEGRAM_BOT_TOKEN.
// Новый env только под ID публичного канала «Авто из Кореи | Николай».
// Авто постим в тему «Автомобили» форум-супергруппы «Авто из Кореи | Mobis | OEM».
export const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '-1003659575794';
export const CARS_TOPIC_ID = Number(process.env.TELEGRAM_CARS_TOPIC_ID || '150');
// Запчасти постим в тему «Запчасти» той же группы.
export const PARTS_TOPIC_ID = Number(process.env.TELEGRAM_PARTS_TOPIC_ID || '151');

// ─── Правила постинга запчастей ──────────────────────────────────────────────
export const PARTS_CONFIG = {
  maxPostsPerDay: 8,      // дневной лимит постов запчастей
  batchScan: 60,          // сколько товаров тянем за раз для выбора
  requirePhoto: false,    // ТЕСТ: любые запчасти. Позже true — только с фото.
  contactUsername: 'caparts',
};
// Старый канал — больше не используется для автопостинга (оставлен для совместимости).
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003889045726';

// ─── Пресеты выборки ─────────────────────────────────────────────────────────
// Марка/модель — корейскими названиями (как требует поиск Encar).
export interface Preset {
  label: string;
  manufacturerKo: string; // 현대, 기아, 벤츠, BMW, 아우디, 제네시스 ...
  modelGroupKo: string;   // 아반떼, K5, E-클래스 ...
  imported?: boolean;     // true → импорт (CarType.N); иначе отечественная (CarType.Y)
  weight?: number;        // частота в ротации (1 = обычная, 2 = чаще); по умолчанию 1
  yearFrom?: number;      // YYYY (форм-год)
  mileageMax?: number;    // км (потолка цены нет — постим любой ценник)
}

// Ротация: взвешенная (см. rotationSequence). weight>1 = модель выходит чаще.
export const PRESETS: Preset[] = [
  // ─── Корейские массовые (国産) ───
  { label: 'Hyundai Avante',   manufacturerKo: '현대', modelGroupKo: '아반떼',   yearFrom: 2018, mileageMax: 130000 },
  { label: 'Kia K5',           manufacturerKo: '기아', modelGroupKo: 'K5',       yearFrom: 2019, mileageMax: 130000 },
  { label: 'Hyundai Sonata',   manufacturerKo: '현대', modelGroupKo: '쏘나타',   yearFrom: 2019, mileageMax: 130000 },
  { label: 'Hyundai Grandeur', manufacturerKo: '현대', modelGroupKo: '그랜저',   yearFrom: 2018, mileageMax: 130000 },
  { label: 'Kia K3',           manufacturerKo: '기아', modelGroupKo: 'K3',       yearFrom: 2019, mileageMax: 130000 },
  { label: 'Kia K8',           manufacturerKo: '기아', modelGroupKo: 'K8',       yearFrom: 2021, mileageMax: 120000 },
  { label: 'Kia Stinger',      manufacturerKo: '기아', modelGroupKo: '스팅어',   yearFrom: 2018, mileageMax: 130000 },
  { label: 'Hyundai Tucson',   manufacturerKo: '현대', modelGroupKo: '투싼',     yearFrom: 2019, mileageMax: 130000 },
  { label: 'Hyundai Santa Fe', manufacturerKo: '현대', modelGroupKo: '싼타페',   yearFrom: 2019, mileageMax: 140000 },
  { label: 'Kia Sorento',      manufacturerKo: '기아', modelGroupKo: '쏘렌토',   yearFrom: 2020, mileageMax: 130000 },
  { label: 'Kia Sportage',     manufacturerKo: '기아', modelGroupKo: '스포티지', yearFrom: 2019, mileageMax: 130000 },
  { label: 'Kia Seltos',       manufacturerKo: '기아', modelGroupKo: '셀토스',   yearFrom: 2020, mileageMax: 120000 },
  { label: 'Hyundai Palisade', manufacturerKo: '현대', modelGroupKo: '팰리세이드', yearFrom: 2019, mileageMax: 150000, weight: 2 },
  { label: 'Kia Carnival',     manufacturerKo: '기아', modelGroupKo: '카니발',   yearFrom: 2019, mileageMax: 150000, weight: 2 },
  // ─── Электро ───
  { label: 'Hyundai Ioniq 5',  manufacturerKo: '현대', modelGroupKo: '아이오닉5', yearFrom: 2021, mileageMax: 100000 },
  { label: 'Kia EV6',          manufacturerKo: '기아', modelGroupKo: 'EV6',      yearFrom: 2021, mileageMax: 100000 },
  // ─── Genesis (премиум-корейцы) ───
  { label: 'Genesis G80',      manufacturerKo: '제네시스', modelGroupKo: 'G80',  yearFrom: 2017, mileageMax: 140000, weight: 2 },
  { label: 'Genesis GV80',     manufacturerKo: '제네시스', modelGroupKo: 'GV80', yearFrom: 2020, mileageMax: 120000, weight: 2 },
  { label: 'Genesis G70',      manufacturerKo: '제네시스', modelGroupKo: 'G70',  yearFrom: 2017, mileageMax: 140000, weight: 2 },
  // ─── Немецкий премиум (импорт) ───
  { label: 'Mercedes E-Class', manufacturerKo: '벤츠', modelGroupKo: 'E-클래스',   imported: true, yearFrom: 2016, mileageMax: 150000 },
  { label: 'Mercedes C-Class', manufacturerKo: '벤츠', modelGroupKo: 'C-클래스',   imported: true, yearFrom: 2016, mileageMax: 150000 },
  { label: 'Mercedes GLC',     manufacturerKo: '벤츠', modelGroupKo: 'GLC-클래스', imported: true, yearFrom: 2017, mileageMax: 150000 },
  { label: 'BMW 5 Series',     manufacturerKo: 'BMW',  modelGroupKo: '5시리즈',    imported: true, yearFrom: 2016, mileageMax: 150000 },
  { label: 'BMW 3 Series',     manufacturerKo: 'BMW',  modelGroupKo: '3시리즈',    imported: true, yearFrom: 2017, mileageMax: 150000 },
  { label: 'BMW X5',           manufacturerKo: 'BMW',  modelGroupKo: 'X5',         imported: true, yearFrom: 2016, mileageMax: 150000 },
  { label: 'BMW X3',           manufacturerKo: 'BMW',  modelGroupKo: 'X3',         imported: true, yearFrom: 2017, mileageMax: 150000 },
  { label: 'Audi A6',          manufacturerKo: '아우디', modelGroupKo: 'A6',       imported: true, yearFrom: 2016, mileageMax: 150000 },
];

/**
 * Взвешенная последовательность индексов пресетов для ротации.
 * Раунд 0 — все модели по разу; раунд r — только те, у кого weight>r.
 * Так модели с weight=2 (Palisade, Carnival, Genesis) выходят вдвое чаще.
 */
export function rotationSequence(): number[] {
  const maxW = Math.max(1, ...PRESETS.map((p) => p.weight ?? 1));
  const seq: number[] = [];
  for (let r = 0; r < maxW; r++) {
    PRESETS.forEach((p, i) => {
      if ((p.weight ?? 1) > r) seq.push(i);
    });
  }
  return seq;
}

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
