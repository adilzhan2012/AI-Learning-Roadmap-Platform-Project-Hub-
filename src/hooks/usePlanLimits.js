import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import { onAuthStateChanged } from 'firebase/auth';

export const usePlanLimits = () => {
  const [plan, setPlan] = useState('FREE');
  const [usage, setUsage] = useState({ roadmapsGenerated: 0, aiQuestionsUsed: 0, lastQuestionDate: null });
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid, 'subscription', 'details');
        const snap = await getDoc(ref);
        const todayStr = new Date().toISOString().split('T')[0];

        if (snap.exists()) {
          const data = snap.data();
          setPlan(data.plan || 'FREE');
          
          let newAiQuestionsUsed = data.aiQuestionsUsed || 0;
          if (data.lastQuestionDate !== todayStr) {
            newAiQuestionsUsed = 0;
          }

          setUsage({ 
            roadmapsGenerated: data.roadmapsGenerated || 0, 
            aiQuestionsUsed: newAiQuestionsUsed,
            lastQuestionDate: todayStr
          });
        } else {
          const initData = { plan: 'FREE', roadmapsGenerated: 0, aiQuestionsUsed: 0, lastQuestionDate: todayStr };
          await setDoc(ref, initData);
          setPlan('FREE');
          setUsage(initData);
        }
      } else {
        setPlan('FREE');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const checkLimit = useCallback((type) => {
    if (plan === 'PRO') return true;
    if (type === 'roadmap' && usage.roadmapsGenerated >= PLAN_LIMITS.FREE.maxRoadmaps) {
      setUpgradeModalOpen(true);
      return false;
    }
    if (type === 'ai_question' && usage.aiQuestionsUsed >= PLAN_LIMITS.FREE.maxAiQuestions) {
      setUpgradeModalOpen(true);
      return false;
    }
    return true;
  }, [plan, usage]);

  const incrementUsage = useCallback(async (type) => {
    if (!auth.currentUser) return;
    const ref = doc(db, 'users', auth.currentUser.uid, 'subscription', 'details');
    const todayStr = new Date().toISOString().split('T')[0];
    
    setUsage(prev => {
      const newUsage = { ...prev };
      if (type === 'roadmap') {
        newUsage.roadmapsGenerated += 1;
      } else if (type === 'ai_question') {
        newUsage.aiQuestionsUsed += 1;
        newUsage.lastQuestionDate = todayStr;
      }
      // Fire-and-forget sync to Firestore
      setDoc(ref, newUsage, { merge: true }).catch(console.error);
      return newUsage;
    });
  }, []);

  return { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen, loading };
};
