import { db } from '../firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  orderBy, 
  limit,
  increment,
  serverTimestamp
} from 'firebase/firestore';

// Helper to get Gemini API Key (tries localStorage first, then env)
export function getGeminiApiKey() {
  const localKey = localStorage.getItem('user_gemini_api_key');
  if (localKey && localKey.trim() !== '') {
    return localKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

// 1. Generate Course using Gemini API
export async function generateCourseAndSave(userId, topic, level) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const prompt = `You are an expert AI curriculum designer. Build a complete, highly structured learning roadmap for the topic: "${topic}" at difficulty level: "${level}".
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
3. The graph has at least 6 and at most 10 nodes. Edges should form a logical, directed acyclic graph (DAG) representing the learning path.
4. Set the status of the first node (with no prerequisites) to "active" and all other nodes to "locked".
5. Return ONLY the JSON object, with no markdown formatting tags. Do NOT wrap it in \`\`\`json \`\`\`.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API Error details:", errText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Empty response from Gemini API');
  }

  let courseData;
  try {
    courseData = JSON.parse(textResponse.trim());
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON. Raw response:", textResponse);
    throw new Error('Invalid JSON format returned by AI. Please try again.');
  }

  // Pre-process nodes status (first node is active, rest locked by default)
  const nodes = courseData.nodes.map((node) => {
    // Find if this node has any prerequisites pointing to it
    const hasPrereq = courseData.edges.some(e => e.to === node.id);
    return {
      ...node,
      status: hasPrereq ? 'locked' : 'active'
    };
  });

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
    edges: courseData.edges || [],
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

// 2. Fetch User Courses
export async function getUserCourses(userId) {
  const coursesCol = collection(db, 'courses');
  const q = query(coursesCol, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  let nodeHours = 1;
  const updatedNodes = course.nodes.map(n => {
    if (n.id === nodeId) {
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
      if (node.id !== nodeId) {
        const nodeInUpdatedList = updatedNodes.find(un => un.id === node.id);
        if (nodeInUpdatedList && nodeInUpdatedList.status === 'locked') {
          // Find all prerequisites for this node
          const prereqIds = course.edges.filter(e => e.to === node.id).map(e => e.from);
          const allPrereqsCompleted = prereqIds.every(pid => {
            const pNode = updatedNodes.find(un => un.id === pid);
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

  const nodeLabel = course.nodes.find(n => n.id === nodeId)?.label || `lesson ${nodeId}`;
  
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
export async function getUserStats(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    // Create default profile if not exists
    const defaultProfile = {
      firstName: 'Learner',
      lastName: '',
      activeCoursesCount: 0,
      hoursLearned: 0,
      certificatesCount: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString()
    };
    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  }
  
  const data = snap.data();
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
  const snap = await getDocs(activitiesCol); // Since SDK query constraints are simple, sort in JS
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return docs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxLimit);
}
