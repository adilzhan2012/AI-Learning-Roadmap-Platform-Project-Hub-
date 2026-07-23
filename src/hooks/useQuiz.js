import { useState, useCallback } from 'react';
import { callGroqWithRetry } from '../services/courseService.js';
import { getLocale } from '../i18n.js';
import { db, auth } from '../firebase.js';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';

export const useQuiz = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = useCallback(async (roadmapId, nodeId, lessonContent) => {
    setGenerating(true);
    setError('');
    
    try {
      const userId = auth.currentUser?.uid;
      let cachedQuestions = null;

      if (userId && nodeId) {
        try {
          const quizRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
          const quizSnap = await getDoc(quizRef);
          if (quizSnap.exists()) {
            const data = quizSnap.data();
            if (data.questions && data.questions.length > 0) {
              cachedQuestions = data.questions;
            }
          }
        } catch (readErr) {
          console.warn("Failed to check Firestore cache for quiz (ignoring and proceeding to generate):", readErr);
        }
      }

      if (cachedQuestions) {
        setGenerating(false);
        return cachedQuestions;
      }

      const apiKey = null;
      
      const currentLocale = getLocale();
      let languageName = 'English';
      if (currentLocale === 'ru') languageName = 'Russian';
      if (currentLocale === 'kk') languageName = 'Kazakh';
      if (currentLocale === 'zh') languageName = 'Chinese (Simplified)';

      const quizPrompt = `
You are a strict examiner. Based on the lesson material below, create 5 questions to test REAL understanding of the topic.
CRITICAL INSTRUCTION: You MUST generate the ENTIRE response in the ${languageName} language.

Material:
${lessonContent.substring(0, 3000)}

REQUIREMENTS FOR QUESTIONS (mandatory):
1. At least 2 questions must be APPLICATION of knowledge (not "what is X", but "what happens if / why / how to correctly do").
2. At least 1 question must be ERROR RECOGNITION (show wrong code/approach, ask what is wrong).
3. All incorrect options must be plausible - not obvious.
4. Questions must cover different parts of the material, no repetitions.

IMPORTANT: Return ONLY a valid JSON object without markdown tags or explanations.

{
  "questions": [
    {
      "id": 1,
      "type": "apply",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation of why this answer is correct and others are wrong"
    }
  ],
  "passingScore": 60
}
`;

      const textResponse = await callGroqWithRetry(apiKey, quizPrompt, 'ai_question');
      if (!textResponse) throw new Error('Empty response');

      let cleanText = textResponse.trim();
      // Strip markdown code blocks if the AI ignored the instruction
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      
      // Try to find JSON object bounds if there's trailing/leading text
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      let parsed = JSON.parse(cleanText);
      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('Invalid quiz format');
      }

      if (userId && nodeId) {
        try {
          const quizRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
          await setDoc(quizRef, {
            userId,
            roadmapId,
            nodeId: String(nodeId),
            questions: parsed.questions,
            lastGeneratedAt: serverTimestamp()
          }, { merge: true });
        } catch (writeErr) {
          console.warn("Failed to cache generated quiz in Firestore (proceeding anyway):", writeErr);
        }
      }

      return parsed.questions;

    } catch (err) {
      console.error('Quiz generation failed:', err);
      setError(err.message || 'Failed to generate quiz');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const saveQuizResult = useCallback(async (roadmapId, nodeId, scorePercent, passed) => {
    if (!auth.currentUser) return;
    try {
      const userId = auth.currentUser.uid;
      const docRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
      
      // Get existing attempts to accumulate history
      const snap = await getDoc(docRef);
      let attempts = [];
      if (snap.exists()) {
        attempts = snap.data().attempts || [];
      }

      // Add new attempt
      attempts.push({
        score: scorePercent,
        date: new Date().toISOString()
      });

      const COOLDOWN_MINUTES = 10;
      const dataToSave = {
        userId,
        roadmapId,
        nodeId: String(nodeId),
        score: scorePercent,
        attempts, // Array of [{score, date}]
        attemptsCount: attempts.length,
        lastAttemptAt: serverTimestamp(),
        passed
      };

      if (!passed) {
        dataToSave.cooldownUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000);
      } else {
        dataToSave.cooldownUntil = null;
      }

      await setDoc(docRef, dataToSave, { merge: true });
    } catch (e) {
      console.error('Failed to save quiz result:', e);
    }
  }, []);

  const checkCooldown = useCallback(async (nodeId) => {
    if (!auth.currentUser) return { allowed: true };
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'quizResults', String(nodeId));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.cooldownUntil && data.cooldownUntil.toDate() > new Date()) {
          return { allowed: false, cooldownUntil: data.cooldownUntil.toDate() };
        }
      }
      return { allowed: true };
    } catch (e) {
      console.error('Failed to check cooldown:', e);
      return { allowed: true };
    }
  }, []);

  return { generateQuiz, saveQuizResult, checkCooldown, generating, error, setError };
};
