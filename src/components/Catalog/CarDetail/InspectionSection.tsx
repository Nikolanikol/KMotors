// «Осмотр Encar» на карточке авто: лист осмотра (성능점검기록부) на сервере, за
// Suspense — тот же приём, что у DetailInfoSection (история авто): первая
// отрисовка карточки не ждёт Encar, а блок всё равно приезжает в том же
// HTTP-ответе, то есть попадает в HTML.
//
// Блок серверный целиком: тексты берутся ключами `car.inspection.*` через
// getServerT, клиентского JS нет (раскрывашек нет, ссылка — обычный <a>).
//
// ⚠️ Подача честная. Показываем ТОЛЬКО отметки самого листа и его флаги
// (`accdient` / `simpleRepair`), своих вердиктов «ОК / требует внимания» не
// вычисляем и «без ДТП» не обещаем — лист может быть неполным.
// SVG-схемы кузова нет намеренно: список деталей читается лучше и весит ноль.

import type { ReactNode } from "react";
import { fetchVehicleInspection, normalizeInspection } from "@/lib/vehicleInspection";
import type {
  ComponentCheck,
  InspectionPanel,
  InspectionView,
  PanelZone,
} from "@/lib/vehicleInspection";
import { getServerT, type ServerT } from "@/lib/serverT";
import { langOrDefault } from "@/lib/lang";

const DATE_LOCALE: Record<string, string> = {
  ru: "ru-RU",
  en: "en-GB",
  ka: "ka-GE",
  ar: "ar-EG-u-nu-latn",
};

function formatInspectionDate(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[lang] ?? "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
}

const CARD_STYLE = {
  backgroundColor: "var(--axis-charcoal)",
  border: "1px solid rgba(74,74,74,0.3)",
};

interface Row {
  key: string;
  label: string;
  value: string;
  /** Отметка, которую покупателю стоит заметить — выделяется бронзой. */
  marked?: boolean;
}

function componentValue(c: ComponentCheck, t: ServerT): { value: string; marked: boolean } {
  const parts: string[] = [];
  if (c.selfCheck === "issue") parts.push(t("car.inspection.selfIssue"));
  if (c.marks > 0) parts.push(t("car.inspection.remarks", { n: c.marks }));
  if (parts.length) return { value: parts.join(" · "), marked: true };
  return {
    value: c.selfCheck === "ok" ? t("car.inspection.selfOk") : t("car.inspection.noRemarks"),
    marked: false,
  };
}

function buildRows(view: InspectionView, lang: string, t: ServerT): Row[] {
  const flag = (key: string, label: string, v: boolean | null): Row[] =>
    v === null
      ? []
      : [{ key, label, value: t(v ? "car.inspection.marked" : "car.inspection.none"), marked: v }];

  const rows: Row[] = [];
  if (view.inspectedAt) {
    rows.push({
      key: "date",
      label: t("car.inspection.date"),
      value: formatInspectionDate(view.inspectedAt, lang),
    });
  }
  if (view.mileage) {
    rows.push({
      key: "mileage",
      label: t("car.inspection.mileage"),
      value: t("car.inspection.mileageValue", {
        km: view.mileage.toLocaleString(DATE_LOCALE[lang] ?? "en-GB"),
      }),
    });
  }
  rows.push(...flag("simpleRepair", t("car.inspection.simpleRepair"), view.simpleRepair));
  rows.push(...flag("structural", t("car.inspection.structural"), view.structural));

  if (view.engine) {
    rows.push({ key: "engine", label: t("car.inspection.engine"), ...componentValue(view.engine, t) });
  }
  if (view.transmission) {
    rows.push({
      key: "transmission",
      label: t("car.inspection.transmission"),
      ...componentValue(view.transmission, t),
    });
  }
  if (view.otherMarks !== null) {
    rows.push({
      key: "otherUnits",
      label: t("car.inspection.otherUnits"),
      value:
        view.otherMarks > 0
          ? t("car.inspection.remarks", { n: view.otherMarks })
          : t("car.inspection.noRemarks"),
      marked: view.otherMarks > 0,
    });
  }

  rows.push(...flag("flood", t("car.inspection.flood"), view.flood));
  rows.push(...flag("fire", t("car.inspection.fire"), view.fire));

  if (view.recall) {
    const { exists, done } = view.recall;
    rows.push({
      key: "recall",
      label: t("car.inspection.recall"),
      value: !exists
        ? t("car.inspection.recallNone")
        : done === true
          ? t("car.inspection.recallDone")
          : done === false
            ? t("car.inspection.recallPending")
            : t("car.inspection.recallUnknown"),
      marked: exists,
    });
  }

  // Тюнинг и смена назначения — только когда отмечены: «нет» на каждой карточке
  // было бы шумом, а покупателю важна именно отметка.
  if (view.tuning) rows.push(...flag("tuning", t("car.inspection.tuning"), true));
  if (view.usageChanged) {
    rows.push(...flag("usageChanged", t("car.inspection.usageChanged"), true));
  }
  return rows;
}

