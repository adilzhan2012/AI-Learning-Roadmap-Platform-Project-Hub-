import { useState, useEffect } from 'react';

// ============================================
// i18n — Internationalization System
// ============================================

const STORAGE_KEY = 'yourway-locale';

const getInitialLocale = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'ru';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') return saved;
    const browserLang = typeof navigator !== 'undefined' ? (navigator.language || navigator.userLanguage) : null;
    const initial = (browserLang && browserLang.startsWith('en')) ? 'en' : 'ru';
    localStorage.setItem(STORAGE_KEY, initial);
    return initial;
  } catch (e) {
    return 'ru';
  }
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

export function getCourseLocale(course) {
  return (course && course.language) ? course.language : 'ru';
}

export function t(key, params = {}) {
  const dictionary = localesCache[currentLocale];
  if (!dictionary) {
    // If dictionary isn't loaded yet, try the other or return key
    const altDict = localesCache[currentLocale === 'ru' ? 'en' : 'ru'];
    if (altDict && altDict[key]) {
      let str = altDict[key];
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
      return str;
    }
    return key;
  }

  const isRawContent = /[\s\u0400-\u04FF]/.test(key) || key.length > 30;

  let str = dictionary[key];
  
  if (!str) {
    // Fallback to alternate dictionary if missing in current locale
    const altLocale = currentLocale === 'ru' ? 'en' : 'ru';
    if (localesCache[altLocale] && localesCache[altLocale][key]) {
      str = localesCache[altLocale][key];
    } else {
      if (!isRawContent) {
        console.warn(`[i18n] Missing translation key: "${key}" for locale: "${currentLocale}"`);
      }
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

export async function setLocale(locale, syncToProfile = true) {
  if (locale !== 'ru' && locale !== 'en') {
    return;
  }
  if (locale !== currentLocale) {
    await loadLocale(locale);
    currentLocale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    // Dispatch event so the app can re-render
    window.dispatchEvent(new CustomEvent('locale:changed', { detail: { locale } }));

    if (syncToProfile) {
      try {
        const { auth } = await import('./firebase.js');
        if (auth.currentUser) {
          const { updateUserProfile } = await import('./services/courseService.js');
          updateUserProfile(auth.currentUser.uid, { locale }).catch(e => {
            console.warn('[i18n] Non-fatal: could not sync locale to profile:', e.message);
          });
        }
      } catch (err) {
        // fail gracefully if firebase/courseService is not available in test context
      }
    }
  }
}

export async function syncUserLocale(userLocale) {
  if (userLocale && (userLocale === 'ru' || userLocale === 'en') && userLocale !== currentLocale) {
    await setLocale(userLocale, false);
  }
}

export function getAvailableLocales() {
  return [
    { code: 'ru', label: 'Русский', flag: '', active: currentLocale === 'ru', disabled: false },
    { code: 'en', label: 'English (US)', flag: '', active: currentLocale === 'en', disabled: false },
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
