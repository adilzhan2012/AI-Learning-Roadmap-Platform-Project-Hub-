import { auth, db, functions } from '../firebase.js';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  updateDoc, 
  addDoc, 
  orderBy, 
  limit,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { getLocale } from '../i18n.js';
import { 
  validateCourseGraph, 
  generateNextNodeId, 
  buildRebuiltGraph 
} from '../utils/graphValidation.js';
import { 
  buildCourseCacheKey, 
  buildLessonCacheKey, 
  logCacheMetric, 
  CACHE_VERSION 
} from '../utils/cacheUtils.js';
// fix/critical-round1: санитизация user input перед вставкой в AI-промпты
import { sanitizeUserInput, sanitizeCode } from '../utils/sanitizeUserInput.js';

// Helper to get Groq API Key is removed as it's now handled by Cloud Functions

// Retry helper with exponential backoff and model fallback for 503/429/404 errors
// Call our secure Cloud Function proxy
// fix/critical-round1: принимает опциональный messages[] для разделения system/user ролей (защита от prompt injection)
export async function callGroqWithRetry(apiKey, prompt, usageType, modelName, messages) {
  try {
    const aiProxy = httpsCallable(functions, 'aiProxy');
    const payload = {};
    
    // Если переданы структурированные messages — используем их, иначе prompt
    if (messages && messages.length > 0) {
      payload.messages = messages;
    } else {
      payload.prompt = prompt;
    }
    
    const knownUsageTypes = ['roadmap', 'ai_question', 'mentor_message', 'homework_review'];
    if (usageType) {
      if (knownUsageTypes.includes(usageType)) {
        payload.usageType = usageType;
      } else {
        payload.modelName = usageType;
      }
    }
    if (modelName) {
      payload.modelName = modelName;
    }
    
    const response = await aiProxy(payload);
    if (!response || !response.data || !response.data.result) {
      throw new Error('Empty response from AI Proxy');
    }
    return response.data.result;
  } catch (error) {
    console.error("AI Proxy Error:", error);
    if (error.code === 'resource-exhausted') {
      throw new Error('API_OVERLOADED');
    }
    if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to use AI features.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('Server API key configuration is missing or invalid.');
    }
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

const inFlightGenerations = new Map();

// 1. Generate Course using Gemini API (or Groq)
export async function generateCourseAndSave(userId, topic, level, preferences = {}) {
  const normalizedTopic = topic.toLowerCase().trim();
  const lockKey = `${userId}_${normalizedTopic}_${level}`;

  if (inFlightGenerations.has(lockKey)) {
    console.log("Reusing in-flight course generation promise for:", lockKey);
    return inFlightGenerations.get(lockKey);
  }

  const genPromise = (async () => {
    try {
      const coursesCol = collection(db, 'courses');
      const templatesCol = collection(db, 'courseTemplates');

      // 1. Deduplication check: 10-second burst window to prevent double-click duplicates
      try {
        const userRecentQuery = query(
          coursesCol,
          where('userId', '==', userId)
        );
        const userRecentSnap = await getDocs(userRecentQuery);
        if (!userRecentSnap.empty) {
          const now = Date.now();
          const recentDoc = userRecentSnap.docs.find(d => {
            const data = d.data();
            const createdTime = new Date(data.createdAt || 0).getTime();
            const isWithin10s = (now - createdTime) < 10000;
            const normExisting = (data.normalizedTopic || '').toLowerCase();
            const normNew = normalizedTopic.toLowerCase();
            return isWithin10s && normExisting === normNew;
          });
          if (recentDoc) {
            console.log("Deduplicated 10s burst request:", recentDoc.id);
            return { id: recentDoc.id, ...recentDoc.data() };
          }
        }
      } catch (dedupErr) {
        console.warn("Deduplication check warning:", dedupErr);
      }

      // 2. Course Template Cache Check
      const templateKey = buildCourseCacheKey(topic, level, preferences);
      const templateRef = doc(db, 'courseTemplates', templateKey);
      
      let cachedTemplate = null;
      try {
        const templateSnap = await getDoc(templateRef);
        if (templateSnap.exists() && templateSnap.data().templateVersion === CACHE_VERSION) {
          cachedTemplate = templateSnap.data();
          logCacheMetric('course', true, templateKey);
        } else {
          logCacheMetric('course', false, templateKey);
        }
      } catch (cacheErr) {
        console.warn("Cache check error, proceeding with generation:", cacheErr);
        logCacheMetric('course', false, templateKey);
      }

      let courseDataToUse = null;

      if (cachedTemplate) {
        courseDataToUse = {
          title: cachedTemplate.title,
          level: cachedTemplate.level,
          hours: cachedTemplate.hours,
          lessonsCount: cachedTemplate.lessonsCount,
          gradient: cachedTemplate.gradient,
          description: cachedTemplate.description,
          nodes: cachedTemplate.nodes,
          edges: cachedTemplate.edges
        };
      } else {
        // AI Generation Pipeline
        const currentLocale = getLocale();
        const languageName = currentLocale === 'ru' ? 'Russian' : 'English';

        let prefString = '';
        if (level === 'Advanced') {
          prefString = `
Advanced Preferences:
- Duration (Nodes count): ${preferences.duration || 'Standard (6-10 nodes)'}
- Focus: ${preferences.focus || 'Theory'}
- Goal: ${preferences.goal || 'General'}
- Tone: ${preferences.tone || 'Academic'}
- Prerequisites to skip: ${preferences.prerequisites || 'None'}
- Tech Stack: ${preferences.stack || 'Agnostic'}
          `.trim();
        } else {
          const timeStr = preferences.dailyTime === '15m' ? '15 minutes per day' : preferences.dailyTime === '60m' ? '1 hour per day' : '30 minutes per day';
          const styleStr = preferences.courseStyle === 'Simple' ? 'Simple and explain-like-I-am-5 style' : preferences.courseStyle === 'Gamified' ? 'Gamified / Fantasy style' : 'Friendly and conversational style';
          prefString = `
Learning Preferences:
- Study pace limit: Designed for about ${timeStr}
- Tone and style: ${styleStr}
- Target number of flashcards per lesson: ${preferences.flashcardCount || '5'}
${preferences.duration ? `- Requested Duration: ${preferences.duration}` : ''}
          `.trim();
        }

        let ragContext = '';
        if (preferences && preferences.ragMode) {
          if (preferences.ragType === 'pdf') {
            ragContext = `\nSOURCE MATERIAL FOR GENERATION: The course structure and nodes MUST be generated based on the uploaded file contents: "${preferences.source}". Focus exclusively on topics covered in this material.`;
          } else {
            ragContext = `\nSOURCE MATERIAL FOR GENERATION: The course structure and nodes MUST be generated based on the YouTube lecture / documentation link: "${preferences.source}". Analyze the lecture content/link and generate matching lessons.`;
          }
        }

        const basePrompt = `You are an expert AI curriculum designer. Build a complete, highly structured learning roadmap for the topic: "${sanitizeUserInput(topic, 500)}" at difficulty level: "${sanitizeUserInput(level, 50)}".
${prefString}
${ragContext}

CRITICAL INSTRUCTION: You MUST generate the ENTIRE response (titles, descriptions, labels) in the ${languageName} language.
The response must be a valid JSON object matching this schema:
{
  "title": "A short, professional title for the course",
  "category": "One of: AI Fundamentals, Machine Learning, Deep Learning, NLP, Computer Vision, Software Engineering, General",
  "level": "${level}",
  "hours": "${preferences.duration ? preferences.duration + ' (CRITICAL: DO NOT change this value, output it exactly)' : "estimated total hours, e.g. '12h' (CRITICAL: if a specific duration is requested in preferences, copy it exactly)"}",
  "lessonsCount": 12,
  "gradient": "A Tailwind CSS gradient (e.g., 'from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-violet-500 to-purple-400', 'from-orange-500 to-amber-400', 'from-pink-500 to-rose-400', 'from-sky-500 to-indigo-400')",
  "description": "A detailed course description of 2-3 sentences.",
  "nodes": [
    {
      "id": 1,
      "label": "Brief Node Label (e.g., 'Introduction to ML')",
      "desc": "A paragraph explaining what this lesson/node covers in detail. Add a few sentences explaining the core concept so the user can actually learn it here.",
      "level": "Beginner | Intermediate | Advanced",
      "hours": "e.g., '1.5h'",
      "lessons": 3,
      "category": "Sub-category name",
      "status": "active"
    }
  ],
  "edges": [
    { "from": 1, "to": 2 }
  ]
}
1. All nodes have a unique sequential numeric id (starting from 1).
2. The edges represent prerequisites (from must be completed before to).
3. The graph must respect the requested duration. Express = 3-5 nodes. Standard = 6-10 nodes. Deep Dive (months long) = 15-20 nodes. CRITICAL: If the course is intended for multiple months, you MUST generate at least 15 nodes. Edges should form a logical, directed acyclic graph (DAG).
4. Set the status of the first node (with no prerequisites) to "active" and all other nodes to "locked".
5. Return ONLY the JSON object, with no markdown formatting tags. Do NOT wrap it in \`\`\`json \`\`\`. Do not include any explanations.`;

        const MAX_RETRIES = 2;
        let currentPrompt = basePrompt;
        let attempt = 0;

        while (attempt <= MAX_RETRIES) {
          const textResponse = await callGroqWithRetry(null, currentPrompt, 'roadmap');

          if (!textResponse) {
            if (attempt < MAX_RETRIES) {
              attempt++;
              continue;
            }
            throw new Error('Empty response from Groq API');
          }

          let cleanText = textResponse.trim();
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          
          const firstBrace = cleanText.indexOf('{');
          const lastBrace = cleanText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
          }

          let courseData;
          try {
            courseData = JSON.parse(cleanText);
          } catch (err) {
            console.error(`Attempt ${attempt + 1}: Failed to parse AI response as JSON. Raw response:`, textResponse);
            if (attempt < MAX_RETRIES) {
              attempt++;
              currentPrompt = `${basePrompt}\n\nCRITICAL FIX: Your previous response was invalid JSON. Ensure you return valid JSON without syntax errors.`;
              continue;
            }
            throw new Error('Invalid JSON format returned by AI. Please try again.');
          }

          const rawNodes = courseData.nodes || [];
          const rawEdges = courseData.edges || [];

          const validation = validateCourseGraph(rawNodes, rawEdges);

          if (!validation.valid) {
            console.warn(`Attempt ${attempt + 1}: Course graph validation failed with errors:`, validation.errors);
            if (attempt < MAX_RETRIES) {
              attempt++;
              currentPrompt = `${basePrompt}\n\nCRITICAL FIX REQUIRED: Your previous course graph was invalid. Please fix the following errors:\n${validation.errors.map(err => `- ${err}`).join('\n')}`;
              continue;
            }
            throw new Error(`Course graph validation failed after ${MAX_RETRIES + 1} attempts: ${validation.errors.join('; ')}`);
          }

          courseDataToUse = courseData;
          break;
        }

        // Save newly generated course to template cache
        try {
          await setDoc(templateRef, {
            templateVersion: CACHE_VERSION,
            topic,
            normalizedTopic,
            level,
            preferences,
            title: courseDataToUse.title || topic,
            category: courseDataToUse.category || 'General',
            hours: courseDataToUse.hours || '10h',
            lessonsCount: courseDataToUse.lessonsCount || (courseDataToUse.nodes || []).length * 3,
            gradient: courseDataToUse.gradient || 'from-blue-500 to-indigo-600',
            description: courseDataToUse.description || `Learning path for ${topic}`,
            nodes: courseDataToUse.nodes,
            edges: courseDataToUse.edges,
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString()
          });
        } catch (saveCacheErr) {
          console.warn("Failed to save template to cache:", saveCacheErr);
        }
      }

      // Normalize nodes and edges to create unique instance IDs for this user
      const courseIdPrefix = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4) + '-';
      const idMap = new Map();
      
      courseDataToUse.nodes.forEach(node => {
        const oldId = parseInt(node.id, 10);
        if (!isNaN(oldId) && !idMap.has(oldId)) {
          idMap.set(oldId, courseIdPrefix + oldId);
        }
      });

      const nodes = courseDataToUse.nodes.map((node) => {
        const oldId = parseInt(node.id, 10);
        const newId = idMap.get(oldId) || (courseIdPrefix + oldId);
        const hasPrereq = (courseDataToUse.edges || []).some(e => parseInt(e.to, 10) === oldId);
        return {
          ...node,
          id: newId,
          rawNodeId: oldId, // Keep reference to template raw node ID for lesson content lookup
          status: hasPrereq ? 'locked' : 'active'
        };
      });

      const edges = (courseDataToUse.edges || [])
        .map(e => {
          const oldFrom = parseInt(e.from, 10);
          const oldTo = parseInt(e.to, 10);
          if (isNaN(oldFrom) || isNaN(oldTo)) return null;
          return {
            from: idMap.get(oldFrom) || (courseIdPrefix + oldFrom),
            to: idMap.get(oldTo) || (courseIdPrefix + oldTo)
          };
        })
        .filter(Boolean);

      // Create course object for user in Firestore
      const newCourse = {
        userId,
        courseTemplateId: templateKey,
        topic: topic,
        normalizedTopic: normalizedTopic,
        title: courseDataToUse.title || topic,
        category: '✨ Сгенерировано ИИ',
        level: courseDataToUse.level || level,
        hours: courseDataToUse.hours || '10h',
        lessonsCount: courseDataToUse.lessonsCount || nodes.length * 3,
        gradient: courseDataToUse.gradient || 'from-blue-500 to-indigo-600',
        description: courseDataToUse.description || `Learning path for ${topic}`,
        nodes,
        edges,
        preferences,
        progress: 0,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(coursesCol, newCourse);
      await updateUserStats(userId, { activeCoursesCount: increment(1) });
      await logActivity(userId, `Created course: ${newCourse.title}`, 'school', 'text-blue-500');

      return { id: docRef.id, ...newCourse };
    } finally {
      inFlightGenerations.delete(lockKey);
    }
  })();

  inFlightGenerations.set(lockKey, genPromise);
  return genPromise;
}

