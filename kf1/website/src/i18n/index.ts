import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

/**
 * i18n internationalization configuration.
 * 
 * @description Configures i18next with language detection, React integration,
 * and message resources. Sets English as the default and fallback language.
 * Disables HTML escaping for interpolation values to allow HTML content in translations.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;