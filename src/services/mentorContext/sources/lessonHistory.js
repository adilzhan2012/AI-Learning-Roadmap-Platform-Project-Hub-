/**
 * @file lessonHistory.js
 * @description Handles lesson-specific mentor context: in-memory history, 3000-char content truncation,
 * and lessonUsage counter from Firestore.
 */

import { doc, getDoc } from 'firebase/firestore';
import { normalizeMessage } from '../normalizeMessage.js';

const MAX_LESSON_CONTENT_LENGTH = 3000;

/**
 * Helper to safely fetch document data from real Firestore or injected test mock.
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
    console.warn('[lessonHistory] Failed to fetch document at', pathSegments.join('/'), err);
    return null;
  }
}

/**
 * Fetches history and context for the LESSON mentor mode.
 *
 * NOTE: ContextualMentor does not persist messages to Firestore or localStorage.
 * It strictly relies on in-memory history passed via `options.historyOverride`.
 *
 * @param {string} userId - Target user ID
 * @param {string|null} nodeId - Lesson node ID
 * @param {import('../types.js').BuildMentorContextOptions} [options] - Options & dbInstance
 * @returns {Promise<{ history: import('../types.js').NormalizedMessage[], lessonContent: string | null, lessonMessagesUsed: number }>}
 */
export async function fetchLessonHistory(userId, nodeId = null, options = {}) {
  const lessonId = nodeId || options.nodeId;
  let lessonMessagesUsed = typeof options.usage?.lessonMessagesUsed === 'number'
    ? options.usage.lessonMessagesUsed
    : 0;

  // 1. Fetch lesson usage counter from Firestore if available
  const db = options.dbInstance;
  if (lessonId && db && typeof options.usage?.lessonMessagesUsed !== 'number') {
    const lessonData = await getDocData(db, 'users', userId, 'lessonUsage', String(lessonId));
    if (lessonData && typeof lessonData.messagesUsed === 'number') {
      lessonMessagesUsed = lessonData.messagesUsed;
    }
  }

  // 2. In-memory conversation history
  let history = [];
  if (options.historyOverride && Array.isArray(options.historyOverride)) {
    history = options.historyOverride.map(normalizeMessage).filter(Boolean);
  }

  // 3. Truncate lesson content to 3000 chars as in ContextualMentor.jsx
  let lessonContent = null;
  if (typeof options.lessonContent === 'string') {
    lessonContent = options.lessonContent.substring(0, MAX_LESSON_CONTENT_LENGTH);
  }

  return {
    history,
    lessonContent,
    lessonMessagesUsed
  };
}
