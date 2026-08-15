/**
 * @file homeworkHistory.js
 * @description Reads homework Socratic mentor chat history and task assignment details from Firestore.
 */

import { doc, getDoc } from 'firebase/firestore';
import { normalizeMessage } from '../normalizeMessage.js';

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
    console.warn('[homeworkHistory] Failed to fetch document at', pathSegments.join('/'), err);
    return null;
  }
}

/**
 * Fetches conversation history and assignment details for the HOMEWORK mentor mode.
 *
 * @param {string} userId - Target user ID
 * @param {string|null} [hwDocId] - Homework document ID (format: courseId_nodeId)
 * @param {import('../types.js').BuildMentorContextOptions} [options] - Options & dbInstance
 * @returns {Promise<{ history: import('../types.js').NormalizedMessage[], homeworkTask: import('../types.js').HomeworkTask | null }>}
 */
export async function fetchHomeworkHistory(userId, hwDocId = null, options = {}) {
  const courseId = options.courseId;
  const nodeId = options.nodeId;
  let targetDocId = hwDocId;

  if (!targetDocId && courseId && nodeId) {
    targetDocId = `${courseId}_${nodeId}`;
  }

  let history = [];
  let homeworkTask = options.homeworkTask || null;

  // 1. History override takes precedence
  if (options.historyOverride && Array.isArray(options.historyOverride)) {
    history = options.historyOverride.map(normalizeMessage).filter(Boolean);
  }

  // 2. Fetch from Firestore homeworkSubmissions if needed
  const db = options.dbInstance;
  if (targetDocId && db && (history.length === 0 || !homeworkTask)) {
    const hwData = await getDocData(db, 'users', userId, 'homeworkSubmissions', targetDocId);
    if (hwData) {
      if (history.length === 0 && Array.isArray(hwData.chatHistory)) {
        history = hwData.chatHistory.map(normalizeMessage).filter(Boolean);
      }

      if (!homeworkTask && (hwData.prompt || hwData.rubric)) {
        homeworkTask = {
          prompt: hwData.prompt || '',
          rubric: Array.isArray(hwData.rubric) ? hwData.rubric : []
        };
      }
    }
  }

  return {
    history,
    homeworkTask
  };
}
