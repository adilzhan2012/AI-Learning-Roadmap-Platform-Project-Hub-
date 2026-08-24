import React from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  BrainCircuit, 
  X,
  Menu
} from 'lucide-react';

export default function MentorHeader({
  isSidebarOpen,
  onToggleSidebar,
  onClose,
  plan,
  locale,
  themeTokens,
}) {
  return (
    <div className={`h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 relative select-none ${themeTokens.headerBg}`}>
      <div className="flex items-center gap-2.5">
        {/* Toggle Sidebar Button */}
        <button 
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className={`p-2 rounded-xl transition-all duration-150 ${themeTokens.toggleBtn}`}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 hidden md:block" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 hidden md:block" />
          )}
          <Menu className="w-5 h-5 md:hidden" />
        </button>

        {/* AI Icon */}
        <div className="flex w-8 h-8 rounded-xl bg-indigo-500/15 items-center justify-center border border-indigo-500/25 shrink-0">
          <BrainCircuit className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>

        {/* Title & Plan Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold tracking-tight">
            {locale === 'en' ? 'AI Mentor' : 'AI Ментор'}
          </span>
          {plan === 'ULTRA' ? (
            <span className="text-[11px] font-extrabold tracking-wider text-indigo-600 dark:text-indigo-300 border border-indigo-500/35 px-2 py-0.5 rounded-lg bg-indigo-500/15 uppercase">
              Ultra
            </span>
          ) : plan === 'PRO' ? (
            <span className="text-[11px] font-extrabold tracking-wider text-amber-600 dark:text-amber-300 border border-amber-500/35 px-2 py-0.5 rounded-lg bg-amber-500/15 uppercase">
              Pro
            </span>
          ) : null}
        </div>
      </div>

      {/* Close Modal Button */}
      <div className="flex items-center gap-2">
        <button 
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`p-2 rounded-xl transition-all duration-150 ${themeTokens.toggleBtn}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
