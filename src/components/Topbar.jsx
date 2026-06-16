import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Info } from 'lucide-react';

const titles = {
  '/dashboard': 'Dashboard',
  '/courses': 'Courses',
  '/graph': 'Knowledge Graph',
  '/resources': 'Resources',
  '/insights': 'Insights',
  '/settings': 'Settings',
  '/lessons': 'Lessons'
};

export default function Topbar() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Dashboard';
  const [showNotifications, setShowNotifications] = useState(false);

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
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
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
                  <button className="text-xs text-primary font-semibold hover:underline">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="mt-1 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-on-surface font-semibold">Course Generated</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Your AI roadmap for Python Basics is ready.</p>
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-surface-container-lowest transition-colors flex gap-3">
                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-on-surface font-semibold">Welcome to the Platform</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Start your first lesson in the new lessons tab!</p>
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">1 day ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
