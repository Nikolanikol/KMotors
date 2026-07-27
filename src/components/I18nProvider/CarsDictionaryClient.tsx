"use client";

import { useTranslation } from "react-i18next";
import type { Resource } from "i18next";

/**
 * Регистрирует словарь Encar в общем инстансе i18next.
 *
 * Регистрация идёт ВО ВРЕМЯ рендера, а не в useEffect: карточки авто рендерятся
 * на сервере, и словарь должен быть в инстансе до них — иначе SSR отдаст в HTML
 * корейские слова (плохо и для читателя, и для индексации), а первый клиентский
 * рендер их заменит и сломает гидрацию. Компонент ставится ПЕРЕД потребителями:
 * React рендерит соседей по порядку, поэтому к моменту их рендера бандл на месте.
 *
 * addResourceBundle идемпотентен благодаря проверке hasResourceBundle, так что
 * повторные монтирования при навигации туда-обратно ничего не переписывают.
 */
export default function CarsDictionaryClient({ resources }: { resources: Resource }) {
  const { i18n } = useTranslation();

  for (const [lng, namespaces] of Object.entries(resources)) {
    for (const [ns, dict] of Object.entries(namespaces as Record<string, object>)) {
      if (!i18n.hasResourceBundle(lng, ns)) {
        i18n.addResourceBundle(lng, ns, dict);
      }
    }
  }

  return null;
}
