const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Sentry = require("@sentry/google-cloud-serverless");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
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
  { id: "first_step", title: "First Step", icon: "👋", xpReward: 20 },
  { id: "explorer_first", title: "Explorer", icon: "🗺️", xpReward: 50 },
  { id: "first_lesson", title: "First Lesson", icon: "📚", xpReward: 40 },
  { id: "first_quiz", title: "First Quiz", icon: "✅", xpReward: 50 },
  { id: "knowledge_seeker", title: "Knowledge Seeker", icon: "🎯", xpReward: 25 },
  { id: "course_creator", title: "Course Creator", icon: "💾", xpReward: 60 },
  { id: "student_5", title: "Student", icon: "📘", xpReward: 100 },
  { id: "learner_25", title: "Learner", icon: "📙", xpReward: 250 },
  { id: "scholar_100", title: "Scholar", icon: "📕", xpReward: 700 },
  { id: "master_student", title: "Master Student", icon: "🎓", xpReward: 1800 },
  { id: "quiz_rookie", title: "Quiz Rookie", icon: "📝", xpReward: 100 },
  { id: "exam_solver", title: "Exam Solver", icon: "🧪", xpReward: 300 },
  { id: "quiz_champion", title: "Quiz Champion", icon: "🏆", xpReward: 1000 },
  { id: "perfect_score_first", title: "Perfect Score", icon: "💯", xpReward: 150 },
  { id: "perfectionist_10", title: "Perfectionist", icon: "🔥", xpReward: 600 },
  { id: "accuracy_master", title: "Accuracy Master", icon: "🎯", xpReward: 1000 },
  { id: "path_builder", title: "Path Builder", icon: "🌱", xpReward: 150 },
  { id: "architect", title: "Architect", icon: "🛣️", xpReward: 500 },
  { id: "explorer_10", title: "Explorer Pro", icon: "🌍", xpReward: 350 },
  { id: "knowledge_network", title: "Knowledge Network", icon: "🚀", xpReward: 400 },
  { id: "completionist_10", title: "Completionist", icon: "🧩", xpReward: 1500 },
  { id: "curious_mind", title: "Curious Mind", icon: "💬", xpReward: 150 },
  { id: "ai_explorer", title: "AI Explorer", icon: "🧠", xpReward: 500 },
  { id: "ai_power_user", title: "AI Power User", icon: "⚡", xpReward: 2000 },
  { id: "example_hunter", title: "Example Hunter", icon: "🌟", xpReward: 300 },
  { id: "flash_starter", title: "Flash Starter", icon: "🃏", xpReward: 100 },
  { id: "memory_builder", title: "Memory Builder", icon: "📚", xpReward: 350 },
  { id: "memory_master", title: "Memory Master", icon: "🧠", xpReward: 1200 },
  { id: "spaced_learner", title: "Spaced Learner", icon: "🔁", xpReward: 80 },
  { id: "never_forget", title: "Never Forget", icon: "⏰", xpReward: 500 },
  { id: "streak_3", title: "3-Day Streak", icon: "🔥", xpReward: 80 },
  { id: "streak_7_ach", title: "7-Day Streak", icon: "🔥", xpReward: 150 },
  { id: "streak_14", title: "14-Day Streak", icon: "🔥", xpReward: 300 },
  { id: "streak_30", title: "30-Day Streak", icon: "🔥", xpReward: 700 },
  { id: "streak_100", title: "100-Day Streak", icon: "🔥", xpReward: 2500 },
  { id: "streak_365", title: "365-Day Legend", icon: "♾️", xpReward: 10000 },
  { id: "xp_100", title: "First 100 XP", icon: "⭐", xpReward: 50 },
  { id: "xp_500", title: "500 XP", icon: "⭐", xpReward: 100 },
  { id: "xp_1000", title: "1000 XP", icon: "⭐", xpReward: 150 },
  { id: "xp_5000", title: "5000 XP", icon: "⭐", xpReward: 500 },
  { id: "xp_10000", title: "10000 XP", icon: "⭐", xpReward: 1200 },
  { id: "xp_50000", title: "50000 XP", icon: "⭐", xpReward: 5000 },
  { id: "level_5_ach", title: "Level 5", icon: "🌟", xpReward: 150 },
  { id: "level_10", title: "Level 10", icon: "🌟", xpReward: 300 },
  { id: "level_25", title: "Level 25", icon: "🌟", xpReward: 800 },
  { id: "level_50", title: "Level 50", icon: "🌟", xpReward: 2500 },
  { id: "dashboard_explorer", title: "Dashboard Explorer", icon: "🧭", xpReward: 20 },
  { id: "settings_master", title: "Settings Master", icon: "⚙️", xpReward: 20 },
  { id: "polyglot", title: "Polyglot", icon: "🌐", xpReward: 40 },
  { id: "night_owl", title: "Night Owl", icon: "🌙", xpReward: 30 },
  { id: "progress_tracker", title: "Progress Tracker", icon: "📈", xpReward: 50 },
  { id: "speed_runner", title: "Speed Runner", icon: "⚡", xpReward: 120 },
  { id: "never_give_up", title: "Never Give Up", icon: "🚫", xpReward: 200 },
  { id: "dedicated", title: "Dedicated", icon: "🎯", xpReward: 350 },
  { id: "weekend_warrior", title: "Weekend Warrior", icon: "📅", xpReward: 300 },
  { id: "early_bird", title: "Early Bird", icon: "🌅", xpReward: 400 },
  { id: "night_coder", title: "Night Coder", icon: "🌙", xpReward: 400 },
  { id: "roadmap_legend", title: "Roadmap Legend", icon: "🏆", xpReward: 10000 },
  { id: "knowledge_king", title: "Knowledge King", icon: "👑", xpReward: 15000 },
  { id: "completionist_all", title: "Completionist", icon: "💎", xpReward: 25000 }
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
    enforceAppCheck: true,
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

    const { prompt, usageType, modelName } = request.data;
    if (!prompt) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'prompt' argument."
      );
    }

    const userId = request.auth.uid;
    let currentUsage = null;
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

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
          lastQuestionDate: data.lastQuestionDate || todayStr,
          mentorMessagesUsed: data.lastMentorDate === todayStr ? (data.mentorMessagesUsed || 0) : 0,
          lastMentorDate: data.lastMentorDate || todayStr,
          mentorMonthStart: data.mentorMonthStart || monthStr,
          ultraTokensUsed: data.ultraTokensUsed || 0
        };
      } else {
        currentUsage = { 
          roadmapsGenerated: 0, 
          aiQuestionsUsed: 0, 
          lastQuestionDate: todayStr,
          mentorMessagesUsed: 0,
          lastMentorDate: todayStr,
          mentorMonthStart: monthStr,
          ultraTokensUsed: 0
        };
      }

      if (plan === 'FREE') {
        const maxRoadmaps = 1;
        const maxAiQuestions = 5;
        
        if (usageType === 'roadmap' && currentUsage.roadmapsGenerated >= maxRoadmaps) {
          throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
        }
        if (usageType === 'ai_question' && currentUsage.aiQuestionsUsed >= maxAiQuestions) {
          throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
        }
        if (usageType === 'mentor_message') {
          // Get user metadata for onboarding check
          const userRecord = await admin.auth().getUser(userId);
          const regTime = new Date(userRecord.metadata.creationTime).getTime();
          const nowTime = Date.now();
          const daysSinceReg = (nowTime - regTime) / (1000 * 60 * 60 * 24);

          const limitVal = daysSinceReg <= 7 ? 20 : 5;
          const mentorUsed = currentUsage.mentorMessagesUsed || 0;
          if (daysSinceReg <= 7) {
            if (mentorUsed >= limitVal) {
              throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
            }
          } else {
            if (currentUsage.lastMentorDate === todayStr && mentorUsed >= limitVal) {
              throw new HttpsError('failed-precondition', 'PLAN_LIMIT_EXCEEDED');
            }
          }
        }
      }

      if (plan === 'ULTRA' && usageType === 'mentor_message') {
        const maxTokens = 300000;
        if ((currentUsage.ultraTokensUsed || 0) >= maxTokens) {
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
    const requestedModel = modelName || request.data.model;
    const modelsToTry = requestedModel 
      ? [requestedModel, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
      : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"];

    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const modelNameStr of modelsToTry) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelNameStr,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const assistantReply = data.choices[0].message.content;
          
          if (usageType && currentUsage) {
            const subRef = db.collection('users').doc(userId).collection('subscription').doc('details');
            if (usageType === 'roadmap') currentUsage.roadmapsGenerated += 1;
            if (usageType === 'ai_question') {
              currentUsage.aiQuestionsUsed = currentUsage.lastQuestionDate === todayStr ? (currentUsage.aiQuestionsUsed + 1) : 1;
              currentUsage.lastQuestionDate = todayStr;
            }
            if (usageType === 'mentor_message') {
              currentUsage.mentorMessagesUsed = currentUsage.lastMentorDate === todayStr ? (currentUsage.mentorMessagesUsed + 1) : 1;
              currentUsage.lastMentorDate = todayStr;
              currentUsage.mentorMonthStart = monthStr;
              
              const subSnap = await subRef.get();
              const plan = subSnap.exists ? (subSnap.data().plan || 'FREE') : 'FREE';
              if (plan === 'ULTRA') {
                const promptTokens = Math.ceil(prompt.length / 4);
                const replyTokens = Math.ceil(assistantReply.length / 4);
                currentUsage.ultraTokensUsed = (currentUsage.ultraTokensUsed || 0) + promptTokens + replyTokens;
              }
            }
            
            await subRef.set(currentUsage, { merge: true });
          }

          return { result: assistantReply };
        } catch (err) {
          lastError = err;
          const errMsg = err.message || "";

          if (
            errMsg.includes("404") ||
            errMsg.includes("not found") ||
            errMsg.includes("NOT_FOUND")
          ) {
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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

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

exports.calculateLevel = calculateLevel;

// ----------------------------------------------------
// Secure awardXP Cloud Function (Transaction Enabled)
// ----------------------------------------------------
exports.awardXP = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const { userId, activityType, details = {}, locale = "en" } = request.data;
  if (!userId || !activityType) {
    throw new HttpsError("invalid-argument", "Missing userId or activityType");
  }

  if (request.auth.uid !== userId) {
    throw new HttpsError("permission-denied", "Cannot award XP to another user");
  }

  const userRef = db.collection("users").doc(userId);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const xpHistory = userData.xpHistory || [];

    let amount = 0;
    let reasonKey = "";
    let activityTitle = "";
    let activityIcon = "star";
    let activityColor = "text-primary";

    if (activityType === "quiz_passed") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      const quizRef = userRef.collection("quizResults").doc(String(nodeId));
      const quizDoc = await transaction.get(quizRef);
      if (!quizDoc.exists || !quizDoc.data().passed) {
        throw new HttpsError("failed-precondition", "User has not passed this quiz");
      }

      reasonKey = `quiz_passed_${nodeId}`;
      amount = 25;
      activityTitle = locale === "ru" ? "Пройден тест" : "Passed a quiz";
      activityIcon = "check_circle";
      activityColor = "text-green-500";

    } else if (activityType === "quiz_perfect") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      const quizRef = userRef.collection("quizResults").doc(String(nodeId));
      const quizDoc = await transaction.get(quizRef);
      if (!quizDoc.exists) {
        throw new HttpsError("failed-precondition", "User has not completed this quiz");
      }

      const quizData = quizDoc.data();
      if (!quizData.score || !quizData.total || quizData.score !== quizData.total) {
        throw new HttpsError("failed-precondition", "User did not get a perfect score");
      }

      reasonKey = `quiz_perfect_${nodeId}`;
      amount = 50;
      activityTitle = locale === "ru" ? "Идеальный результат теста" : "Perfect quiz score";
      activityIcon = "emoji_events";
      activityColor = "text-amber-500";

    } else if (activityType === "achievement_unlocked") {
      const { achievementId } = details;
      if (!achievementId) throw new HttpsError("invalid-argument", "Missing achievementId");

      const achDef = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achDef) throw new HttpsError("not-found", "Achievement definition not found");

      const achRef = userRef.collection("achievements").doc(achievementId);
      const achDoc = await transaction.get(achRef);
      if (!achDoc.exists) {
        throw new HttpsError("failed-precondition", "Achievement is not unlocked");
      }

      reasonKey = `achievement_${achievementId}`;
      amount = achDef.xpReward;
      activityTitle = locale === "ru" ? `Достижение: ${achDef.title}` : `Achievement: ${achDef.title}`;
      activityIcon = "emoji_events";
      activityColor = "text-amber-500";

    } else if (activityType === "selection_ask") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      reasonKey = `selection_ask_${nodeId}`;
      amount = 10;
      activityTitle = locale === "ru" ? "ИИ-помощник использован" : "AI Assistant used";
      activityIcon = "auto_awesome";
      activityColor = "text-purple-500";

    } else if (activityType === "slide_completed") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      reasonKey = `slide_completed_${nodeId}`;
      amount = 5;
      activityTitle = locale === "ru" ? "Слайды прочитаны" : "Slides completed";
      activityIcon = "slideshow";
      activityColor = "text-emerald-500";

    } else if (activityType === "code_review_passed") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      reasonKey = `code_review_passed_${nodeId}`;
      amount = 40;
      activityTitle = locale === "ru" ? "AI Code Review пройден" : "AI Code Review passed";
      activityIcon = "code";
      activityColor = "text-blue-500";

    } else if (activityType === "project_verified") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      reasonKey = `project_verified_${nodeId}`;
      amount = 50;
      activityTitle = locale === "ru" ? "AI Проверка проекта пройдена" : "AI Project Verification passed";
      activityIcon = "verified";
      activityColor = "text-sky-500";

    } else if (activityType === "mock_interview_completed") {
      const { nodeId } = details;
      if (!nodeId) throw new HttpsError("invalid-argument", "Missing nodeId");

      reasonKey = `mock_interview_completed_${nodeId}`;
      amount = 100;
      activityTitle = locale === "ru" ? "AI Mock Interview завершено" : "AI Mock Interview completed";
      activityIcon = "record_voice_over";
      activityColor = "text-violet-500";

    } else {
      throw new HttpsError("invalid-argument", "Unsupported activityType");
    }

    const alreadyAwarded = xpHistory.some(h => h.reason === reasonKey);
    if (alreadyAwarded) {
      return {
        success: false,
        message: "XP already awarded",
        userLevelData: calculateLevel(userData.xp || 0)
      };
    }

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

    if (newLevelCalc.current.level > oldLevelCalc.current.level) {
      updates.level = newLevelCalc.current.level;
    }

    transaction.update(userRef, updates);

    const activitiesRef = userRef.collection("activities").doc();
    transaction.set(activitiesRef, {
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
});

