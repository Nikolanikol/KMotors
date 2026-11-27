// Перевод для СЕРВЕРНЫХ компонентов по ключам словаря common.json.
//
// У серверного компонента нет инстанса i18next (он поднимается на клиенте), а
// тянуть раздел словаря в RSC-payload страницы ради нескольких строк — вес на
// каждый просмотр. Поэтому серверные блоки карточки авто (осмотр Encar, «Как мы
// работаем») читают те же ключи common.json прямо на сервере: на клиент уезжает
// только готовый текст, а сырых ключей быть не может — фолбэк проходит en → ключ.
//
// ⚠️ SERVER-ONLY: модуль статически импортирует все локали. Не импортировать из
// "use client" компонентов, иначе словари улетят в клиентский бандл.
import ru from "@/locales/ru/common.json";
import en from "@/locales/en/common.json";
import ka from "@/locales/ka/common.json";
import ar from "@/locales/ar/common.json";
import { langOrDefault } from "@/lib/lang";

type Dict = { [key: string]: unknown };

const BUNDLES: Record<string, Dict> = { ru, en, ka, ar };

function lookup(dict: Dict | undefined, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Dict)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export type ServerT = (key: string, vars?: Record<string, string | number>) => string;

/** `t(key, { n: 3 })` подставляет `{{n}}`; нет ключа в языке — берёт en, затем сам ключ. */
export function getServerT(lang: string): ServerT {
  const active = BUNDLES[langOrDefault(lang)];
  return (key, vars) => {
    const text = lookup(active, key) ?? lookup(en, key) ?? key;
    return vars
      ? text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
      : text;
  };
}
