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

/**
 * Паттерны попытки переопределения системного промпта.
 * Используем строки с new RegExp() там, где regex-литерал содержит
 * спецсимволы, которые могут путать парсер (< | >).
 */
const INJECTION_PATTERNS = [
  // Классические injection triggers (EN)
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi,
  /override\s+(the\s+)?(system|previous)\s+(prompt|instructions?)/gi,

  // Классические injection triggers (RU)
  /игнорируй\s+(все\s+)?(предыдущие|прошлые|вышеуказанные)?\s*(инструкции|указания|промпты|правила)/gi,
  /забудь\s+(все\s+)?(предыдущие|прошлые|вышеуказанные)?\s*(инструкции|указания|промпты|правила)/gi,
  /отмени\s+(все\s+)?(предыдущие|прошлые)?\s*(инструкции|указания|промпты|правила)/gi,
  /переопредели\s+(системный|системные)?\s*(промпт|инструкции|правила)/gi,

  // Ролевые переключатели
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /act\s+as\s+(a|an)\s+/gi,
  /pretend\s+(to\s+be|you\s+are)\s+/gi,
  /roleplay\s+as\s+/gi,
  /switch\s+(to\s+)?(developer|jailbreak|DAN)\s+mode/gi,
  /DAN\s+mode/gi,
  /jailbreak/gi,
  /ты\s+теперь\s+/gi,
  /действуй\s+как\s+/gi,
  /притворись\s+/gi,
  /режим\s+(разработчика|джейлбрейк|DAN)/gi,

  // Маркеры структуры промпта
  /^SYSTEM\s*:/gim,
  /^CRITICAL\s+INSTRUCTION\s*:/gim,
  /^IMPORTANT\s*:/gim,
  /^СИСТЕМА\s*:/gim,
  /^КРИТИЧЕСКАЯ\s+ИНСТРУКЦИЯ\s*:/gim,

  // LLM special tokens
  new RegExp('\\[INST\\]', 'gi'),
  new RegExp('<<SYS>>', 'gi'),
  new RegExp('<\\|system\\|>', 'gi'),
  new RegExp('<\\|im_start\\|>', 'gi'),
  new RegExp('<\\|user\\|>', 'gi'),
  new RegExp('<\\|assistant\\|>', 'gi'),

  // Delimiter tags prevention
  new RegExp('<student_submission>', 'gi'),
  new RegExp('</student_submission>', 'gi'),

  // Избыточные переносы строк (> 4 пустых строк подряд) — маскируют структуру промпта
  /(\n\s*){5,}/g,
];

/**
 * Применяет все injection-паттерны к тексту, заменяет на '[removed]'.
 */
function stripInjectionPatterns(text) {
  let result = text;
  for (const pattern of INJECTION_PATTERNS) {
    // Сбрасываем lastIndex для stateful (global) RegExp между вызовами
    if (pattern.global) pattern.lastIndex = 0;
    result = result.replace(pattern, '[removed]');
  }
  return result;
}

/**
 * Нормализует whitespace: схлопывает 3+ пустых строки в одну,
 * убирает trailing spaces.
 */
function normalizeWhitespace(text) {
  return text
    .replace(/[ \t]+$/gm, '')
    .replace(/(\r?\n){3,}/g, '\n\n')
    .trim();
}

/**
 * Санитизирует пользовательский текстовый ввод перед вставкой в AI-промпт.
 * Применяется к: topic, topicLabel, topicDesc, submissionText.
 *
 * @param {string} text
 * @param {number} [maxLen=MAX_INPUT_LENGTH]
 * @returns {string}
 */
export function sanitizeUserInput(text, maxLen = MAX_INPUT_LENGTH) {
  if (!text || typeof text !== 'string') return '';
  let result = text.substring(0, maxLen * 2);
  result = stripInjectionPatterns(result);
  result = normalizeWhitespace(result);
  if (result.length > maxLen) {
    result = result.substring(0, maxLen) + '\u2026 [truncated]';
  }
  return result;
}

/**
 * Санитизирует код студента перед вставкой в AI-промпт.
 * НЕ нормализует whitespace агрессивно (отступы семантически значимы).
 * Фильтрует только injection-паттерны.
 *
 * @param {string} code
 * @param {number} [maxLen=MAX_CODE_LENGTH]
 * @returns {string}
 */
export function sanitizeCode(code, maxLen = MAX_CODE_LENGTH) {
  if (!code || typeof code !== 'string') return '';
  let result = code.substring(0, maxLen * 2);
  result = stripInjectionPatterns(result);
  if (result.length > maxLen) {
    result = result.substring(0, maxLen) + '\n// ... [code truncated for safety]';
  }
  return result;
}