// ----------------------------------------------------
// Secure unlockAchievement Cloud Function
// ----------------------------------------------------
exports.unlockAchievement = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const { achievementId } = request.data;
  const userId = request.auth.uid;

  if (!achievementId) {
    throw new HttpsError("invalid-argument", "Missing achievementId");
  }

  const achDef = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achDef) {
    throw new HttpsError("not-found", "Achievement definition not found");
  }

  const userRef = db.collection("users").doc(userId);
  const achRef = userRef.collection("achievements").doc(achievementId);

  return db.runTransaction(async (transaction) => {
    const achDoc = await transaction.get(achRef);
    if (achDoc.exists) {
      return { success: false, message: "Achievement already unlocked" };
    }

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User document not found");
    }

    // Set achievement document
    transaction.set(achRef, {
      unlockedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userData = userDoc.data();
    const xpHistory = userData.xpHistory || [];
    const reasonKey = `achievement_${achievementId}`;

    const alreadyAwarded = xpHistory.some(h => h.reason === reasonKey);
    if (!alreadyAwarded) {
      const amount = achDef.xpReward;
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

      if (newLevelCalc.current.level > oldLevelCalc.current.level) {
        updates.level = newLevelCalc.current.level;
      }

      transaction.update(userRef, updates);

      const activitiesRef = userRef.collection("activities").doc();
      transaction.set(activitiesRef, {
        title: `Достижение: ${achDef.title}`,
        icon: achDef.icon || "emoji_events",
        color: "text-amber-500",
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        amountAwarded: amount,
        userLevelData: newLevelCalc,
        oldLevel: oldLevelCalc.current,
        newLevel: newLevelCalc.current
      };
    }

    return { success: true };
  });
});

