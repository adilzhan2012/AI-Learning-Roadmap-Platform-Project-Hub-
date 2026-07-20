const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Sentry = require("@sentry/google-cloud-serverless");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

admin.initializeApp();

const db = admin.firestore();

// ----------------------------------------------------
// Constants (Duplicated for cloud use)
// ----------------------------------------------------
const LEVELS = [
  { level: 1, title: "Новичок",      xpRequired: 0 },
  { level: 2, title: "Ученик",       xpRequired: 100 },
  { level: 3, title: "Практик",      xpRequired: 300 },
  { level: 4, title: "Знаток",       xpRequired: 700 },
  { level: 5, title: "Эксперт",      xpRequired: 1500 },
  { level: 6, title: "Мастер",       xpRequired: 3000 },
  { level: 7, title: "Архитектор",   xpRequired: 6000 },
  { level: 8, title: "Легенда",      xpRequired: 12000 },
];

const ACHIEVEMENTS = [
  { id: "first_lesson",  title: "Первый шаг",     description: "Пройди первый урок",               icon: "🎯", xpReward: 50  },
  { id: "perfect_quiz",  title: "Перфекционист",  description: "Получи 100% в квизе",             icon: "💯", xpReward: 75  },
  { id: "streak_7",      title: "Недельный воин", description: "7 дней стрика подряд",            icon: "🔥", xpReward: 100 },
  { id: "first_roadmap", title: "Картограф",      description: "Заверши первый roadmap",          icon: "🗺️", xpReward: 200 },
  { id: "speed_learner", title: "Спринтер",       description: "Пройди 5 уроков за 1 день",      icon: "⚡", xpReward: 100 },
  { id: "deep_diver",    title: "Глубоководный",  description: "Пройди 10 уроков в одном курсе", icon: "🤿", xpReward: 150 },
  { id: "comeback",      title: "Возвращение",    description: "Вернись после 7 дней перерыва",  icon: "👑", xpReward: 50  },
  { id: "level_5",       title: "Эксперт",        description: "Достигни 5-го уровня",           icon: "⭐", xpReward: 300 },
];

const calculateLevel = (xp) => {
  let currentLevel = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
    } else {
      break;
    }
  }
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1) || null;
  return {
    current: currentLevel,
    next: nextLevel,
    progress: nextLevel 
      ? Math.max(0, Math.min(100, ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100))
      : 100
  };
};

// ----------------------------------------------------
// Functions
// ----------------------------------------------------

