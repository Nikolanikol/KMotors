import { createInstance, type i18n as I18nType, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

const SUPPORTED = ['ru', 'en', 'ka', 'ar'] as const;

// Фабрика вместо глобального синглтона.
// На сервере глобальный инстанс шарится между конкурентными запросами и всегда
// стартует с 'ru' → серверный HTML клиентских компонентов всегда русский независимо
// от URL. Создаём изолированный инстанс на каждый запрос (внутри рендер-дерева, см.
// I18nProvider), инициализированный правильным языком синхронно (initImmediate: false),
// поэтому серверный HTML сразу корректен, а первый клиентский рендер совпадает с ним
// (нет hydration mismatch).
//
// Ресурсы больше НЕ бандлятся статически (раньше все 5 языков грузились в клиентский
// бандл). Теперь сервер грузит только активный язык + en (см. loadLocale.ts) и передаёт
// их сюда пропом — тот же объект доступен синхронно и на сервере, и на клиенте, поэтому
// гидрация не ломается.
export function createI18nInstance(lang: string, resources: Resource): I18nType {
  const language = (SUPPORTED as readonly string[]).includes(lang) ? lang : 'en';
  const instance = createInstance();

  instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED as unknown as string[],
    // Двухбуквенные коды: компоненты сравнивают i18n.language === "ru" точным равенством
    load: 'languageOnly',
    debug: false,
    resources,
    defaultNS: 'common',
    ns: ['common', 'cars'],
    interpolation: {
      escapeValue: false, // React уже защищён от XSS
    },
    // Синхронная инициализация — ресурсы переданы пропом, HTTP-бэкенда нет.
    // Гарантирует, что t() возвращает перевод уже на первом (серверном) рендере.
    initImmediate: false,
    react: {
      useSuspense: false,
    },
  });

  return instance;
}
