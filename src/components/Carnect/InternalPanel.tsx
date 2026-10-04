// Служебная панель страницы машины: «Только для нас».
//
// Рисуется ТОЛЬКО на служебном хосте (src/lib/serviceHost.ts) — на www её нет
// в разметке вовсе. Порядок разделов — по задачам менеджера (решение владельца
// 04.10.2026): сверху то, что нужно для работы, снизу «видно всё».
//   1. Торги и сделка   2. Документы   3. Сверка и флаги
//   4. Все поля — читабельным деревом, с пометкой «на карточке»
//   5. Сырой JSON — свёрнутым, с копированием
// Данные раскладывает модель (card.ts, `internal`), здесь только отрисовка.

import type { ReactNode } from "react";

import type { CarCard } from "@/lib/carnect/card";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";

import { ago } from "./ui";
import CopyJson from "./CopyJson";

const muted = "var(--axis-gray)";
const cream = "var(--axis-cream, #F5F0EB)";
const line = "rgba(74,74,74,0.35)";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <SpecCard title={title}>{children}</SpecCard>;
}

// ─── Дерево «Все поля» ────────────────────────────────────────────────────

const IMG = /^https?:\/\/\S+\.(jpe?g|png|webp|gif)(\?|$)|\/image|img|IMAGE_UPLOAD|AU_INSP|certifiimg|valimg/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
/** Больше стольких элементов массива — сворачиваем. */
const FOLD = 6;

function Leaf({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === "") return <span style={{ color: muted }}>—</span>;
  if (typeof v === "boolean") return <span style={{ color: v ? "#3FB950" : "#E5484D" }}>{v ? "✓ да" : "✗ нет"}</span>;
  if (typeof v === "number") return <span>{v.toLocaleString("ru-RU")}</span>;
  const s = String(v);
  if (/^https?:\/\//.test(s)) {
    return IMG.test(s) ? (
      <a href={s} target="_blank" rel="noreferrer" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s} alt="" loading="lazy" className="h-16 rounded bg-white object-contain" />
      </a>
    ) : (
      <a href={s} target="_blank" rel="noreferrer" className="break-all underline" style={{ color: "var(--axis-bronze)" }}>
        {s}
      </a>
    );
  }
  if (ISO.test(s)) return <span>{s.replace("T", " ").slice(0, 16)}</span>;
  return <span className="whitespace-pre-line break-words">{s}</span>;
}

