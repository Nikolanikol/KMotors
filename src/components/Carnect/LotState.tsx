// Страница машины, когда деталей нет: «ушла с торгов» или «источник не ответил».
//
// ⚠️ Это РАЗНЫЕ исходы, и разводить их обязательно — то же правило, что у
// Encar и прежней витрины аукционов. Сказать «продана» про живую машину, пока
// carnect лежит, — соврать. Причина сбоя (сменилась разметка) — только админке.

import Link from "next/link";

import type { CardLang } from "@/lib/carnect/lang";

import { tx } from "./text";
import { C, Page, Panel } from "./ui";

export default function LotState({
  id,
  gone,
  parser,
  lang,
  backHref,
  withHeader = false,
  showReason = false,
}: {
  id: string;
  gone: boolean;
  parser: boolean;
  lang: CardLang;
  backHref: string;
  withHeader?: boolean;
  /** Служебная подсказка «чинить парсер» — только нам. */
  showReason?: boolean;
}) {
  return (
    <Page withHeader={withHeader}>
      <Link href={backHref} className="text-sm" style={{ color: C.accent }}>
        {tx(lang, "backToCatalog")}
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold">{id}</h1>
      {gone ? (
        <Panel title={tx(lang, "goneTitle")}>
          <p className="text-sm">{tx(lang, "goneText")}</p>
        </Panel>
      ) : (
        <Panel title={tx(lang, "unavailableTitle")}>
          <p className="text-sm" style={{ color: C.muted }}>
            {tx(lang, "unavailableText")}
          </p>
          {showReason && parser && (
            <p className="mt-2 text-xs" style={{ color: C.bad }}>
              Страница пришла, но объекта машины в ней нет — сменилась разметка. Чинить detail.ts / heydealer.ts.
            </p>
          )}
        </Panel>
      )}
    </Page>
  );
}