// ----------------------------------------------------
// Secure updateSubscription Cloud Function
// ----------------------------------------------------
exports.updateSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  // Enforce email verification for subscription plan changes
  if (!request.auth.token.email_verified) {
    throw new HttpsError("permission-denied", "Email must be verified to change your subscription.");
  }

  const { plan } = request.data;
  const userId = request.auth.uid;

  if (!["FREE", "PRO", "ULTRA"].includes(plan)) {
    throw new HttpsError("invalid-argument", "Invalid plan type");
  }

  const subRef = db.collection("users").doc(userId).collection("subscription").doc("details");
  await subRef.set({
    plan,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentVerified: plan !== "FREE"
  }, { merge: true });

  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    isPremium: plan !== "FREE",
    subscriptionPlan: plan === "FREE" ? null : plan
  });

  return { success: true };
});

// ----------------------------------------------------
// Secure deleteUserData Cloud Function
// ----------------------------------------------------
exports.deleteUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  // Enforce email verification for account deletion
  if (!request.auth.token.email_verified) {
    throw new HttpsError("permission-denied", "Email must be verified to delete your account.");
  }

  const userId = request.auth.uid;
  const batch = db.batch();

  // 1. Delete all subcollections of user
  const subcollections = ["subscription", "achievements", "quizResults", "activities", "mentorSessions"];
  for (const sub of subcollections) {
    const snap = await db.collection("users").doc(userId).collection(sub).get();
    snap.forEach(doc => batch.delete(doc.ref));
  }

  // 2. Delete user's courses
  const coursesSnap = await db.collection("courses").where("userId", "==", userId).get();
  coursesSnap.forEach(doc => batch.delete(doc.ref));

  // 3. Delete user document
  batch.delete(db.collection("users").doc(userId));

  await batch.commit();

  // 4. Delete the authentication record
  await admin.auth().deleteUser(userId);

  return { success: true };
});

