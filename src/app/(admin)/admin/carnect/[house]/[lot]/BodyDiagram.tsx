// Схема кузова — развёртка, как в корейском листе осмотра (성능점검).
//
// В центре вид сверху (капот, крыша, багажник, стёкла, бамперы), слева и справа
// — борта, «откинутые» от крыши наружу: крыша у вида сверху, колёса снаружи.
// Такую раскладку покупатель корейской машины видел в каждом листе осмотра, и
// борт с колёсами, окнами и стойками читается как машина, а не как набор
// прямоугольников (первая версия была именно такой — владелец забраковал).
//
// Устройство: силуэт кузова — clipPath, панели — простые зоны ПОД ним, поэтому
// закраска повторяет форму кузова, а геометрию зон можно держать грубой.
// Стёкла, колёса и швы рисуются поверх. Один профиль борта на обе стороны:
// правый борт — зеркало левого (matrix с отражением), отдельно его не рисуем.
//
// Рисуем САМИ, а не берём картинку площадки: у K Car, Autohub и HeyDealer
// повреждения приходят данными, и вид не должен зависеть от источника.
//
// ⚠️ Цвет — не единственный носитель смысла: под схемой всегда список
// «Капот — замена», у каждой зоны <title> для наведения. Прошлый ремонт —
// заливка, «нужно сейчас» — штриховка: история машины и будущие расходы
// покупателя — разные вещи.

import type { BodyAction, BodyMark } from "@/lib/carnect/card";

export const ACTION: Record<BodyAction, { label: string; color: string; rank: number }> = {
  replaced: { label: "замена", color: "#E5484D", rank: 1 },
  welded: { label: "сварка / рихтовка", color: "#F59E0B", rank: 2 },
  painted: { label: "окрас", color: "#60A5FA", rank: 3 },
  adjusted: { label: "регулировка", color: "#A1A1AA", rank: 4 },
  other: { label: "ремонт", color: "#A1A1AA", rank: 5 },
  need_replace: { label: "нужна замена", color: "#F87171", rank: 0 },
  need_repair: { label: "нужен ремонт", color: "#C084FC", rank: 0 },
};

const BODY = "#1C1C1C";
const LINE = "#5A5A5A";
const SEAM = "#3A3A3A";
const GLASS = "#13202B";

// ─── Профиль борта: длина 400 (перед в x=0), высота 140 (крыша y=0, земля y=140) ───

const SIDE_SILHOUETTE =
  "M4 96 C2 80 6 70 16 66 L122 56 L168 20 C174 13 182 10 192 10 L304 11 C322 12 334 20 346 34 L382 54 " +
  "C392 58 396 66 397 80 L397 100 C397 108 393 112 386 112 L352 112 A34 34 0 0 0 284 112 L118 112 " +
  "A34 34 0 0 0 50 112 L14 112 C7 112 4 106 4 96 Z";

/** Остекление борта (линия окон). */
const SIDE_DLO = "M130 58 L170 24 C175 19 181 17 190 17 L300 18 C314 19 324 25 334 36 L346 54 Z";

/** Зоны борта. `{s}` — сторона (left / right); стойки и зеркало рисуются поверх стёкол. */
const SIDE_ZONES: { id: string; d: string; over?: boolean }[] = [
  { id: "bumper_front", d: "M0 60 H24 V124 H0 Z" },
  { id: "fender_front_{s}", d: "M24 40 H124 V112 H24 Z" },
  { id: "door_front_{s}", d: "M124 14 H240 V102 H124 Z" },
  { id: "door_rear_{s}", d: "M240 14 H330 V102 H240 Z" },
  { id: "quarter_{s}", d: "M330 8 H384 V112 H330 Z" },
  { id: "bumper_rear", d: "M384 50 H400 V124 H384 Z" },
  { id: "sill_{s}", d: "M118 101 H284 V112 H118 Z" },
  { id: "pillar_{s}", d: "M122 56 L168 20 L177 20 L133 58 Z M236 17 H245 V58 H236 Z", over: true },
  { id: "mirror_{s}", d: "M127 52 C126 45 136 41 146 44 L145 52 L134 56 Z", over: true },
];

const SIDE_SEAMS = [
  "M124 57 V108",
  "M240 58 V104",
  "M330 44 C330 70 330 90 326 104",
  "M118 101 H284",
  "M24 64 C24 80 22 96 20 110",
  "M384 56 C386 76 386 96 384 112",
];

