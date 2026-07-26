import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, functions } from '../firebase.js';
import { httpsCallable } from 'firebase/functions';
import { calculateLevel } from '../constants/levels.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { getLocale } from '../i18n.js';

export const useXP = () => {
  const [userLevelData, setUserLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showXPToast, showLevelUp } = useGamification();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentXp = data.xp || 0;
          setUserLevelData(calculateLevel(currentXp));
        } else {
          setUserLevelData(calculateLevel(0));
        }
      } else {
        setUserLevelData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addXP = useCallback(async (amount, reason, activityType, details) => {
    if (!auth.currentUser) return;
    
    try {
      const awardXPFn = httpsCallable(functions, 'awardXP');
      const result = await awardXPFn({
        userId: auth.currentUser.uid,
        activityType,
        details,
        locale: getLocale()
      });
      
      if (result.data.success) {
        showXPToast(result.data.amountAwarded, reason);
        setUserLevelData(result.data.userLevelData);
        
        if (result.data.newLevel.level > result.data.oldLevel.level) {
          showLevelUp(result.data.oldLevel, result.data.newLevel);
        }
      }
    } catch (e) {
      console.error("Failed to add XP:", e);
    }
  }, [showXPToast, showLevelUp]);

  return { userLevelData, addXP, loading };
};
