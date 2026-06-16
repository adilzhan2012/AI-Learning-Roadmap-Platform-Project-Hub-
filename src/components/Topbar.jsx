import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Info } from 'lucide-react';
import { t, useLocale } from '../i18n.js';

export default function Topbar() {
  const location = useLocation();
  const locale = useLocale();
  
  const titles = {
    '/dashboard': t('nav.dashboard'),
    '/courses': t('nav.courses'),
    '/graph': t('nav.graph'),
    '/resources': t('nav.resources'),
    '/insights': t('nav.insights'),
    '/settings': t('nav.settings'),
    '/lessons': 'Lessons'
  };

  const title = titles[location.pathname] || t('nav.dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Course Generated',
      message: 'Your AI roadmap for Python Basics is ready.',
      time: '2 hours ago',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      id: 2,
      title: 'Welcome to the Platform',
      message: 'Start your first lesson in the new lessons tab!',
      time: '1 day ago',
      icon: <Info className="w-4 h-4" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications([]);
  };

  return (
    <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-title-lg font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input type="text" placeholder="Search..." className="w-64 h-10 pl-10 pr-4 bg-surface-container-high border-none rounded-full text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/70 text-on-surface" />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-surface-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                  <h3 className="font-bold text-on-surface">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary font-semibold hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors flex gap-3">
                        <div className={`mt-1 w-8 h-8 rounded-full ${notif.bg} flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                          {notif.icon}
                        </div>
                        <div>
                          <p className="text-sm text-on-surface font-semibold">{notif.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-on-surface-variant/70 mt-1 block">{notif.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-on-surface-variant">
                      No new notifications
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
