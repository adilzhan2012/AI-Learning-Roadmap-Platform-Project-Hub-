export const CACHE_VERSION = 1;

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
 * Builds a deterministic cache key for a course template based on topic, level, preferences, and locale.
 */
export function buildCourseCacheKey(topic, level, preferences = {}) {
  const normTopic = normalizeString(topic);
  const normLevel = normalizeString(level);
  let locale = 'ru';
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    locale = localStorage.getItem('yourway-locale') || 'ru';
  }

  const duration = normalizeString(preferences.duration || preferences.dailyTime || 'default');
  const style = normalizeString(preferences.courseStyle || preferences.tone || 'default');
  const focus = normalizeString(preferences.focus || preferences.goal || 'default');
  const stack = normalizeString(preferences.stack || 'default');

  const rawKey = `course_v${CACHE_VERSION}_${locale}_${normTopic}_${normLevel}_${duration}_${style}_${focus}_${stack}`;
  
  // Replace non-alphanumeric chars with underscore for a clean Firestore doc ID
  return rawKey.replace(/[^a-z0-9_-]/gi, '_').substring(0, 150);
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
