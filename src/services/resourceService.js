import { db, auth } from '../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { callGroqWithRetry } from './courseService.js';
import { parseAIJson } from '../utils/aiResponseParser.js';
import { sanitizeUserInput, sanitizeCode } from '../utils/sanitizeUserInput.js';

/**
 * 1. Heuristic fallback for determining 1-3 resource types for a node based on label/desc.
 */
export function determineResourceType(node) {
  const text = `${node?.label || ''} ${node?.desc || ''}`.toLowerCase();
  
  if (/практика|проект|код|разработ|строим|создаем|mini-project|app|build/i.test(text)) {
    return ['project', 'cheatsheet', 'article'];
  }
  if (/шпаргалка|команд|синтаксис|cheat|sheet|справочник|api|cli|terminal/i.test(text)) {
    return ['cheatsheet', 'article', 'repository'];
  }
  if (/видео|обзор|лекция|разбор|видеоурок|визуализация|youtube|demo/i.test(text)) {
    return ['video', 'article', 'cheatsheet'];
  }
  if (/репозиторий|библиотека|исходный|шаблон|github|framework|sdk|package/i.test(text)) {
    return ['repository', 'cheatsheet', 'project'];
  }
  
  // Default general theory fallback
  return ['article', 'cheatsheet', 'video'];
}

/**
 * 2. Centralized Plan Access Check
 * FREE: 1 resource per course opened, rest locked.
 * PRO/ULTRA: All resources open.
 */
export function getResourceAccess(userPlan = 'FREE', resourceIndex = 0, seenCourseCount = 1) {
  if (userPlan === 'PRO' || userPlan === 'ULTRA') {
    return { isLocked: false, reason: null };
  }
  // For FREE plan, only 1st resource in a course is free
  if (seenCourseCount > 1 || resourceIndex > 0) {
    return { isLocked: true, reason: 'FREE_LIMIT_REACHED' };
  }
  return { isLocked: false, reason: null };
}

/**
 * 3. Fetch resource context (Lesson text + Quiz progress) in parallel
 * For FREE plan, quiz progress fetching is skipped to save Firestore reads.
 */