// 1.5 Generate Lesson Content
export async function generateLessonContent(courseId, nodeId, courseTitle, topicLabel, topicDesc, preferences = {}) {
  const courseRef = doc(db, 'courses', courseId);
  const snap = await getDoc(courseRef);
  if (!snap.exists()) throw new Error('Course not found');

  const courseData = snap.data();
  const targetNode = (courseData.nodes || []).find(n => String(n.id) === String(nodeId));
  
  // If content is already generated on the user node, return it immediately
  if (targetNode && targetNode.content) {
    return targetNode.content;
  }

  const courseTemplateId = courseData.courseTemplateId || buildCourseCacheKey(courseData.topic || courseTitle, courseData.level || 'Intermediate', preferences);
  const rawNodeId = targetNode?.rawNodeId || targetNode?.id || nodeId;
  const lessonKey = buildLessonCacheKey(rawNodeId);

  // Check lesson cache in courseTemplates/{templateId}/lessons/{lessonKey}
  let cachedContent = null;
  let lessonDocRef = null;

  if (courseTemplateId) {
    try {
      lessonDocRef = doc(db, 'courseTemplates', courseTemplateId, 'lessons', lessonKey);
      const lessonSnap = await getDoc(lessonDocRef);
      if (lessonSnap.exists() && lessonSnap.data().content) {
        cachedContent = lessonSnap.data().content;
        logCacheMetric('lesson', true, `${courseTemplateId}/${lessonKey}`);
      } else {
        logCacheMetric('lesson', false, `${courseTemplateId}/${lessonKey}`);
      }
    } catch (cacheErr) {
      console.warn("Lesson cache check error, proceeding with generation:", cacheErr);
      logCacheMetric('lesson', false, `${courseTemplateId}/${lessonKey}`);
    }
  }

  let finalContent = cachedContent;

  if (!finalContent) {
    const currentLocale = getLocale();
    const languageName = currentLocale === 'ru' ? 'Russian' : 'English';

    let prefString = '';
    let flashcardInstruction = 'include 3-5 flashcards';
    
    if (preferences.dailyTime || preferences.flashcardCount || preferences.courseStyle) {
      const timeStr = preferences.dailyTime === '15m' ? '15 minutes per day' : preferences.dailyTime === '60m' ? '1 hour per day' : '30 minutes per day';
      const styleStr = preferences.courseStyle === 'Simple' ? 'Simple and explain-like-I-am-5 style' : preferences.courseStyle === 'Gamified' ? 'Gamified / Fantasy style' : 'Friendly and conversational style';
      prefString = `
Learning Preferences:
- Study pace: Designed for a study speed of ${timeStr}
- Style and Tone: Use a ${styleStr} to write the content
      `.trim();
      
      if (preferences.flashcardCount) {
        flashcardInstruction = `include EXACTLY ${preferences.flashcardCount} flashcards`;
      }
    } else {
      prefString = `
Advanced Preferences:
- Focus: ${preferences.focus || 'Theory'}
- Goal: ${preferences.goal || 'General'}
- Tone: ${preferences.tone || 'Academic'}
- Tech Stack: ${preferences.stack || 'Agnostic'}
      `.trim();
    }

    const prompt = `You are an expert tutor. Write a comprehensive, highly detailed lesson in Markdown format for the topic: "${sanitizeUserInput(topicLabel, 300)}".
This lesson is part of a larger course called "${sanitizeUserInput(courseTitle, 200)}".
Topic context: ${sanitizeUserInput(topicDesc, 500)}
${prefString}

CRITICAL INSTRUCTION: You MUST generate the ENTIRE lesson content in the ${languageName} language.
Requirements:
1. Start with an engaging H1 title.
2. Provide a deep, step-by-step explanation of the concepts.
3. Include relevant examples, analogies, or code snippets if applicable.
4. Use formatting (bolding, lists, blockquotes) to make it highly readable.
5. End with a short summary.
6. The output should be pure markdown, suitable for rendering in a React-Markdown component.
7. CRITICAL: Add exactly ONE image placeholder right after the H1 title using this EXACT format: \`[IMAGE: English Keyword for Wikipedia Search]\` (e.g., \`[IMAGE: Python (programming language)]\` or \`[IMAGE: Arduino Uno]\`). Use highly specific nouns.
8. CRITICAL: At the end of the lesson content, create a Practice section. Start it with an H2 heading "## Практика / Домашнее задание". Include 1-3 practical tasks.
9. CRITICAL: At the very end of the file (after the homework), ${flashcardInstruction} for the most important key terms using EXACTLY this text format:
---FLASHCARD---
Term: [Concept Name]
Def: [A concise, 1-2 sentence definition]
---
Make it highly educational, long, and detailed so the user can genuinely learn from it.`;

    const textResponse = await callGroqWithRetry(null, prompt, 'ai_question');

    if (!textResponse) throw new Error('Empty response from Groq API');
    finalContent = textResponse;

    // Save generated lesson to template cache for other users
    if (lessonDocRef) {
      try {
        await setDoc(lessonDocRef, {
          rawNodeId,
          content: finalContent,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (saveCacheErr) {
        console.warn("Failed to save lesson template content to cache:", saveCacheErr);
      }
    }
  }

  // Update content on user's specific node in Firestore
  const updatedNodes = (courseData.nodes || []).map(n => {
    if (String(n.id) === String(nodeId)) {
      return { ...n, content: finalContent };
    }
    return n;
  });
  await updateDoc(courseRef, { nodes: updatedNodes });

  return finalContent;
}


// 1.6 Generate Homework & Rubric with Template Caching
export async function generateHomeworkWithRubric(courseId, nodeId, lessonContent, topicLabel, topicDesc) {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) throw new Error('Course not found');
  const courseData = courseSnap.data();

  const targetNode = (courseData.nodes || []).find(n => String(n.id) === String(nodeId));
  const rawNodeId = targetNode?.rawNodeId || targetNode?.id || nodeId;
  const courseTemplateId = courseData.courseTemplateId || buildCourseCacheKey(courseData.topic || courseData.title, courseData.level || 'Intermediate', courseData.preferences || {});
  const lessonKey = buildLessonCacheKey(rawNodeId);

  let templateDocRef = null;
  if (courseTemplateId) {
    try {
      templateDocRef = doc(db, 'courseTemplates', courseTemplateId, 'lessons', lessonKey);
      const lessonSnap = await getDoc(templateDocRef);
      if (lessonSnap.exists() && lessonSnap.data().homeworkPrompt && lessonSnap.data().homeworkRubric) {
        const data = lessonSnap.data();
        logCacheMetric('homework', true, `${courseTemplateId}/${lessonKey}`);
        return {
          prompt: data.homeworkPrompt,
          rubric: data.homeworkRubric
        };
      } else {
        logCacheMetric('homework', false, `${courseTemplateId}/${lessonKey}`);
      }
    } catch (cacheErr) {
      console.warn("Homework cache check warning:", cacheErr);
    }
  }

  const currentLocale = getLocale();
  const languageName = currentLocale === 'ru' ? 'Russian' : 'English';

  const prompt = `You are an expert educational reviewer. Based on the lesson material below for "${topicLabel}", create an interactive homework assignment and a strict 3-5 criterion rubric for AI evaluation.
CRITICAL INSTRUCTION: Respond ENTIRELY in ${languageName} language.

Lesson Material:
${(lessonContent || '').substring(0, 3000)}

Requirements:
1. "prompt": A clear, hands-on homework assignment with instructions, requirements, and an example answer structure.
2. "rubric": 3 to 5 evaluation criteria. Each criterion must have:
   - "id": string (e.g. "crit_1")
   - "criterion": short title of the criterion
   - "description": clear explanation of what is required to pass this criterion
   - "weight": number (sum of weights should equal 100)

Return ONLY a valid JSON object:
{
  "prompt": "Full homework assignment instructions...",
  "rubric": [
    {
      "id": "crit_1",
      "criterion": "Criterion Name",
      "description": "What is evaluated...",
      "weight": 25
    }
  ]
}`;

  const textResponse = await callGroqWithRetry(null, prompt, 'ai_question');
  if (!textResponse) throw new Error('Empty response from Groq API');

  let cleanText = textResponse.trim();
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleanText);
  const result = {
    prompt: parsed.prompt || `Практическое задание по теме "${topicLabel}".`,
    rubric: parsed.rubric || [
      { id: 'crit_1', criterion: 'Понимание концепции', description: 'Ответ демонстрирует правильное понимание темы.', weight: 50 },
      { id: 'crit_2', criterion: 'Практическая применимость', description: 'Приведены корректные примеры или решение.', weight: 50 }
    ]
  };

  // Cache in courseTemplates
  if (templateDocRef) {
    try {
      await setDoc(templateDocRef, {
        homeworkPrompt: result.prompt,
        homeworkRubric: result.rubric,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (saveCacheErr) {
      console.warn("Failed to cache homework in courseTemplates:", saveCacheErr);
    }
  }

  return result;
}

// 1.7 Review Homework Submission with AI
export async function reviewHomeworkSubmission(courseId, nodeId, submissionText, lessonContent, homeworkPrompt, rubric) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Unauthenticated');

  const currentLocale = getLocale();
  const languageName = currentLocale === 'ru' ? 'Russian' : 'English';

  // fix/critical-round1: разделяем системный промпт и пользовательский input на отдельные Groq messages.
  // submissionText помещается в user-role сообщение — структурная защита от prompt injection.
  const sanitizedSubmission = sanitizeUserInput(submissionText, 4000);

  const systemPrompt = `You are a strict code and homework evaluator. Evaluate the student's submission against the provided rubric.
CRITICAL INSTRUCTION: Respond ENTIRELY in ${languageName} language.

Homework Task:
${homeworkPrompt}

Lesson Context:
${(lessonContent || '').substring(0, 2000)}

Evaluation Rubric:
${JSON.stringify(rubric, null, 2)}

Instructions:
1. Evaluate whether each criterion in the rubric is met by the student.
2. Provide a overall score from 0 to 100 based on criterion weights.
3. Mark "passed": true if score >= 60, otherwise false.
4. For each criterion, give constructive, encouraging, but honest feedback.

Return ONLY a valid JSON object:
{
  "score": 85,
  "passed": true,
  "overallComment": "General feedback summary for student...",
  "feedback": [
    {
      "criterion": "Criterion Name",
      "met": true,
      "comment": "Specific feedback explaining why this was met or what was missing..."
    }
  ]
}`;

  const userMessage = `Student Submission:\n${sanitizedSubmission}`;

  // fix/critical-round1: usageType изменён на 'homework_review' (отдельный серверный лимит, Фикс 4)
  const textResponse = await callGroqWithRetry(null, null, 'homework_review', null, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]);
  if (!textResponse) throw new Error('Empty response from Groq API');

  let cleanText = textResponse.trim();
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  const reviewResult = JSON.parse(cleanText);

  // Soft Rate-Limit: max 3 reviews per hour per node
  const hwRef = doc(db, 'users', userId, 'homeworkSubmissions', `${courseId}_${nodeId}`);
  const hwSnap = await getDoc(hwRef);

  let attempts = [];
  if (hwSnap.exists()) {
    attempts = hwSnap.data().attempts || [];
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentHourlyAttempts = attempts.filter(a => new Date(a.timestamp) > oneHourAgo);
  if (recentHourlyAttempts.length >= 3) {
    const error = new Error("RATE_LIMIT_HOURLY");
    error.userMessage = "Вы достигли лимита проверок для этого задания за час.";
    throw error;
  }

  // fix/critical-round1 (ФИКС 4): клиентский инкремент homeworkReviewsUsed удалён.
  // aiProxy теперь атомарно инкрементирует счётчик в runTransaction ДО вызова Groq API.
  // Клиентская версия была ненадёжной (race condition) и дублирующей.

  attempts.push({
    submission: submissionText,
    score: reviewResult.score,
    passed: reviewResult.passed,
    overallComment: reviewResult.overallComment,
    feedback: reviewResult.feedback,
    timestamp: new Date().toISOString()
  });

  const hwDataToSave = {
    userId,
    courseId,
    nodeId: String(nodeId),
    status: reviewResult.passed ? 'reviewed' : 'submitted',
    submission: submissionText,
    score: reviewResult.score,
    passed: reviewResult.passed,
    feedback: reviewResult.feedback,
    overallComment: reviewResult.overallComment,
    attempts,
    attemptsCount: attempts.length,
    updatedAt: serverTimestamp()
  };

  await setDoc(hwRef, hwDataToSave, { merge: true });

  // Update node in user's course doc with homework status flag
  try {
    const courseRef = doc(db, 'courses', courseId);
    const cSnap = await getDoc(courseRef);
    if (cSnap.exists()) {
      const cData = cSnap.data();
      const updatedNodes = (cData.nodes || []).map(n => {
        if (String(n.id) === String(nodeId)) {
          return {
            ...n,
            homeworkStatus: reviewResult.passed ? 'reviewed' : 'submitted',
            homeworkPassed: reviewResult.passed,
            homeworkScore: reviewResult.score
          };
        }
        return n;
      });
      await updateDoc(courseRef, { nodes: updatedNodes });
    }
  } catch (err) {
    console.warn("Failed to update node homeworkStatus flag:", err);
  }

  return {
    ...reviewResult,
    attemptsCount: attempts.length
  };
}

export async function getHomeworkState(courseId, nodeId) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  const hwRef = doc(db, 'users', userId, 'homeworkSubmissions', `${courseId}_${nodeId}`);
  const hwSnap = await getDoc(hwRef);
  if (!hwSnap.exists()) return null;
  return hwSnap.data();
}
export async function getUserCourses(userId) {
  const coursesCol = collection(db, 'courses');
  const q = query(coursesCol, where('userId', '==', userId));
  const snap = await getDocs(q);
  const courses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 2.5 Delete a Course
export async function deleteCourse(courseId, userId) {
  const courseRef = doc(db, 'courses', courseId);
  const snap = await getDoc(courseRef);
  if (!snap.exists()) throw new Error('Course not found');
  
  const courseData = snap.data();
  if (courseData.userId !== userId) throw new Error('Unauthorized');

  await deleteDoc(courseRef);

  // Decrement active courses count if course wasn't 100% complete
  if ((courseData.progress || 0) < 100) {
    await updateUserStats(userId, { activeCoursesCount: increment(-1) });
  }

  await logActivity(userId, `Deleted course: ${courseData.title}`, 'school', 'text-red-500');
}

// 2.6 Pin / Unpin Course
export async function toggleCoursePin(courseId, userId, isPinned) {
  const courseRef = doc(db, 'courses', courseId);
  const snap = await getDoc(courseRef);
  if (!snap.exists()) throw new Error('Course not found');
  const courseData = snap.data();
  if (courseData.userId !== userId) throw new Error('Unauthorized');

  await updateDoc(courseRef, { isPinned: !!isPinned });
}


// 3. Fetch specific course
export async function getQuizResult(courseId, nodeId) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;
  const docRef = doc(db, 'users', userId, 'quizResults', nodeId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function updateNodeFields(courseId, nodeId, fields) {
  const docRef = doc(db, 'courses', courseId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Course not found');
  
  const courseData = snap.data();
  const updatedNodes = courseData.nodes.map(node => {
    if (String(node.id) === String(nodeId)) {
      return { ...node, ...fields };
    }
    return node;
  });
  
  await updateDoc(docRef, { nodes: updatedNodes });
  return { ...courseData, id: courseId, nodes: updatedNodes };
}

export async function getCourseById(courseId) {
  const docRef = doc(db, 'courses', courseId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Course not found');
  }
  return { id: snap.id, ...snap.data() };
}

// 4. Update Node Status (Mark completed, unlock next nodes, update progress)
export async function updateNodeStatus(courseId, nodeId, newStatus) {
  const course = await getCourseById(courseId);
  const userId = course.userId;

  if (newStatus === 'completed') {
    const quizResultSnap = await getDoc(doc(db, 'users', userId, 'quizResults', String(nodeId)));
    if (!quizResultSnap.exists() || !quizResultSnap.data().passed) {
      throw new Error('Quiz must be passed before marking lesson complete');
    }
  }

  let nodeHours = 1;
  const updatedNodes = course.nodes.map(n => {
    if (String(n.id) === String(nodeId)) {
      if (n.hours) {
        const hMatch = n.hours.match(/(\d+(\.\d+)?)/);
        if (hMatch) nodeHours = parseFloat(hMatch[1]);
      }
      return { ...n, status: newStatus };
    }
    return n;
  });

  // If node was marked completed, check what to unlock
  if (newStatus === 'completed') {
    // A locked node can be unlocked (set to 'active') if ALL its prerequisite nodes are 'completed'
    course.nodes.forEach(node => {
      if (String(node.id) !== String(nodeId)) {
        const nodeInUpdatedList = updatedNodes.find(un => String(un.id) === String(node.id));
        if (nodeInUpdatedList && nodeInUpdatedList.status === 'locked') {
          // Find all prerequisites for this node
          const prereqIds = course.edges.filter(e => String(e.to) === String(node.id)).map(e => e.from);
          const allPrereqsCompleted = prereqIds.every(pid => {
            const pNode = updatedNodes.find(un => String(un.id) === String(pid));
            return pNode && pNode.status === 'completed';
          });
          if (allPrereqsCompleted && prereqIds.length > 0) {
            nodeInUpdatedList.status = 'active';
          }
        }
      }
    });

    // Update user learning hours & check streak
    await updateUserStats(userId, {
      hoursLearned: increment(nodeHours)
    });
  }

  // Calculate new overall progress
  const completedCount = updatedNodes.filter(n => n.status === 'completed').length;
  const newProgress = Math.round((completedCount / updatedNodes.length) * 100);

  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    nodes: updatedNodes,
    progress: newProgress
  });

  const nodeLabel = course.nodes.find(n => String(n.id) === String(nodeId))?.label || `lesson ${nodeId}`;
  
  if (newStatus === 'completed') {
    await logActivity(userId, `Completed lesson: ${nodeLabel}`, 'check_circle', 'text-green-500');
    
    // Check if course is 100% completed to award a certificate
    if (newProgress === 100 && course.progress < 100) {
      await updateUserStats(userId, {
        certificatesCount: increment(1),
        activeCoursesCount: increment(-1)
      });
      await logActivity(userId, `Earned certificate for: ${course.title}`, 'emoji_events', 'text-amber-500');
    }
  }

  return { ...course, nodes: updatedNodes, progress: newProgress };
}

// 5. User statistics and profile management
export async function getUserStats(userId, additionalData = {}) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  let data;
  
  if (!snap.exists()) {
    // Create default profile if not exists
    const defaultProfile = {
      activeCoursesCount: 0,
      hoursLearned: 0,
      certificatesCount: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      referralCode: userId, // Use uid as the unique referral code for simplicity
    };
    
    // Only write profile fields if they are explicitly provided in additionalData
    if (additionalData.firstName) defaultProfile.firstName = additionalData.firstName;
    if (additionalData.lastName) defaultProfile.lastName = additionalData.lastName;
    if (additionalData.username) defaultProfile.username = additionalData.username;
    if (additionalData.referredBy) defaultProfile.referredBy = additionalData.referredBy;
    if (additionalData.email) defaultProfile.email = additionalData.email;
    if (additionalData.photoURL !== undefined) defaultProfile.photoURL = additionalData.photoURL;
    if (additionalData.avatarColor !== undefined) defaultProfile.avatarColor = additionalData.avatarColor;
    
    // Use merge to prevent overwriting concurrently created profiles
    await setDoc(userRef, defaultProfile, { merge: true });
    data = defaultProfile;
  } else {
    data = snap.data();
    
    // Ensure existing users have a referralCode
    if (!data.referralCode) {
      await updateDoc(userRef, { referralCode: userId });
      data.referralCode = userId;
    }
    
    // If the document already exists but additionalData was provided (e.g. from a concurrent registration call),
    // update the document to ensure the student's registration details are saved.
    if (Object.keys(additionalData).length > 0) {
      const updates = {};
      if (additionalData.firstName && (!data.firstName || data.firstName === 'Learner')) {
        updates.firstName = additionalData.firstName;
        data.firstName = additionalData.firstName;
      }
      if (additionalData.lastName && !data.lastName) {
        updates.lastName = additionalData.lastName;
        data.lastName = additionalData.lastName;
      }
      if (additionalData.username && !data.username) {
        updates.username = additionalData.username;
        data.username = additionalData.username;
      }
      if (additionalData.email && !data.email) {
        updates.email = additionalData.email;
        data.email = additionalData.email;
      }
      
      // Update avatar details if provided (even if they already exist, they might be overwriting default Google avatar)
      if (additionalData.avatarColor !== undefined) {
        updates.avatarColor = additionalData.avatarColor;
        data.avatarColor = additionalData.avatarColor;
      }
      if (additionalData.photoURL !== undefined) {
        updates.photoURL = additionalData.photoURL;
        data.photoURL = additionalData.photoURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }
    }
  }
  
  if (data) {
    if (!data.firstName) data.firstName = 'Learner';
    if (!data.lastName) data.lastName = '';
    if (!data.username) data.username = '';
    
    // Provide default values in memory (since we can't write these to Firestore from client)
    if (data.xp === undefined) data.xp = 0;
    if (data.level === undefined) data.level = 1;
    if (data.totalXPEarned === undefined) data.totalXPEarned = 0;
    if (data.isPremium === undefined) data.isPremium = false;
    if (data.isBanned === undefined) data.isBanned = false;
  }

  // Timezone-aware streak calculator logic
  const now = new Date();
  const lastActive = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
  
  if (lastActive) {
    const getLocalDateOnly = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const today = getLocalDateOnly(now);
    const lastActiveDay = getLocalDateOnly(lastActive);
    const diffTime = today - lastActiveDay;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      // Streak broken (user skipped a day or more)
      await updateDoc(userRef, { streakDays: 1, lastActiveDate: now.toISOString() });
      data.streakDays = 1;
    } else if (diffDays === 1) {
      // Incremented streak (consecutive local days)
      await updateDoc(userRef, { streakDays: increment(1), lastActiveDate: now.toISOString() });
      data.streakDays += 1;
    } else {
      // Active again on the same calendar day; update timestamp only if last activity was > 1 hour ago
      // This saves Firebase write costs if the user refreshes the page multiple times
      if (now - lastActive > 60 * 60 * 1000) {
        await updateDoc(userRef, { lastActiveDate: now.toISOString() });
      }
    }
  } else {
    await updateDoc(userRef, { lastActiveDate: now.toISOString(), streakDays: 1 });
    data.streakDays = 1;
  }

  return data;
}

export async function updateUserStats(userId, statsUpdates) {
  const userRef = doc(db, 'users', userId);
  // Ensure document exists
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await getUserStats(userId);
  }
  await updateDoc(userRef, {
    ...statsUpdates,
    lastActiveDate: new Date().toISOString()
  });
}

