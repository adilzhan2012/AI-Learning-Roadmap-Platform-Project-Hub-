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
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStr = todayStr.substring(0, 7); // YYYY-MM
        const initData = { 
          plan: 'FREE', 
          roadmapsGenerated: 0, 
          aiQuestionsUsed: 0, 
          lastQuestionDate: todayStr,
          mentorMessagesUsed: 0,
          ultraTokensUsed: 0,
          homeworkReviewsUsed: 0,
          homeworkMonthStart: monthStr,
          lastMentorDate: todayStr,
          mentorMonthStart: monthStr
        };

        try {
          const ref = doc(db, 'users', user.uid, 'subscription', 'details');
          const snap = await getDoc(ref);
          
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
                if (data.lastMentorDate !== todayStr) {
                  newMentorMessagesUsed = 0;
                }
              }
            } else {
              if (data.lastMentorDate !== todayStr) {
                newMentorMessagesUsed = 0;
                newUltraTokensUsed = 0;
              }
            }

            // Monthly reset for homework reviews
            let newHomeworkReviewsUsed = data.homeworkReviewsUsed || 0;
            if (data.homeworkMonthStart !== monthStr) {
              newHomeworkReviewsUsed = 0;
            }

          setUsage({ 
            roadmapsGenerated: data.roadmapsGenerated || 0, 
            aiQuestionsUsed: newAiQuestionsUsed,
            lastQuestionDate: todayStr,
            mentorMessagesUsed: newMentorMessagesUsed,
            ultraTokensUsed: newUltraTokensUsed,
            homeworkReviewsUsed: newHomeworkReviewsUsed,
            homeworkMonthStart: monthStr,
            lastMentorDate: data.lastMentorDate || todayStr,
            mentorMonthStart: data.mentorMonthStart || monthStr
          });
        } else {
          // Document doesn't exist yet, which means user is on FREE plan by default.
          // DO NOT write to Firestore here because security rules block client writes to /subscription.
          setPlan('FREE');
          setDbBillingPeriod('monthly');
          setUsage(initData);
        }
      } catch (error) {
        console.error("Failed to load plan limits:", error);
        // Fallback to FREE plan logic so app doesn't break
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

    if (type === 'homework_review') {
      const limitVal = PLAN_LIMITS[plan]?.homeworkReviewsPerMonth ?? 2;
      if (limitVal !== Infinity && usage.homeworkReviewsUsed >= limitVal) {
        setUpgradeModalOpen(true);
        return false;
      }
      return true;
    }

    return true;
  }, [plan, usage]);

  const incrementUsage = useCallback((type, updatedCount = null) => {
    if (!auth.currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);
    
    setUsage(prev => {
      const newUsage = { ...prev };
      if (type === 'roadmap') {
        newUsage.roadmapsGenerated = typeof updatedCount === 'number' ? updatedCount : (newUsage.roadmapsGenerated || 0) + 1;
      } else if (type === 'ai_question') {
        newUsage.aiQuestionsUsed = typeof updatedCount === 'number' ? updatedCount : (newUsage.aiQuestionsUsed || 0) + 1;
        newUsage.lastQuestionDate = todayStr;
      } else if (type === 'homework_review') {
        newUsage.homeworkReviewsUsed = typeof updatedCount === 'number' ? updatedCount : (newUsage.homeworkReviewsUsed || 0) + 1;
        newUsage.homeworkMonthStart = monthStr;
      } else if (type === 'mentor_message') {
        newUsage.mentorMessagesUsed = typeof updatedCount === 'number' ? updatedCount : (newUsage.mentorMessagesUsed || 0) + 1;
        newUsage.lastMentorDate = todayStr;
        newUsage.mentorMonthStart = monthStr;
        if (plan === 'ULTRA' && typeof updatedCount === 'number') {
          newUsage.ultraTokensUsed = updatedCount;
        }
      }
      return newUsage;
    });
  }, [plan]);

  useEffect(() => {
    const handleUsageUpdated = (event) => {
      const { usageType, updatedUsageCount } = event.detail || {};
      if (usageType && typeof updatedUsageCount === 'number') {
        incrementUsage(usageType, updatedUsageCount);
      }
    };

    window.addEventListener('planUsage:updated', handleUsageUpdated);
    return () => window.removeEventListener('planUsage:updated', handleUsageUpdated);
  }, [incrementUsage]);

  return { plan, usage, checkLimit, incrementUsage, isUpgradeModalOpen, setUpgradeModalOpen, loading, dbBillingPeriod };
};
