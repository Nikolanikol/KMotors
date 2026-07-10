import { createInstance, type i18n as I18nType } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт переводов
import enCommon from '../locales/en/common.json';
import enCars from '../locales/en/cars.json';
import ruCommon from '../locales/ru/common.json';
import ruCars from '../locales/ru/cars.json';
import koCommon from '../locales/ko/common.json';
import koCars from '../locales/ko/cars.json';
import kaCommon from '../locales/ka/common.json';
import kaCars from '../locales/ka/cars.json';
import arCommon from '../locales/ar/common.json';
import arCars from '../locales/ar/cars.json';

const resources = {
  ru: { common: ruCommon, cars: ruCars },
  en: { common: enCommon, cars: enCars },
  ko: { common: koCommon, cars: koCars },
  ka: { common: kaCommon, cars: kaCars },
  ar: { common: arCommon, cars: arCars },
} as const;

const SUPPORTED = ['ru', 'en', 'ko', 'ka', 'ar'] as const;

// Фабрика вместо глобального синглтона.
// На сервере глобальный инстанс шарится между конкурентными запросами и всегда
// стартует с 'ru' → серверный HTML клиентских компонентов всегда русский независимо
// от URL. Создаём изолированный инстанс на каждый запрос (внутри рендер-дерева, см.
// I18nProvider), инициализированный правильным языком синхронно (initImmediate: false),
// поэтому серверный HTML сразу корректен, а первый клиентский рендер совпадает с ним
// (нет hydration mismatch).
export function createI18nInstance(lang: string): I18nType {
  const language = (SUPPORTED as readonly string[]).includes(lang) ? lang : 'ru';
  const instance = createInstance();

  instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'ru',
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
    // Синхронная инициализация — ресурсы забандлены, HTTP-бэкенда нет.
    // Гарантирует, что t() возвращает перевод уже на первом (серверном) рендере.
    initImmediate: false,
    react: {
      useSuspense: false,
    },
  });

  return instance;
}