function Value({ v, path, shown, depth }: { v: unknown; path: string; shown: Set<string>; depth: number }) {
  if (Array.isArray(v)) {
    if (!v.length) return <span style={{ color: muted }}>пусто</span>;
    // Простые значения — строкой через запятую (картинки — лентой миниатюр).
    if (v.every((x) => x === null || typeof x !== "object")) {
      if (v.some((x) => typeof x === "string" && /^https?:\/\//.test(x))) {
        return (
          <div className="flex flex-wrap gap-1.5">
            {v.map((x, i) => (
              <Leaf key={i} v={x} />
            ))}
          </div>
        );
      }
      return <span className="break-words">{v.map((x) => (x == null ? "—" : String(x))).join(", ")}</span>;
    }
    const items = v.map((x, i) => (
      <div key={i} className="mb-1 rounded-lg pl-2" style={{ borderLeft: `2px solid ${line}` }}>
        <span className="text-[10px]" style={{ color: muted }}>
          #{i + 1}
        </span>
        <Value v={x} path={path} shown={shown} depth={depth + 1} />
      </div>
    ));
    return v.length > FOLD ? (
      <details>
        <summary className="cursor-pointer text-xs" style={{ color: muted }}>
          {v.length} элементов — развернуть
        </summary>
        <div className="mt-1">{items}</div>
      </details>
    ) : (
      <div>{items}</div>
    );
  }
  if (v && typeof v === "object") {
    if (depth > 4) return <code className="break-all text-[11px]">{JSON.stringify(v)}</code>;
    return <Tree data={v as Record<string, unknown>} prefix={path} shown={shown} depth={depth + 1} />;
  }
  return <Leaf v={v} />;
}

function Tree({
  data,
  prefix,
  shown,
  depth,
}: {
  data: Record<string, unknown>;
  prefix: string;
  shown: Set<string>;
  depth: number;
}) {
  const entries = Object.entries(data);
  if (!entries.length) return <span style={{ color: muted }}>пусто</span>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {entries.map(([k, v]) => {
          const path = prefix ? `${prefix}.${k}` : k;
          const onCard = shown.has(path);
          return (
            <tr key={k} style={{ borderTop: `1px solid ${line}` }}>
              <td className="w-44 py-1 pr-3 align-top" style={{ color: muted }}>
                <span className="font-mono text-xs">{k}</span>
                {onCard && (
                  <span
                    className="ml-1 whitespace-nowrap rounded px-1 text-[9px] font-semibold uppercase"
                    style={{ color: "#3FB950", border: "1px solid rgba(63,185,80,0.4)" }}
                    title="Уже выведено на карточку клиента"
                  >
                    на карточке
                  </span>
                )}
              </td>
              <td className="py-1 align-top" style={{ color: cream }}>
                <Value v={v} path={path} shown={shown} depth={depth} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Панель ───────────────────────────────────────────────────────────────

export default function InternalPanel({
  card,
  meta,
}: {
  card: CarCard;
  meta: { id: string; ms: number; fetchedAt?: string };
}) {
  const it = card.internal;
  const shown = new Set(card.shownKeys);
  // Фото — сотни ссылок; в дереве только их число, сама галерея выше.
  const raw = Object.fromEntries(
    Object.entries(card.raw).map(([k, v]) =>
      (k === "photos" || k === "photoThumbs") && Array.isArray(v) ? [k, `${v.length} фото (галерея выше)`] : [k, v],
    ),
  );
  const notOnCard = Object.keys(card.raw).filter((k) => !shown.has(k) && ![...shown].some((s) => s.startsWith(`${k}.`)));

  return (
    <section
      className="mt-6 space-y-4 rounded-2xl p-5"
      style={{ backgroundColor: "#111", border: "1px dashed rgba(138,138,138,0.45)" }}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold" style={{ color: "var(--axis-white)" }}>
          🔒 Только для нас
        </h2>
        <span className="text-xs" style={{ color: muted }}>
          видно только на служебном адресе · id {meta.id} · ответ {meta.ms} мс · загружено {ago(meta.fetchedAt)}
        </span>
        <a
          href={it.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm"
          style={{ color: "var(--axis-bronze)" }}
        >
          открыть у carnect ↗
        </a>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="1. Торги и сделка">
          <SpecRows rows={it.deal.map((r) => ({ label: r.label, value: r.value ?? null }))} />
        </Section>

        <Section title="2. Документы">
          {it.scans.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {it.scans.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block text-xs" style={{ color: muted }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.label} loading="lazy" className="mb-1 h-28 rounded-lg bg-white object-contain" />
                  {s.label} — открыть
                </a>
              ))}
            </div>
          )}
          {it.documents.have.length + it.documents.missing.length > 0 ? (
            <ul className="mb-3 space-y-1 text-sm">
              {it.documents.have.map((d) => (
                <li key={`+${d}`} style={{ color: cream }}>
                  <span style={{ color: "#3FB950" }}>✓</span> {d}
                </li>
              ))}
              {it.documents.missing.map((d) => (
                <li key={`-${d}`} style={{ color: cream }}>
                  <span style={{ color: "#E5484D" }}>✗ нет:</span> {d}
                </li>
              ))}
            </ul>
          ) : (
            !it.scans.length && (
              <p className="mb-3 text-sm" style={{ color: muted }}>
                Площадка не отдаёт список документов.
              </p>
            )
          )}
          <SpecRows rows={it.facts.map((r) => ({ label: r.label, value: r.value ?? null }))} />
        </Section>
      </div>

      <Section title="3. Сверка и флаги">
        {it.flags.length ? (
          <ul className="mb-3 space-y-1 text-sm">
            {it.flags.map((f) => (
              <li key={f.text} style={{ color: f.warn ? "#F0A1A3" : cream }}>
                {f.warn ? "⚠" : "ℹ"} {f.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm" style={{ color: muted }}>
            Противоречий и тревожных признаков не найдено.
          </p>
        )}

        {(card.defects.length > 0 || it.notes.length > 0) && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: muted }}>
                Наш перевод (видит клиент)
              </div>
              {card.defects.length ? (
                <ul className="space-y-0.5 text-sm" style={{ color: cream }}>
                  {card.defects.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: muted }}>
                  —
                </p>
              )}
            </div>
            <div>
              {it.notes.map((n) => (
                <div key={n.label} className="mb-2">
                  <div className="mb-1 text-xs font-semibold" style={{ color: muted }}>
                    Оригинал: {n.label}
                  </div>
                  {n.lines.map((l, i) => (
                    <p key={i} className="whitespace-pre-line text-sm" style={{ color: cream }}>
                      {l}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {it.unknownPhrases.length > 0 && (
          <p className="mt-3 text-xs" style={{ color: "#F0A1A3" }}>
            Словарь не узнал (пополнить src/lib/carnect/defects.ts): {it.unknownPhrases.join(" · ")}
          </p>
        )}
      </Section>

      <Section title="4. Все поля">
        <p className="mb-2 text-xs" style={{ color: muted }}>
          Всё, что прислал источник. Пометка «на карточке» — уже выведено клиенту.
          {notOnCard.length > 0 && <> Не выведено на верхнем уровне: {notOnCard.join(", ")}.</>}
        </p>
        <Tree data={raw} prefix="" shown={shown} depth={0} />
      </Section>

      <details className="rounded-2xl p-5" style={{ backgroundColor: "var(--axis-charcoal)", border: `1px solid ${line}` }}>
        <summary className="flex cursor-pointer items-center gap-3 text-base font-semibold" style={{ color: "var(--axis-white)" }}>
          5. Сырой JSON
          <span className="ml-auto">
            <CopyJson json={JSON.stringify(card.raw, null, 2)} />
          </span>
        </summary>
        <pre className="mt-3 max-h-[600px] overflow-auto text-[11px]" style={{ color: muted }}>
          {JSON.stringify(card.raw, null, 2)}
        </pre>
      </details>
    </section>
  );
}
