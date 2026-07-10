'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18nInstance } from '@/lib/i18n';

interface Props {
  children: React.ReactNode;
  lang: string;
}

export default function I18nProvider({ children, lang }: Props) {
  // Инстанс создаётся внутри рендер-дерева → на сервере он свой на каждый запрос
  // (не шарится между конкурентными запросами), на клиенте — один на монтирование.
  // Инициализируется правильным языком синхронно, поэтому серверный HTML и первый
  // клиентский рендер совпадают.
  const [i18n] = useState(() => createI18nInstance(lang));

  useEffect(() => {
    // «Догоняющий» механизм для клиентской смены языка: layout под сегментом [lang]
    // не перемонтируется при смене только параметра, поэтому синхронизируем вручную.
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    // Сохраняем в localStorage для совместимости
    localStorage.setItem('kmotors-language', lang);
    // Обновляем html lang атрибут на клиенте
    document.documentElement.lang = lang;
  }, [i18n, lang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
