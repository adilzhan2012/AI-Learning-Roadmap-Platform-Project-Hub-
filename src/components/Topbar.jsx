import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  X, 
  Trash2, 
  Menu, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  ChevronRight,
  CreditCard,
  Trophy
} from 'lucide-react';
import { t, useLocale } from '../i18n.js';
import { useXP } from '../hooks/useXP.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { toggleTheme } from '../theme.js';
import { auth, signOut } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserStats } from '../services/courseService.js';
import Logo from './shared/Logo.jsx';
import { LeagueIcon } from '../pages/Leagues.jsx';
import { usePlanLimits } from '../hooks/usePlanLimits.js';

const LEAGUE_NAMES = {
  silicon: 'Кремний',
  graphite: 'Графит',
  quartz: 'Кварц',
  obsidian: 'Обсидиан',
  platinum: 'Платина',
  titan: 'Титан'
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = useLocale();

  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState({ firstName: 'User' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const { userLevelData } = useXP();
  const { 
    notifications, 
    clearNotification, 
    clearAllNotifications, 
    markAllAsRead 
  } = useGamification();

  const unreadCount = notifications.filter(n => n.unread).length;

  const NAV_ITEMS = [
    { path: '/dashboard', label: t('nav.dashboard') },
    { path: '/courses', label: t('nav.courses') },
    { path: '/graph', label: t('nav.graph') },
    { path: '/achievements', label: 'Достижения' },
    { path: '/resources', label: t('nav.resources') },
    { path: '/insights', label: t('nav.insights') },
  ];

  const { plan } = usePlanLimits();
  const currentLeague = profile.currentLeague || (plan === 'FREE' ? 'graphite' : 'quartz');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const stats = await getUserStats(currentUser.uid);
          setProfile(stats);
        } catch (e) {
          console.error("Error loading user stats in Topbar:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync dark mode state with system theme changes
  useEffect(() => {
    const handler = (e) => setIsDarkMode(e.detail.theme === 'dark');
    window.addEventListener('theme:changed', handler);
    return () => window.removeEventListener('theme:changed', handler);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      markAllAsRead();
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const userEmail = user ? user.email : '';
  const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : '?');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[80] h-14 border-b border-outline bg-background/90 backdrop-blur-md flex items-center justify-between px-12 md:px-16 font-sans transition-colors duration-200">
        {/* Left Brand Area */}
        <div className="flex items-center gap-6">
          <div onClick={() => navigate('/dashboard')} className="flex items-center cursor-pointer select-none">
            <Logo variant="icon" className="h-9 md:h-9.5" scale={1.05} />
          </div>
        </div>

        {/* Center Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center h-full gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={`relative flex items-center h-full py-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-on-background font-semibold' : 'text-on-surface-variant hover:text-on-background'
                } group`}
              >
                <span>{item.label}</span>
                {item.isPro && (
                  <span className="ml-1 px-1 py-0.5 text-[8px] font-bold tracking-widest text-on-surface-variant border border-outline rounded group-hover:border-on-background group-hover:text-on-background transition-colors leading-none uppercase">
                    Pro
                  </span>
                )}
                {/* 2px Apple Style bottom selection line */}
                <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-on-background transition-transform duration-200 origin-center ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </NavLink>
            );
          })}
        </nav>

        {/* Right Action Icons & Avatar */}
        <div className="flex items-center gap-4">
          
          {/* Current League Emblem */}
          <div 
            onClick={() => navigate('/achievements')}
            className="hidden sm:flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-on-surface-variant hover:text-white transition-colors border border-outline bg-surface rounded-full px-2.5 py-1 select-none font-sans"
            title="Лига соревнований"
          >
            <LeagueIcon leagueId={currentLeague} className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{LEAGUE_NAMES[currentLeague] || 'Кварц'}</span>
          </div>

          {/* User Progress */}
          {userLevelData && userLevelData.current && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-on-surface-variant select-none">
              <span className="font-bold text-on-background">LVL {userLevelData.current.level}</span>
              <div className="w-10 h-[2px] bg-surface-container-high border border-outline-variant rounded-full overflow-hidden">
                <div className="h-full bg-on-background" style={{ width: `${userLevelData.progress || 0}%` }} />
              </div>
            </div>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={handleToggleNotifications}
              className={`p-1.5 rounded-[8px] border border-transparent transition-all relative ${showNotifications ? 'bg-surface-container border-outline-variant text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-[300px] sm:w-80 bg-surface-container border border-outline-variant rounded-[16px] z-[90] flex flex-col max-h-96 font-sans shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <h3 className="font-bold text-on-surface text-xs">Уведомления</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 uppercase tracking-wider font-mono"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Очистить все
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-outline-variant scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-on-surface-variant font-medium">
                        {t('topbar.noNotifications') || 'Нет уведомлений'}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-3 flex items-start gap-3 hover:bg-surface-container-high transition-colors relative group">
                          <div className="text-xl flex-shrink-0 mt-0.5">{notif.icon || '🏆'}</div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="font-bold text-xs text-on-surface leading-tight truncate">{notif.title}</p>
                            <p className="text-[11px] text-on-surface-variant mt-1 leading-snug break-words">{notif.description}</p>
                            <p className="text-[9px] text-on-surface-variant/70 mt-1 font-mono">{formatTime(notif.timestamp)}</p>
                          </div>
                          <button 
                            onClick={() => clearNotification(notif.id)}
                            className="absolute right-2 top-2.5 p-1 rounded-[6px] hover:bg-surface-container-highest text-on-surface-variant hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Удалить"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Avatar Icon button */}
          <div className="relative">
            <button 
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="w-7 h-7 rounded-full bg-surface-container border border-outline flex items-center justify-center text-on-surface font-semibold text-xs font-mono hover:border-[rgba(255,255,255,0.3)] transition-colors select-none"
            >
              {userInitial}
            </button>

            {/* Profile Dropdown panel */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-64 bg-surface border border-outline rounded-[16px] z-[90] shadow-[0_20px_60px_rgba(0,0,0,0.4)] py-2 font-sans text-xs"
                >
                  {/* Profile Info block */}
                  <div className="px-4 py-3 border-b border-outline">
                    <p className="font-bold text-on-surface text-sm">{profile.firstName || 'User'}</p>
                    <p className="text-[10px] text-on-surface-variant truncate font-mono mt-0.5">{userEmail}</p>
                  </div>

                  {/* Toggle Theme Menu button */}
                  <button 
                    onClick={handleToggleTheme} 
                    className="flex items-center justify-between w-full px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      {isDarkMode ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
                      <span>{isDarkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
                    </span>
                  </button>

                  {/* Settings Page option */}
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4" strokeWidth={1.5} />
                      <span>{t('nav.settings')}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#636366]" strokeWidth={1.5} />
                  </button>

                  {/* Tariffs Page option */}
                  <button 
                    onClick={() => { setShowProfileMenu(false); navigate('/pricing'); }}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                      <span>Тарифы</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#636366]" strokeWidth={1.5} />
                  </button>

                  <div className="py-2 border-b border-outline">
                    <button 
                      onClick={() => {
                        navigate('/achievements');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high/50 transition-colors flex items-center gap-2"
                    >
                      <Trophy className="w-3.5 h-3.5 text-on-surface-variant" strokeWidth={1.5} />
                      Достижения
                    </button>
                  </div>

                  <div className="border-t border-outline my-1"></div>

                  {/* Logout/Sign Out Option */}
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-[#FF453A] hover:bg-surface-container/40 transition-colors text-left font-bold"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    <span>Выйти</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger menu (Lucide) */}
          <button 
            onClick={() => setShowMobileMenu(true)} 
            className="p-1 text-on-surface-variant hover:text-on-surface md:hidden"
            title="Menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

        </div>
      </header>

      {/* Fullscreen Mobile Navigation Menu Overlay (Apple Style) */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col p-6 font-sans"
          >
            {/* Top Close trigger row */}
            <div className="flex items-center justify-between mb-12">
              <span className="text-sm font-semibold tracking-tight text-on-surface font-clash">yourway.co</span>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-on-surface-variant hover:text-on-surface bg-surface border border-outline rounded-[12px]"
                title="Close menu"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Vertical list of navigation items */}
            <div className="flex-1 flex flex-col gap-8 justify-center max-w-sm mx-auto w-full">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        navigate(item.path);
                      }}
                      className={`text-left text-3xl font-bold font-clash tracking-tight transition-colors flex items-center gap-3 ${
                        isActive ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.isPro && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-current rounded font-bold font-sans tracking-widest uppercase leading-none">
                          Pro
                        </span>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Mobile Footer Area */}
            <div className="mt-auto border-t border-outline pt-6 flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between text-on-surface-variant font-mono">
                <span>{profile.firstName || 'User'}</span>
                <span>{userEmail}</span>
              </div>
              <button 
                onClick={() => { setShowMobileMenu(false); handleSignOut(); }}
                className="w-full py-3 bg-[#FF453A] text-on-surface rounded-[12px] text-center font-bold text-xs uppercase tracking-wider"
              >
                Выйти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
