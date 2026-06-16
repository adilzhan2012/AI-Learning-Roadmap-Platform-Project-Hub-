import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, signOut } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserStats } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';

export default function Sidebar() {
  const location = useLocation();
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState({ firstName: 'User' });
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const NAV_ITEMS = [
    { id: 'dashboard',  icon: 'dashboard',     label: t('nav.dashboard') },
    { id: 'courses',    icon: 'school',        label: t('nav.courses') },
    { id: 'graph',      icon: 'hub',           label: t('nav.graph') },
    { id: 'lessons',    icon: 'menu_book',     label: 'Lessons' },
    { id: 'resources',  icon: 'library_books', label: t('nav.resources') },
    { id: 'insights',   icon: 'insights',      label: t('nav.insights') },
    { id: 'settings',   icon: 'settings',      label: t('nav.settings') },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const stats = await getUserStats(currentUser.uid);
          setProfile(stats);
        } catch (e) {
          console.error("Error loading user stats in sidebar:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      html.classList.add('light');
      setIsDarkMode(false);
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const userEmail = user ? user.email : 'Not logged in';
  const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : (user && user.email ? user.email.charAt(0).toUpperCase() : '?');


  return (
    <>
      <nav id="sidebar" className="bg-surface h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-outline-variant z-50 transition-transform duration-300 md:translate-x-0">
        <div className="flex items-center gap-3 px-5 py-6 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white icon-filled text-xl">psychology</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-title-md font-semibold text-on-surface truncate tracking-tight">AI Learning Roadmap</span>
            <span className="text-caption text-secondary truncate">Platform — Project Hub</span>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto relative">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === `/${item.id}`;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${isActive ? 'text-on-primary-fixed' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-primary rounded-lg z-0"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`material-symbols-outlined text-[20px] relative z-10 ${isActive ? 'icon-filled' : 'group-hover:text-primary transition-colors'}`}>{item.icon}</span>
                <span className="text-body-md relative z-10 font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-auto px-3 pb-4">
          <button onClick={handleToggleTheme} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors mb-2">
            <span className="material-symbols-outlined text-[20px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            <span className="text-body-md">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="border-t border-separator my-2"></div>
          
          <div className="flex items-center gap-3 px-3 py-2 group">
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-semibold text-label-lg flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-body-md font-semibold text-on-surface truncate">{profile.firstName || 'User'}</p>
                <p className="text-caption text-on-surface-variant truncate">{userEmail}</p>
              </div>
            </div>

            <button onClick={handleSignOut} title="Sign Out" className="p-2 text-secondary hover:text-error transition-colors rounded-lg hover:bg-error-container">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
