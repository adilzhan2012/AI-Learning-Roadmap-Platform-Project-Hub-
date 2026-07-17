import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import XPToast from '../components/gamification/XPToast.jsx';
import LevelUpModal from '../components/gamification/LevelUpModal.jsx';
import AchievementUnlockToast from '../components/gamification/AchievementUnlockToast.jsx';

const GamificationContext = createContext(null);

export const GamificationProvider = ({ children }) => {
  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);
  const [achievementToasts, setAchievementToasts] = useState([]);

  const showXPToast = useCallback((amount, reason) => {
    const id = Date.now() + Math.random();
    setXpToasts(prev => [...prev, { id, amount, reason }]);
    setTimeout(() => {
      setXpToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const showLevelUp = useCallback((oldLevel, newLevel) => {
    setLevelUpData({ oldLevel, newLevel });
  }, []);

  const closeLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const showAchievementToast = useCallback((achievement) => {
    const id = Date.now() + Math.random();
    setAchievementToasts(prev => [...prev, { id, achievement }]);
    setTimeout(() => {
      setAchievementToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <GamificationContext.Provider value={{ showXPToast, showLevelUp, showAchievementToast }}>
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
