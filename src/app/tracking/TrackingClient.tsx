"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { EMS_NUMBER_RE, EMS_PIPELINE, normalizeEmsNumber, type EmsStage, type EmsTrackingResult } from "@/lib/emsTracking";

/** Ключ истории в localStorage. Хранится только список номеров, ничего больше. */
const HISTORY_KEY = "kaxis:ems-history";
const HISTORY_LIMIT = 8;

/**
 * Даты Korea Post приходят строкой «31-Jul-2026». Разбираем сами: Date.parse
 * такой формат читает не во всех движках, а показать её надо на языке клиента.
 */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Локалей ровно две, по числу заполненных словарей. ka/ar показывают
 * английский текст (fallbackLng), и даты там обязаны быть английскими —
 * иначе получится строка вида «Checked 3 წუთის წინ».
 */
const DATE_LOCALES: Record<string, string> = {
  ru: "ru-RU",
  en: "en-GB",
};

const dateLocale = (lang: string) => DATE_LOCALES[lang] || "en-GB";

function formatEmsDate(raw: string, lang: string): string {
  const match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return raw;
  const month = MONTHS.indexOf(match[2].toLowerCase());
  if (month === -1) return raw;

  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
  try {
    const formatted = new Intl.DateTimeFormat(dateLocale(lang), {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
    // Русский формат Intl добавляет « г.» — в плотной ленте событий это шум.
    return formatted.replace(/\sг\.$/, "");
  } catch {
    return raw;
  }
}

/**
 * «только что» / «3 минуты назад» от момента запроса.
 *
 * Нужно потому, что ответ минуту лежит в памяти инстанса: без этой строки
 * клиент жмёт «Обновить», экран не меняется — и кнопка выглядит сломанной.
 * Особенно на посылке, у которой статус и так стоит сутками.
 */
function formatCheckedAt(iso: string, now: number, lang: string): string | null {
  const elapsed = now - new Date(iso).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;

  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return null; // «только что» приходит из словаря

  try {
    const rtf = new Intl.RelativeTimeFormat(dateLocale(lang), { numeric: "auto" });
    if (minutes < 60) return rtf.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-Math.floor(hours / 24), "day");
  } catch {
    return null;
  }
}

/** Служебные поля Details уже показаны в шапке — в ленте они лишний английский. */
function isKnownDetail(details: string): boolean {
  return /Posting office zip code|Transit or Destination country/i.test(details);
}

function readHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is string => typeof n === "string" && EMS_NUMBER_RE.test(n)).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeHistory(numbers: string[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(numbers.slice(0, HISTORY_LIMIT)));
  } catch {
    // Приватный режим или переполненное хранилище — история не критична.
  }
}

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; result: EmsTrackingResult }
  | { kind: "error"; reason: "invalid" | "not_found" | "upstream" | "rate_limited" };

