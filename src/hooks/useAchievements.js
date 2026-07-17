import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { ACHIEVEMENTS } from '../constants/achievements.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { useXP } from './useXP.js';
import { onAuthStateChanged } from 'firebase/auth';

export const useAchievements = () => {
  const [unlockedAchievements, setUnlockedAchievements] = useState({});
  const { showAchievementToast } = useGamification();
  const { addXP } = useXP();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const achRef = collection(db, 'users', user.uid, 'achievements');
        const snap = await getDocs(achRef);
        const unlocked = {};
        snap.forEach(doc => {
          unlocked[doc.id] = doc.data();
        });
        setUnlockedAchievements(unlocked);
      } else {
        setUnlockedAchievements({});
      }
    });
    return () => unsubscribe();
  }, []);

  const unlockAchievement = useCallback(async (achievementId) => {
    if (!auth.currentUser) return;
    if (unlockedAchievements[achievementId]) return;

    const achievementDef = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievementDef) return;

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'achievements', achievementId);
      await setDoc(docRef, { unlockedAt: serverTimestamp() });
      
      setUnlockedAchievements(prev => ({ ...prev, [achievementId]: { unlockedAt: new Date() } }));
      
      showAchievementToast(achievementDef);
      setTimeout(() => {
        addXP(achievementDef.xpReward, `Достижение: ${achievementDef.title}`);
      }, 1000);
      
    } catch (e) {
      console.error("Failed to unlock achievement:", e);
    }
  }, [unlockedAchievements, showAchievementToast, addXP]);

  return { unlockedAchievements, unlockAchievement };
};