export async function updateUserProfile(userId, profileData) {
  const ALLOWED_FIELDS = ['firstName', 'lastName', 'username', 'displayName', 'bio', 'avatarUrl', 'photoURL', 'avatarColor', 'locale', 'theme'];
  const sanitized = {};
  for (const key of ALLOWED_FIELDS) {
    if (profileData[key] !== undefined) {
      sanitized[key] = profileData[key];
    }
  }
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, sanitized, { merge: true });
  try {
    await logActivity(userId, 'Updated profile settings', 'manage_accounts', 'text-purple-500');
  } catch (e) {
    console.warn("Could not log activity:", e);
  }
}


// 6. User Activity Logging
export async function logActivity(userId, title, iconName, colorClass) {
  try {
    const activitiesCol = collection(db, 'users', userId, 'activities');
    await addDoc(activitiesCol, {
      title,
      icon: iconName,
      color: colorClass,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Could not log activity:", e);
  }
}

export async function getUserActivityLogs(userId) {
  const activitiesCol = collection(db, 'users', userId, 'activities');
  const snap = await getDocs(activitiesCol);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 7. Get Recent Activities
export async function getRecentActivities(userId, maxLimit = 5) {
  const activitiesCol = collection(db, 'users', userId, 'activities');
  const snap = await getDocs(activitiesCol); // Since SDK query constraints are simple, sort in JS
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return docs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxLimit);
}

export async function generateELI5Content(originalContent, courseTemplateId = null, rawNodeId = null) {
  let lessonDocRef = null;
  if (courseTemplateId && rawNodeId) {
    try {
      const lessonKey = buildLessonCacheKey(rawNodeId);
      lessonDocRef = doc(db, 'courseTemplates', courseTemplateId, 'lessons', lessonKey);
      const lessonSnap = await getDoc(lessonDocRef);
      if (lessonSnap.exists() && lessonSnap.data().eli5Content) {
        logCacheMetric('eli5', true, `${courseTemplateId}/${lessonKey}`);
        return lessonSnap.data().eli5Content;
      } else {
        logCacheMetric('eli5', false, `${courseTemplateId}/${lessonKey}`);
      }
    } catch (e) {
      console.warn("ELI5 cache check error:", e);
    }
  }

  const currentLocale = getLocale();
  let languageName = 'English';
  if (currentLocale === 'ru') languageName = 'Russian';
  
  const prompt = `You are an expert at explaining complex concepts to complete beginners.
Rewrite the following educational lesson so that a 5-year-old or a complete novice could understand it.
Use extremely simple language, funny real-world metaphors, and keep the core concepts intact.
Format the output in Markdown.
CRITICAL INSTRUCTION: Respond entirely in ${languageName}.

Original Lesson:
${originalContent}
`;

  const textResponse = await callGroqWithRetry(null, prompt, 'ai_question');
  if (!textResponse) throw new Error('Empty response from Groq API');
  const result = textResponse.trim();

  if (lessonDocRef) {
    try {
      await setDoc(lessonDocRef, { eli5Content: result }, { merge: true });
    } catch (e) {
      console.warn("Failed to cache ELI5 content:", e);
    }
  }

  return result;
}

export async function generateRealWorldExample(topicLabel, topicDesc) {

  const currentLocale = localStorage.getItem('yourway-locale');
  let languageName = currentLocale === 'en' ? 'English' : 'Russian';

  const prompt = `You are a career mentor. The student is learning about "${sanitizeUserInput(topicLabel, 300)}".
Context: ${sanitizeUserInput(topicDesc, 500)}
Provide exactly ONE highly engaging, mind-blowing, and realistic real-world example of how this specific concept is used in a top tech company (like Netflix, Google, Space X) or in a fascinating real-world scenario.
Keep it to 2-3 sentences max. Do NOT use markdown headings.
CRITICAL INSTRUCTION: Respond entirely in ${languageName}.`;

  const textResponse = await callGroqWithRetry(null, prompt, 'ai_question');
  if (!textResponse) throw new Error('Empty response from Groq API');
  return textResponse.trim();
}

export function markdownToSlides(markdown) {
  if (!markdown) return [];
  const sections = markdown.split(/^## /m).filter(Boolean);
  return sections.map(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].replace(/^#+ /, '').trim();
    const body = lines.slice(1).join('\n').trim();
    return { title, body };
  });
}

export { generateNextNodeId, buildRebuiltGraph };

export async function rebuildGraphForFailedNode(courseId, nodeId) {
  const course = await getCourseById(courseId);
  const failedNode = course.nodes.find(n => String(n.id) === String(nodeId));
  if (!failedNode) return null;

  // Check if a micro-module for this node already exists to avoid duplicates
  const alreadyExists = course.nodes.some(n => n.label.includes(`Работа над ошибками: ${failedNode.label}`));
  if (alreadyExists) return course;

  const currentLocale = getLocale();
  let languageName = 'English';
  if (currentLocale === 'ru') languageName = 'Russian';

  const prompt = `You are a friendly AI tutor correcting student errors.
The student has failed a test on the topic: "${failedNode.label}".
Description of topic: "${failedNode.desc}".

Please generate a brief, hyper-focused micro-module lesson content (500-1000 characters) in Markdown explaining the common pitfalls, key rules, and a simple walkthrough that addresses gaps in understanding "${failedNode.label}".
Provide structured bullet points, examples, and highlight typical mistakes.
CRITICAL INSTRUCTION: Respond entirely in ${languageName}.`;

  let aiGeneratedContent = '';
  try {
    aiGeneratedContent = await callGroqWithRetry(null, prompt, 'ai_question');
  } catch (e) {
    console.error("Failed to generate micro-module content via AI", e);
    aiGeneratedContent = `## Микро-модуль для закрытия пробелов: ${failedNode.label}\n\nЗдесь собраны ключевые моменты и пояснения по теме "${failedNode.label}". Пожалуйста, перечитайте основные материалы и обратитесь к AI-ассистенту за дополнительными вопросами.`;
  }

  const { nodes: finalNodes, edges: updatedEdges } = buildRebuiltGraph(course.nodes, course.edges, failedNode, aiGeneratedContent);

  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    nodes: finalNodes,
    edges: updatedEdges
  });

  return { ...course, nodes: finalNodes, edges: updatedEdges };
}

