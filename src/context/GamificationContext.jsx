import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import XPToast from '../components/gamification/XPToast.jsx';
import LevelUpModal from '../components/gamification/LevelUpModal.jsx';
import AchievementUnlockToast from '../components/gamification/AchievementUnlockToast.jsx';

const GamificationContext = createContext(null);

const triggerFireworks = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

export const GamificationProvider = ({ children }) => {
  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);
  const [achievementToasts, setAchievementToasts] = useState([]);
  const [leagueToast, setLeagueToast] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('yourway_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveNotifications = (newNotifs) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem('yourway_notifications', JSON.stringify(newNotifs));
    } catch (e) {
      console.error(e);
    }
  };

  const showXPToast = useCallback((amount, reason) => {
    const id = Date.now() + Math.random();
    setXpToasts(prev => [...prev, { id, amount, reason }]);
    setTimeout(() => {
      setXpToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const showLeagueToast = useCallback((text) => {
    setLeagueToast({ id: Date.now(), text });
    setTimeout(() => {
      setLeagueToast(null);
    }, 4500);
  }, []);

  const showLevelUp = useCallback((oldLevel, newLevel) => {
    setLevelUpData({ oldLevel, newLevel });
  }, []);

  const closeLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem('yourway_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.setItem('yourway_notifications', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, unread: false }));
      try {
        localStorage.setItem('yourway_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const showAchievementToast = useCallback((achievement) => {
    const id = Date.now() + Math.random();
    setAchievementToasts(prev => [...prev, { id, achievement }]);
    triggerFireworks(); // 🎆 BOOM!

    // Add to notifications
    const newNotif = {
      id: Date.now() + Math.random(),
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      timestamp: new Date().toISOString(),
      unread: true
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      try {
        localStorage.setItem('yourway_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setTimeout(() => {
      setAchievementToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <GamificationContext.Provider value={{ 
      showXPToast, 
      showLevelUp, 
      showAchievementToast,
      showLeagueToast,
      notifications,
      clearNotification,
      clearAllNotifications,
      markAllAsRead
    }}>
      {children}
      
      {/* Portals / Fixed UI overlays */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-2 pointer-events-none items-end">
        <AnimatePresence>
          {xpToasts.map(toast => (
            <XPToast key={toast.id} amount={toast.amount} reason={toast.reason} />
          ))}
        </AnimatePresence>
      </div>

      <div className="fixed top-6 right-6 z-[150] flex flex-col gap-2 pointer-events-none items-end">
        <AnimatePresence>
          {achievementToasts.map(toast => (
            <AchievementUnlockToast key={toast.id} achievement={toast.achievement} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {levelUpData && (
          <LevelUpModal 
            oldLevel={levelUpData.oldLevel} 
            newLevel={levelUpData.newLevel} 
            onClose={closeLevelUp} 
          />
        )}
      </AnimatePresence>

      {/* Top Center League Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {leagueToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto bg-surface border border-outline rounded-xl p-4 shadow-xl flex items-center gap-3 text-left"
            >
              <div className="p-2 rounded-[8px] bg-on-surface/5 border border-white/10 text-on-surface">
                <Trophy className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-on-background font-medium leading-relaxed font-sans">{leagueToast.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