// ----------------------------------------------------
// Admin Operations
// ----------------------------------------------------

exports.adminUpdateUser = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    // Bootstrap: Allow if database is empty or the user document has role 'admin' in Firestore
    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const isDbAdmin = userSnap.exists && userSnap.data().role === "admin";
    
    if (!isDbAdmin) {
      throw new HttpsError("permission-denied", "Only admins can perform admin operations.");
    }
  }

  const { targetUserId, updates } = request.data;
  if (!targetUserId || !updates) {
    throw new HttpsError("invalid-argument", "Missing targetUserId or updates");
  }

  const allowedKeys = ["isPremium", "subscriptionPlan", "isBanned", "role"];
  const sanitizedUpdates = {};
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  const userRef = db.collection("users").doc(targetUserId);
  await userRef.update(sanitizedUpdates);

  // If role is changing, update claims
  if (sanitizedUpdates.role !== undefined) {
    const isAdmin = sanitizedUpdates.role === "admin";
    await admin.auth().setCustomUserClaims(targetUserId, { admin: isAdmin });
  }

  return { success: true };
});

exports.adminSetMaintenance = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const isDbAdmin = userSnap.exists && userSnap.data().role === "admin";
    if (!isDbAdmin) {
      throw new HttpsError("permission-denied", "Only admins can perform admin operations.");
    }
  }

  const { isActive, endTime } = request.data;
  const maintenanceRef = db.collection("settings").doc("maintenance");

  const updates = {
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (isActive && endTime) {
    updates.endTime = admin.firestore.Timestamp.fromDate(new Date(endTime));
  } else {
    updates.endTime = null;
  }

  await maintenanceRef.set(updates);
  return { success: true };
});

