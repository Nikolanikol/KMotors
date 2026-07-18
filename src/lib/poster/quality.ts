// Квалити-гейт: отсев мусорных авто + плюс-сигналы доверия для подписи.
import type { Listing, EncarDetail } from './encar';
import { QUALITY } from './config';

export interface GateResult {
  pass: boolean;
  reason?: string;   // причина отклонения (для логов)
  signals: string[]; // сигналы доверия для подписи
}

/** Дешёвый пред-фильтр по данным из выдачи (без доп. запросов). */
export function prefilter(l: Listing): GateResult {
  if (QUALITY.rejectDuplicate && l.isDuplicate)
    return { pass: false, reason: 'дубль (ServiceCopyCar)', signals: [] };
  if (QUALITY.requireInspection && !l.hasInspection)
    return { pass: false, reason: 'нет диагностики encar', signals: [] };
  return { pass: true, signals: [] };
}

/** Глубокий гейт по истории/диагностике + реальному числу фото. */
export function deepGate(l: Listing, d: EncarDetail): GateResult {
  if (d.photos.length < QUALITY.minPhotos)
    return { pass: false, reason: `мало фото (${d.photos.length})`, signals: [] };

  const { record: rec, inspection: insp } = d;

  // Требуем проверяемую диагностику: если её не удалось получить — не постим
  // (не можем подтвердить отсутствие ДТП), чтобы случайно не выдать битое авто.
  if (QUALITY.requireInspection && !insp)
    return { pass: false, reason: 'не удалось проверить диагностику', signals: [] };

  if (QUALITY.rejectAccident) {
    if (insp?.accident)
      return { pass: false, reason: 'ДТП по диагностике (master.accdient)', signals: [] };
    if (rec && rec.myAccidentCnt > 0)
      return { pass: false, reason: `ДТП в истории (${rec.myAccidentCnt})`, signals: [] };
  }
  if (insp?.hasSeriousDamage)
    return { pass: false, reason: 'серьёзное повреждение кузова (RANK_ONE)', signals: [] };
  if (insp?.waterlog)
    return { pass: false, reason: 'подтопление', signals: [] };

  // ─── Плюс-сигналы доверия ───
  const signals: string[] = [];
  if (l.hasInspection) signals.push('Диагностика Encar пройдена');
  if (insp && !insp.accident) signals.push('ДТП не найдено');
  if (rec && rec.ownerChangeCnt <= 1) signals.push('Один владелец');

  return { pass: true, signals };
}
