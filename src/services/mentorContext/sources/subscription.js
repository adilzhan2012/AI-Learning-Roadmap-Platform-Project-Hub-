/**
 * @file subscription.js
 * @description Fetches and normalizes subscription details and usage counters from Firestore.
 */

import { doc, getDoc } from 'firebase/firestore';

/**
 * Helper to safely fetch document data from real Firestore or injected test mock.
 * @param {any} db - Firestore DB instance
 * @param {string[]} pathSegments - Path components
 * @returns {Promise<any>} Document data or null
 */
async function getDocData(db, ...pathSegments) {
  if (!db) return null;
  if (typeof db.getDocData === 'function') {
    return await db.getDocData(pathSegments.join('/'));
  }
  try {
    const docRef = doc(db, ...pathSegments);
    const snap = await getDoc(docRef);
    return snap && snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('[subscription] Failed to fetch document at', pathSegments.join('/'), err);
    return null;
  }
}

/**
 * Fetches user subscription plan and usage metrics.
 * Normalizes daily and monthly reset counters based on current UTC date to avoid
 * stale yesterday usage showing as limit exceeded before first daily request.
 *
 * @param {string} userId - Target user ID
 * @param {import('../types.js').BuildMentorContextOptions} [options] - Options & dbInstance
 * @returns {Promise<{ plan: import('../types.js').MentorPlan, usage: import('../types.js').MentorUsage }>}
 */
export async function fetchUserSubscription(userId, options = {}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStr = todayStr.substring(0, 7);

  // Default empty state for Free plan
  let plan = options.plan || 'FREE';
  let usage = {
    mentorMessagesUsed: 0,
    ultraTokensUsed: 0,
    homeworkReviewsUsed: 0,
    roadmapsGenerated: 0,
    roadmapsGeneratedThisMonth: 0,
    aiQuestionsUsed: 0,
    lastMentorDate: todayStr,
    mentorMonthStart: monthStr,
    lastQuestionDate: todayStr,
    homeworkMonthStart: monthStr,
    ...(options.usage || {})
  };

  const db = options.dbInstance;
  if (db && !options.plan) {
    const subData = await getDocData(db, 'users', userId, 'subscription', 'details');
    if (subData) {
      plan = subData.plan || 'FREE';

      // Normalize daily counters: if date is explicitly set and older than today, active daily count is 0
      const isMentorToday = !subData.lastMentorDate || subData.lastMentorDate === todayStr;
      const isQuestionToday = !subData.lastQuestionDate || subData.lastQuestionDate === todayStr;
      const isHomeworkThisMonth = !subData.homeworkMonthStart || subData.homeworkMonthStart === monthStr;
      const isRoadmapThisMonth = !subData.roadmapsMonthStart || subData.roadmapsMonthStart === monthStr;

      usage = {
        ...usage,
        mentorMessagesUsed: isMentorToday ? (subData.mentorMessagesUsed || 0) : 0,
        ultraTokensUsed: isMentorToday ? (subData.ultraTokensUsed || 0) : 0,
        aiQuestionsUsed: isQuestionToday ? (subData.aiQuestionsUsed || 0) : 0,
        homeworkReviewsUsed: isHomeworkThisMonth ? (subData.homeworkReviewsUsed || 0) : 0,
        roadmapsGenerated: subData.roadmapsGenerated || 0,
        roadmapsGeneratedThisMonth: isRoadmapThisMonth ? (subData.roadmapsGeneratedThisMonth || 0) : 0,
        lastMentorDate: subData.lastMentorDate || todayStr,
        mentorMonthStart: subData.mentorMonthStart || monthStr,
        lastQuestionDate: subData.lastQuestionDate || todayStr,
        homeworkMonthStart: subData.homeworkMonthStart || monthStr,
        ...options.usage // allow explicit test overrides
      };
    }
  }

  // Calculate Free onboarding status if creation time provided
  if (plan === 'FREE' && options.userCreationTime) {
    const regTime = new Date(options.userCreationTime).getTime();
    const daysSinceReg = (Date.now() - regTime) / (1000 * 60 * 60 * 24);
    usage.isFreeOnboarding = daysSinceReg <= 7;
  }

  return { plan, usage };
}
