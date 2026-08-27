import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase.js';
import { PLAN_LIMITS } from '../constants/planLimits.js';
import { onAuthStateChanged } from 'firebase/auth';

export const usePlanLimits = () => {
  const [plan, setPlan] = useState('FREE');
  const [daysSinceReg, setDaysSinceReg] = useState(999);
  const [isFreeOnboarding, setIsFreeOnboarding] = useState(false);
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
          groupLessonsUsed: 0,
          groupLessonsMonthStart: monthStr,
          lastMentorDate: todayStr,
          mentorMonthStart: monthStr
        };

        try {
          // 1. Primary path: Fetch authoritative server-calculated limits & creation age
          const getPlanLimitsFn = httpsCallable(functions, 'getUserPlanLimits');
          const res = await getPlanLimitsFn();
          if (res && res.data) {
            const data = res.data;
            setPlan(data.plan || 'FREE');
            setDbBillingPeriod(data.billingPeriod || 'monthly');
            setDaysSinceReg(typeof data.daysSinceReg === 'number' ? data.daysSinceReg : 999);
            setIsFreeOnboarding(data.isFreeOnboarding === true);
            if (data.usage) {
              setUsage(data.usage);
            }
            setLoading(false);
            return;
          }
        } catch (fnErr) {
          console.warn('[usePlanLimits] Cloud Function getUserPlanLimits failed, using Firestore fallback:', fnErr?.message || fnErr);
        }

        try {
          // 2. Fallback path: Direct Firestore read
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

            const regTime = new Date(user.metadata.creationTime || new Date()).getTime();
            const fallbackDays = Math.max(0, (Date.now() - regTime) / (1000 * 60 * 60 * 24));
            setDaysSinceReg(fallbackDays);
            setIsFreeOnboarding(fallbackDays <= 7);

            if (currentPlan === 'FREE') {
              if (fallbackDays > 7) {
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

            let newGroupLessonsUsed = data.groupLessonsUsed || 0;
            if (data.groupLessonsMonthStart !== monthStr) {
              newGroupLessonsUsed = 0;
            }

            let newRoadmapsGeneratedThisMonth = data.roadmapsGeneratedThisMonth || 0;
            if (data.roadmapsMonthStart !== monthStr) {
              newRoadmapsGeneratedThisMonth = 0;
            }

            setUsage({ 
              roadmapsGenerated: data.roadmapsGenerated || 0, 
              roadmapsGeneratedThisMonth: newRoadmapsGeneratedThisMonth,
              roadmapsMonthStart: monthStr,
              aiQuestionsUsed: newAiQuestionsUsed,
              lastQuestionDate: todayStr,
              mentorMessagesUsed: newMentorMessagesUsed,
              ultraTokensUsed: newUltraTokensUsed,
              homeworkReviewsUsed: newHomeworkReviewsUsed,
              homeworkMonthStart: monthStr,
              groupLessonsUsed: newGroupLessonsUsed,
              groupLessonsMonthStart: monthStr,
              lastMentorDate: data.lastMentorDate || todayStr,
              mentorMonthStart: data.mentorMonthStart || monthStr
            });
          } else {
            setPlan('FREE');
            setDbBillingPeriod('monthly');
            setUsage(initData);
          }
        } catch (error) {
          if (error.code !== 'permission-denied') {
            console.error("Failed to load plan limits fallback:", error);
          }
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
        const limitVal = isFreeOnboarding 
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
      if (plan === 'FREE' && usage.roadmapsGenerated >= PLAN_LIMITS.FREE.maxActiveRoadmaps) {
        setUpgradeModalOpen(true);
        return false;
      }
      if (plan === 'PRO' && (usage.roadmapsGeneratedThisMonth || 0) >= PLAN_LIMITS.PRO.aiRoadmapsPerMonth) {
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

    if (type === 'group_lesson') {
      const limitVal = PLAN_LIMITS[plan]?.groupLessonsPerMonth ?? 2;
      if (limitVal !== Infinity && (usage.groupLessonsUsed || 0) >= limitVal) {
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
      } else if (type === 'group_lesson') {
        newUsage.groupLessonsUsed = typeof updatedCount === 'number' ? updatedCount : (newUsage.groupLessonsUsed || 0) + 1;
        newUsage.groupLessonsMonthStart = monthStr;
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

  const groupLessonsLimit = PLAN_LIMITS[plan]?.groupLessonsPerMonth ?? 2;
  const groupLessonsUsed = usage.groupLessonsUsed || 0;
  const groupLessonsRemaining = Math.max(0, groupLessonsLimit - groupLessonsUsed);

  return { 
    plan, 
    usage, 
    daysSinceReg,
    isFreeOnboarding,
    checkLimit, 
    incrementUsage, 
    isUpgradeModalOpen, 
    setUpgradeModalOpen, 
    loading, 
    dbBillingPeriod,
    groupLessonsLimit,
    groupLessonsUsed,
    groupLessonsRemaining
  };
};
