import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
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
    let snapshotUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (snapshotUnsubscribe) {
        snapshotUnsubscribe();
        snapshotUnsubscribe = null;
      }

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        snapshotUnsubscribe = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const currentXp = data.xp || 0;
              setUserLevelData(calculateLevel(currentXp));
            } else {
              setUserLevelData(calculateLevel(0));
            }
            setLoading(false);
          },
          (error) => {
            console.error('[useXP] Error in user XP snapshot listener:', error);
            setLoading(false);
          }
        );
      } else {
        setUserLevelData(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (snapshotUnsubscribe) {
        snapshotUnsubscribe();
      }
    };
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
      // fix/critical-round1: логируем ошибку с достаточным контекстом для диагностики.
      // Тихое проглатывание заменено на полное логирование кода и activityType.
      console.error(`[useXP] Failed to award XP for activityType='${activityType}':`, {
        errorCode: e.code,
        errorMessage: e.message,
        details
      });
    }
  }, [showXPToast, showLevelUp]);

  return { userLevelData, addXP, loading };
};
