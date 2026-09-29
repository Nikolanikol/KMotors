// Служебная витрина лотов SK. Вся обвязка — в ../shell.

import { AdminPlatformPage } from "../shell";

export const dynamic = "force-dynamic";

export default async function SKAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <AdminPlatformPage
      searchParams={await searchParams}
      source="sk"
      note="Источник — витрина-агрегатор: у SK всё про машины за логином (auction.skcarrental.com отдаёт оболочку входа). Прогноза молотка нет — истории торгов по SK у нас не существует."
    />
  );
}
