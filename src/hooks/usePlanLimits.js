import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import { onAuthStateChanged } from 'firebase/auth';

export const usePlanLimits = () => {
  const [plan, setPlan] = useState('FREE');
  const [usage, setUsage] = useState({ 
    roadmapsGenerated: 0, 
    aiQuestionsUsed: 0, 
    lastQuestionDate: null,
    mentorMessagesUsed: 0,
    lastMentorDate: null,
    mentorMonthStart: null
  });
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbBillingPeriod, setDbBillingPeriod] = useState('monthly');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid, 'subscription', 'details');
        const snap = await getDoc(ref);
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStr = todayStr.substring(0, 7); // YYYY-MM

        if (snap.exists()) {
          const data = snap.data();
          const currentPlan = data.plan || 'FREE';
          setPlan(currentPlan);
          setDbBillingPeriod(data.billingPeriod || 'monthly');
          
          let newAiQuestionsUsed = data.aiQuestionsUsed || 0;
          if (data.lastQuestionDate !== todayStr) {
            newAiQuestionsUsed = 0;
          }

          let newMentorMessagesUsed = data.mentorMessagesUsed || 0;
          if (currentPlan === 'PRO') {
            if (data.lastMentorDate !== todayStr) {
              newMentorMessagesUsed = 0;
            }
          } else {
            if (data.mentorMonthStart !== monthStr) {
              newMentorMessagesUsed = 0;
            }
          }

          setUsage({ 
            roadmapsGenerated: data.roadmapsGenerated || 0, 
            aiQuestionsUsed: newAiQuestionsUsed,
            lastQuestionDate: todayStr,
            mentorMessagesUsed: newMentorMessagesUsed,
            lastMentorDate: data.lastMentorDate || todayStr,
            mentorMonthStart: data.mentorMonthStart || monthStr
          });
        } else {
          const initData = { 
            plan: 'FREE', 
            roadmapsGenerated: 0, 
            aiQuestionsUsed: 0, 
            lastQuestionDate: todayStr,
            mentorMessagesUsed: 0,
            lastMentorDate: todayStr,
            mentorMonthStart: monthStr
          };
          await setDoc(ref, initData);
          setPlan('FREE');
          setDbBillingPeriod('monthly');
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
    if (type === 'mentor_message') {
      const limitVal = plan === 'PRO' ? PLAN_LIMITS.PRO.maxMentorMessages : PLAN_LIMITS.FREE.maxMentorMessages;
      if (usage.mentorMessagesUsed >= limitVal) {
        setUpgradeModalOpen(true);
        return false;
      }
      return true;
    }

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
    const monthStr = todayStr.substring(0, 7);
    
    setUsage(prev => {
      const newUsage = { ...prev };
      if (type === 'roadmap') {
        newUsage.roadmapsGenerated += 1;
      } else if (type === 'ai_question') {
        newUsage.aiQuestionsUsed += 1;
        newUsage.lastQuestionDate = todayStr;
      } else if (type === 'mentor_message') {
        newUsage.mentorMessagesUsed += 1;
        newUsage.lastMentorDate = todayStr;
        newUsage.mentorMonthStart = monthStr;
      }
      // Fire-and-forget sync to Firestore
      setDoc(ref, newUsage, { merge: true }).catch(console.error);
      return newUsage;
    });
  }, []);

  return { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen, loading, dbBillingPeriod };
};