exports.adminSetPolicies = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const isDbAdmin = userSnap.exists && userSnap.data().role === "admin";
    if (!isDbAdmin) {
      throw new HttpsError("permission-denied", "Only admins can perform admin operations.");
    }
  }

  const { terms_ru, terms_en, privacy_ru, privacy_en } = request.data;
  const legalRef = db.collection("settings").doc("legal");

  await legalRef.set({
    terms_ru: terms_ru || "",
    terms_en: terms_en || "",
    privacy_ru: privacy_ru || "",
    privacy_en: privacy_en || ""
  }, { merge: true });

  return { success: true };
});

exports.getAdminDashboardStats = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    const userSnap = await db.collection("users").doc(request.auth.uid).get();
    const isDbAdmin = userSnap.exists && userSnap.data().role === "admin";
    if (!isDbAdmin) {
      throw new HttpsError("permission-denied", "Only admins can access admin statistics.");
    }
  }

  const usersRef = db.collection("users");

  // Get total count
  const totalSnap = await usersRef.count().get();
  const total = totalSnap.data().count;

  // Get premium count
  const premiumSnap = await usersRef.where("isPremium", "==", true).count().get();
  const premium = premiumSnap.data().count;

  // Fetch only necessary fields for active/growth calculation to optimize reads
  const usersProjection = await usersRef.select("createdAt", "lastActiveDate", "isPremium").get();
  
  let online = 0;
  const now = Date.now();
  const activeThreshold = 15 * 60 * 1000;
  const monthCounts = {};

  usersProjection.forEach(doc => {
    const data = doc.data();
    if (data.lastActiveDate) {
      const lastActive = new Date(data.lastActiveDate).getTime();
      if (now - lastActive <= activeThreshold) {
        online++;
      }
    }
    const dateStr = data.createdAt || data.lastActiveDate || new Date().toISOString();
    const monthStr = new Date(dateStr).toLocaleString("ru-RU", { month: "short" });
    monthCounts[monthStr] = (monthCounts[monthStr] || 0) + 1;
  });

  const growthChart = Object.keys(monthCounts).map(month => ({
    name: month,
    users: monthCounts[month]
  }));

  return {
    total,
    premium,
    online,
    growthChart
  };
});

