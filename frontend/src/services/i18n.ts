import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Load JSON locale files at build time
import en from '../locales/en/translation.json'
import hi from '../locales/hi/translation.json'
import bn from '../locales/bn/translation.json'
import ta from '../locales/ta/translation.json'
import te from '../locales/te/translation.json'
import kn from '../locales/kn/translation.json'
import ml from '../locales/ml/translation.json'
import mr from '../locales/mr/translation.json'
import gu from '../locales/gu/translation.json'
import pa from '../locales/pa/translation.json'
import or from '../locales/or/translation.json'

const resources = { en: { translation: en }, hi: { translation: hi }, bn: { translation: bn }, ta: { translation: ta }, te: { translation: te }, kn: { translation: kn }, ml: { translation: ml }, mr: { translation: mr }, gu: { translation: gu }, pa: { translation: pa }, or: { translation: or } }

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['querystring', 'localStorage', 'navigator'], caches: ['localStorage'] },
  })
  .then(() => {
    console.log('i18next initialized successfully')
  })
  .catch((error) => {
    console.error('i18next initialization failed:', error)
  })

export default i18n


