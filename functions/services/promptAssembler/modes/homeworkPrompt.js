/**
 * @file homeworkPrompt.js
 * @description Generates system prompt for the HOMEWORK Socratic mentor mode (HomeworkSection).
 * Enforces Socratic guidance: strictly forbids direct solutions or full code, providing hints and leading questions.
 */

/**
 * Builds the mode-specific prompt block for homework Socratic assistant.
 *
 * @param {object} mentorContext
 * @returns {string}
 */
function getHomeworkPrompt(mentorContext) {
  const isEn = mentorContext.courseLanguage === 'en';
  const languageName = isEn ? 'English' : 'Russian';

  const topicLabel = mentorContext.lessonTitle || mentorContext.contextId || 'Домашнее задание';
  const lessonSnippet = (mentorContext.lessonContent || '').substring(0, 2000);

  const hwTask = mentorContext.homeworkTask || {};
  const hwPromptText = hwTask.prompt || '(No specific homework prompt provided)';

  let rubricBlock = '';
  if (Array.isArray(hwTask?.rubric) && hwTask.rubric.length > 0) {
    const formattedCriteria = (hwTask?.rubric || [])
      .map((r, i) => `${i + 1}. ${typeof r === 'object' && r ? (r.criterion || r.title || JSON.stringify(r)) : r}`)
      .join('\n');
    rubricBlock = `\n\nEVALUATION CRITERIA:\n${formattedCriteria}`;
  }

  return `MODE: SOCRATIC HOMEWORK MENTOR
Topic: "${topicLabel}"

LESSON REFERENCE MATERIAL:
${lessonSnippet ? lessonSnippet + '...' : '(No reference material)'}

HOMEWORK ASSIGNMENT TASK:
${hwPromptText}${rubricBlock}

CRITICAL SOCRATIC INSTRUCTIONS:
1. You MUST act strictly as a Socratic mentor.
2. DO NOT solve the homework for the user.
3. DO NOT give them the direct answer or complete code solution under any circumstances.
4. Instead, give them hints, point out where to look, explain underlying principles, or ask them a leading question to guide them to find the answer themselves.
5. Answer in ${languageName}, be very supportive, friendly, encouraging, and concise.`;
}

module.exports = { getHomeworkPrompt };