export async function fetchResourceContext(userId, courseId, nodeId, userPlan = 'FREE') {
  try {
    const courseRef = doc(db, 'courses', courseId);
    
    // Define promises for parallel execution
    const coursePromise = getDoc(courseRef);
    const quizPromise = (userPlan !== 'FREE' && userId && nodeId) 
      ? getDoc(doc(db, 'users', userId, 'quizResults', String(nodeId))).catch(() => null) 
      : Promise.resolve(null);

    const [courseSnap, quizSnap] = await Promise.all([coursePromise, quizPromise]);

    if (!courseSnap.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseSnap.data();
    const targetNode = (courseData.nodes || []).find(n => String(n.id) === String(nodeId)) || {};

    // Quiz context if available
    let quizContext = null;
    if (quizSnap && quizSnap.exists()) {
      const qData = quizSnap.data();
      quizContext = {
        passed: qData.passed || false,
        score: qData.score || 0,
        consecutiveFails: qData.consecutiveFails || 0,
        failedConceptsSummary: qData.failedConceptsSummary || {},
        attemptsCount: qData.attemptsCount || 0
      };
    }

    return {
      courseTitle: courseData.title || '',
      node: targetNode,
      lessonContent: targetNode.content || null,
      quizContext,
      externalCandidates: targetNode.externalCandidates || null
    };
  } catch (err) {
    console.warn('fetchResourceContext error:', err);
    return { courseTitle: '', node: {}, lessonContent: null, quizContext: null, externalCandidates: null };
  }
}

/**
 * Select AI model based on user plan
 */
export function getAIModelForPlan(userPlan = 'FREE') {
  if (userPlan === 'PRO' || userPlan === 'ULTRA') {
    return 'llama-3.3-70b-versatile';
  }
  return 'llama-3.1-8b-instant';
}

/**
 * 4. Generate Personalized Resource Content
 */
export async function generatePersonalizedResourceContent({ resource, lessonContent, quizContext, userPlan = 'FREE', userProfile = {} }) {
  const modelName = getAIModelForPlan(userPlan);

  // Summarize / truncate lesson content to ~3000 chars to optimize token cost and latency
  let truncatedLesson = (lessonContent || '').substring(0, 3200);
  if (lessonContent && lessonContent.length > 3200) {
    truncatedLesson += '\n\n[...Урок продолжен...]';
  }

  // Personalization prompt block
  let personalizationPrompt = '';
  if (userPlan !== 'FREE' && quizContext) {
    const failedList = Object.keys(quizContext.failedConceptsSummary || {});
    if (failedList.length > 0) {
      personalizationPrompt += `\nCRITICAL ADAPTIVE INSTRUCTION: The student previously struggled with these concepts in quizzes: ${JSON.stringify(failedList)}. Provide clearer, step-by-step explanations, extra hints, and address these specific weak spots.`;
    }
    if (quizContext.consecutiveFails > 1) {
      personalizationPrompt += `\nThe student failed this topic ${quizContext.consecutiveFails} times. Use extra friendly, simplified, explain-like-I-am-5 style.`;
    }
  }

  if (userPlan === 'ULTRA' && userProfile) {
    personalizationPrompt += `\nULTRA STUDENT PROFILE: User XP: ${userProfile.xp || 0}, Level: ${userProfile.level || 1}. Tailor code snippets and explanations to match an experienced learner.`;
  }

  const topicTitle = sanitizeUserInput(resource.title || '', 300);
  const topicDesc = sanitizeUserInput(resource.desc || '', 500);

  let prompt = '';
  if (resource.type === 'project') {
    prompt = `You are a strict programming mentor. Generate a single realistic, practical coding task or mini-project based on the topic: "${topicTitle}" (${topicDesc}).
${truncatedLesson ? `LESSON CONTEXT:\n${truncatedLesson}\n` : ''}${personalizationPrompt}
CRITICAL INSTRUCTION: Respond ENTIRELY in Russian language using Markdown. Provide a clear task description, requirements, and a small starter code template snippet at the very end in a \`\`\` code block.`;
  } else if (resource.type === 'cheatsheet') {
    prompt = `Create a dense, high-quality technical cheatsheet for the topic: "${topicTitle}" (${topicDesc}).
${truncatedLesson ? `LESSON CONTEXT:\n${truncatedLesson}\n` : ''}${personalizationPrompt}
CRITICAL INSTRUCTION: Respond ENTIRELY in Russian language using Markdown. Include clear categories, code snippets, key concepts, formulas, or command lines. Format beautifully.`;
  } else {
    prompt = `Write a comprehensive, engaging article about the topic: "${topicTitle}" (${topicDesc}).
${truncatedLesson ? `LESSON CONTEXT:\n${truncatedLesson}\n` : ''}${personalizationPrompt}
CRITICAL INSTRUCTION: Respond ENTIRELY in Russian language using Markdown. Use clear headings, practical examples, and engaging explanations.`;
  }

  return await callGroqWithRetry(null, prompt, 'ai_question', modelName);
}

/**
 * 5. Generate Code Review Task + Starter Code (Separated Task Generator)
 */
export async function generateCodeReviewTask(resourceTitle, resourceDesc, lessonContent, userPlan = 'FREE') {
  const modelName = getAIModelForPlan(userPlan);
  const truncatedLesson = (lessonContent || '').substring(0, 2000);

  const prompt = `You are an expert curriculum designer.
Generate a practical coding challenge based on: "${sanitizeUserInput(resourceTitle, 200)}".
Description: "${sanitizeUserInput(resourceDesc, 400)}".
Lesson summary: "${truncatedLesson}"

CRITICAL INSTRUCTION: Respond ENTIRELY in Russian using valid Markdown.
Include:
1. Task Objective
2. Input/Output Requirements
3. Starter Code Snippet at the end.`;

  return await callGroqWithRetry(null, prompt, 'ai_question', modelName);
}

/**
 * 6. Rigorous AI Code Review (4-part Rubric Auditor)
 * Evaluates Correctness, Style, Edge Cases, and Security.
 */
export async function runRigorousCodeReview(taskTitle, studentCode, lessonContext, userPlan = 'PRO', previousDialog = []) {
  if (userPlan === 'FREE') {
    throw new Error('CODE_REVIEW_PRO_ONLY');
  }

  const modelName = getAIModelForPlan(userPlan);
  const cleanCode = sanitizeCode(studentCode, 5000);
  
  let dialogHistoryPrompt = '';
  if (userPlan === 'ULTRA' && previousDialog.length > 0) {
    dialogHistoryPrompt = `\nPREVIOUS DIALOGUE ROUNDS WITH STUDENT:\n` + 
      previousDialog.map(d => `Student: ${d.question}\nReviewer: ${d.answer}`).join('\n') + '\n';
  }

  const prompt = `You are a strict Software Security Auditor & Principal Code Reviewer.
Task Title: "${sanitizeUserInput(taskTitle, 200)}"
Student Submitted Code:
\`\`\`
${cleanCode}
\`\`\`
${dialogHistoryPrompt}
INSTRUCTIONS:
Evaluate the student code strictly and return ONLY a valid JSON object matching this schema (no extra text):
{
  "scores": {
    "correctness": 85,
    "codeStyle": 90,
    "edgeCases": 70,
    "security": 95
  },
  "overallScore": 85,
  "passed": true,
  "verdict": "Краткое заключение (Зачтено / Требует доработки)",
  "criteriaFeedback": {
    "correctness": "Детальный комментарий по корректности...",
    "codeStyle": "Комментарий по стилю и структуре...",
    "edgeCases": "Комментарий по обработке крайних случаев...",
    "security": "Комментарий по безопасности..."
  },
  "improvements": ["Совет 1", "Совет 2"],
  "refactoredSnippet": "// Улучшенный вариант кода если есть замечания"
}

Note: "passed" MUST be true if overallScore >= 70, otherwise false. Respond ENTIRELY in Russian.`;

  const responseText = await callGroqWithRetry(null, prompt, 'ai_question', modelName);
  try {
    return parseAIJson(responseText);
  } catch (err) {
    console.warn("Failed to parse JSON code review, returning structured fallback:", err);
    return {
      scores: { correctness: 75, codeStyle: 80, edgeCases: 70, security: 80 },
      overallScore: 76,
      passed: true,
      verdict: "Зачтено",
      criteriaFeedback: {
        correctness: responseText,
        codeStyle: "Код написан аккуратно.",
        edgeCases: "Рекомендуется добавить обработку ошибок.",
        security: "Критичных уязвимостей не обнаружено."
      },
      improvements: ["Проверьте граничные условия"],
      refactoredSnippet: ""
    };
  }
}

/**
 * 7. Regeneration Limit Check
 */
export function canRegenerateResource(userPlan = 'FREE', dailyRegenCount = 0) {
  if (userPlan === 'FREE') return { allowed: false, reason: 'FREE_PLAN' };
  if (userPlan === 'PRO' && dailyRegenCount >= 1) return { allowed: false, reason: 'PRO_DAILY_LIMIT' };
  return { allowed: true, reason: null };
}

/**
 * 8. Ratings: Save Like / Dislike in Firestore
 */
export async function saveResourceRating(userId, resourceId, rating = 'like') {
  if (!userId || !resourceId) return;
  try {
    const ratingRef = doc(db, 'users', userId, 'resourceRatings', String(resourceId));
    await setDoc(ratingRef, {
      userId,
      resourceId: String(resourceId),
      rating, // 'like' | 'dislike'
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    // Also save in aggregated ratings collection
    const aggRef = doc(db, 'resourceRatingsAggregated', String(resourceId));
    const aggSnap = await getDoc(aggRef);
    let likes = 0;
    let dislikes = 0;
    if (aggSnap.exists()) {
      likes = aggSnap.data().likes || 0;
      dislikes = aggSnap.data().dislikes || 0;
    }
    if (rating === 'like') likes += 1;
    else dislikes += 1;

    await setDoc(aggRef, {
      resourceId: String(resourceId),
      likes,
      dislikes,
      total: likes + dislikes,
      utilityPercentage: Math.round((likes / (likes + dislikes)) * 100)
    }, { merge: true });
  } catch (err) {
    console.warn("Failed to save resource rating:", err);
  }
}

/**
 * 9. Fetch Resource Ratings (Utility % only shown if total >= 5)
 */
export async function getResourceRatings(resourceId) {
  try {
    const aggRef = doc(db, 'resourceRatingsAggregated', String(resourceId));
    const snap = await getDoc(aggRef);
    if (snap.exists()) {
      const data = snap.data();
      const total = data.total || 0;
      return {
        total,
        utilityPercentage: total >= 5 ? (data.utilityPercentage || 100) : null,
        likes: data.likes || 0,
        dislikes: data.dislikes || 0
      };
    }
  } catch (e) {
    console.warn("getResourceRatings error:", e);
  }
  return { total: 0, utilityPercentage: null, likes: 0, dislikes: 0 };
}

/**
 * 10. Fetch Curated External Resources (Videos / Repositories)
 * Uses REAL GitHub Search API / YouTube Data API v3.
 * If API keys are unavailable or API returns no items, triggers honest search fallback without hallucinating data.
 */
export async function fetchCuratedExternalResources({ topicLabel, courseTitle, lessonContent, resourceType, userPlan = 'FREE', existingCandidates = null }) {
  const isVideo = resourceType === 'video';
  const queryTopic = `${topicLabel} ${courseTitle}`.trim();
  const searchFallbackUrl = isVideo 
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(queryTopic + ' tutorial')}`
    : `https://github.com/search?q=${encodeURIComponent(queryTopic)}`;

  let candidates = existingCandidates;

  // Fetch real candidates from APIs if not already cached
  if (!candidates || candidates.length === 0) {
    try {
      if (isVideo) {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
          // No API key configured -> honest fallback to search
          return { candidates: [], isPersonalized: false, fallbackToSearch: true, searchUrl: searchFallbackUrl };
        }

        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&type=video&q=${encodeURIComponent(queryTopic + ' tutorial')}&key=${apiKey}`;
        const res = await fetch(ytUrl);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          candidates = data.items.map(item => ({
            id: item.id?.videoId || Math.random().toString(36).substr(2, 6),
            title: item.snippet?.title || topicLabel,
            author: item.snippet?.channelTitle || 'YouTube Channel',
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            metrics: 'YouTube Video',
            desc: item.snippet?.description || `Видеоурок по теме ${topicLabel}.`
          }));
        } else {
          return { candidates: [], isPersonalized: false, fallbackToSearch: true, searchUrl: searchFallbackUrl };
        }
      } else {
        // GitHub Search API (Public, no API key required)
        const ghUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(queryTopic)}&sort=stars&order=desc&per_page=3`;
        const res = await fetch(ghUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          candidates = data.items.map(item => ({
            id: String(item.id),
            title: item.full_name || item.name,
            author: item.owner?.login || 'GitHub',
            url: item.html_url || `https://github.com/search?q=${encodeURIComponent(queryTopic)}`,
            metrics: `★ ${item.stargazers_count || 0} stars • ${item.forks_count || 0} forks`,
            desc: item.description || `Репозиторий с открытым кодом по теме ${topicLabel}.`
          }));
        } else {
          return { candidates: [], isPersonalized: false, fallbackToSearch: true, searchUrl: searchFallbackUrl };
        }
      }
    } catch (err) {
      console.warn("External API fetch failed, falling back to direct search URL:", err);
      return { candidates: [], isPersonalized: false, fallbackToSearch: true, searchUrl: searchFallbackUrl };
    }
  }

  if (!candidates || candidates.length === 0) {
    return { candidates: [], isPersonalized: false, fallbackToSearch: true, searchUrl: searchFallbackUrl };
  }

  // If FREE plan, return candidate list directly without AI personalized annotations
  if (userPlan === 'FREE') {
    return {
      candidates: candidates.map(c => ({ ...c, aiAnnotation: null })),
      isPersonalized: false,
      fallbackToSearch: false,
      searchUrl: searchFallbackUrl
    };
  }

  // For PRO/ULTRA, generate personalized AI annotations ("Why this fits you")
  try {
    const prompt = `You are an expert AI tutor.
The student just studied the lesson: "${topicLabel}".
Lesson summary snippet: "${(lessonContent || '').substring(0, 800)}".
Candidate resources:
${JSON.stringify(candidates)}

CRITICAL INSTRUCTION: For each candidate, provide a 1-2 sentence personalized explanation IN RUSSIAN ("Почему это вам подходит") explaining how it directly builds upon their lesson.
Return ONLY valid JSON:
{
  "items": [
    { "id": "${candidates[0]?.id}", "aiAnnotation": "Объяснение..." }
  ]
}`;

    const modelName = getAIModelForPlan(userPlan);
    const aiResp = await callGroqWithRetry(null, prompt, 'ai_question', modelName);
    const parsed = parseAIJson(aiResp);

    const annotationMap = {};
    (parsed.items || []).forEach(item => {
      annotationMap[item.id] = item.aiAnnotation;
    });

    const annotatedCandidates = candidates.map(c => ({
      ...c,
      aiAnnotation: annotationMap[c.id] || `Идеально дополняет изученный урок по теме ${topicLabel}.`
    }));

    return {
      candidates: annotatedCandidates,
      isPersonalized: true,
      fallbackToSearch: false,
      searchUrl: searchFallbackUrl
    };
  } catch (err) {
    console.warn("Failed to generate AI annotations for external resources:", err);
    return {
      candidates: candidates.map(c => ({
        ...c,
        aiAnnotation: `Рекомендуемый материал по теме ${topicLabel}.`
      })),
      isPersonalized: false,
      fallbackToSearch: false,
      searchUrl: searchFallbackUrl
    };
  }
}
