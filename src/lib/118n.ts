import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en/translation.json';
i18n
  .use(initReactI18next)
  .init({
    lng: 'kor',
    fallbackLng: 'en',
    debug: false,
    resources: {
    //   kor: {
    //     translation: require('../../locales/kor/translation.json'),
    //   },
      en: {
        translation:enTranslation ,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
