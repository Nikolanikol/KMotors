// Служебная витрина лотов Lotte. Вся обвязка — в ../shell.

import { AdminPlatformPage } from "../shell";

export const dynamic = "force-dynamic";

export default async function LotteAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <AdminPlatformPage
      searchParams={await searchParams}
      source="lotte"
      note="Источник — витрина-агрегатор, а не сам аукцион: у Lotte публичного API нет. Прогноза молотка здесь нет: истории торгов этой площадки у нас не существует."
    />
  );
}
