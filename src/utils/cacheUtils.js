export const CACHE_VERSION = 1;
export const PROMPT_VERSION = 3;

/**
 * Normalizes a string by trimming, converting to lower case, and removing excess whitespace.
 */
export function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes a topic string by removing common filler/stop words in Russian and English
 * to maximize cache hit rate for equivalent topics (e.g. "Курс по React Hooks" -> "react hooks").
 */
export function normalizeTopic(topic) {
  if (!topic) return '';
  let norm = normalizeString(topic);

  const stopWords = [
    /(?:^|\s)курс по(?:\s|$)/gi,
    /(?:^|\s)курс(?:\s|$)/gi,
    /(?:^|\s)обучение(?:\s|$)/gi,
    /(?:^|\s)руководство по(?:\s|$)/gi,
    /(?:^|\s)для начинающих(?:\s|$)/gi,
    /(?:^|\s)для новичков(?:\s|$)/gi,
    /(?:^|\s)с нуля(?:\s|$)/gi,
    /(?:^|\s)с 0(?:\s|$)/gi,
    /(?:^|\s)основы(?:\s|$)/gi,
    /(?:^|\s)course on(?:\s|$)/gi,
    /(?:^|\s)course(?:\s|$)/gi,
    /(?:^|\s)tutorial on(?:\s|$)/gi,
    /(?:^|\s)tutorial(?:\s|$)/gi,
    /(?:^|\s)for beginners(?:\s|$)/gi,
    /(?:^|\s)from scratch(?:\s|$)/gi,
    /(?:^|\s)basics of(?:\s|$)/gi,
    /(?:^|\s)basics(?:\s|$)/gi
  ];

  stopWords.forEach(regex => {
    norm = norm.replace(regex, ' ');
  });

  return norm.trim().replace(/\s+/g, ' ') || normalizeString(topic);
}

/**
 * Builds a deterministic cache key for a course template based on topic, level, preferences, and locale.
 */
export function buildCourseCacheKey(topic, level, preferences = {}, explicitLocale = null) {
  if (
    preferences.ragMode ||
    preferences.isPrivate ||
    preferences.hasUserSourceMaterial ||
    preferences.isPersonalized
  ) {
    return null;
  }

  const normTopic = normalizeTopic(topic);
  const normLevel = normalizeString(level);
  let locale = explicitLocale || 'ru';
  if (!explicitLocale && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    locale = localStorage.getItem('yourway-locale') || 'ru';
  }

  const duration = normalizeString(preferences.duration || preferences.dailyTime || 'default');
  const style = normalizeString(preferences.courseStyle || preferences.tone || 'default');
  const focus = normalizeString(preferences.focus || preferences.goal || 'default');
  const stack = normalizeString(preferences.stack || 'default');

  const rawKey = `course_v${CACHE_VERSION}_p${PROMPT_VERSION}_${locale}_${normTopic}_${normLevel}_${duration}_${style}_${focus}_${stack}`;
  
  // Replace non-alphanumeric unicode chars with underscore for a clean Firestore doc ID
  return rawKey
    .replace(/[^\p{L}\p{N}_-]/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 150);
}

/**
 * Builds a cache key for a lesson content item.
 */
export function buildLessonCacheKey(rawNodeId) {
  return `lesson_node_${rawNodeId}`;
}

/**
 * Logs Cache Hit vs Cache Miss metrics with timestamps.
 */
export function logCacheMetric(type, hit, key) {
  const status = hit ? 'HIT 🎯' : 'MISS ⚡';
  const label = type === 'course' ? '[Course Template Cache]' : '[Lesson Content Cache]';
  console.log(`${label} ${status} | Key: "${key}" | Timestamp: ${new Date().toISOString()}`);
}
