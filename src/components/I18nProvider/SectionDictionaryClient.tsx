"use client";

import { useTranslation } from "react-i18next";
import type { Resource } from "i18next";

/**
 * Домешивает разделы `common` в уже зарегистрированный неймспейс.
 *
 * ⚠️ Здесь НЕЛЬЗЯ повторить приём CarsDictionaryClient с проверкой
 * `hasResourceBundle(lng, ns)`: неймспейс `common` к этому моменту всегда
 * существует — его кладёт [lang]/layout, — поэтому проверка вернула бы true и
 * разделы не добавились бы никогда, а страница показала бы сырые ключи.
 * Отсюда addResourceBundle с deep=true: разделы доливаются в существующий бандл.
 *
 * overwrite=false намеренно: догрузка ДОПОЛНЯЕТ словарь и не имеет права затирать
 * то, что уже отдал layout. Повторные монтирования при навигации туда-обратно
 * безвредны — слияние идемпотентно.
 *
 * Регистрация идёт ВО ВРЕМЯ рендера, а не в useEffect, по той же причине, что у
 * словаря Encar: потребители рендерятся на сервере, и словарь должен быть в
 * инстансе раньше них — иначе SSR отдаст в HTML сырые ключи, а первый клиентский
 * рендер их заменит и сломает гидрацию. Компонент ставится ПЕРЕД потребителями.
 */
export default function SectionDictionaryClient({ resources }: { resources: Resource }) {
  const { i18n } = useTranslation();

  for (const [lng, namespaces] of Object.entries(resources)) {
    for (const [ns, dict] of Object.entries(namespaces as Record<string, object>)) {
      i18n.addResourceBundle(lng, ns, dict, true, false);
    }
  }

  return null;
}
