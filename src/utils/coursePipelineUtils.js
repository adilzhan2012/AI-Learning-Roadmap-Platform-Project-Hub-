/**
 * Allowlist of valid Tailwind CSS gradients for courses (Item 7)
 */
export const ALLOWED_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-purple-400',
  'from-orange-500 to-amber-400',
  'from-pink-500 to-rose-400',
  'from-sky-500 to-indigo-400',
  'from-purple-600 to-indigo-600',
  'from-teal-400 to-blue-500',
  'from-amber-500 to-red-500'
];

/**
 * Validates generated gradient against allowlist or falls back deterministically (Item 7).
 */
export function validateOrFallbackGradient(gradient, topic = '') {
  if (gradient && ALLOWED_GRADIENTS.includes(gradient.trim())) {
    return gradient.trim();
  }
  // Deterministic fallback based on topic char code sum
  let sum = 0;
  for (let i = 0; i < topic.length; i++) {
    sum += topic.charCodeAt(i);
  }
  return ALLOWED_GRADIENTS[sum % ALLOWED_GRADIENTS.length];
}

/**
 * Sanitizes and moderates image keywords extracted from [IMAGE: Keyword] tags (Item 8).
 */
export function sanitizeImageKeyword(keyword) {
  if (!keyword) return 'Education';
  const clean = String(keyword)
    .replace(/[<>{}[\]\\]/g, '')
    .trim()
    .substring(0, 100);

  // Blacklist of forbidden / harmful search terms
  const forbiddenPatterns = [
    /porn/i, /sex/i, /nude/i, /hate/i, /kill/i, /bomb/i, /weapon/i, /drug/i, /suicide/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(clean)) {
      return 'Education';
    }
  }

  return clean || 'Education';
}

/**
 * Validates lesson content structure (Item 6).
 */
export function validateLessonContent(content) {
  const errors = [];
  if (!content || typeof content !== 'string') {
    return { valid: false, errors: ['Empty lesson content'] };
  }

  // Check 1: Must start with H1 heading or contain at least one H1 (# Heading)
  if (!/^#\s+.+/m.test(content)) {
    errors.push('Missing H1 title heading (# Title)');
  }

  // Check 2: Must contain Practice / Homework section (## Практика or ## Homework)
  if (!/##\s+(Практика|Домашнее задание|Homework|Practice)/i.test(content)) {
    errors.push('Missing Practice section (## Практика / Домашнее задание)');
  }

  // Check 3: Must contain ---FLASHCARD--- block
  if (!/---FLASHCARD---/i.test(content)) {
    errors.push('Missing flashcard blocks (---FLASHCARD---)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Observability logger for Course Generation Pipeline metrics (Item 9).
 */
export function logPipelineMetric(metricName, data = {}) {
  const payload = {
    metric: metricName,
    timestamp: new Date().toISOString(),
    ...data
  };
  console.log(`[Pipeline Metric] ${metricName}:`, payload);
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('pipelineMetric:logged', { detail: payload }));
  }
}
