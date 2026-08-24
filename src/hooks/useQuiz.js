import { useState, useCallback } from 'react';
import { callGeminiWithRetry, withTimeout } from '../services/courseService.js';
import { t, getLocale } from '../i18n.js';
import { db, auth } from '../firebase.js';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { parseAIJson, AIParsingError } from '../utils/aiResponseParser.js';

export const useQuiz = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = useCallback(async (roadmapId, nodeId, lessonContent, failedConcepts = [], forceFresh = false, explicitCourseLanguage = null) => {
    setGenerating(true);
    setError('');
    
    try {
      const userId = auth.currentUser?.uid;
      let cachedQuestions = null;

      const normalizeQ = (q, idx) => {
        const qText = q.question || q.questionText || q.prompt || q.title || `Вопрос ${idx + 1}`;
        const cIdx = typeof q.correctIndex === 'number' 
          ? q.correctIndex 
          : (typeof q.correctAnswer === 'number' 
              ? q.correctAnswer 
              : 0);
        return {
          ...q,
          id: q.id || idx + 1,
          question: qText,
          questionText: qText,
          correctIndex: cIdx,
          correctAnswer: cIdx,
          options: Array.isArray(q.options) ? q.options : [],
          explanation: q.explanation || '',
          sectionHeading: q.sectionHeading || ''
        };
      };

      // Only check cache if forceFresh is false and no failed concepts are passed
      if (userId && nodeId && !forceFresh && (!failedConcepts || failedConcepts.length === 0)) {
        try {
          const quizRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
          const quizSnap = await getDoc(quizRef);
          if (quizSnap.exists() && quizSnap.data().questions && quizSnap.data().questions.length > 0) {
            cachedQuestions = quizSnap.data().questions.map(normalizeQ);
          }
        } catch (cacheErr) {
          console.warn("Quiz cache read warning:", cacheErr);
        }
      }

      if (cachedQuestions) {
        setGenerating(false);
        return cachedQuestions;
      }

      let courseLanguage = explicitCourseLanguage;
      if (!courseLanguage && roadmapId) {
        try {
          const cSnap = await getDoc(doc(db, 'courses', roadmapId));
          if (cSnap.exists()) {
            courseLanguage = cSnap.data().language || 'ru';
          }
        } catch (e) {
          // fallback
        }
      }
      if (!courseLanguage) courseLanguage = 'ru';

      const apiKey = null; // Cloud Functions proxy mode
      const languageName = courseLanguage === 'en' ? 'English' : 'Russian';

      let adaptivityPromptPart = "";
      if (failedConcepts && failedConcepts.length > 0) {
        adaptivityPromptPart = `
CRITICAL ADAPTIVE INSTRUCTION: The student previously failed questions on these specific topics/headings: ${JSON.stringify(failedConcepts)}.
You MUST include at least 2 questions specifically targeting these failed concepts with clearer, simpler explanations and hints.
`;
      }

      const quizPrompt = `You are an expert tutor creating a quiz to verify student understanding.
Analyze the following lesson content and create a 5-question multiple-choice quiz.
CRITICAL INSTRUCTION: Respond ENTIRELY in ${languageName} language.
${adaptivityPromptPart}
Lesson Content:
${(lessonContent || '').substring(0, 4000)}

Requirements:
1. Generate EXACTLY 5 questions based directly on the material provided.
2. Each question MUST have exactly 4 options.
3. "correctIndex": Index of the correct option (0, 1, 2, or 3).
4. "explanation": Brief explanation of why that answer is correct.
5. "sectionHeading": The nearest section heading/topic in the lesson.

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear question text?",
      "questionText": "Clear question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": 0,
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct and others are wrong",
      "sectionHeading": "Nearest H2/H3 Heading Text in Material"
    }
  ],
  "passingScore": 60
}
`;

      const textResponse = await withTimeout(
        callGeminiWithRetry(apiKey, quizPrompt, 'ai_question'),
        120000,
        courseLanguage === 'en'
          ? 'Timeout generating quiz (120s). Please try again.'
          : 'Превышено время ожидания генерации теста (120 сек). Пожалуйста, попробуйте еще раз.'
      );
      if (!textResponse) throw new Error('Empty response');

      let parsed = parseAIJson(textResponse);
      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('Invalid quiz format');
      }

      const normalizedQuestions = parsed.questions.map(normalizeQ);

      if (userId && nodeId) {
        try {
          const quizRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
          await setDoc(quizRef, {
            userId,
            roadmapId,
            nodeId: String(nodeId),
            questions: normalizedQuestions,
            lastGeneratedAt: serverTimestamp()
          }, { merge: true });
        } catch (writeErr) {
          console.warn("Failed to cache generated quiz in Firestore:", writeErr);
        }
      }

      return normalizedQuestions;

    } catch (err) {
      console.error('Quiz generation failed:', err);
      if (err instanceof AIParsingError || err?.name === 'AIParsingError') {
        setError(t('quiz.errorParse') || 'Failed to parse quiz response. Click "Try Again".');
      } else {
        setError(err.message || t('quiz.errorGenerate') || 'Failed to generate quiz. Click "Try Again".');
      }
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const saveQuizResult = useCallback(async (roadmapId, nodeId, score, total, passed, failedDetails = []) => {
    if (!auth.currentUser) return;
    try {
      const userId = auth.currentUser.uid;
      const docRef = doc(db, 'users', userId, 'quizResults', String(nodeId));
      
      const snap = await getDoc(docRef);
      let attempts = [];
      let consecutiveFails = 0;
      let failedConceptsSummary = {};

      if (snap.exists()) {
        const data = snap.data();
        attempts = data.attempts || [];
        consecutiveFails = data.consecutiveFails || 0;
        failedConceptsSummary = data.failedConceptsSummary || {};
      }

      if (passed) {
        consecutiveFails = 0;
      } else {
        consecutiveFails += 1;
        failedDetails.forEach(detail => {
          const conceptKey = detail.sectionHeading || detail.questionText.substring(0, 40);
          failedConceptsSummary[conceptKey] = (failedConceptsSummary[conceptKey] || 0) + 1;
        });
      }

      const scorePercentage = total > 0 ? Math.round((score / total) * 100) : 100;
      const nowIso = new Date().toISOString();

      attempts.push({
        score: scorePercentage,
        rawScore: score,
        total,
        passed,
        failedConcepts: failedDetails.map(d => d.sectionHeading || d.questionText),
        date: nowIso,
        timestamp: nowIso
      });

      const dataToSave = {
        userId,
        roadmapId,
        nodeId: String(nodeId),
        score: scorePercentage,
        rawScore: score,
        total,
        attempts,
        attemptsCount: attempts.length,
        consecutiveFails,
        failedConceptsSummary,
        lastAttemptAt: serverTimestamp(),
        passed
      };

      await setDoc(docRef, dataToSave, { merge: true });

      // Signal graph rebuild if user is stuck (e.g. 4+ consecutive failures)
      if (consecutiveFails >= 4) {
        console.warn(`Node ${nodeId} has ${consecutiveFails} consecutive fails. Signal candidate for rebuildGraphForFailedNode.`);
      }

      return { consecutiveFails, failedConceptsSummary };
    } catch (e) {
      console.error('Failed to save quiz result:', e);
    }
  }, []);

  const resetConsecutiveFails = useCallback(async (nodeId) => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'quizResults', String(nodeId));
      await setDoc(docRef, { consecutiveFails: 0 }, { merge: true });
    } catch (e) {
      console.warn("Failed to reset consecutive fails counter:", e);
    }
  }, []);

  return { generateQuiz, saveQuizResult, resetConsecutiveFails, generating, error, setError };
};