const WHEELS = [84, 318];

/** Фара и фонарь на борту — по ним профиль узнаётся как машина, а не как клин. */
const SIDE_LIGHTS = [
  { d: "M8 70 C12 66 20 64 30 63 L28 72 C20 73 13 74 8 76 Z", fill: "#D9D4CC" },
  { d: "M392 60 C395 64 396 70 396 76 L386 74 L384 60 Z", fill: "#9B2C2C" },
];

/** Колёса на виде сверху выглядывают из-под кузова — те же оси, что на борту. */
const TOP_WHEELS = [
  [0, 62],
  [150, 62],
  [0, 296],
  [150, 296],
];

const TOP_LIGHTS = [
  { d: "M16 14 C24 8 38 6 50 6 L48 14 C38 15 26 17 16 20 Z", fill: "#D9D4CC" },
  { d: "M144 14 C136 8 122 6 110 6 L112 14 C122 15 134 17 144 20 Z", fill: "#D9D4CC" },
  { d: "M14 384 C22 390 36 393 48 394 L48 386 C38 386 26 384 16 380 Z", fill: "#9B2C2C" },
  { d: "M146 384 C138 390 124 393 112 394 L112 386 C122 386 134 384 144 380 Z", fill: "#9B2C2C" },
];

// ─── Вид сверху: ширина 160, длина 400 (перед в y=0) ───

const TOP_SILHOUETTE =
  "M80 2 C44 2 18 6 12 22 C8 34 6 60 6 110 L6 300 C6 350 8 372 12 382 C18 396 44 398 80 398 " +
  "C116 398 142 396 148 382 C152 372 154 350 154 300 L154 110 C154 60 152 34 148 22 C142 6 116 2 80 2 Z";

const TOP_ZONES: { id: string; d: string; glass?: boolean }[] = [
  { id: "bumper_front", d: "M0 0 H160 V22 H0 Z" },
  { id: "hood", d: "M28 22 H132 L134 118 H26 Z" },
  { id: "fender_front_left", d: "M0 22 H28 L26 120 H0 Z" },
  { id: "fender_front_right", d: "M132 22 H160 V120 H134 Z" },
  { id: "door_front_left", d: "M0 120 H34 V210 H0 Z" },
  { id: "door_rear_left", d: "M0 210 H34 V300 H0 Z" },
  { id: "door_front_right", d: "M126 120 H160 V210 H126 Z" },
  { id: "door_rear_right", d: "M126 210 H160 V300 H126 Z" },
  { id: "windshield", d: "M26 120 H134 L126 160 H34 Z", glass: true },
  { id: "roof", d: "M34 160 H126 V292 H34 Z" },
  { id: "rear_glass", d: "M34 292 H126 L134 322 H26 Z", glass: true },
  { id: "quarter_left", d: "M0 300 H34 L26 322 V382 H0 Z" },
  { id: "quarter_right", d: "M126 300 H160 V382 H134 V322 Z" },
  { id: "trunk", d: "M26 322 H134 V380 H26 Z" },
  { id: "bumper_rear", d: "M0 380 H160 V400 H0 Z" },
];

const TOP_SEAMS = [
  "M14 22 C40 18 120 18 146 22",
  "M28 22 L26 118",
  "M132 22 L134 118",
  "M26 120 H134",
  "M34 160 H126",
  "M34 160 V292",
  "M126 160 V292",
  "M34 292 H126",
  "M26 322 H134",
  "M26 322 V380",
  "M134 322 V380",
  "M14 380 C40 384 120 384 146 380",
];

/** Зеркала на виде сверху торчат за силуэт, поэтому рисуются отдельно, без обрезки. */
const TOP_MIRRORS = [
  { id: "mirror_left", d: "M7 126 L-4 128 C-8 129 -8 137 -4 138 L7 140 Z" },
  { id: "mirror_right", d: "M153 126 L164 128 C168 129 168 137 164 138 L153 140 Z" },
];

// ─── Отметки → зоны ───

/** Ключ отметки → зона. Стойки и лонжероны бывают с «front/rear» — на схеме одна полоса на сторону. */
function zoneOf(panel: string | null): string | null {
  if (!panel) return null;
  const side = panel.endsWith("_left") ? "left" : panel.endsWith("_right") ? "right" : null;
  if (panel.startsWith("pillar") && side) return `pillar_${side}`;
  return panel;
}

type Paint = { past?: BodyMark; now?: BodyMark };

