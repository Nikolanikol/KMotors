import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт переводов
import enCommon from '../locales/en/common.json';
import enCars from '../locales/en/cars.json';
import ruCommon from '../locales/ru/common.json';
import ruCars from '../locales/ru/cars.json';
import koCommon from '../locales/ko/common.json';
import koCars from '../locales/ko/cars.json';

i18n
  .use(initReactI18next)
  .init({
    // Всегда стартуем с ru — одинаково на сервере и клиенте (нет hydration mismatch)
    lng: 'ru',
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

    // Загрузка пространств имён
    ns: ['common', 'cars'],
  });

export default i18n;
