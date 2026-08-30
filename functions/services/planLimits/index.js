/**
 * @file index.js
 * @description Centralized, unified evaluation of plan limits, soft-caps, and model routing.
 */

const PLAN_LIMIT_DEFAULTS = {
  FREE: {
    roadmapsTotal: 1,
    aiQuestionsPerDay: 5,
    mentorMessagesPerDay: 5,
    onboardingMessagesTotal: 20,
    lessonMessagesPerLesson: 3,
    homeworkReviewsPerMonth: 2,
    softCapThreshold: 5
  },
  PRO: {
    roadmapsPerMonth: 2,
    mentorMessagesPerDay: 50,
    homeworkReviewsPerMonth: 30,
    lessonMessagesPerLesson: Infinity,
    softCapThreshold: 50
  },
  ULTRA: {
    roadmapsPerMonth: Infinity,
    dailyTokenLimit: 300000,
    homeworkReviewsPerMonth: Infinity,
    lessonMessagesPerLesson: Infinity,
    softCapThreshold: Infinity
  }
};

/**
 * Checks limits and returns model and allowance status.
 *
 * @param {object} params
 * @param {string} [params.plan] - 'FREE' | 'PRO' | 'ULTRA'
 * @param {string} [params.usageType] - 'mentor_message' | 'contextual_mentor_message' | 'homework_review' | 'roadmap' | 'ai_question'
 * @param {object} [params.usage] - Current user subscription usage counters
 * @param {number} [params.daysSinceReg] - Days since account registration
 * @param {number} [params.lessonMessagesUsed] - Usage count for the target lesson
 * @param {string} [params.userQuery] - User query string (for complexity model selection)
 * @returns {{ allowed: boolean, reason?: string, isProSoftCapped: boolean, model: string, updatedUsageCount: number }}
 */
function evaluatePlanLimits({
  plan = 'FREE',
  usageType = 'mentor_message',
  usage = {},
  daysSinceReg = 999,
  lessonMessagesUsed = 0,
  userQuery = ''
}) {
  const currentPlan = (plan || 'FREE').toUpperCase();
  let isProSoftCapped = false;
  let updatedUsageCount = 0;

  // 1. Non-metered / bypass types (Lesson generation for courses, moderation, internal chat)
  if (usageType === 'topic_moderation' || usageType === 'ai_chat' || usageType === 'lesson_generation' || !usageType) {
    return {
      allowed: true,
      isProSoftCapped: false,
      model: currentPlan === 'ULTRA' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
      updatedUsageCount: 0
    };
  }

  // 2. ULTRA Plan
  if (currentPlan === 'ULTRA') {
    const tokensUsed = usage.ultraTokensUsed || 0;
    if (tokensUsed >= PLAN_LIMIT_DEFAULTS.ULTRA.dailyTokenLimit) {
      return {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: tokensUsed
      };
    }
    const currentMentor = usage.mentorMessagesUsed || 0;
    const count = usageType === 'mentor_message' ? currentMentor + 1 : (usageType === 'contextual_mentor_message' ? lessonMessagesUsed + 1 : 0);
    return {
      allowed: true,
      isProSoftCapped: false,
      model: 'gemini-2.5-pro',
      updatedUsageCount: count
    };
  }

  // 3. PRO Plan
  if (currentPlan === 'PRO') {
    if (usageType === 'roadmap') {
      const roadmapsThisMonth = usage.roadmapsGeneratedThisMonth || 0;
      if (roadmapsThisMonth >= PLAN_LIMIT_DEFAULTS.PRO.roadmapsPerMonth) {
        return {
          allowed: false,
          reason: 'PRO_ROADMAP_LIMIT_EXCEEDED',
          isProSoftCapped: false,
          model: 'gemini-2.5-flash',
          updatedUsageCount: roadmapsThisMonth
        };
      }
      updatedUsageCount = roadmapsThisMonth;
    } else if (usageType === 'mentor_message') {
      const currentMentor = usage.mentorMessagesUsed || 0;
      isProSoftCapped = currentMentor >= PLAN_LIMIT_DEFAULTS.PRO.softCapThreshold;
      updatedUsageCount = currentMentor + 1;
    } else if (usageType === 'homework_review') {
      const reviewsUsed = usage.homeworkReviewsUsed || 0;
      if (reviewsUsed >= PLAN_LIMIT_DEFAULTS.PRO.homeworkReviewsPerMonth) {
        return {
          allowed: false,
          reason: 'PLAN_LIMIT_EXCEEDED',
          isProSoftCapped: false,
          model: 'gemini-2.5-flash',
          updatedUsageCount: reviewsUsed
        };
      }
      updatedUsageCount = reviewsUsed + 1;
    } else if (usageType === 'contextual_mentor_message') {
      updatedUsageCount = lessonMessagesUsed + 1;
    } else if (usageType === 'ai_question') {
      updatedUsageCount = (usage.aiQuestionsUsed || 0) + 1;
    }

    const isComplex = userQuery.length > 200 ||
      /(?:объясни|почему|ошибка|архитектур|алгоритм)/i.test(userQuery);

    const model = isProSoftCapped
      ? 'gemini-2.5-flash'
      : (isComplex ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

    return {
      allowed: true,
      isProSoftCapped,
      model,
      updatedUsageCount
    };
  }

  // 4. FREE Plan
  if (usageType === 'roadmap') {
    const roadmapsTotal = usage.roadmapsGenerated || 0;
    if (roadmapsTotal >= PLAN_LIMIT_DEFAULTS.FREE.roadmapsTotal) {
      return {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: roadmapsTotal
      };
    }
    updatedUsageCount = roadmapsTotal;
  } else if (usageType === 'ai_question') {
    const questionsUsed = usage.aiQuestionsUsed || 0;
    if (questionsUsed >= PLAN_LIMIT_DEFAULTS.FREE.aiQuestionsPerDay) {
      return {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: questionsUsed
      };
    }
    updatedUsageCount = questionsUsed + 1;
  } else if (usageType === 'mentor_message') {
    const currentMentor = usage.mentorMessagesUsed || 0;
    const isOverLimit = daysSinceReg <= 7
      ? currentMentor >= PLAN_LIMIT_DEFAULTS.FREE.onboardingMessagesTotal
      : currentMentor >= PLAN_LIMIT_DEFAULTS.FREE.mentorMessagesPerDay;

    if (isOverLimit) {
      return {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: currentMentor
      };
    }
    updatedUsageCount = currentMentor + 1;
  } else if (usageType === 'contextual_mentor_message') {
    if (lessonMessagesUsed >= PLAN_LIMIT_DEFAULTS.FREE.lessonMessagesPerLesson) {
      return {
        allowed: false,
        reason: 'LESSON_MENTOR_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: lessonMessagesUsed
      };
    }
    updatedUsageCount = lessonMessagesUsed + 1;
  } else if (usageType === 'homework_review') {
    const reviewsUsed = usage.homeworkReviewsUsed || 0;
    if (reviewsUsed >= PLAN_LIMIT_DEFAULTS.FREE.homeworkReviewsPerMonth) {
      return {
        allowed: false,
        reason: 'PLAN_LIMIT_EXCEEDED',
        isProSoftCapped: false,
        model: 'gemini-2.5-flash',
        updatedUsageCount: reviewsUsed
      };
    }
    updatedUsageCount = reviewsUsed + 1;
  }

  return {
    allowed: true,
    isProSoftCapped: false,
    model: 'gemini-2.5-flash',
    updatedUsageCount
  };
}

module.exports = {
  evaluatePlanLimits,
  PLAN_LIMIT_DEFAULTS
};