function Zone({ id, d, base, paint }: { id: string; d: string; base: string; paint: Map<string, Paint> }) {
  const p = paint.get(id);
  const title = [p?.past && `${p.past.label}: ${ACTION[p.past.action].label}`, p?.now && `${p.now.label}: ${ACTION[p.now.action].label}`]
    .filter(Boolean)
    .join("; ");
  return (
    <g>
      {title && <title>{title}</title>}
      <path d={d} fill={p?.past ? ACTION[p.past.action].color : base} fillOpacity={p?.past ? 0.9 : 1} />
      {/* «Нужно сейчас» — штриховка: читается и поверх заливки прошлого ремонта,
          и не режется силуэтом, как пунктирная рамка в первой версии. */}
      {p?.now && <path d={d} fill={`url(#hatch-${p.now.action})`} />}
    </g>
  );
}

/** Штриховки для «нужно сейчас» — по одной на вид действия. */
function Hatches() {
  return (
    <defs>
      {(["need_replace", "need_repair"] as const).map((a) => (
        <pattern key={a} id={`hatch-${a}`} patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="rotate(45)">
          <rect width={7} height={7} fill={ACTION[a].color} fillOpacity={0.18} />
          <rect width={3} height={7} fill={ACTION[a].color} />
        </pattern>
      ))}
    </defs>
  );
}

/** Борт. Профиль общий; сторона задаёт и зоны (`{s}`), и отражение. */
function SideView({ side, transform, paint }: { side: "left" | "right"; transform: string; paint: Map<string, Paint> }) {
  const clip = `side-clip-${side}`;
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={clip}>
          <path d={SIDE_SILHOUETTE} />
        </clipPath>
      </defs>
      <path d={SIDE_SILHOUETTE} fill={BODY} />
      <g clipPath={`url(#${clip})`}>
        {SIDE_ZONES.filter((z) => !z.over).map((z) => (
          <Zone key={z.id} id={z.id.replace("{s}", side)} d={z.d} base="transparent" paint={paint} />
        ))}
      </g>
      <path d={SIDE_DLO} fill={GLASS} stroke={LINE} strokeWidth={1.2} />
      {SIDE_ZONES.filter((z) => z.over).map((z) => (
        <Zone key={z.id} id={z.id.replace("{s}", side)} d={z.d} base={BODY} paint={paint} />
      ))}
      <path d={SIDE_SILHOUETTE} fill="none" stroke={LINE} strokeWidth={1.6} strokeLinejoin="round" />
      {SIDE_SEAMS.map((d) => (
        <path key={d} d={d} fill="none" stroke={SEAM} strokeWidth={1.2} />
      ))}
      {SIDE_LIGHTS.map((l) => (
        <path key={l.d} d={l.d} fill={l.fill} fillOpacity={0.85} />
      ))}
      {/* Ручки дверей — мелочь, по которой борт и узнаётся. */}
      <rect x={196} y={66} width={16} height={4} rx={2} fill={SEAM} />
      <rect x={292} y={66} width={16} height={4} rx={2} fill={SEAM} />
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={112} r={27} fill="#0B0B0B" stroke={LINE} strokeWidth={1.2} />
          <circle cx={cx} cy={112} r={15} fill="#191919" stroke="#4A4A4A" strokeWidth={1} />
          <circle cx={cx} cy={112} r={4} fill="#4A4A4A" />
        </g>
      ))}
    </g>
  );
}

function TopView({ transform, paint }: { transform: string; paint: Map<string, Paint> }) {
  return (
    <g transform={transform}>
      <defs>
        <clipPath id="top-clip">
          <path d={TOP_SILHOUETTE} />
        </clipPath>
      </defs>
      {TOP_MIRRORS.map((m) => (
        <Zone key={m.id} id={m.id} d={m.d} base={BODY} paint={paint} />
      ))}
      {TOP_MIRRORS.map((m) => (
        <path key={`${m.id}-o`} d={m.d} fill="none" stroke={LINE} strokeWidth={1.2} />
      ))}
      {TOP_WHEELS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={10} height={44} rx={4} fill="#0B0B0B" stroke={LINE} strokeWidth={1} />
      ))}
      <path d={TOP_SILHOUETTE} fill={BODY} />
      <g clipPath="url(#top-clip)">
        {TOP_ZONES.map((z) => (
          <Zone key={z.id} id={z.id} d={z.d} base={z.glass ? GLASS : "transparent"} paint={paint} />
        ))}
      </g>
      <path d={TOP_SILHOUETTE} fill="none" stroke={LINE} strokeWidth={1.6} />
      {TOP_SEAMS.map((d) => (
        <path key={d} d={d} fill="none" stroke={SEAM} strokeWidth={1.2} />
      ))}
      {TOP_LIGHTS.map((l) => (
        <path key={l.d} d={l.d} fill={l.fill} fillOpacity={0.85} />
      ))}
    </g>
  );
}

