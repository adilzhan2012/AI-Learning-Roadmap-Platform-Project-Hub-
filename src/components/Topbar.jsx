import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { t, useLocale } from '../i18n.js';
import XPProgressBar from './gamification/XPProgressBar.jsx';
import { useXP } from '../hooks/useXP.js';

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const locale = useLocale();
  
  const titles = {
    '/dashboard': t('nav.dashboard'),
    '/courses': t('nav.courses'),
    '/graph': t('nav.graph'),
    '/resources': t('nav.resources'),
    '/insights': t('nav.insights'),
    '/settings': t('nav.settings'),
    '/lessons': t('nav.lessons')
  };

  const title = titles[location.pathname] || t('nav.dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const { userLevelData } = useXP();

  return (
    <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-title-lg font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <XPProgressBar levelData={userLevelData} />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <Bell className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 bg-surface border border-outline-variant rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
                  <h3 className="font-bold text-on-surface">{t('topbar.notifications')}</h3>
                </div>
                <div className="p-6 text-center text-sm text-on-surface-variant">
                  {t('topbar.noNotifications')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
