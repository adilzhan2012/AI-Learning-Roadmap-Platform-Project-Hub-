/**
 * @file index.js
 * @description Public entry point for Prompt Assembler service.
 * Assembles unified system prompts and Gemini messages across global, lesson, and homework modes.
 */

const { BASE_PROMPT } = require('./basePrompt.js');
const { getGlobalPrompt } = require('./modes/globalPrompt.js');
const { getLessonPrompt } = require('./modes/lessonPrompt.js');
const { getHomeworkPrompt } = require('./modes/homeworkPrompt.js');
const { stripActionBlocks } = require('./stripActionBlocks.js');

/**
 * Configurable history depth per mode and subscription plan.
 * Rationale:
 * - global_ULTRA (12): Interactive roadmap briefings take 2-3 questions + answers + module revisions (8-12 messages).
 * - global_PRO / FREE (6): Standard conversational Q&A without inflating token latency.
 * - lesson (6): Focused on immediate lesson clarifications without attention drift.
 * - homework (8): Accommodates multi-step Socratic guidance arcs (hints + student attempts).
 */
const HISTORY_DEPTH = {
  global_ULTRA: 12,
  global_PRO: 6,
  global_FREE: 6,
  lesson: 6,
  homework: 8
};

/**
 * Resolves the history depth for a given context.
 *
 * @param {string} mode
 * @param {string} plan
 * @returns {number}
 */
function getHistoryDepth(mode, plan) {
  if (mode === 'global') {
    return HISTORY_DEPTH[`global_${plan}`] || HISTORY_DEPTH.global_FREE;
  }
  return HISTORY_DEPTH[mode] || 6;
}

/**
 * Assembles the final system prompt and message array for Vertex AI.
 *
 * @param {object} mentorContext - Unified context object from buildMentorContext / server request
 * @param {string} [userQuery] - Current user query if prompt-string format is needed
 * @returns {{ systemPrompt: string, historyMessages: Array<{ role: string, content: string }>, geminiMessages: Array<{ role: string, content: string }>, fullPrompt: string }}
 */
function assembleSystemPrompt(mentorContext, userQuery = '') {
  if (!mentorContext || typeof mentorContext !== 'object') {
    throw new Error('[promptAssembler] mentorContext must be a valid object');
  }

  const mode = mentorContext.mode || 'global';
  const plan = mentorContext.plan || 'FREE';

  // 1. Build mode-specific prompt block
  let modePrompt = '';
  if (mode === 'global') {
    modePrompt = getGlobalPrompt(mentorContext);
  } else if (mode === 'lesson') {
    modePrompt = getLessonPrompt(mentorContext);
  } else if (mode === 'homework') {
    modePrompt = getHomeworkPrompt(mentorContext);
  } else {
    throw new Error(`[promptAssembler] Unknown mentor mode: "${mode}"`);
  }

  // 2. Combine base prompt and mode prompt
  const systemPrompt = `${BASE_PROMPT}\n\n${modePrompt}`;

  // 3. Process conversation history with mode-specific depth & action block stripping
  const rawHistory = Array.isArray(mentorContext.recentHistory) ? mentorContext.recentHistory : [];
  const depth = getHistoryDepth(mode, plan);
  const slicedHistory = rawHistory.slice(-depth);

  const historyMessages = [];
  const historyTextLines = [];

  for (const msg of slicedHistory) {
    if (!msg || !msg.content || msg.id === 'welcome') continue;

    const cleanedContent = stripActionBlocks(msg.content);
    if (!cleanedContent) continue;

    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    historyMessages.push({ role, content: cleanedContent });
    historyTextLines.push(`${role === 'user' ? 'User' : 'Assistant'}: ${cleanedContent}`);
  }

  // 4. Construct Gemini structured messages array (for prompt injection protection)
  const geminiMessages = [
    { role: 'system', content: systemPrompt },
    ...historyMessages
  ];

  if (userQuery) {
    geminiMessages.push({ role: 'user', content: userQuery });
  }

  // 5. Construct full string prompt (for backward compatibility with legacy prompt callers)
  const historyText = historyTextLines.length > 0
    ? historyTextLines.join('\n\n')
    : 'No previous history.';

  const fullPrompt = userQuery
    ? `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser Question: ${userQuery}`
    : `${systemPrompt}\n\nConversation History:\n${historyText}`;

  return {
    systemPrompt,
    historyMessages,
    geminiMessages,
    fullPrompt
  };
}

module.exports = {
  assembleSystemPrompt,
  HISTORY_DEPTH,
  getHistoryDepth
};