// Get referrals count
export async function getReferralsCount(userId) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referredBy', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching referrals count:', error);
    return 0;
  }
}

// Request generation of a course certificate
export async function requestCourseCertificate(courseId) {
  try {
    const generateCertificateFn = httpsCallable(functions, 'generateCertificate');
    const result = await generateCertificateFn({ courseId });
    return result.data;
  } catch (err) {
    console.warn('Cloud Function generateCertificate fallback engaged:', err);
    const user = auth.currentUser;
    if (!user) throw err;

    // Return existing certificate if found
    const existing = await getCourseCertificate(user.uid, courseId);
    if (existing) {
      return { certId: existing.certId || existing.id, fileUrl: existing.fileUrl };
    }

    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    const courseData = courseDoc.exists() ? courseDoc.data() : {};

    const certId = `YW-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const certRef = doc(db, 'certificates', certId);
    const certPayload = {
      certId,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Ивакин Даниил',
      courseId,
      courseName: courseData.title || courseData.name || 'Курс обучения',
      modulesCount: Array.isArray(courseData.nodes) ? courseData.nodes.length : 12,
      hoursLearned: courseData.estimatedHours ? parseInt(courseData.estimatedHours) : (courseData.hours ? parseInt(courseData.hours) : (Array.isArray(courseData.nodes) ? courseData.nodes.length * 2 : 40)),
      userLevel: 3,
      issuedAt: new Date().toLocaleDateString('ru-RU'),
      createdAt: new Date().toISOString()
    };

    await setDoc(certRef, certPayload);
    return { certId, fileUrl: null };
  }
}

// Get existing certificate for a course
export async function getCourseCertificate(userId, courseId) {
  try {
    const certsRef = collection(db, 'certificates');
    const q = query(certsRef, where('userId', '==', userId), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      return { id: snap.docs[0].id, ...docData };
    }
    return null;
  } catch (error) {
    console.error('Error fetching course certificate:', error);
    return null;
  }
}

// Get all certificates for a user
export async function getUserAllCertificates(userId) {
  try {
    const certsRef = collection(db, 'certificates');
    const q = query(certsRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const certificates = [];
    snap.forEach(doc => {
      certificates.push({ id: doc.id, ...doc.data() });
    });
    return certificates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return [];
  }
}
