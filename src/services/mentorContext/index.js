/**
 * @file index.js
 * @description Public entry point for mentorContext service.
 * Orchestrates unified context assembly for all mentor modes without inline storage logic.
 */

import { fetchUserSubscription } from './sources/subscription.js';
import { fetchGlobalHistory } from './sources/globalHistory.js';
import { fetchLessonHistory } from './sources/lessonHistory.js';
import { fetchHomeworkHistory } from './sources/homeworkHistory.js';
import { normalizeMessage } from './normalizeMessage.js';

export { normalizeMessage };

/**
 * Resolves the Firestore DB instance safely (lazy import for browser / bundlers).
 * @param {any} [customDb] - Injected Firestore instance
 * @returns {Promise<any>}
 */
async function resolveDb(customDb) {
  if (customDb) return customDb;
  try {
    const fb = await import('../../firebase.js');
    return fb.db;
  } catch {
    return null;
  }
}

/**
 * buildMentorContext
 *
 * Consolidates context assembly for all 3 mentor modes:
 * - 'global': floating widget & /mentor page. Persists PRO/ULTRA sessions in Firestore `users/{userId}/mentorSessions/{sessionId}`
 *   with standardized schema fields (`mode: 'global'`, `contextId: null`), and FREE sessions in localStorage (48h TTL).
 * - 'lesson': contextual panel. Deliberately preserved as in-memory history per lesson session (3000-char lessonContent, lessonUsage counter in Firestore).
 * - 'homework': Socratic homework mentor (ULTRA-exclusive). Deliberately preserved as `chatHistory` inside `users/{userId}/homeworkSubmissions/{courseId}_{nodeId}` to maintain direct association with homework rubrics and grading attempts.
 *
 * Supports both signature styles:
 * buildMentorContext(userId, mode, contextId, options)
 * buildMentorContext({ userId, mode, contextId, ...options })
 *
 * @param {string|object} userIdOrParams - User UID or options object
 * @param {import('./types.js').MentorMode} [modeParam] - 'global' | 'lesson' | 'homework'
 * @param {string|null} [contextIdParam] - nodeId for lesson, courseId_nodeId for homework, sessionId for global
 * @param {import('./types.js').BuildMentorContextOptions} [optionsParam] - Additional options
 * @returns {Promise<import('./types.js').MentorContext>} Unified mentor context object
 */
export async function buildMentorContext(userIdOrParams, modeParam, contextIdParam, optionsParam = {}) {
  let userId;
  let mode;
  let contextId;
  let options;

  if (typeof userIdOrParams === 'object' && userIdOrParams !== null) {
    userId = userIdOrParams.userId;
    mode = userIdOrParams.mode;
    contextId = userIdOrParams.contextId ?? null;
    options = { ...userIdOrParams, ...optionsParam };
  } else {
    userId = userIdOrParams;
    mode = modeParam;
    contextId = contextIdParam ?? null;
    options = optionsParam || {};
  }

  if (!userId) {
    throw new Error('[mentorContext] userId is required');
  }

  const validModes = ['global', 'lesson', 'homework'];
  if (!validModes.includes(mode)) {
    throw new Error(`[mentorContext] Invalid mode: "${mode}". Expected one of: ${validModes.join(', ')}`);
  }

  // Resolve DB instance (injected or default Firebase)
  const db = await resolveDb(options.dbInstance);
  const contextOptions = { ...options, dbInstance: db };

  // 1. Fetch Subscription & Usage
  const { plan, usage } = await fetchUserSubscription(userId, contextOptions);
  contextOptions.plan = plan;
  contextOptions.usage = usage;

  let recentHistory = [];
  let lessonContent = null;
  let homeworkTask = null;

  // 2. Delegate to mode-specific source fetcher
  if (mode === 'global') {
    recentHistory = await fetchGlobalHistory(userId, contextId, contextOptions);
  } else if (mode === 'lesson') {
    const lessonRes = await fetchLessonHistory(userId, contextId, contextOptions);
    recentHistory = lessonRes.history;
    lessonContent = lessonRes.lessonContent;
    usage.lessonMessagesUsed = lessonRes.lessonMessagesUsed;
  } else if (mode === 'homework') {
    const homeworkRes = await fetchHomeworkHistory(userId, contextId, contextOptions);
    recentHistory = homeworkRes.history;
    homeworkTask = homeworkRes.homeworkTask;
  }

  return {
    userId,
    mode,
    contextId,
    plan,
    usage,
    recentHistory,
    lessonContent,
    homeworkTask,
    userProfile: options.userProfile || null,
    courseLanguage: options.courseLanguage || 'ru',
    lessonTitle: options.lessonTitle || null
  };
}

export default buildMentorContext;
