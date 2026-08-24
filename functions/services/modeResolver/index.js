/**
 * @file index.js
 * @description Deterministic keyword & title matching Mode Resolver.
 * Dynamically switches from global to lesson mode when a user explicitly refers
 * to an enrolled course lesson in their query.
 */

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[«»""''.,!?:;()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves mentor execution mode based on user query and active enrolled courses.
 *
 * @param {string} userQuery - The incoming user prompt text
 * @param {string} currentMode - 'global' | 'lesson' | 'homework'
 * @param {string|null} currentContextId - Existing contextId
 * @param {object} [userProfile] - User profile with enrolledCourses
 * @returns {{ mode: string, contextId: string|null, lessonTitle?: string|null, lessonContent?: string|null }}
 */
function resolveMode(userQuery, currentMode = 'global', currentContextId = null, userProfile = null) {
  // 1. Resolver only operates for global mode; homework and lesson modes are preserved strictly.
  if (currentMode !== 'global') {
    return { mode: currentMode, contextId: currentContextId, lessonTitle: null };
  }

  if (!userQuery || typeof userQuery !== 'string') {
    return { mode: currentMode, contextId: currentContextId, lessonTitle: null };
  }

  const enrolledCourses = userProfile?.enrolledCourses;
  if (!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) {
    return { mode: currentMode, contextId: currentContextId, lessonTitle: null };
  }

  const normalizedQuery = normalizeText(userQuery);
  if (!normalizedQuery) {
    return { mode: currentMode, contextId: currentContextId, lessonTitle: null };
  }

  // Common intent prefix indicators
  const hasLessonIntent = /(?:урок|уроку|уроке|тема|теме|тему|узел|модуль|модуле|модулю|объясни|разбери|помоги с|не понял|не понимаю|вопрос по)/i.test(normalizedQuery);

  // 2. Iterate enrolled courses and their nodes
  let bestMatch = null;
  let maxMatchLength = 0;

  for (const course of enrolledCourses) {
    const nodes = Array.isArray(course.nodes) ? course.nodes : [];
    for (const node of nodes) {
      const nodeLabel = node.label || node.title || '';
      const normalizedLabel = normalizeText(nodeLabel);

      if (normalizedLabel.length >= 3) {
        // Direct match: the entire lesson label is found in the user query
        if (normalizedQuery.includes(normalizedLabel)) {
          if (normalizedLabel.length > maxMatchLength) {
            maxMatchLength = normalizedLabel.length;
            bestMatch = {
              nodeId: node.id,
              label: nodeLabel,
              content: node.content || null
            };
          }
        } else if (hasLessonIntent) {
          // If explicit lesson intent is present, check significant words of the label (length >= 4)
          const labelWords = normalizedLabel.split(' ').filter(w => w.length >= 4);
          const matchedWords = labelWords.filter(w => normalizedQuery.includes(w));
          const matchRatio = labelWords.length > 0 ? (matchedWords.length / labelWords.length) : 0;
          if (matchedWords.length >= 2 || (labelWords.length === 1 && matchedWords.length === 1) || matchRatio >= 0.5) {
            if (normalizedLabel.length > maxMatchLength) {
              maxMatchLength = normalizedLabel.length;
              bestMatch = {
                nodeId: node.id,
                label: nodeLabel,
                content: node.content || null
              };
            }
          }
        }
      }
    }
  }

  if (bestMatch) {
    return {
      mode: 'lesson',
      contextId: bestMatch.nodeId,
      lessonTitle: bestMatch.label,
      lessonContent: bestMatch.content
    };
  }

  return {
    mode: currentMode,
    contextId: currentContextId,
    lessonTitle: null
  };
}

module.exports = {
  resolveMode,
  normalizeText
};
