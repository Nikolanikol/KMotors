import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import enCommon from '../locales/en/common.json';
import enCars from '../locales/en/cars.json';
import ruCommon from '../locales/ru/common.json';
import ruCars from '../locales/ru/cars.json';
import koCommon from '../locales/ko/common.json';
import koCars from '../locales/ko/cars.json';

i18n
  .use(LanguageDetector) // Автоматическое определение языка браузера
  .use(initReactI18next)
  .init({
    // Язык по умолчанию
    fallbackLng: 'ru',

    // Поддерживаемые языки
    supportedLngs: ['ru', 'en', 'ko'],

    // Отладка (выключить в продакшене)
    debug: false,

    // Ресурсы переводов
    resources: {
      ru: {
        common: ruCommon,
        cars: ruCars,
      },
      en: {
        common: enCommon,
        cars: enCars,
      },
      ko: {
        common: koCommon,
        cars: koCars,
      },
    },

    // Пространство имён по умолчанию
    defaultNS: 'common',

    // Интерполяция
    interpolation: {
      escapeValue: false, // React уже защищён от XSS
    },

    // Определение языка
    detection: {
      // Порядок проверки источников языка
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Ключ для localStorage
      lookupLocalStorage: 'kmotors-language',

      // Кэширование выбранного языка
      caches: ['localStorage'],
    },

    // Загрузка пространств имён
    ns: ['common', 'cars'],
  });

export default i18n;
