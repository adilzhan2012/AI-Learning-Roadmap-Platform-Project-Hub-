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
    ultraTokensUsed: 0,
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
          let newUltraTokensUsed = data.ultraTokensUsed || 0;

          if (currentPlan === 'FREE') {
            const regTime = new Date(user.metadata.creationTime || new Date()).getTime();
            const nowTime = new Date().getTime();
            const daysSinceReg = (nowTime - regTime) / (1000 * 60 * 60 * 24);
            
            if (daysSinceReg > 7) {
              // Regular FREE plan (after onboarding): daily reset
              if (data.lastMentorDate !== todayStr) {
                newMentorMessagesUsed = 0;
              }
            } else {
              // Onboarding phase: cumulative (no daily reset)
            }
          } else {
            // PRO & ULTRA: daily reset
            if (data.lastMentorDate !== todayStr) {
              newMentorMessagesUsed = 0;
              newUltraTokensUsed = 0;
            }
          }

          setUsage({ 
            roadmapsGenerated: data.roadmapsGenerated || 0, 
            aiQuestionsUsed: newAiQuestionsUsed,
            lastQuestionDate: todayStr,
            mentorMessagesUsed: newMentorMessagesUsed,
            ultraTokensUsed: newUltraTokensUsed,
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
            ultraTokensUsed: 0,
            lastMentorDate: todayStr,
            mentorMonthStart: monthStr
          };
          // Document doesn't exist yet, which means user is on FREE plan by default.
          // DO NOT write to Firestore here because security rules block client writes to /subscription.
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
      if (plan === 'FREE') {
        const regTime = new Date(auth.currentUser?.metadata?.creationTime || new Date()).getTime();
        const nowTime = new Date().getTime();
        const daysSinceReg = (nowTime - regTime) / (1000 * 60 * 60 * 24);
        
        const limitVal = daysSinceReg <= 7 
          ? PLAN_LIMITS.FREE.onboardingMessagesTotal 
          : PLAN_LIMITS.FREE.aiMentorPerDay;
          
        if (usage.mentorMessagesUsed >= limitVal) {
          setUpgradeModalOpen(true);
          return false;
        }
        return true;
      }
      
      if (plan === 'PRO') {
        // Soft limit: always allowed to pass so user isn't abruptly blocked, we degrade model in chat
        return true;
      }
      
      if (plan === 'ULTRA') {
        if (usage.ultraTokensUsed >= PLAN_LIMITS.ULTRA.aiMentorTokensPerDay) {
          setUpgradeModalOpen(true);
          return false;
        }
        return true;
      }
    }

    if (type === 'roadmap') {
      const limitVal = plan === 'ULTRA' 
        ? PLAN_LIMITS.ULTRA.maxActiveRoadmaps 
        : (plan === 'PRO' ? PLAN_LIMITS.PRO.maxActiveRoadmaps : PLAN_LIMITS.FREE.maxActiveRoadmaps);
      if (usage.roadmapsGenerated >= limitVal) {
        setUpgradeModalOpen(true);
        return false;
      }
      return true;
    }

    if (type === 'ai_question') {
      const limitVal = plan === 'ULTRA' 
        ? PLAN_LIMITS.ULTRA.aiQuestionsPerDay 
        : (plan === 'PRO' ? PLAN_LIMITS.PRO.aiQuestionsPerDay : PLAN_LIMITS.FREE.aiQuestionsPerDay);
      if (usage.aiQuestionsUsed >= limitVal) {
        setUpgradeModalOpen(true);
        return false;
      }
      return true;
    }

    return true;
  }, [plan, usage]);

  const incrementUsage = useCallback(async (type, tokenCount = 0) => {
    if (!auth.currentUser) return;
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
        if (plan === 'ULTRA' && tokenCount > 0) {
          newUsage.ultraTokensUsed = (newUsage.ultraTokensUsed || 0) + tokenCount;
        }
      }
      return newUsage;
    });
  }, [plan]);

  return { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen, loading, dbBillingPeriod };
};