export default function BodyDiagram({ marks }: { marks: BodyMark[] }) {
  // На зону — самая тяжёлая отметка каждого вида (прошлое и текущее отдельно).
  const paint = new Map<string, Paint>();
  for (const m of marks) {
    const z = zoneOf(m.panel);
    if (!z) continue;
    const cur = paint.get(z) ?? {};
    const key = m.when === "current" ? "now" : "past";
    const prev = cur[key];
    if (!prev || ACTION[m.action].rank < ACTION[prev.action].rank) cur[key] = m;
    paint.set(z, cur);
  }

  const used = [...new Set(marks.map((m) => m.action))].sort((a, b) => ACTION[a].rank - ACTION[b].rank);
  const sorted = [...marks].sort(
    (a, b) => Number(b.structural) - Number(a.structural) || ACTION[a.action].rank - ACTION[b.action].rank,
  );
  // Силовые элементы (лонжерон, пол, стойки изнутри) на развёртке не видны —
  // их отдельно выносим над списком, чтобы не потерялись внизу.
  const hidden = marks.filter((m) => !zoneOf(m.panel) || m.panel?.match(/^(member|floor|wheelhouse|dash|cross|rear_panel|radiator)/));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <figure className="mx-auto w-full max-w-[420px]">
        <svg viewBox="-4 0 512 440" className="w-full" role="img" aria-label="Схема кузова: левый борт, вид сверху, правый борт">
          <Hatches />
          {/* Борта «откинуты» от крыши: крыша к виду сверху, колёса наружу. */}
          <SideView side="left" transform="matrix(0 1 -1 0 148 24)" paint={paint} />
          <TopView transform="translate(172 24)" paint={paint} />
          <SideView side="right" transform="matrix(0 1 1 0 356 24)" paint={paint} />
          <text x={252} y={14} textAnchor="middle" fontSize={11} fill="#8A8A8A">
            ▲ перед
          </text>
          <text x={78} y={436} textAnchor="middle" fontSize={11} fill="#8A8A8A">
            левый борт
          </text>
          <text x={252} y={436} textAnchor="middle" fontSize={11} fill="#8A8A8A">
            вид сверху
          </text>
          <text x={426} y={436} textAnchor="middle" fontSize={11} fill="#8A8A8A">
            правый борт
          </text>
        </svg>
      </figure>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: "var(--axis-gray)" }}>
          {used.map((a) => {
            const current = a === "need_replace" || a === "need_repair";
            return (
              <span key={a} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={
                    current
                      ? { backgroundImage: `repeating-linear-gradient(45deg, ${ACTION[a].color} 0 2px, transparent 2px 5px)`, border: `1px solid ${ACTION[a].color}` }
                      : { backgroundColor: ACTION[a].color }
                  }
                />
                {ACTION[a].label}
              </span>
            );
          })}
        </div>
        {hidden.length > 0 && (
          <p className="mb-2 text-xs" style={{ color: "#E5484D" }}>
            Есть отметки по элементам, которых не видно на развёртке ({hidden.map((m) => m.label).join(", ")}) — смотрите список.
          </p>
        )}
        <ul className="text-sm">
          {sorted.map((m, i) => (
            <li
              key={`${m.label}-${m.action}-${i}`}
              className="flex justify-between gap-3 py-1.5"
              style={{ borderTop: i ? "1px solid rgba(74,74,74,0.2)" : undefined }}
            >
              <span style={{ color: "var(--axis-cream, #F5F0EB)" }}>
                {m.label}
                {m.structural && (
                  <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ border: "1px solid #E5484D", color: "#E5484D" }}>
                    силовой элемент
                  </span>
                )}
              </span>
              <span className="text-right" style={{ color: ACTION[m.action].color }}>
                {ACTION[m.action].label}
                {m.paintLevel ? ` (толщина ${m.paintLevel})` : ""}
                {m.when === "current" ? " · сейчас" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
