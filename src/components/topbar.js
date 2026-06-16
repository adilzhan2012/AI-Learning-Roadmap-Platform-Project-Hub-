// ============================================
// Top App Bar
// ============================================

import { getCurrentRoute } from '../router.js';
import { t } from '../i18n.js';

export function renderTopbar() {
  const route = getCurrentRoute();
  const title = t('nav.' + route);

  return `
    <header class="bg-surface/80 backdrop-blur-lg sticky top-0 border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-gutter h-16 z-30">
      <!-- Left: Menu + Title -->
      <div class="flex items-center gap-3">
        <button onclick="window.__openSidebar()" class="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <h1 class="text-title-md font-semibold text-on-surface">${title}</h1>
      </div>

      <!-- Right: Search + Actions -->
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative hidden sm:block group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px] group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="${t('topbar.search')}" 
            class="w-52 bg-surface-container border border-outline-variant rounded-full py-2 pl-9 pr-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-body-sm"
          >
        </div>

        <!-- Mobile Search -->
        <button class="sm:hidden p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors">
          <span class="material-symbols-outlined text-[20px]">search</span>
        </button>

        <!-- Notifications -->
        <button class="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors relative">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <!-- Help -->
        <button class="hidden sm:block p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors">
          <span class="material-symbols-outlined text-[20px]">help_outline</span>
        </button>

        <!-- Profile Avatar -->
        <a href="#settings" class="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-semibold text-label-md flex-shrink-0 ml-1 hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-surface transition-all">
          A
        </a>
      </div>
    </header>
  `;
}
