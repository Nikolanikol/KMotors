// Просмотрщик carnect.biz: один лот со всеми полями, что отдаёт источник.
//
//   /admin/carnect/glovis/<lotId>
//
// Блоки идут от «что увидит клиент» к «что лежит внутри»: шапка с ценой и
// датой торгов → галерея → лист осмотра и юридическая чистота → сканы →
// все поля таблицей → сырой JSON. Последние два нужны, чтобы проектировать
// схему по живым данным, а не по догадкам.
//
// Набор деталей у площадок РАЗНЫЙ (у Autobell сканы техпаспорта и акта, у
// K Car акт осмотра и окрашенные панели, у Lotte лист узлов по группам),
// поэтому каждый блок рисуется только при наличии данных и разбирает форму
// терпимо: неизвестная форма уходит в таблицу полей, а не роняет страницу.

import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "../../../auction/shell";
import { getLotDetail } from "@/lib/carnect/cached";
import { HOUSES, isHouse } from "@/lib/carnect/houses";
import type { CarnectLotDetail } from "@/lib/carnect/types";

import { C, FieldTable, Page, Panel, Stat, ago, km, krw } from "../../ui";

export const dynamic = "force-dynamic";

/** Пункт листа осмотра. ok=false — узел требует ремонта. */
type InspItem = { name?: string; status?: string; ok?: boolean };

/**
 * Лист осмотра приходит двумя формами: группами ({groupEn, items:[…]}) у
 * Lotte и Autobell или плоским списком пунктов. Сводим к группам.
 */
function inspectionGroups(raw: unknown[] | undefined): { title: string; items: InspItem[] }[] {
  if (!raw?.length) return [];
  const groups: { title: string; items: InspItem[] }[] = [];
  const loose: InspItem[] = [];
  for (const g of raw) {
    if (g && typeof g === "object" && Array.isArray((g as { items?: unknown }).items)) {
      const o = g as { groupEn?: string; groupKo?: string; title?: string; items: InspItem[] };
      groups.push({ title: o.groupEn ?? o.title ?? o.groupKo ?? "Осмотр", items: o.items });
    } else if (g && typeof g === "object") {
      loose.push(g as InspItem);
    }
  }
  if (loose.length) groups.push({ title: "Осмотр", items: loose });
  return groups;
}

/** Опции: у Autobell строки, у других площадок бывают объекты — показываем как есть. */
function optionLabels(raw: unknown[] | undefined): string[] {
  return (raw ?? []).map((o) => (typeof o === "string" ? o : JSON.stringify(o)));
}

