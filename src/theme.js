// ============================================
// Theme — Dark / Light Mode Controller
// ============================================

const STORAGE_KEY = 'ai-academy-theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    setTheme(saved);
  } else {
    // Auto-detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  // Listen for system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

export function setTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme } }));
}

export function toggleTheme() {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function isDark() {
  return document.documentElement.classList.contains('dark');
}
