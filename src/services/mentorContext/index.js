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
 * - 'global': floating widget (Free local / Pro/Ultra Firestore mentorSessions)
 * - 'lesson': contextual panel (in-memory history, 3000-char lessonContent, lessonUsage counter)
 * - 'homework': Socratic homework mentor (chatHistory in homeworkSubmissions)
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
    plan,
    usage,
    recentHistory,
    lessonContent,
    homeworkTask
  };
}

export default buildMentorContext;
