'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

interface Props {
  children: React.ReactNode;
  lang: string;
}

export default function I18nProvider({ children, lang }: Props) {
  // Меняем язык синхронно — все ресурсы уже загружены в i18n.ts
  if (i18n.isInitialized && i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }

  useEffect(() => {
    // Сохраняем в localStorage для совместимости
    localStorage.setItem('kmotors-language', lang);
    // Обновляем html lang атрибут на клиенте
    document.documentElement.lang = lang;
  }, [lang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