function Images({ urls }: { urls: string[] }) {
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

function Body({ lot }: { lot: CarnectLotDetail }) {
  const photos = lot.photos?.length ? lot.photos : lot.photo ? [lot.photo] : [];
  const insp = inspectionGroups(lot.inspection);
  const legal = lot.legalStatus ?? lot.legal;
  const scans = [lot.registrationImage, lot.inspectionSheetImage].filter((x): x is string => !!x);
  const options = optionLabels(lot.options);
  const damages = (lot.damages ?? []) as unknown[];

  return (
    <>
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="старт" value={krw(lot.startKrw)} hint={lot.afterBidKrw ? `после торгов ${krw(lot.afterBidKrw)}` : undefined} />
        <Stat label="пробег" value={km(lot.km)} />
        <Stat label="торги" value={lot.auctionDate ?? "—"} hint={lot.startAt ?? undefined} />
        <Stat label="площадка" value={lot.venue || lot.location || "—"} hint={`лот №${lot.lotNo ?? "?"} · ряд ${lot.lane ?? "?"}`} />
        <Stat label="оценка" value={lot.inspGrade ?? "—"} />
        <Stat label="статус" value={lot.status ?? "—"} />
      </section>

      <Panel title={`Фото — ${photos.length}`}>
        {photos.length ? <Images urls={photos} /> : <p className="text-sm" style={{ color: C.muted }}>Нет фото.</p>}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Машина">
          <FieldTable
            data={{
              VIN: lot.vin,
              "номер": lot.vehicleNo,
              "первая регистрация": lot.firstRegistrationDate,
              "объём, см³": lot.cc,
              "топливо": lot.fuel,
              "коробка": lot.trans,
              "цвет": lot.color,
              "использование": lot.usage,
              "комплектация": lot.grade,
              "по-корейски": lot.titleKo,
            }}
          />
        </Panel>

        <Panel title="Юридическая чистота">
          {legal ? (
            <div className="flex gap-6 text-sm">
              <span style={{ color: legal.seizures ? C.bad : C.good }}>арестов: {legal.seizures ?? "?"}</span>
              <span style={{ color: legal.mortgages ? C.bad : C.good }}>залогов: {legal.mortgages ?? "?"}</span>
            </div>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>Площадка не отдаёт.</p>
          )}
          {typeof lot.accidentHistory === "string" && (
            <p className="mt-2 text-sm">ДТП по данным площадки: {lot.accidentHistory}</p>
          )}
          {lot.inspectionRecord && (
            <div className="mt-3">
              <FieldTable data={lot.inspectionRecord} />
            </div>
          )}
        </Panel>
      </div>

      {insp.length > 0 && (
        <Panel title="Лист осмотра узлов">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insp.map((g, gi) => (
              <div key={g.title + gi}>
                <div className="mb-1 text-xs font-semibold" style={{ color: C.muted }}>
                  {g.title}
                </div>
                <ul className="text-sm">
                  {g.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2 py-0.5" style={{ borderTop: `1px solid ${C.line}` }}>
                      <span>{it.name ?? "—"}</span>
                      <span style={{ color: it.ok === false ? C.bad : C.muted }}>{it.status ?? ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {damages.length > 0 && (
        <Panel title={`Повреждения — ${damages.length}`}>
          <ul className="text-sm">
            {damages.map((d, i) => (
              <li key={i} className="font-mono text-xs">
                {JSON.stringify(d)}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {scans.length > 0 && (
        <Panel title="Сканы документов" hint="Техпаспорт и акт осмотра площадки. Лежат на CDN аукциона.">
          <Images urls={scans} />
        </Panel>
      )}

      {options.length > 0 && (
        <Panel title={`Опции — ${options.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <span key={o} className="rounded px-2 py-0.5 text-xs" style={{ border: `1px solid ${C.line}` }}>
                {o}
              </span>
            ))}
          </div>
        </Panel>
      )}

      {(lot.notes || lot.notesKo) && (
        <Panel title="Примечания площадки">
          <p className="whitespace-pre-line text-sm">{lot.notes ?? lot.notesKo}</p>
        </Panel>
      )}

      <Panel title="Все поля" hint="Скаляры как есть; объекты и массивы — JSON-строкой.">
        <FieldTable data={lot} skip={["photos"]} />
      </Panel>

      <Panel title="Сырой JSON">
        <details>
          <summary className="cursor-pointer text-xs" style={{ color: C.muted }}>
            развернуть
          </summary>
          <pre className="mt-2 max-h-[600px] overflow-auto text-[11px]">{JSON.stringify(lot, null, 2)}</pre>
        </details>
      </Panel>
    </>
  );
}

export default async function CarnectLotPreview({ params }: { params: Promise<{ house: string; lot: string }> }) {
  await requireAdmin();
  const { house, lot: rawLot } = await params;
  if (!isHouse(house)) notFound();
  // Сегмент приходит закодированным: в lotId бывают "~" и base64.
  const lotId = decodeURIComponent(rawLot);

  const t0 = Date.now();
  const res = await getLotDetail(house, lotId);
  const ms = Date.now() - t0;

  const title =
    res.status === "ok"
      ? `${res.lot.year ?? ""} ${res.lot.make ?? ""} ${res.lot.model ?? ""}`.trim()
      : lotId;

  return (
    <Page>
      <Link href={`/admin/carnect?house=${house}`} className="text-sm" style={{ color: C.accent }}>
        ← {HOUSES[house].name}
      </Link>
      <header className="mb-4 mt-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-xs" style={{ color: C.muted }}>
          {res.status === "ok" && res.lot.grade ? `${res.lot.grade} · ` : ""}
          lotId <code>{lotId}</code> · ответ {ms} мс ({ms < 200 ? "из кеша" : "свежий поход"}) · загружено{" "}
          {ago(res.fetchedAt)}
        </p>
      </header>

      {res.status === "ok" && <Body lot={res.lot} />}
      {res.status === "gone" && (
        <Panel title="Лот ушёл с торгов">
          <p className="text-sm">
            carnect отдал страницу «не найдено». Лот продан или снят — что именно, источник не говорит.
          </p>
        </Panel>
      )}
      {res.status === "failed" && (
        <Panel title={res.parser ? "Не разобралось" : "Источник не ответил"}>
          <p className="text-sm" style={{ color: C.bad }}>
            {res.parser
              ? "Страница пришла, но объекта lot в ней нет — carnect сменил разметку. Чинить detail.ts."
              : "carnect не отдал страницу. Это не значит, что лот ушёл; обновите позже."}
          </p>
        </Panel>
      )}
    </Page>
  );
}
