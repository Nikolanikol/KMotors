// Запрос пришёл через служебный хост (office.kmotors.shop), а не через www.
//
// Решение владельца 04.10.2026: служебные данные машины (сканы техпаспорта,
// документы, ставки, сырые поля) показываются ТОЛЬКО на служебном хосте. На
// www их нет в разметке вовсе — не спрятаны стилями, а не отрисованы.
//
// Определение то же, что в middleware.ts (isCanonicalHost) и ShareCar.tsx:
// служебный — всё, что не CANONICAL_HOST. Меняешь там — меняй здесь.
// localhost считается служебным: на нём сидит разработчик, то есть мы.
//
// ⚠️ Вход на служебный хост закрывает Cloudflare Access, а не этот код. Две
// вещи держат схему целой:
//   • страницы со служебным блоком НЕ кешировать общим кешем Next: кеш один на
//     оба хоста, и закешированный на office ответ ушёл бы на www;
//   • заголовок Host подделывается при запросе прямо на IP сервера в обход
//     Cloudflare. Закрывается на сервере — пускать на 80/443 только адреса
//     Cloudflare. Пока это не сделано, служебный блок — защита от случайного
//     взгляда клиента, а не от целенаправленного обхода.

import { headers } from "next/headers";

const CANONICAL_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop").hostname;
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export async function isServiceHost(): Promise<boolean> {
  const host = ((await headers()).get("host") ?? "").split(":")[0].toLowerCase();
  if (!host) return false;
  return LOCAL_HOSTS.includes(host) || host !== CANONICAL_HOST;
}
