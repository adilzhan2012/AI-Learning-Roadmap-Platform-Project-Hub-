import { useState, useEffect } from 'react';

// ============================================
// i18n — Internationalization System
// ============================================

const STORAGE_KEY = 'yourway-locale';

const getInitialLocale = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  const browserLang = navigator.language ? navigator.language.split('-')[0] : 'en';
  const available = ['en', 'kk', 'ru', 'zh'];
  return available.includes(browserLang) ? browserLang : 'ru'; // Default to ru as it's the primary audience
};

let currentLocale = getInitialLocale();
let localesCache = {};
let isLoading = false;

// Preload the current locale initially if possible, or we will load it asynchronously
async function loadLocale(locale) {
  if (localesCache[locale]) return localesCache[locale];
  isLoading = true;
  try {
    let data;
    switch (locale) {
      case 'ru': data = await import('./locales/ru.json'); break;
      case 'kk': data = await import('./locales/kk.json'); break;
      case 'zh': data = await import('./locales/zh.json'); break;
      case 'en':
      default: data = await import('./locales/en.json'); break;
    }
    localesCache[locale] = data.default || data;
  } catch (error) {
    console.error(`Failed to load locale: ${locale}`, error);
    // fallback to English if it fails
    if (locale !== 'en') {
       if (!localesCache['en']) {
         const enData = await import('./locales/en.json');
         localesCache['en'] = enData.default || enData;
       }
       localesCache[locale] = localesCache['en'];
    }
  } finally {
    isLoading = false;
  }
  return localesCache[locale];
}

// Initial load trigger
loadLocale(currentLocale).then(() => {
  window.dispatchEvent(new CustomEvent('locale:loaded', { detail: { locale: currentLocale } }));
});

export function t(key, params = {}) {
  const dictionary = localesCache[currentLocale];
  if (!dictionary) {
    // If dictionary isn't loaded yet, return the key itself temporarily
    return key;
  }

  let str = dictionary[key];
  
  if (!str) {
    // Fallback to 'en' dictionary if missing in current locale
    if (currentLocale !== 'en' && localesCache['en'] && localesCache['en'][key]) {
      str = localesCache['en'][key];
    } else {
      console.warn(`[i18n] Missing translation key: "${key}" for locale: "${currentLocale}"`);
      return key;
    }
  }

  // Simple interpolation: {{name}} → params.name
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  });
  return str;
}

export function getLocale() {
  return currentLocale;
}

export async function setLocale(locale) {
  if (locale !== currentLocale) {
    await loadLocale(locale);
    currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    // Dispatch event so the app can re-render
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale } }));
  }
}

export function getAvailableLocales() {
  return [
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '中文 (HSK 1)', flag: '🇨🇳' },
  ];
}

export function useLocale() {
  const [locale, setLocaleState] = useState(currentLocale);
  const [, setTrigger] = useState(0);

  useEffect(() => {
    const changeHandler = (e) => setLocaleState(e.detail.locale);
    const loadHandler = () => setTrigger(t => t + 1); // Force re-render when dict is ready

    window.addEventListener('locale:changed', changeHandler);
    window.addEventListener('locale:loaded', loadHandler);

    return () => {
      window.removeEventListener('locale:changed', changeHandler);
      window.removeEventListener('locale:loaded', loadHandler);
    }
  }, []);
  return locale;
}
