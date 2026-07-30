import { db, functions } from '../firebase.js';
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

// Helper to get Groq API Key is removed as it's now handled by Cloud Functions

// Retry helper with exponential backoff and model fallback for 503/429/404 errors
// Call our secure Cloud Function proxy
export async function callGroqWithRetry(apiKey, prompt, usageType, modelName) {
  try {
    const aiProxy = httpsCallable(functions, 'aiProxy');
    const payload = { prompt };
    
    const knownUsageTypes = ['roadmap', 'ai_question', 'mentor_message'];
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

// 1. Generate Course using Gemini API (or Groq)
export async function generateCourseAndSave(userId, topic, level, preferences = {}) {
  const normalizedTopic = topic.toLowerCase().trim();
  const coursesCol = collection(db, 'courses');

  const isCustomized = Object.keys(preferences).length > 0 && Object.values(preferences).some(val => {
    return val && 
           val !== 'Standard' && 
           val !== 'Theory' && 
           val !== 'General' && 
           val !== 'Academic' && 
           val !== '30m' && 
           val !== '5' && 
           val !== 'Friendly';
  });

  if (!isCustomized) {
    // Check for existing similar course
    const q = query(coursesCol, where('normalizedTopic', '==', normalizedTopic), where('level', '==', level));
    const existingSnap = await getDocs(q);
    
    if (!existingSnap.empty) {
      const existingCourse = existingSnap.docs[0].data();
      
      // Clone the course for the new user
      const clonedCourse = {
        ...existingCourse,
        userId,
        progress: 0,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(coursesCol, clonedCourse);
      await updateUserStats(userId, { activeCoursesCount: increment(1) });
      await logActivity(userId, `Created course: ${clonedCourse.title} (Cloned)`, 'school', 'text-blue-500');
      
      return { id: docRef.id, ...clonedCourse };
    }
  }

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

  const prompt = `You are an expert AI curriculum designer. Build a complete, highly structured learning roadmap for the topic: "${topic}" at difficulty level: "${level}".
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

  const textResponse = await callGroqWithRetry(null, prompt, 'roadmap');

  if (!textResponse) {
    throw new Error('Empty response from Groq API');
  }

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

  let courseData;
  try {
    courseData = JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse AI response as JSON. Raw response:", textResponse);
    throw new Error('Invalid JSON format returned by AI. Please try again.');
  }

  if (!courseData.nodes || !Array.isArray(courseData.nodes)) {
    throw new Error('Invalid course structure returned by AI. Missing nodes. Please try again.');
  }

  // Normalize nodes and edges to ensure unique IDs across the entire app
  const courseIdPrefix = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4) + '-';
  const idMap = new Map();
  
  courseData.nodes.forEach(node => {
    const oldId = parseInt(node.id, 10);
    if (!isNaN(oldId) && !idMap.has(oldId)) {
      idMap.set(oldId, courseIdPrefix + oldId);
    }
  });

  const nodes = courseData.nodes.map((node) => {
    const oldId = parseInt(node.id, 10);
    const newId = idMap.get(oldId) || (courseIdPrefix + oldId);
    // Find if this node has any prerequisites pointing to it (using old IDs from AI)
    const hasPrereq = (courseData.edges || []).some(e => parseInt(e.to, 10) === oldId);
    return {
      ...node,
      id: newId,
      status: hasPrereq ? 'locked' : 'active'
    };
  });

  const edges = (courseData.edges || [])
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

  // Create course object for Firestore
  const newCourse = {
    userId,
    topic: topic,
    normalizedTopic: normalizedTopic,
    title: courseData.title || topic,
    category: '✨ Сгенерировано ИИ',
    level: courseData.level || level,
    hours: courseData.hours || '10h',
    lessonsCount: courseData.lessonsCount || nodes.length * 3,
    gradient: courseData.gradient || 'from-blue-500 to-indigo-600',
    description: courseData.description || `Learning path for ${topic}`,
    nodes,
    edges,
    preferences,
    progress: 0,
    createdAt: new Date().toISOString()
  };

  // Save to Firestore
  const docRef = await addDoc(coursesCol, newCourse);
  
  // Update user stats (increment active courses)
  await updateUserStats(userId, { activeCoursesCount: increment(1) });
  
  // Log activity
  await logActivity(userId, `Created course: ${newCourse.title}`, 'school', 'text-blue-500');

  return { id: docRef.id, ...newCourse };
}

// 1.5 Generate Lesson Content
export async function generateLessonContent(courseId, nodeId, courseTitle, topicLabel, topicDesc, preferences = {}) {

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

  const prompt = `You are an expert tutor. Write a comprehensive, highly detailed lesson in Markdown format for the topic: "${topicLabel}".
This lesson is part of a larger course called "${courseTitle}".
Topic context: ${topicDesc}
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

  // Save the generated content directly to the specific node in Firestore
  const courseRef = doc(db, 'courses', courseId);
  const snap = await getDoc(courseRef);
  if (snap.exists()) {
    const data = snap.data();
    const updatedNodes = data.nodes.map(n => {
      if (String(n.id) === String(nodeId)) {
        return { ...n, content: textResponse };
      }
      return n;
    });
    await updateDoc(courseRef, { nodes: updatedNodes });
  }

  return textResponse;
}


// 2. Fetch User Courses
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
    
    // Add default admin fields
    defaultProfile.isPremium = false;
    defaultProfile.isBanned = false;
    
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
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }
    }
  }
  
  // Ensure default values are populated in the returned object for UI stability
  if (data) {
    if (!data.firstName) data.firstName = 'Learner';
    if (!data.lastName) data.lastName = '';
    if (!data.username) data.username = '';
  }
  
  // Backfill missing fields for old users
  let needsUpdate = false;
  const updates = {};
  if (data.xp === undefined) { updates.xp = 0; needsUpdate = true; data.xp = 0; }
  if (data.level === undefined) { updates.level = 1; needsUpdate = true; data.level = 1; }
  if (data.totalXPEarned === undefined) { updates.totalXPEarned = 0; needsUpdate = true; data.totalXPEarned = 0; }
  
  if (needsUpdate) {
    await updateDoc(userRef, updates);
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
      // Active again on the same calendar day; update timestamp but keep streak
      await updateDoc(userRef, { lastActiveDate: now.toISOString() });
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
  const ALLOWED_FIELDS = ['firstName', 'lastName', 'username', 'displayName', 'bio', 'avatarUrl', 'locale', 'theme'];
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
  const activitiesCol = collection(db, 'users', userId, 'activities');
  await addDoc(activitiesCol, {
    title,
    icon: iconName,
    color: colorClass,
    timestamp: new Date().toISOString()
  });
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

export async function generateELI5Content(originalContent) {

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
  return textResponse.trim();
}

export async function generateRealWorldExample(topicLabel, topicDesc) {

  const currentLocale = localStorage.getItem('yourway-locale');
  let languageName = currentLocale === 'en' ? 'English' : 'Russian';

  const prompt = `You are a career mentor. The student is learning about "${topicLabel}".
Context: ${topicDesc}
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

export async function rebuildGraphForFailedNode(courseId, nodeId) {
  const course = await getCourseById(courseId);
  const failedNode = course.nodes.find(n => String(n.id) === String(nodeId));
  if (!failedNode) return null;

  // Check if a micro-module for this node already exists to avoid duplicates
  const alreadyExists = course.nodes.some(n => n.label.includes(`Работа над ошибками: ${failedNode.label}`));
  if (alreadyExists) return course;

  const newId = Math.max(...course.nodes.map(n => n.id)) + 1;

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

  const microNode = {
    id: newId,
    label: `🔍 Работа над ошибками: ${failedNode.label}`,
    desc: `Автоматически сгенерированный микро-модуль для закрытия пробелов по теме "${failedNode.label}".`,
    hours: '0.5h',
    lessons: 1,
    category: 'Работа над ошибками',
    status: 'active',
    content: aiGeneratedContent
  };

  const updatedEdges = [
    ...course.edges.filter(e => String(e.from) !== String(failedNode.id)),
    { from: parseInt(failedNode.id, 10), to: newId },
    ...course.edges.filter(e => String(e.from) === String(failedNode.id)).map(e => ({ from: newId, to: parseInt(e.to, 10) }))
  ];

  const updatedNodes = course.nodes.map(n => {
    if (String(n.id) === String(failedNode.id)) {
      return { ...n, status: 'completed' };
    }
    const dependsOnFailedNode = course.edges.some(e => String(e.from) === String(failedNode.id) && String(e.to) === String(n.id));
    if (dependsOnFailedNode) {
      return { ...n, status: 'locked' };
    }
    return n;
  });

  const finalNodes = [...updatedNodes, microNode];

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
