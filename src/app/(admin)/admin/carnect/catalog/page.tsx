// Каталог carnect в админке — по-русски, без кеша выборки (свежесть сразу
// после синка). Сам каталог — общий компонент, его же рисует витрина
// /[lang]/auction: src/components/Carnect/CatalogView.tsx.

import CatalogView, { type SP } from "@/components/Carnect/CatalogView";
import { isServiceHost } from "@/lib/serviceHost";

import { requireAdmin } from "../../auction/shell";

export const dynamic = "force-dynamic";

export default async function CarnectCatalog({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const [sp, service] = await Promise.all([searchParams, isServiceHost()]);
  return (
    <CatalogView
      searchParams={sp}
      lang="ru"
      base="/admin/carnect/catalog"
      lotBase="/admin/carnect"
      cached={false}
      showReason={service}
      intro={
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Каталог аукционов</h1>
        </header>
      }
    />
  );
}