/** Какие категории в листе отмечены — для строки «Кратко». */
function markedCategories(view: InspectionView): string[] {
  const out: string[] = [];
  if (view.simpleRepair) out.push("simpleRepair");
  if (view.structural) out.push("structural");
  if (view.flood) out.push("flood");
  if (view.fire) out.push("fire");
  if (view.recall?.exists) out.push("recall");
  if (view.engine && (view.engine.selfCheck === "issue" || view.engine.marks > 0)) out.push("engine");
  if (view.transmission && (view.transmission.selfCheck === "issue" || view.transmission.marks > 0)) {
    out.push("transmission");
  }
  if (view.otherMarks) out.push("otherUnits");
  if (view.tuning) out.push("tuning");
  if (view.usageChanged) out.push("usageChanged");
  return out;
}

const ZONES: { zone: PanelZone; titleKey: string }[] = [
  { zone: "outer", titleKey: "car.inspection.zoneOuter" },
  { zone: "frame", titleKey: "car.inspection.zoneFrame" },
  { zone: "unknown", titleKey: "car.inspection.zoneOther" },
];

function PanelItem({ panel, t }: { panel: InspectionPanel; t: ServerT }) {
  const part = t(`car.inspection.parts.${panel.part}`);
  const name = panel.side
    ? t("car.inspection.partWithSide", { part, side: t(`car.inspection.sides.${panel.side}`) })
    : part;
  return (
    <li
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2 px-3 rounded-lg"
      style={{ backgroundColor: "var(--axis-graphite)" }}
    >
      <span dir="auto" className="text-xs" style={{ color: "var(--axis-white)" }}>
        {name}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {panel.statuses.map((s) => (
          <span
            key={s}
            dir="auto"
            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: "rgba(182,119,73,0.12)",
              border: "1px solid rgba(182,119,73,0.3)",
              color: "var(--axis-orange)",
            }}
          >
            {t(`car.inspection.status.${s}`)}
          </span>
        ))}
      </span>
    </li>
  );
}

function InspectionBlock({
  view,
  lang,
  vehicleId,
}: {
  view: InspectionView;
  lang: string;
  vehicleId: string | number;
}) {
  const t = getServerT(lang);
  const rows = buildRows(view, lang, t);
  const cats = markedCategories(view);
  const summary = cats.length
    ? t("car.inspection.summaryMarks", {
        list: cats.map((c) => t(`car.inspection.cats.${c}`)).join(t("car.inspection.listSep")),
      })
    : t("car.inspection.summaryNone");

  return (
    <section
      data-track-block="inspection"
      aria-labelledby="car-inspection-title"
      className="rounded-2xl p-5"
      style={CARD_STYLE}
    >
      <h2
        id="car-inspection-title"
        className="text-base font-semibold flex items-center gap-2 mb-1"
        style={{ color: "var(--axis-white)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block"
          style={{ background: "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))" }}
        />
        {t("car.inspection.title")}
      </h2>
      <p dir="auto" className="text-xs leading-relaxed mb-4" style={{ color: "var(--axis-gray)" }}>
        {t("car.inspection.disclaimer")}
      </p>

      <div>
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-start justify-between gap-4 py-2.5 border-b"
            style={{ borderColor: "rgba(74,74,74,0.2)" }}
          >
            <span dir="auto" className="text-sm min-w-0" style={{ color: "var(--axis-gray)" }}>
              {row.label}
            </span>
            <span
              dir="auto"
              className="text-sm font-semibold text-right min-w-0"
              style={{ color: row.marked ? "var(--axis-orange)" : "var(--axis-white)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {view.panels.length > 0 && (
        <div className="mt-4">
          <p className="text-xs mb-2" style={{ color: "var(--axis-gray)" }}>
            {t("car.inspection.panelsTitle")} ({view.panels.length})
          </p>
          <div className="space-y-3">
            {ZONES.map(({ zone, titleKey }) => {
              const items = view.panels.filter((p) => p.zone === zone);
              if (!items.length) return null;
              return (
                <div key={zone}>
                  <p
                    dir="auto"
                    className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--axis-silver)" }}
                  >
                    {t(titleKey)}
                  </p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((p, i) => (
                      <PanelItem key={`${p.part}-${p.side}-${i}`} panel={p} t={t} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p dir="auto" className="text-xs leading-relaxed mt-4" style={{ color: "var(--axis-gray)" }}>
        <span className="font-semibold" style={{ color: "var(--axis-white)" }}>
          {t("car.inspection.summary")}:
        </span>{" "}
        {summary}
      </p>

      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${vehicleId}`}
        className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-200 cursor-pointer hover:bg-[rgba(182,119,73,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
        style={{
          backgroundColor: "rgba(182,119,73,0.08)",
          color: "var(--axis-orange)",
          border: "1px solid rgba(182,119,73,0.2)",
        }}
      >
        {t("car.encarReport")}
        <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}

export default async function InspectionSection({
  lang,
  vehicleId,
}: {
  lang: string;
  vehicleId: string | number | undefined;
}): Promise<ReactNode> {
  const view = normalizeInspection(await fetchVehicleInspection(vehicleId));
  if (!view || !vehicleId) return null;
  return <InspectionBlock view={view} lang={langOrDefault(lang)} vehicleId={vehicleId} />;
}

export function InspectionSkeleton() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: "var(--axis-charcoal)" }}>
      <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: "var(--axis-graphite)" }} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 rounded mb-3" style={{ backgroundColor: "var(--axis-graphite)" }} />
      ))}
    </div>
  );
}