const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const { renderCertificateHtml } = require("./certificateTemplate.js");
const { renderCertificateHtml: renderCertificateHtmlFree } = require("./certificateTemplateFree.js");

exports.generateCertificate = onCall(
  {
    cors: true,
    memory: "1GiB",
    timeoutSeconds: 120,
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Пользователь должен быть авторизован для получения сертификата."
      );
    }

    const userId = request.auth.uid;
    const { courseId } = request.data || {};

    if (!courseId) {
      throw new HttpsError(
        "invalid-argument",
        "Необходимо указать courseId."
      );
    }

    // 1. Check if certificate already generated for (userId, courseId)
    const existingSnap = await db
      .collection("certificates")
      .where("userId", "==", userId)
      .where("courseId", "==", courseId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0].data();
      return {
        success: true,
        fileUrl: existingDoc.fileUrl,
        certId: existingDoc.certId,
        alreadyExisted: true,
      };
    }

    // 2. Fetch course data & user progress
    let courseSnap = await db.collection("users").doc(userId).collection("courses").doc(courseId).get();
    if (!courseSnap.exists) {
      courseSnap = await db.collection("courses").doc(courseId).get();
    }

    if (!courseSnap.exists) {
      throw new HttpsError("not-found", "Курс не найден.");
    }

    const courseData = courseSnap.data();
    const progress = Number(courseData.progress || 0);

    if (progress < 100) {
      throw new HttpsError(
        "failed-precondition",
        "Сертификат выдается только после 100% прохождения курса."
      );
    }

    // 3. Gather student profile info
    const userSnap = await db.collection("users").doc(userId).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const subSnap = await db.collection("users").doc(userId).collection("subscription").doc("details").get();
    const plan = subSnap.exists ? (subSnap.data().plan || "FREE") : "FREE";
    const isFree = plan === "FREE";
    const userName = userData.displayName || userData.name || userData.email?.split("@")[0] || "Студент YourWay";
    const userXp = Number(userData.stats?.xp || userData.xp || 0);
    const userLevelInfo = calculateLevel(userXp);
    const userLevel = userLevelInfo.current.level;

    const courseTitle = courseData.title || courseData.name || "Интерактивный курс";
    const modulesCount = Array.isArray(courseData.modules)
      ? courseData.modules.length
      : Number(courseData.modulesCount || 1);
    const hoursLearned = Number(courseData.estimatedHours || courseData.hoursLearned || Math.ceil(modulesCount * 1.5));

    // 4. Generate certId YW-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const certId = `YW-${year}-${randomCode}`;

    // 5. Generate QR Code
    const verifyUrl = `https://beta.yourwayy.co/verify/${certId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // 6. Render HTML
    const formattedDate = new Date().toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const renderFunc = isFree ? renderCertificateHtmlFree : renderCertificateHtml;
    const htmlContent = renderFunc({
      userName,
      courseName: courseTitle,
      modulesCount,
      hoursLearned,
      userLevel,
      certId,
      issuedAt: formattedDate,
      qrCodeDataUrl,
    });

    // 7. Render PDF with Puppeteer
    let pdfBuffer;
    let browser;
    try {
      const fs = require('fs');
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
        (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : undefined);

      browser = await puppeteer.launch({
        ...(executablePath ? { executablePath } : {}),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
        headless: true,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1473, height: 1079 });
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      if (isFree) {
        pdfBuffer = await page.screenshot({
          type: "png",
          fullPage: true,
        });
      } else {
        pdfBuffer = await page.pdf({
          format: "A4",
          landscape: true,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    // 8. Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileExt = isFree ? "png" : "pdf";
    const contentType = isFree ? "image/png" : "application/pdf";
    const filePath = `certificates/${certId}.${fileExt}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(pdfBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          certId,
          userId,
          courseId,
          tier: plan,
        },
      },
      public: true,
    });

    try {
      await fileRef.makePublic();
    } catch (e) {
      console.warn("Storage makePublic warning:", e.message);
    }
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // 9. Save document to Firestore
    const certDoc = {
      certId,
      userId,
      courseId,
      userName,
      courseName: courseTitle,
      modulesCount,
      hoursLearned,
      userLevel,
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      fileUrl,
      tier: plan,
    };

    await db.collection("certificates").doc(certId).set(certDoc);

    // 10. Increment user stats certificatesCount
    await db.collection("users").doc(userId).set(
      {
        stats: {
          certificatesCount: admin.firestore.FieldValue.increment(1),
        },
      },
      { merge: true }
    );

    return {
      success: true,
      fileUrl,
      certId,
    };
  }
);

