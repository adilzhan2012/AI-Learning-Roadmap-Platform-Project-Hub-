/**
 * sanitizeUserInput.js
 *
 * fix/critical-round1 — защита от prompt injection.
 *
 * Функции:
 *   sanitizeUserInput(text, maxLen?)  — для текстовых полей (topic, topicLabel, submission и т.д.)
 *   sanitizeCode(text, maxLen?)       — для кода (practiceCode): фильтрует только инъекционные
 *                                       паттерны, не трогает легитимные программные конструкции.
 */

export const MAX_INPUT_LENGTH = 2000;
export const MAX_CODE_LENGTH  = 8000;

const INJECTION_PATTERNS = [
  /ignores+(alls+)?(previous|above|prior)s+(instructions?|prompts?|context)/gi,
  /disregards+(alls+)?(previous|above|prior)s+(instructions?|prompts?)/gi,
  /forgets+(alls+)?(previous|above|prior)s+(instructions?|prompts?)/gi,
  /overrides+(thes+)?(system|previous)s+(prompt|instructions?)/gi,
  /yous+ares+nows+(a|an)s+/gi,
  /acts+ass+(a|an)s+/gi,
  /pretends+(tos+be|yous+are)s+/gi,
  /roleplays+ass+/gi,
  /switchs+(tos+)?(developer|jailbreak|DAN)s+mode/gi,
  /DANs+mode/gi,
  /jailbreak/gi,
  /^SYSTEMs*:/gim,
  /^CRITICALs+INSTRUCTIONs*:/gim,
  /^IMPORTANTs*:/gim,
  /[INST]/gi,
  /<<SYS>>/gi,
  /<|system|>/gi,
  /<|im_start|>/gi,
  /(
s*){5,}/g,
];

function stripInjectionPatterns(text) {
  let result = text;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.global) pattern.lastIndex = 0;
    result = result.replace(pattern, '[removed]');
  }
  return result;
}

function normalizeWhitespace(text) {
  return text
    .replace(/[ 	]+$/gm, '')
    .replace(/(?
){3,}/g, '

')
    .trim();
}

export function sanitizeUserInput(text, maxLen = MAX_INPUT_LENGTH) {
  if (!text || typeof text !== 'string') return '';
  let result = text.substring(0, maxLen * 2);
  result = stripInjectionPatterns(result);
  result = normalizeWhitespace(result);
  if (result.length > maxLen) {
    result = result.substring(0, maxLen) + '… [truncated]';
  }
  return result;
}

export function sanitizeCode(code, maxLen = MAX_CODE_LENGTH) {
  if (!code || typeof code !== 'string') return '';
  let result = code.substring(0, maxLen * 2);
  result = stripInjectionPatterns(result);
  if (result.length > maxLen) {
    result = result.substring(0, maxLen) + '
// ... [code truncated for safety]';
  }
  return result;
}
