// ============================================
// Sidebar — Side Navigation Bar
// ============================================

import { navigate, getCurrentRoute } from '../router.js';
import { toggleTheme, isDark } from '../theme.js';
import { t } from '../i18n.js';
import { auth, signOut } from '../firebase.js';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: 'dashboard',     labelKey: 'nav.dashboard' },
  { id: 'courses',    icon: 'school',        labelKey: 'nav.courses' },
  { id: 'graph',      icon: 'hub',           labelKey: 'nav.graph' },
  { id: 'resources',  icon: 'library_books', labelKey: 'nav.resources' },
  { id: 'insights',   icon: 'insights',      labelKey: 'nav.insights' },
  { id: 'settings',   icon: 'settings',      labelKey: 'nav.settings' },
];

export function renderSidebar() {
  const currentRoute = getCurrentRoute();
  const user = auth.currentUser;
  const userEmail = user ? user.email : 'Not logged in';
  const userInitial = user && user.email ? user.email.charAt(0).toUpperCase() : '?';

  return `
    <!-- Mobile Overlay -->
    <div id="sidebar-overlay" class="sidebar-overlay" onclick="window.__closeSidebar()"></div>

    <!-- Sidebar -->
    <nav id="sidebar" class="bg-surface h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-outline-variant z-50 transition-transform duration-300 -translate-x-full md:translate-x-0">
      
      <!-- Brand -->
      <div class="flex items-center gap-3 px-5 py-6 mb-2">
        <div class="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <span class="material-symbols-outlined text-white icon-filled text-xl">psychology</span>
        </div>
        <div class="flex flex-col overflow-hidden">
          <span class="text-title-md font-semibold text-on-surface truncate tracking-tight">AI Academy</span>
          <span class="text-caption text-secondary truncate">${t('nav.premiumLearner')}</span>
        </div>
      </div>

      <!-- Nav Links -->
      <div class="flex-1 px-3 space-y-1 overflow-y-auto">
        ${NAV_ITEMS.map(item => {
          const isActive = item.id === currentRoute;
          return `
            <a href="#${item.id}" 
               data-nav-link="${item.id}"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'nav-link-active' 
                        : 'text-on-surface-variant hover:bg-surface-container-high'}"
               onclick="window.__closeSidebar()">
              <span class="material-symbols-outlined text-[20px] ${isActive ? 'icon-filled' : 'group-hover:text-primary'} transition-colors">${item.icon}</span>
              <span class="text-body-md">${t(item.labelKey)}</span>
            </a>
          `;
        }).join('')}
      </div>

      <!-- Bottom Section -->
      <div class="mt-auto px-3 pb-4">
        <!-- Theme Toggle -->
        <button onclick="window.__toggleTheme()" class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors mb-2">
          <span class="material-symbols-outlined text-[20px]">${isDark() ? 'light_mode' : 'dark_mode'}</span>
          <span class="text-body-md">${isDark() ? t('nav.lightMode') : t('nav.darkMode')}</span>
        </button>

        <!-- Divider -->
        <div class="border-t border-separator my-2"></div>
        
        <!-- User Profile -->
        <div class="flex items-center gap-3 px-3 py-2 group">
          <div class="flex-1 flex items-center gap-3 overflow-hidden">
            <div class="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-semibold text-label-lg flex-shrink-0">
              ${userInitial}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-body-md font-semibold text-on-surface truncate">User</p>
              <p class="text-caption text-on-surface-variant truncate">${userEmail}</p>
            </div>
          </div>
          <button onclick="window.__signOut()" title="Sign Out" class="p-2 text-secondary hover:text-error transition-colors rounded-lg hover:bg-error-container">
            <span class="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </nav>
  `;
}

export function initSidebar() {
  // Global functions for onclick handlers
  window.__toggleTheme = () => {
    toggleTheme();
  };

  window.__signOut = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged in main.js handles the redirect to login
    } catch (e) {
      console.error('Error signing out', e);
    }
  };

  // Sync visual theme button state with custom theme changes
  window.removeEventListener('theme:changed', window.__handleThemeChanged);
  window.__handleThemeChanged = (e) => {
    const isDarkMode = e.detail.theme === 'dark';
    const themeBtn = document.querySelector('[onclick="window.__toggleTheme()"]');
    if (themeBtn) {
      const icon = themeBtn.querySelector('.material-symbols-outlined');
      const label = themeBtn.querySelector('.text-body-md');
      if (icon) icon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
      if (label) label.textContent = isDarkMode ? t('nav.lightMode') : t('nav.darkMode');
    }
  };
  window.addEventListener('theme:changed', window.__handleThemeChanged);

  window.__closeSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (sidebar) sidebar.classList.remove('translate-x-0');
    if (overlay) overlay.classList.remove('active');
  };

  window.__openSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (sidebar) sidebar.classList.add('translate-x-0');
    if (overlay) overlay.classList.add('active');
  };
}
