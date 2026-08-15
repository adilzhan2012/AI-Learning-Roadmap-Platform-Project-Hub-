/**
 * @file stripActionBlocks.js
 * @description Cleans JSON action blocks (e.g. {"action": "propose_course"}, {"action": "generate_course"})
 * from conversation history so the LLM does not get confused by previous raw JSON payloads.
 */

/**
 * Strips JSON action blocks from message content while preserving surrounding text.
 *
 * @param {string} content - Raw message text
 * @returns {string} Cleaned markdown text without action JSON blocks
 */
function stripActionBlocks(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let cleaned = content;

  // 1. Strip ```json { ... "action": ... } ``` blocks
  const codeBlockRegex = /```json\s*\{[\s\S]*?"action"\s*:[\s\S]*?\}\s*```/g;
  cleaned = cleaned.replace(codeBlockRegex, '');

  // 2. Strip standalone inline JSON action blocks { "action": ... }
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      const candidate = cleaned.substring(firstBrace, lastBrace + 1);
      if (candidate.includes('"action"') && (candidate.includes('"propose_course"') || candidate.includes('"generate_course"'))) {
        cleaned = cleaned.substring(0, firstBrace) + cleaned.substring(lastBrace + 1);
      }
    }
  }

  return cleaned.trim();
}

module.exports = { stripActionBlocks };
