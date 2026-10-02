// Карточка машины HeyDealer в просмотрщике carnect.
//
// Отдельный компонент, а не ветка в Body лота: у HeyDealer другая механика и
// другие данные. Нет дня торгов и номера лота — есть окончание торгов и счёт
// ставок; нет листа узлов площадки — есть отчёт инспектора HeyDealer (у Zero
// и Instant) со страховой историей, схемой ремонта кузова и состоянием шин.
//
// Порядок блоков тот же, что у лота: цена и сроки → фото → история и
// состояние → всё сырьём. Сырьё нужно, чтобы проектировать схему по живым
// данным: формы conditionRows разные по kind (tires, count, …).

import type { HeyCarDetail } from "@/lib/carnect/heydealer";
import { HEY_TYPES } from "@/lib/carnect/heydealer";

import { C, FieldTable, Panel, Stat, km, krw } from "../../ui";

/** Подписи истории HeyDealer. Ключи — как в их данных; незнакомые выводятся сырыми. */
const HISTORY_LABELS: Record<string, string> = {
  ownerChanges: "смен владельцев",
  myAccidents: "ДТП по своей страховке",
  otherAccidents: "ДТП по чужой страховке",
  myAccidentCostKrw: "выплаты по своей, ₩",
  otherAccidentCostKrw: "выплаты по чужой, ₩",
  totalLoss: "тотал",
  floodLoss: "утопленник",
  stolen: "угон",
};

/** Строка листа состояния. Форма зависит от kind: у шин front/rear, у счётных — count. */
function conditionValue(row: Record<string, unknown>): string {
  if (row.kind === "tires") return `перед ${row.front ?? "?"}% · зад ${row.rear ?? "?"}%`;
  if (row.kind === "count") return `${row.count ?? "?"} ${row.unit ?? ""}`.trim();
  const rest = Object.entries(row).filter(([k]) => !["key", "label", "kind", "ok", "notice"].includes(k));
  return rest.length ? JSON.stringify(Object.fromEntries(rest)) : "";
}

export function HeyCarBody({ car }: { car: HeyCarDetail }) {
  const h = car.heydealer ?? {};
  const type = HEY_TYPES.find((t) => t.type === (h.auctionType ?? car.auctionType));
  // Галерея по группам HeyDealer (снаружи, салон, …), если они есть, — так
  // видно, чего не хватает. Иначе общий список фото.
  const groups = h.imageGroups?.filter((g) => g.urls?.length) ?? [];
  const photos = car.photos?.map((p) => p.url) ?? (car.photo ? [car.photo] : []);
  const history = Object.entries(h.history ?? {});
  const repairs = h.accidentDiagram?.repairs ?? [];
  const rows = h.conditionRows ?? [];
  const notes = [...(h.conditionItems ?? []), ...(h.conditionNotes ?? []), ...(h.inspectorNotes ?? []), ...(h.sellerNotes ?? [])];

  return (
    <>
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="цена"
          value={car.priceOnRequest ? "ставки" : krw(car.krw)}
          hint={car.originPriceKrw ? `новая ${krw(car.originPriceKrw)}` : undefined}
        />
        <Stat label="тип" value={type?.label ?? String(h.auctionType ?? "—")} hint={type?.hint} />
        <Stat label="пробег" value={km(car.km)} />
        <Stat label="торги до" value={car.endAt ? car.endAt.slice(0, 16).replace("T", " ") : "—"} hint="время корейское" />
        <Stat label="ставок" value={`${car.bidCount ?? 0}${h.maxBids ? ` / ${h.maxBids}` : ""}`} />
        <Stat label="ДТП" value={h.accidentSummary ?? h.accidentGrade ?? "—"} />
      </section>

      {groups.length ? (
        groups.map((g, i) => (
          <Panel key={(g.type ?? "") + i} title={`${g.label ?? g.type ?? "Фото"} — ${g.urls!.length}`}>
            <Gallery urls={g.urls!} />
          </Panel>
        ))
      ) : (
        <Panel title={`Фото — ${photos.length}`}>
          <Gallery urls={photos} />
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Машина">
          <FieldTable
            data={{
              ...(h.vehicleInfo ?? {}),
              "номер": h.carNumber,
              "цвет": car.color,
              "салон": h.interior,
              "регион": car.region,
              "оплата": h.payment,
            }}
          />
        </Panel>

        <Panel title="История (страховая)">
          {history.length ? (
            <table className="w-full text-sm">
              <tbody>
                {history.map(([k, v]) => (
                  <tr key={k} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="py-1 pr-3" style={{ color: C.muted }}>
                      {HISTORY_LABELS[k] ?? k}
                    </td>
                    <td className="py-1" style={{ color: v ? C.accent : C.text }}>
                      {typeof v === "number" ? v.toLocaleString("ru-RU") : String(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>
              Нет данных (у Self осмотра нет).
            </p>
          )}
        </Panel>
      </div>

      {repairs.length > 0 && (
        <Panel title={`Ремонт кузова — ${repairs.length}`}>
          <ul className="text-sm">
            {repairs.map((r, i) => (
              <li key={i} className="flex justify-between py-0.5" style={{ borderTop: `1px solid ${C.line}` }}>
                <span>{r.part ?? r.partKey}</span>
                <span style={{ color: C.accent }}>{r.repair}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {rows.length > 0 && (
        <Panel title="Лист состояния">
          <ul className="text-sm">
            {rows.map((r, i) => (
              <li key={i} className="flex justify-between gap-3 py-0.5" style={{ borderTop: `1px solid ${C.line}` }}>
                <span>{String(r.label ?? r.key ?? "—")}</span>
                <span style={{ color: r.ok === false ? C.bad : C.muted }}>{conditionValue(r)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {notes.length > 0 && (
        <Panel title="Замечания">
          <ul className="list-disc pl-5 text-sm">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Все поля" hint="Скаляры как есть; объекты и массивы — JSON-строкой.">
        <FieldTable data={car} skip={["photos", "heydealer"]} />
      </Panel>

      <Panel title="Сырой JSON">
        <details>
          <summary className="cursor-pointer text-xs" style={{ color: C.muted }}>
            развернуть
          </summary>
          <pre className="mt-2 max-h-[600px] overflow-auto text-[11px]">{JSON.stringify(car, null, 2)}</pre>
        </details>
      </Panel>
    </>
  );
}

function Gallery({ urls }: { urls: string[] }) {
  if (!urls.length) return <p className="text-sm" style={{ color: C.muted }}>Нет фото.</p>;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {urls.map((u, i) => (
        <a key={u + i} href={u} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={u}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full rounded-lg object-cover"
            style={{ backgroundColor: "#1E1E1E" }}
          />
        </a>
      ))}
    </div>
  );
}
