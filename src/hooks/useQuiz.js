import { useState, useCallback } from 'react';
import { callGroqWithRetry } from '../services/courseService.js';
import { getLocale } from '../i18n.js';
import { db, auth } from '../firebase.js';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';

export const useQuiz = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = useCallback(async (roadmapId, nodeId, lessonContent, failedConcepts = [], forceFresh = false) => {
    setGenerating(true);
    setError('');
    
    try {
      const userId = auth.currentUser?.uid;
      let cachedQuestions = null;

      // Only check cache if forceFresh is false and no failed concepts are passed
      if (userId && nodeId && !forceFresh && (!failedConcepts || failedConcepts.length === 0)) {
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
          console.warn("Failed to check Firestore cache for quiz:", readErr);
        }
      }

      if (cachedQuestions) {
        setGenerating(false);
        return cachedQuestions;
      }

      const apiKey = null;
      const currentLocale = getLocale();
      const languageName = currentLocale === 'ru' ? 'Russian' : 'English';

      let focusInstruction = '';
      if (failedConcepts && failedConcepts.length > 0) {
        focusInstruction = `
CRITICAL ADAPTIVE INSTRUCTION:
The student previously struggled with these specific concepts:
${failedConcepts.map(c => `- ${c}`).join('\n')}

Generate 5 NEW, FRESH questions that test these weak areas with different scenarios and perspectives!
        `.trim();
      }

      const quizPrompt = `
You are a strict examiner. Based on the lesson material below, create 5 questions to test REAL understanding of the topic.
CRITICAL INSTRUCTION: You MUST generate the ENTIRE response in the ${languageName} language.
${focusInstruction}

Material:
${lessonContent.substring(0, 3500)}

REQUIREMENTS FOR QUESTIONS (mandatory):
1. At least 2 questions must be APPLICATION of knowledge (not "what is X", but "what happens if / why / how to correctly do").
2. At least 1 question must be ERROR RECOGNITION (show wrong code/approach, ask what is wrong).
3. All incorrect options must be plausible - not obvious.
4. Questions must cover different parts of the material, no repetitions.
5. Include sectionHeading field for each question matching the nearest H2/H3 header text in the lesson material.

IMPORTANT: Return ONLY a valid JSON object without markdown tags or explanations.

{
  "questions": [
    {
      "id": 1,
      "type": "apply",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct and others are wrong",
      "sectionHeading": "Nearest H2/H3 Heading Text in Material"
    }
  ],
  "passingScore": 60
}
`;

      const textResponse = await callGroqWithRetry(apiKey, quizPrompt, 'ai_question');
      if (!textResponse) throw new Error('Empty response');

      let cleanText = textResponse.trim();
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      
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
          console.warn("Failed to cache generated quiz in Firestore:", writeErr);
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

      attempts.push({
        score,
        total,
        passed,
        failedConcepts: failedDetails.map(d => d.sectionHeading || d.questionText),
        timestamp: new Date().toISOString()
      });

      const dataToSave = {
        userId,
        roadmapId,
        nodeId: String(nodeId),
        score,
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
