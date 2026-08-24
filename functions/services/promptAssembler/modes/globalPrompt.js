/**
 * @file globalPrompt.js
 * @description Generates system prompt for the GLOBAL mentor mode (floating widget / main chat).
 * Includes tier-specific course generation abilities (Ultra interactive briefing, Pro direct draft, Free refusal).
 */

/**
 * Tools available for the global mentor in Vertex AI Gemini API.
 */
const GLOBAL_MENTOR_TOOLS = [
  {
    type: "function",
    function: {
      name: "propose_course",
      description: "Propose a tailored learning roadmap or course syllabus to the user with a module outline and pacing. Call this when drafting, suggesting, or showing a course structure before final confirmation.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic or subject of the course (e.g. 'Go для backend-разработки')"
          },
          difficulty: {
            type: "string",
            enum: ["Beginner", "Intermediate", "Advanced"],
            description: "The difficulty level of the course"
          },
          modules: {
            type: "array",
            items: { type: "string" },
            description: "List of proposed course modules or syllabus chapters"
          },
          preferences: {
            type: "object",
            properties: {
              dailyTime: { type: "string", description: "e.g. '30m' or '45m'" },
              duration: { type: "string", description: "e.g. '1 month' or '3 months'" },
              courseStyle: { type: "string", description: "e.g. 'Friendly' or 'Practical'" },
              prerequisites: { type: "string", description: "Prerequisite skills" }
            },
            description: "Learning preferences and schedule"
          }
        },
        required: ["topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_course",
      description: "Trigger the actual generation and launch of the knowledge graph course. Call this ONLY after the user explicitly confirms the proposed syllabus or requests immediate course creation.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The confirmed topic of the course"
          },
          difficulty: {
            type: "string",
            enum: ["Beginner", "Intermediate", "Advanced"],
            description: "The difficulty level of the course"
          },
          preferences: {
            type: "object",
            properties: {
              dailyTime: { type: "string" },
              duration: { type: "string" },
              courseStyle: { type: "string" },
              prerequisites: { type: "string" }
            },
            description: "Confirmed user preferences"
          }
        },
        required: ["topic"]
      }
    }
  }
];

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
1. CRITICAL: You MUST FIRST guide them through an interactive briefing. Ask 2-3 clarifying questions about their background, their schedule, and their exact goals. Do NOT call propose_course or generate_course until they have answered your questions.
2. ONLY AFTER they have provided these details, suggest a customized course pacing and list of modules by calling the tool "propose_course". Ask them if the modules look good or if they want to adjust anything.
3. Once they explicitly confirm they are happy with the draft structure, call the tool "generate_course" to launch automatic course generation.`;
  }

  if (plan === 'PRO') {
    return `
PRO SUBSCRIBER ABILITY - DIRECT COURSE PROPOSAL:
If the user asks to create a course or learn a topic (e.g. "составь курс по React"):
1. Immediately call the tool "propose_course" with the proposed course syllabus and settings.
2. In text, tell them you generated a standard roadmap for them. Add a note: "Подсказка: На подписке **ULTRA** я могу провести персональный бриф из 3 вопросов и подстроить программу под твой график и стек."`;
  }

  // FREE plan
  return `
FREE PLAN LIMITATION - COURSE CREATION RESTRICTION:
If the user asks to create, design, compose, or write a course syllabus, roadmap, or study plan (e.g., "составь курс", "сделай программу обучения"):
You MUST politely refuse to draft or write the syllabus. Explain that personalized course generation, interactive syllabus briefings, and materials-based roadmaps (RAG) are exclusive to PRO and ULTRA plans. Suggest they upgrade to PRO or ULTRA to unlock this capability. Do NOT call propose_course or generate_course tools.`;
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

module.exports = { getGlobalPrompt, getPlanCourseInstruction, GLOBAL_MENTOR_TOOLS };
