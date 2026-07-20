import { db } from '../firebase.js';
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

// Helper to get Groq API Key (uses env variable directly for monetization billing model)
export function getGroqApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

// Retry helper with exponential backoff and model fallback for 503/429/404 errors
export async function callGroqWithRetry(apiKey, prompt, modelNameOverride = null, maxRetries = 5) {
  let lastError;
  const defaultModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"];
  const modelsToTry = modelNameOverride ? [modelNameOverride, ...defaultModels.filter(m => m !== modelNameOverride)] : defaultModels;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const modelName of modelsToTry) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (err) {
        lastError = err;
        const errMsg = err.message || '';
        
        // If it's a 404 (model not found), try the next model immediately
        if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('NOT_FOUND')) {
          console.warn(`Model ${modelName} not found, trying next model...`);
          continue;
        }

        const isRetryable = errMsg.includes('503') || errMsg.includes('429') 
          || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED')
          || errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('rate limit');
        
        if (isRetryable) {
           console.warn(`Model ${modelName} overloaded, trying next model...`);
           continue; // Try next model
        }
        
        // If it's another error (like auth failure), throw immediately
        if (errMsg.includes('Invalid API Key') || errMsg.includes('401')) {
           throw new Error('MISSING_API_KEY');
        }
        break; // break inner loop, will hit the delay if we haven't thrown
      }
    }
    
    // If we've exhausted all models and it was a retryable error, wait and try again
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(1.5, attempt) * 3000 + Math.random() * 2000;
      console.warn(`All models failed/overloaded. Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error("Groq API Error after all retries and fallbacks:", lastError);
  const finalErrMsg = lastError?.message || "Unknown error";
  
  if (finalErrMsg.includes('503') || finalErrMsg.includes('high demand') || finalErrMsg.includes('UNAVAILABLE') || finalErrMsg.includes('RESOURCE_EXHAUSTED') || finalErrMsg.includes('429')) {
    throw new Error('API_OVERLOADED');
  }
  
  throw new Error(`Groq API error: ${finalErrMsg}`);
}

// 1. Generate Course using Groq API
export async function generateCourseAndSave(userId, topic, level, preferences = {}) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const currentLocale = getLocale();
  let languageName = 'English';
  if (currentLocale === 'ru') languageName = 'Russian';
  if (currentLocale === 'kk') languageName = 'Kazakh';
  if (currentLocale === 'zh') languageName = 'Chinese (Simplified)';

  const prefString = `
Advanced Preferences:
- Duration (Nodes count): ${preferences.duration || 'Standard (6-10 nodes)'}
- Focus: ${preferences.focus || 'Theory'}
- Goal: ${preferences.goal || 'General'}
- Tone: ${preferences.tone || 'Academic'}
- Prerequisites to skip: ${preferences.prerequisites || 'None'}
- Tech Stack: ${preferences.stack || 'Agnostic'}
  `.trim();

  const prompt = `You are an expert AI curriculum designer. Build a complete, highly structured learning roadmap for the topic: "${topic}" at difficulty level: "${level}".
${prefString}

CRITICAL INSTRUCTION: You MUST generate the ENTIRE response (titles, descriptions, labels) in the ${languageName} language.
The response must be a valid JSON object matching this schema:
{
  "title": "A short, professional title for the course",
  "category": "One of: AI Fundamentals, Machine Learning, Deep Learning, NLP, Computer Vision, Software Engineering, General",
  "level": "${level}",
  "hours": "estimated total hours, e.g. '12h'",
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
Ensure:
1. All nodes have a unique sequential numeric id (starting from 1).
2. The edges represent prerequisites (from must be completed before to).
3. The graph must respect the requested duration. Express = 3-5 nodes. Standard = 6-10 nodes. Deep Dive = 12-15 nodes. Edges should form a logical, directed acyclic graph (DAG) representing the learning path.
4. Set the status of the first node (with no prerequisites) to "active" and all other nodes to "locked".
5. Return ONLY the JSON object, with no markdown formatting tags. Do NOT wrap it in \`\`\`json \`\`\`. Do not include any explanations.`;

  const textResponse = await callGroqWithRetry(apiKey, prompt);

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

  // Normalize nodes and edges to ensure integer IDs
  const nodes = courseData.nodes.map((node) => {
    const nodeId = parseInt(node.id, 10);
    // Find if this node has any prerequisites pointing to it
    const hasPrereq = (courseData.edges || []).some(e => parseInt(e.to, 10) === nodeId);
    return {
      ...node,
      id: nodeId,
      status: hasPrereq ? 'locked' : 'active'
    };
  });

  const edges = (courseData.edges || [])
    .map(e => ({
      from: parseInt(e.from, 10),
      to: parseInt(e.to, 10)
    }))
    .filter(e => !isNaN(e.from) && !isNaN(e.to));

  // Create course object for Firestore
  const newCourse = {
    userId,
    title: courseData.title || topic,
    category: courseData.category || 'General',
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
  const coursesCol = collection(db, 'courses');
  const docRef = await addDoc(coursesCol, newCourse);
  
  // Update user stats (increment active courses)
  await updateUserStats(userId, { activeCoursesCount: increment(1) });
  
  // Log activity
  await logActivity(userId, `Created course: ${newCourse.title}`, 'school', 'text-blue-500');

  return { id: docRef.id, ...newCourse };
}

// 1.5 Generate Lesson Content
export async function generateLessonContent(courseId, nodeId, courseTitle, topicLabel, topicDesc, preferences = {}) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const currentLocale = getLocale();
  let languageName = 'English';
  if (currentLocale === 'ru') languageName = 'Russian';
  if (currentLocale === 'kk') languageName = 'Kazakh';
  if (currentLocale === 'zh') languageName = 'Chinese (Simplified)';

  const prefString = `
Advanced Preferences:
- Focus: ${preferences.focus || 'Theory'}
- Goal: ${preferences.goal || 'General'}
- Tone: ${preferences.tone || 'Academic'}
- Tech Stack: ${preferences.stack || 'Agnostic'}
  `.trim();

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
7. CRITICAL: At the very end of the lesson, include 3-5 flashcards for the most important key terms using EXACTLY this text format:
---FLASHCARD---
Term: [Concept Name]
Def: [A concise, 1-2 sentence definition]
---
Make it highly educational, long, and detailed so the user can genuinely learn from it.`;

  const textResponse = await callGroqWithRetry(apiKey, prompt);

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
    const quizResultSnap = await getDoc(doc(db, 'users', userId, 'quizResults', nodeId));
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
      firstName: additionalData.firstName || 'Learner',
      lastName: additionalData.lastName || '',
      username: additionalData.username || '',
      activeCoursesCount: 0,
      hoursLearned: 0,
      certificatesCount: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString()
    };
    await setDoc(userRef, defaultProfile);
    data = defaultProfile;
  } else {
    data = snap.data();
    
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
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }
    }
  }
  
  if (data && !('username' in data)) {
    data.username = '';
  }
  // Simple streak calculator logic
  const now = new Date();
  const lastActive = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
  
  if (lastActive) {
    const diffTime = Math.abs(now - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      // Streak broken
      await updateDoc(userRef, { streakDays: 1, lastActiveDate: now.toISOString() });
      data.streakDays = 1;
    } else if (diffDays === 1 && now.getDate() !== lastActive.getDate()) {
      // Incremented streak
      await updateDoc(userRef, { streakDays: increment(1), lastActiveDate: now.toISOString() });
      data.streakDays += 1;
    }
  } else {
    await updateDoc(userRef, { lastActiveDate: now.toISOString() });
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
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, profileData, { merge: true });
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
  const q = query(activitiesCol, orderBy('timestamp', 'desc'), limit(maxLimit));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function generateELI5Content(originalContent) {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error('MISSING_API_KEY');

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

  const textResponse = await callGroqWithRetry(apiKey, prompt);
  if (!textResponse) throw new Error('Empty response from Groq API');
  return textResponse.trim();
}

export async function generateRealWorldExample(topicLabel, topicDesc) {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error('MISSING_API_KEY');

  const currentLocale = localStorage.getItem('yourway-locale') || 'en';
  let languageName = 'English';
  if (currentLocale === 'ru') languageName = 'Russian';

  const prompt = `You are a career mentor. The student is learning about "${topicLabel}".
Context: ${topicDesc}
Provide exactly ONE highly engaging, mind-blowing, and realistic real-world example of how this specific concept is used in a top tech company (like Netflix, Google, Space X) or in a fascinating real-world scenario.
Keep it to 2-3 sentences max. Do NOT use markdown headings.
CRITICAL INSTRUCTION: Respond entirely in ${languageName}.`;

  const textResponse = await callGroqWithRetry(apiKey, prompt);
  if (!textResponse) throw new Error('Empty response from Groq API');
  return textResponse.trim();
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
