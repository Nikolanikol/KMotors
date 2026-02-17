'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Восстанавливаем сохранённый язык только на клиенте, после гидратации
    const saved = localStorage.getItem('kmotors-language');
    if (saved && ['ru', 'en', 'ko'].includes(saved)) {
      i18n.changeLanguage(saved);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
