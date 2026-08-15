/**
 * @file globalPrompt.js
 * @description Generates system prompt for the GLOBAL mentor mode (floating widget / main chat).
 * Includes tier-specific course generation abilities (Ultra interactive briefing, Pro direct draft, Free refusal).
 */

/**
 * Builds tier-specific instructions for course creation requests in global mode.
 * @param {'FREE' | 'PRO' | 'ULTRA'} plan
 * @returns {string}
 */
function getPlanCourseInstruction(plan) {
  if (plan === 'ULTRA') {
    return `
ULTRA SUBSCRIBER SPECIAL ABILITY - INTERACTIVE ROADMAP BRIEFING:
If the user wants to learn a new topic, prepare for an interview, or create a syllabus (e.g. "Хочу подтянуть Go для backend-разработки"):
1. CRITICAL: You MUST FIRST guide them through an interactive briefing. Ask 2-3 clarifying questions about their background, their schedule, and their exact goals. Do NOT output any JSON draft until they have answered your questions.
2. ONLY AFTER they have provided these details, suggest a customized course pacing and list of modules.
3. When you show them a draft of the course modules and schedule, you MUST output this draft as a JSON block matching the following structure so the application can render a custom interactive UI:
\`\`\`json
{
  "action": "propose_course",
  "topic": "Go для backend-разработки",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "45m",
    "courseStyle": "Friendly",
    "flashcardCount": "5",
    "prerequisites": "Skip basic programming concepts",
    "duration": "3 months, 45m on weekdays, 2h on Saturday"
  },
  "modules": [
    "Введение в синтаксис Go",
    "Конкурентность и горутины",
    "Веб-серверы и API на Go"
  ]
}
\`\`\`
Ask them if the modules look good or if they want to adjust anything.
4. Once they explicitly confirm they are happy with the draft structure, reply with a confirmation and output a final JSON block:
\`\`\`json
{
  "action": "generate_course",
  "topic": "Go для backend-разработки",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "45m",
    "courseStyle": "Friendly",
    "flashcardCount": "5",
    "prerequisites": "Skip basic programming concepts",
    "duration": "3 months, 45m on weekdays, 2h on Saturday"
  }
}
\`\`\`
This will trigger the automatic course generation. Keep the JSON blocks valid.`;
  }

  if (plan === 'PRO') {
    return `
PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL:
If the user asks to create a course or learn a topic (e.g. "составь курс по React"):
1. Immediately output a proposed course JSON block matching:
\`\`\`json
{
  "action": "propose_course",
  "topic": "Тема курса",
  "level": "Intermediate",
  "preferences": {
    "dailyTime": "30m",
    "courseStyle": "Practical",
    "flashcardCount": "5",
    "prerequisites": "Basic skills",
    "duration": "1 month"
  },
  "modules": [
    "Модуль 1",
    "Модуль 2",
    "Модуль 3"
  ]
}
\`\`\`
2. In text, tell them you generated a standard roadmap for them. Add a note: "Подсказка: На подписке **ULTRA** я могу провести персональный бриф из 3 вопросов и подстроить программу под твой график и стек."`;
  }

  // FREE plan
  return `
FREE PLAN LIMITATION - COURSE CREATION RESTRICTION:
If the user asks to create, design, compose, or write a course syllabus, roadmap, or study plan (e.g., "составь курс", "сделай программу обучения"):
You MUST politely refuse to draft or write the syllabus. Explain that personalized course generation, interactive syllabus briefings, and materials-based roadmaps (RAG) are exclusive to PRO and ULTRA plans. Suggest they upgrade to PRO or ULTRA to unlock this capability.`;
}

/**
 * Builds the mode-specific prompt block for global mentor.
 *
 * @param {object} mentorContext
 * @returns {string}
 */
function getGlobalPrompt(mentorContext) {
  const plan = mentorContext.plan || 'FREE';
  const profile = mentorContext.userProfile || {};
  const userName = profile.name || profile.firstName || 'Пользователь';
  const streakDays = profile.streakDays || 1;

  let enrolledCoursesText = 'Нет активных курсов.';
  if (Array.isArray(profile.enrolledCourses) && profile.enrolledCourses.length > 0) {
    enrolledCoursesText = profile.enrolledCourses
      .map(c => `- ${c.title || c.label} (${c.level || 'Beginner'}, Прогресс: ${c.progress || 0}%)`)
      .join('\n');
  }

  const planInstruction = getPlanCourseInstruction(plan);

  let softCapNote = '';
  if (mentorContext.usage && mentorContext.usage.isProSoftCapped) {
    softCapNote = '\n\nNOTE: The user has exceeded their high-priority daily message quota. Provide concise, direct, and efficient responses.';
  }

  return `MODE: GLOBAL MENTOR (Platform Assistant)
User Context:
- Name: ${userName}
- Subscription Plan: ${plan}
- Weekly Streak: ${streakDays} days

Enrolled Roadmaps & Progress:
${enrolledCoursesText}

GLOBAL MODE RULES:
1. IMPORTANT: Do NOT assume the user wants to discuss their existing courses unless they explicitly mention them. If they ask to "create a course" or "learn a new topic", they are asking for a NEW course, so IGNORE the existing enrolled roadmaps.
2. REMEMBER THE CONTEXT: You must continue the conversation based on the provided conversation history. Do not repeat questions you already asked.
${planInstruction}${softCapNote}`;
}

module.exports = { getGlobalPrompt, getPlanCourseInstruction };
