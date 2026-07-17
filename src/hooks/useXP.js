import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { calculateLevel } from '../constants/levels.js';
import { useGamification } from '../context/GamificationContext.jsx';
import { onAuthStateChanged } from 'firebase/auth';

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

  const addXP = useCallback(async (amount, reason) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    
    // Optimistic UI update
    showXPToast(amount, reason);
    
    try {
      const docSnap = await getDoc(docRef);
      const currentXp = docSnap.exists() ? (docSnap.data().xp || 0) : 0;
      const newXp = currentXp + amount;
      
      const oldLevelCalc = calculateLevel(currentXp);
      const newLevelCalc = calculateLevel(newXp);
      
      setUserLevelData(newLevelCalc);

      const updates = {
        xp: increment(amount),
        totalXPEarned: increment(amount),
        xpHistory: arrayUnion({
          amount,
          reason,
          timestamp: new Date().toISOString()
        })
      };

      if (newLevelCalc.current.level > oldLevelCalc.current.level) {
        updates.level = newLevelCalc.current.level;
        // Small delay so the LevelUp modal doesn't clash instantly with the XP toast
        setTimeout(() => {
          showLevelUp(oldLevelCalc.current, newLevelCalc.current);
        }, 1000);
      }

      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Failed to add XP:", e);
    }
  }, [showXPToast, showLevelUp]);

  return { userLevelData, addXP, loading };
};
