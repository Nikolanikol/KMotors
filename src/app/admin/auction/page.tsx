// Служебная витрина лотов, вкладка K Car.
//
// Живёт под /admin намеренно: isExcluded в middleware.ts уже пропускает этот
// префикс мимо языкового редиректа, noindex стоит в admin/layout.tsx, а
// cookie-гейт admin_session работает там же. Ни одной новой строки в
// middleware — и ни одной новой дырки.
//
// От остальных вкладок отличается двумя вещами: сводкой по базе над сеткой и
// прогнозом цены молотка. Прогноз возможен только здесь — история прошедших
// торгов наполняется из публичного API K Car, у Lotte и SK такого API нет.

import { getAuctionSummary } from "@/lib/kcar/query";

import { AdminPlatformPage, requireAdmin } from "./shell";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.25)" }}
    >
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
        {label}
      </div>
      <div className="text-lg font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
        {value}
      </div>
      {hint && (
        <div className="text-[11px]" style={{ color: "var(--axis-gray)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

/** Сводка по базе: что вообще лежит и на чём стоит прогноз. */
async function Summary() {
  const summary = await getAuctionSummary();
  return (
    <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Stat
        label="ближайшие торги"
        value={summary.nextDate ?? "—"}
        hint={summary.sites.join(", ") || undefined}
      />
      <Stat label="лотов выставлено" value={summary.upcomingLots.toLocaleString("ru-RU")} />
      <Stat label="архив лотов" value={summary.archiveLots.toLocaleString("ru-RU")} hint="прошедшие торги" />
      <Stat
        label="наблюдений"
        value={summary.observations.toLocaleString("ru-RU")}
        hint={summary.lastSession ? `по сессию ${summary.lastSession}` : undefined}
      />
      <Stat
        label="из них сделок"
        value={summary.sales.toLocaleString("ru-RU")}
        hint={
          summary.observations
            ? `${Math.round((summary.sales / summary.observations) * 100)}% выборки`
            : undefined
        }
      />
    </section>
  );
}

export default async function AuctionAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  return (
    <AdminPlatformPage searchParams={await searchParams} source="kcar" withForecast>
      <Summary />
    </AdminPlatformPage>
  );
}