export default function TrackingClient() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ru";

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [state, setState] = useState<FetchState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);

  const track = useCallback(async (rawNumber: string) => {
    const number = normalizeEmsNumber(rawNumber);
    if (!EMS_NUMBER_RE.test(number)) {
      setState({ kind: "error", reason: "invalid" });
      return;
    }

    const id = ++requestId.current;
    setState({ kind: "loading" });

    let result: EmsTrackingResult | null = null;
    let rateLimited = false;
    try {
      const response = await fetch(`/api/ems/track?number=${encodeURIComponent(number)}`);
      rateLimited = response.status === 429;
      if (!rateLimited) result = (await response.json()) as EmsTrackingResult;
    } catch {
      result = null;
    }

    // Пока ждали, клиент мог запросить другой номер — старый ответ игнорируем.
    if (id !== requestId.current) return;

    if (rateLimited) {
      setState({ kind: "error", reason: "rate_limited" });
      return;
    }
    if (!result || result.status === "upstream_error") {
      setState({ kind: "error", reason: "upstream" });
      return;
    }
    if (result.status === "invalid") {
      setState({ kind: "error", reason: "invalid" });
      return;
    }
    if (result.status === "not_found") {
      setState({ kind: "error", reason: "not_found" });
      return;
    }

    setState({ kind: "done", result });

    // В историю попадают только номера, которые Korea Post действительно знает.
    setHistory((prev) => {
      const next = [number, ...prev.filter((n) => n !== number)].slice(0, HISTORY_LIMIT);
      writeHistory(next);
      return next;
    });

    // Адрес обновляем через replaceState, а не router: серверный рендер этой
    // страницы от searchParams не зависит, данные приходят клиентским fetch'ем.
    const url = new URL(window.location.href);
    url.searchParams.set("n", number);
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Первый заход: восстановить историю и, если номер пришёл ссылкой, сразу искать.
  useEffect(() => {
    const saved = readHistory();
    setHistory(saved);

    const fromUrl = normalizeEmsNumber(new URLSearchParams(window.location.search).get("n") || "");
    if (EMS_NUMBER_RE.test(fromUrl)) {
      setInput(fromUrl);
      void track(fromUrl);
    }
  }, [track]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void track(input);
  };

  const removeFromHistory = (number: string) => {
    setHistory((prev) => {
      const next = prev.filter((n) => n !== number);
      writeHistory(next);
      return next;
    });
  };

  const handleCopy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Буфер недоступен — номер и так виден на экране.
    }
  };

  const result = state.kind === "done" ? state.result : null;
  const latestEvent = result?.events[result.events.length - 1];

  // Строка «проверено N назад» обязана стареть сама, иначе на открытой
  // вкладке она навсегда останется «только что».
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!result) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [result]);

  const checkedAgo = result ? formatCheckedAt(result.fetchedAt, now, lang) : null;

  /** Докуда посылка реально дошла: максимум по ленте, а не только текущий статус. */
  const reachedIndex = useMemo(() => {
    if (!result) return -1;
    const indexOf = (stage: EmsStage) => EMS_PIPELINE.indexOf(stage as (typeof EMS_PIPELINE)[number]);
    return result.events.reduce((max, event) => Math.max(max, indexOf(event.stage)), indexOf(result.stage));
  }, [result]);

  const statusText = (raw: string, key: string | null) => (key ? t(`tracking.status.${key}`) : raw);

  return (
    /* ⚠️ min-h держит футер на месте. У `main` глобально `min-h-[70vh]`, и без
       этой строки короткие состояния (пустая форма, ошибка) сжимали страницу —
       футер уезжал вверх на ~330px и въезжал в видимую часть экрана прямо на
       глазах у клиента, стоило результату смениться ошибкой. 68px — высота
       фиксированной шапки, её же компенсирует `pt-[68px]` у main. */
    <div className="mx-auto flex min-h-[calc(100vh-68px)] w-full max-w-4xl flex-col px-4 py-10 sm:px-6 md:py-14">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-bronze)]/40 bg-[var(--axis-glass)] px-3 py-1 text-xs font-medium text-[var(--axis-bronze)]">
          <PackageSearch className="h-3.5 w-3.5" />
          {t("tracking.badge")}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--axis-white)] sm:text-4xl">
          {t("tracking.h1")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--axis-gray)] sm:text-base">
          {t("tracking.intro")}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--axis-gray)]" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder={t("tracking.placeholder")}
              aria-label={t("tracking.inputLabel")}
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              className="h-12 w-full rounded-xl border border-white/10 bg-[var(--axis-charcoal)] pl-11 pr-4 font-mono text-sm tracking-wider text-[var(--axis-white)] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--axis-gray-dim)] focus:border-[var(--axis-bronze)]"
            />
          </div>
          <button
            type="submit"
            disabled={state.kind === "loading"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[image:var(--axis-bronze-fill)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.kind === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("tracking.searching")}
              </>
            ) : (
              t("tracking.submit")
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--axis-gray-dim)]">{t("tracking.hint")}</p>
      </form>

      {history.length > 0 && (
        <section className="mt-6" aria-label={t("tracking.history.title")}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--axis-gray)]">
            {t("tracking.history.title")}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {history.map((number) => (
              <li key={number}>
                <span className="group inline-flex items-center overflow-hidden rounded-lg border border-white/10 bg-[var(--axis-charcoal)] transition-colors hover:border-[var(--axis-bronze)]/50">
                  <button
                    type="button"
                    onClick={() => {
                      setInput(number);
                      void track(number);
                    }}
                    className="px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--axis-white)]"
                  >
                    {number}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromHistory(number)}
                    aria-label={`${t("tracking.history.remove")} ${number}`}
                    className="px-2 py-1.5 text-[var(--axis-gray-dim)] transition-colors hover:text-[var(--axis-white)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.kind === "error" && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-[var(--axis-white)]">
              {t(`tracking.error.${state.reason}.title`)}
            </p>
            <p className="mt-1 text-sm text-[var(--axis-gray)]">
              {t(`tracking.error.${state.reason}.text`)}
            </p>
          </div>
        </div>
      )}

      {result && (
        <article className="mt-8 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[var(--axis-charcoal)] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-wider text-[var(--axis-gray)]">
                    {result.number}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(result.number)}
                    aria-label={t("tracking.copy")}
                    className="text-[var(--axis-gray-dim)] transition-colors hover:text-[var(--axis-bronze)]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <h2 className="mt-1 text-xl font-bold text-[var(--axis-white)] sm:text-2xl">
                  {statusText(result.currentStatus, result.currentStatusKey)}
                </h2>
                {/* Дата последней отметки — главный признак того, что посылка
                    едет. Ближе к концу пути Korea Post повторяет один и тот же
                    статус сутками, и без даты это читается как «застряла». */}
                {latestEvent && (
                  <p className="mt-1 text-xs text-[var(--axis-gray)]">
                    {t("tracking.lastEvent")}: {formatEmsDate(latestEvent.date, lang)}
                    {latestEvent.time && `, ${latestEvent.time}`}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => void track(result.number)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-[var(--axis-gray)] transition-colors hover:border-[var(--axis-bronze)]/50 hover:text-[var(--axis-white)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("tracking.refresh")}
                </button>
                <span className="text-[11px] text-[var(--axis-gray-dim)]">
                  {t("tracking.checked")} {checkedAgo ?? t("tracking.justNow")}
                </span>
              </div>
            </div>

            {/* Шкала пути: пройденные шаги бронзовые, будущие — приглушённые. */}
            <ol className="mt-6 grid grid-cols-3 gap-y-4 sm:grid-cols-6">
              {EMS_PIPELINE.map((stage, index) => {
                const reached = index <= reachedIndex;
                return (
                  <li key={stage} className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`h-2 w-full rounded-full ${
                        reached ? "bg-[var(--axis-bronze)]" : "bg-white/10"
                      }`}
                    />
                    <span
                      className={`text-[11px] leading-tight ${
                        reached ? "text-[var(--axis-white)]" : "text-[var(--axis-gray-dim)]"
                      }`}
                    >
                      {t(`tracking.stage.${stage}`)}
                    </span>
                  </li>
                );
              })}
            </ol>

            <dl className="mt-6 grid gap-4 border-t border-white/5 pt-5 text-sm sm:grid-cols-2">
              {result.sender.name && (
                <div>
                  <dt className="text-xs text-[var(--axis-gray-dim)]">{t("tracking.field.sender")}</dt>
                  <dd className="mt-0.5 text-[var(--axis-white)]">
                    {result.sender.name}
                    {result.sender.date && (
                      <span className="text-[var(--axis-gray)]">
                        {" · "}
                        {formatEmsDate(result.sender.date, lang)}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {result.recipient.name && (
                <div>
                  <dt className="text-xs text-[var(--axis-gray-dim)]">{t("tracking.field.recipient")}</dt>
                  <dd className="mt-0.5 text-[var(--axis-white)]">
                    {result.recipient.name}
                    {result.recipient.date && (
                      <span className="text-[var(--axis-gray)]">
                        {" · "}
                        {formatEmsDate(result.recipient.date, lang)}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {result.mailType && (
                <div>
                  <dt className="text-xs text-[var(--axis-gray-dim)]">{t("tracking.field.mailType")}</dt>
                  <dd className="mt-0.5 text-[var(--axis-white)]">{result.mailType}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[var(--axis-charcoal)] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-[var(--axis-white)]">{t("tracking.timeline")}</h3>
            <ol className="mt-4 space-y-0">
              {[...result.events].reverse().map((event, index, all) => {
                const isLatest = index === 0;
                return (
                  <li key={`${event.date}-${event.time}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < all.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-white/10" aria-hidden />
                    )}
                    <span
                      className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        isLatest ? "bg-[var(--axis-bronze)] ring-4 ring-[var(--axis-glass)]" : "bg-white/20"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isLatest ? "text-[var(--axis-white)]" : "text-[var(--axis-silver)]"
                        }`}
                      >
                        {statusText(event.status, event.statusKey)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--axis-gray)]">
                        {formatEmsDate(event.date, lang)}
                        {event.time && ` · ${event.time}`}
                        {event.location && ` · ${event.location}`}
                      </p>
                      {event.details && !isKnownDetail(event.details) && (
                        <p className="mt-1 text-xs text-[var(--axis-gray-dim)]">{event.details}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-5 border-t border-white/5 pt-4 text-xs leading-relaxed text-[var(--axis-gray-dim)]">
              {t("tracking.note")}
            </p>
          </section>
        </article>
      )}

      {/* Распорка прижимает блок помощи к низу, когда результата ещё нет:
          иначе под ним оставалась дыра до футера и страница выглядела
          оборванной. При длинном результате свободного места нет, и распорка
          схлопывается в ноль. Отдельным узлом, а не `mt-auto` на секции: рядом
          с `mt-10` это были бы два конфликтующих правила margin-top, и какое
          победит, решал бы порядок в собранном CSS. */}
      <div className="grow" aria-hidden />

      <section className="mt-10 rounded-2xl border border-white/10 bg-[var(--axis-graphite)] p-5 text-center sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--axis-white)]">{t("tracking.help.title")}</h2>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-[var(--axis-gray)]">{t("tracking.help.text")}</p>
        <a
          href={`/${lang}/contact`}
          className="mt-4 inline-flex items-center rounded-lg border border-[var(--axis-bronze)]/50 px-4 py-2 text-sm font-medium text-[var(--axis-bronze)] transition-colors hover:bg-[var(--axis-glass)]"
        >
          {t("tracking.help.cta")}
        </a>
      </section>
    </div>
  );
}
