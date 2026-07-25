import { db, auth } from '../firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * SM-2 Algorithm Implementation for Anki-style flashcards
 * quality: 0-5
 *   1 = Again (Blackout/Wrong)
 *   2 = Hard
 *   3 = Good
 *   4 = Easy
 */
export function calculateSM2(quality, lastInterval, lastEaseFactor) {
  let easeFactor = lastEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  
  let interval;
  if (quality < 3) {
    interval = 1; // Reset to 1 day if failed or hard
  } else if (lastInterval === 0) {
    interval = 1;
  } else if (lastInterval === 1) {
    interval = 6;
  } else {
    interval = Math.round(lastInterval * easeFactor);
  }
  
  return { interval, easeFactor };
}

export async function saveFlashcardProgress(term, quality) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  // Create a safe document ID from the term
  const cardId = encodeURIComponent(term).replace(/\./g, '_');
  const docRef = doc(db, 'users', userId, 'flashcards', cardId);
  
  const snap = await getDoc(docRef);

  let lastInterval = 0;
  let lastEaseFactor = 2.5;
  let repetitions = 0;

  if (snap.exists()) {
    const data = snap.data();
    lastInterval = data.interval || 0;
    lastEaseFactor = data.easeFactor || 2.5;
    repetitions = data.repetitions || 0;
  }

  const { interval, easeFactor } = calculateSM2(quality, lastInterval, lastEaseFactor);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await setDoc(docRef, {
    term,
    interval,
    easeFactor,
    repetitions: quality < 3 ? 0 : repetitions + 1,
    nextReview: nextReview.toISOString(),
    lastReviewed: new Date().toISOString()
  }, { merge: true });

  return { interval, nextReview };
}

export async function getFlashcardProgress(term) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const cardId = encodeURIComponent(term).replace(/\./g, '_');
  const docRef = doc(db, 'users', userId, 'flashcards', cardId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    return snap.data();
  }
  return null;
}