exports.aiProxy = onCall(
  {
    enforceAppCheck: false,
    maxInstances: 10,
    secrets: ["GROQ_API_KEY"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { prompt, usageType } = request.data;
    if (!prompt) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'prompt' argument."
      );
    }

    const userId = request.auth.uid;
    let currentUsage = null;
    const todayStr = new Date().toISOString().split('T')[0];

    if (usageType) {
      const subRef = db.collection('users').doc(userId).collection('subscription').doc('details');
      const subSnap = await subRef.get();
      let plan = 'FREE';
      
      if (subSnap.exists) {
        const data = subSnap.data();
        plan = data.plan || 'FREE';
        currentUsage = {
          roadmapsGenerated: data.roadmapsGenerated || 0,
          aiQuestionsUsed: data.lastQuestionDate === todayStr ? (data.aiQuestionsUsed || 0) : 0,
          lastQuestionDate: todayStr
        };
      } else {
        currentUsage = { roadmapsGenerated: 0, aiQuestionsUsed: 0, lastQuestionDate: todayStr };
      }

      if (plan === 'FREE') {
        const maxRoadmaps = 2; // from PLAN_LIMITS.FREE
        const maxAiQuestions = 5;
        
        if (usageType === 'roadmap' && currentUsage.roadmapsGenerated >= maxRoadmaps) {
          throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
        }
        if (usageType === 'ai_question' && currentUsage.aiQuestionsUsed >= maxAiQuestions) {
          throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
        }
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "The server is missing the GROQ API KEY configuration."
      );
    }

    let lastError;
    const modelsToTry = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ];

    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const modelName of modelsToTry) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          
          if (usageType && currentUsage) {
            const subRef = db.collection('users').doc(userId).collection('subscription').doc('details');
            if (usageType === 'roadmap') currentUsage.roadmapsGenerated += 1;
            if (usageType === 'ai_question') currentUsage.aiQuestionsUsed += 1;
            
            await subRef.set(currentUsage, { merge: true });
          }

          return { result: data.choices[0].message.content };
        } catch (err) {
          lastError = err;
          const errMsg = err.message || "";

          if (
            errMsg.includes("404") ||
            errMsg.includes("not found") ||
            errMsg.includes("NOT_FOUND")
          ) {
            console.warn(`Model ${modelName} not found, trying next model...`);
            continue;
          }

          const isRetryable =
            errMsg.includes("503") ||
            errMsg.includes("429") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("high demand") ||
            errMsg.includes("overloaded") ||
            errMsg.includes("rate limit");

          if (isRetryable) {
            console.warn(`Model ${modelName} overloaded, trying next model...`);
            continue;
          }

          if (errMsg.includes("Invalid API Key") || errMsg.includes("401")) {
            throw new HttpsError("permission-denied", "Server API Key is invalid.");
          }
          
          break;
        }
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(1.5, attempt) * 3000 + Math.random() * 2000;
        console.warn(
          `All models failed/overloaded. Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error("Groq API Error after all retries and fallbacks:", lastError);
    const finalErrMsg = lastError?.message || "Unknown error";

    if (
      finalErrMsg.includes("503") ||
      finalErrMsg.includes("high demand") ||
      finalErrMsg.includes("UNAVAILABLE") ||
      finalErrMsg.includes("RESOURCE_EXHAUSTED") ||
      finalErrMsg.includes("429")
    ) {
      throw new HttpsError("resource-exhausted", "API is currently overloaded.");
    }

    Sentry.captureException(lastError);
    throw new HttpsError("internal", `Groq API error: ${finalErrMsg}`);
  }
);

// For testing purposes
exports.calculateLevel = calculateLevel;

exports.awardXP = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { userId, activityType, details = {}, locale = "en" } = request.data;
  if (!userId || !activityType) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'userId' and 'activityType' arguments."
    );
  }

  // Prevent users from awarding XP to other users
  if (request.auth.uid !== userId) {
    throw new HttpsError(
      "permission-denied",
      "You cannot award XP to another user."
    );
  }

  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "User document does not exist.");
  }

  const userData = userDoc.data();
  const xpHistory = userData.xpHistory || [];

  let amount = 0;
  let reasonKey = "";
  let activityTitle = "";
  let activityIcon = "star";
  let activityColor = "text-primary";

  // Validate event and calculate rewards
  if (activityType === "quiz_passed") {
    const { nodeId } = details;
    if (!nodeId) {
      throw new HttpsError("invalid-argument", "Missing 'nodeId' in details.");
    }
    
    // Check if the user really passed the quiz
    const quizRef = db.collection("quizResults").doc(`${userId}_${nodeId}`);
    const quizDoc = await quizRef.get();
    if (!quizDoc.exists || !quizDoc.data().passed) {
      throw new HttpsError("failed-precondition", "User has not passed this quiz.");
    }

    reasonKey = `quiz_passed_${nodeId}`;
    amount = 25;
    activityTitle = locale === "ru" ? "Пройден тест" : "Passed a quiz";
    activityIcon = "check_circle";
    activityColor = "text-green-500";

  } else if (activityType === "quiz_perfect") {
    const { nodeId } = details;
    if (!nodeId) {
      throw new HttpsError("invalid-argument", "Missing 'nodeId' in details.");
    }

    const quizRef = db.collection("quizResults").doc(`${userId}_${nodeId}`);
    const quizDoc = await quizRef.get();
    if (!quizDoc.exists) {
      throw new HttpsError("failed-precondition", "User has not completed this quiz.");
    }

    const quizData = quizDoc.data();
    if (!quizData.score || !quizData.total || quizData.score !== quizData.total) {
      throw new HttpsError("failed-precondition", "User did not get a perfect score.");
    }

    reasonKey = `quiz_perfect_${nodeId}`;
    amount = 50;
    activityTitle = locale === "ru" ? "Идеальный результат теста" : "Perfect quiz score";
    activityIcon = "emoji_events";
    activityColor = "text-amber-500";

  } else if (activityType === "achievement_unlocked") {
    const { achievementId } = details;
    if (!achievementId) {
      throw new HttpsError("invalid-argument", "Missing 'achievementId' in details.");
    }

    const achDef = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achDef) {
      throw new HttpsError("not-found", "Achievement definition not found.");
    }

    // Verify achievement is unlocked in database
    const achRef = db.collection("users").doc(userId).collection("achievements").doc(achievementId);
    const achDoc = await achRef.get();
    if (!achDoc.exists) {
      throw new HttpsError("failed-precondition", "Achievement is not unlocked in the database.");
    }

    reasonKey = `achievement_${achievementId}`;
    amount = achDef.xpReward;
    activityTitle = locale === "ru" 
      ? `Достижение: ${achDef.title}` 
      : `Achievement unlocked: ${achDef.title}`;
    activityIcon = "emoji_events";
    activityColor = "text-amber-500";

  } else if (activityType === "selection_ask") {
    const { nodeId } = details;
    if (!nodeId) throw new HttpsError("invalid-argument", "Missing 'nodeId' in details.");
    
    reasonKey = `selection_ask_${nodeId}`;
    amount = 10;
    activityTitle = locale === "ru" ? "ИИ-помощник использован" : "AI Assistant used";
    activityIcon = "auto_awesome";
    activityColor = "text-purple-500";
    
  } else if (activityType === "slide_completed") {
    const { nodeId } = details;
    if (!nodeId) throw new HttpsError("invalid-argument", "Missing 'nodeId' in details.");
    
    reasonKey = `slide_completed_${nodeId}`;
    amount = 5;
    activityTitle = locale === "ru" ? "Слайды прочитаны" : "Slides completed";
    activityIcon = "slideshow";
    activityColor = "text-emerald-500";

  } else {
    throw new HttpsError("invalid-argument", `Unsupported activityType: ${activityType}`);
  }

  // Check if already awarded (Double-Claim Protection)
  const alreadyAwarded = xpHistory.some(historyItem => historyItem.reason === reasonKey);
  if (alreadyAwarded) {
    return { 
      success: false, 
      message: "XP for this activity has already been awarded.",
      userLevelData: calculateLevel(userData.xp || 0)
    };
  }

  // Calculate new stats
  const oldXp = userData.xp || 0;
  const newXp = oldXp + amount;
  const oldLevelCalc = calculateLevel(oldXp);
  const newLevelCalc = calculateLevel(newXp);

  const updates = {
    xp: admin.firestore.FieldValue.increment(amount),
    totalXPEarned: admin.firestore.FieldValue.increment(amount),
    xpHistory: admin.firestore.FieldValue.arrayUnion({
      amount,
      reason: reasonKey,
      timestamp: new Date().toISOString()
    })
  };

  // Level up trigger
  if (newLevelCalc.current.level > oldLevelCalc.current.level) {
    updates.level = newLevelCalc.current.level;
  }

  // Save updates
  await userRef.update(updates);

  // Log activity in the subcollection
  const activitiesCol = userRef.collection("activities");
  await activitiesCol.add({
    title: activityTitle,
    icon: activityIcon,
    color: activityColor,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    amountAwarded: amount,
    oldLevel: oldLevelCalc.current,
    newLevel: newLevelCalc.current,
    userLevelData: newLevelCalc
  };
});
