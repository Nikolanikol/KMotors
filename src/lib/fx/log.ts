import type { FxKind } from "@/lib/fx/types";

/** Текст причины без стека: в логе Coolify нужна одна строка. */
export function reasonText(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return String(reason);
}

/**
 * Падение на фолбэк — ЕДИНСТВЕННОЕ место, где оно пишется в лог.
 *
 * Уровень error, а не warn: молча подставленный курс — это не подстраховка, а
 * место, где расхождение цен становится невидимым (постмортем про курс рубля
 * по константе июня 2026, CLAUDE.md «Цены и курсы»). Формат один на все виды,
 * чтобы в логе искалось одной строкой: `[fx:<вид>] упали на фолбэк`.
 */
export function logFallback(kind: FxKind, what: string, why: string): void {
  console.error(`[fx:${kind}] упали на фолбэк — ${what}. Причина: ${why}`);
}

/**
 * Источник не ответил, но его подхватил другой живой источник — это ещё не
 * фолбэк, поэтому warn. Если пробел закроет снимок, следом придёт `logFallback`.
 */
export function logSourceDown(source: string, reason: unknown): void {
  console.warn(`[fx] источник ${source} недоступен: ${reasonText(reason)}`);
}
