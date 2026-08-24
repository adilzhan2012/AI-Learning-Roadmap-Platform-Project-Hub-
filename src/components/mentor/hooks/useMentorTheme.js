import { useState, useEffect } from 'react';
import { 
  NEUTRAL_TOKENS, 
  CATEGORY_TOKENS, 
  MENTOR_CATEGORY_KEYS,
  QUICK_PROMPTS,
  getSessionCategory, 
  getCategoryTokens 
} from '../constants/mentorTheme.js';

/**
 * Hook to retrieve current theme state and theme-aware design tokens
 */
export function useMentorTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setIsDark(!isLight);
    };

    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setIsDark(e.detail.theme === 'dark');
      } else {
        checkTheme();
      }
    };

    window.addEventListener('theme:changed', handleThemeChange);
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('theme:changed', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  const mode = isDark ? 'dark' : 'light';
  const neutral = NEUTRAL_TOKENS[mode];

  return {
    isDark,
    mode,
    neutral,
    categories: CATEGORY_TOKENS,
    quickPrompts: QUICK_PROMPTS,
    getSessionCategory,
    getCategoryTokens: (catOrTitle) => getCategoryTokens(catOrTitle, isDark),
  };
}
