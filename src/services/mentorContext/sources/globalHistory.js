/**
 * @file globalHistory.js
 * @description Reads global mentor history from localStorage (FREE) or Firestore mentorSessions (PRO/ULTRA).
 */

import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { normalizeMessage } from '../normalizeMessage.js';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Reads local storage history for FREE global mentor sessions.
 * Safely handles SSR/Node environments and 48-hour expiration.
 *
 * @returns {import('../types.js').NormalizedMessage[]}
 */
export function getFreeLocalStorageHistory() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const savedMessages = localStorage.getItem('free_mentor_messages');
    const savedTimestamp = parseInt(localStorage.getItem('free_mentor_timestamp') || '0', 10);
    if (savedMessages && (Date.now() - savedTimestamp < FORTY_EIGHT_HOURS_MS)) {
      const parsed = JSON.parse(savedMessages);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeMessage).filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('[globalHistory] Error reading free_mentor_messages from localStorage:', err);
  }
  return [];
}

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
    console.warn('[globalHistory] Failed to fetch document at', pathSegments.join('/'), err);
    return null;
  }
}

/**
 * Helper to fetch latest session messages.
 */
async function getLatestSessionMessages(db, userId) {
  if (!db) return [];
  if (typeof db.getLatestSessionMessages === 'function') {
    return await db.getLatestSessionMessages(userId);
  }
  try {
    const sessionsCol = collection(db, 'users', userId, 'mentorSessions');
    const q = query(sessionsCol, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap && !snap.empty) {
      const sessionData = snap.docs[0].data();
      return sessionData?.messages || [];
    }
  } catch (err) {
    console.warn('[globalHistory] Failed to load latest mentorSession:', err);
  }
  return [];
}

/**
 * Saves a global mentor session to Firestore with formal unified fields.
 *
 * @param {any} db - Firestore DB instance
 * @param {string} userId - User UID
 * @param {string} sessionId - Session document ID
 * @param {object} sessionPayload - Session data (messages, title, etc.)
 */
export async function saveGlobalSession(db, userId, sessionId, sessionPayload = {}) {
  if (!db || !userId || !sessionId) return;
  const docRef = doc(db, 'users', userId, 'mentorSessions', sessionId);
  const dataToSave = {
    ...sessionPayload,
    mode: sessionPayload.mode || 'global',
    contextId: sessionPayload.contextId ?? null
  };
  await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Fetches recent conversation history for the GLOBAL mentor mode.
 *
 * @param {string} userId - Target user ID
 * @param {string|null} [sessionId] - Optional mentor session ID
 * @param {import('../types.js').BuildMentorContextOptions & { plan?: import('../types.js').MentorPlan }} [options] - Options & dbInstance
 * @returns {Promise<import('../types.js').NormalizedMessage[]>}
 */
export async function fetchGlobalHistory(userId, sessionId = null, options = {}) {
  // 1. History override takes top priority (universal client/server contract)
  if (options.historyOverride && Array.isArray(options.historyOverride)) {
    return options.historyOverride.map(normalizeMessage).filter(Boolean);
  }

  const plan = options.plan || 'FREE';

  // 2. FREE tier: read from localStorage (48h TTL)
  if (plan === 'FREE') {
    return getFreeLocalStorageHistory();
  }

  // 3. PRO / ULTRA tiers: read from Firestore mentorSessions
  const db = options.dbInstance;
  if (db) {
    if (sessionId) {
      const sessionData = await getDocData(db, 'users', userId, 'mentorSessions', sessionId);
      if (sessionData && Array.isArray(sessionData.messages)) {
        return sessionData.messages.map(normalizeMessage).filter(Boolean);
      }
    } else {
      const msgs = await getLatestSessionMessages(db, userId);
      if (Array.isArray(msgs)) {
        return msgs.map(normalizeMessage).filter(Boolean);
      }
    }
  }

  return [];
}
