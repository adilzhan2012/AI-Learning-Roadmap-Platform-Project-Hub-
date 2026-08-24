// ============================================================================
// AI Mentor Design System & Theme Tokens (Dual Light / Dark Theme)
// ============================================================================

export const MENTOR_CATEGORY_KEYS = {
  ROADMAP: 'roadmap',
  CONCEPT: 'concept',
  CODE: 'code',
  INTERVIEW: 'interview',
  GENERAL: 'general',
};

/**
 * Category Tokens: Dual Light & Dark Palette
 * Each category includes styling for cards, badges, border highlights, and sidebar dots.
 */
export const CATEGORY_TOKENS = {
  [MENTOR_CATEGORY_KEYS.ROADMAP]: {
    id: MENTOR_CATEGORY_KEYS.ROADMAP,
    icon: 'Compass',
    light: {
      bg: 'bg-indigo-50 hover:bg-indigo-100/70',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      descriptionText: 'text-indigo-700/80',
      badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500 shadow-indigo-300',
      glow: 'rgba(99, 102, 241, 0.25)',
      cardBgHex: 'rgba(238, 242, 255, 0.9)',
      cardBorderHex: 'rgba(199, 210, 254, 1)',
      textHex: '#312E81',
    },
    dark: {
      bg: 'bg-indigo-950/30 hover:bg-indigo-900/40',
      border: 'border-indigo-500/25 hover:border-indigo-500/40',
      text: 'text-indigo-200',
      descriptionText: 'text-indigo-300/70',
      badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400 shadow-indigo-500/50',
      glow: 'rgba(99, 102, 241, 0.35)',
      cardBgHex: 'rgba(30, 27, 75, 0.35)',
      cardBorderHex: 'rgba(99, 102, 241, 0.3)',
      textHex: '#C7D2FE',
    },
  },
  [MENTOR_CATEGORY_KEYS.CONCEPT]: {
    id: MENTOR_CATEGORY_KEYS.CONCEPT,
    icon: 'Lightbulb',
    light: {
      bg: 'bg-cyan-50 hover:bg-cyan-100/70',
      border: 'border-cyan-200',
      text: 'text-cyan-900',
      descriptionText: 'text-cyan-700/80',
      badgeBg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      dot: 'bg-cyan-500 shadow-cyan-300',
      glow: 'rgba(6, 182, 212, 0.25)',
      cardBgHex: 'rgba(236, 254, 255, 0.9)',
      cardBorderHex: 'rgba(165, 243, 252, 1)',
      textHex: '#164E63',
    },
    dark: {
      bg: 'bg-cyan-950/30 hover:bg-cyan-900/40',
      border: 'border-cyan-500/25 hover:border-cyan-500/40',
      text: 'text-cyan-200',
      descriptionText: 'text-cyan-300/70',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400 shadow-cyan-500/50',
      glow: 'rgba(6, 182, 212, 0.35)',
      cardBgHex: 'rgba(8, 51, 68, 0.35)',
      cardBorderHex: 'rgba(6, 182, 212, 0.3)',
      textHex: '#A5F3FC',
    },
  },
  [MENTOR_CATEGORY_KEYS.CODE]: {
    id: MENTOR_CATEGORY_KEYS.CODE,
    icon: 'Code2',
    light: {
      bg: 'bg-emerald-50 hover:bg-emerald-100/70',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      descriptionText: 'text-emerald-700/80',
      badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 shadow-emerald-300',
      glow: 'rgba(16, 185, 129, 0.25)',
      cardBgHex: 'rgba(236, 253, 245, 0.9)',
      cardBorderHex: 'rgba(167, 243, 208, 1)',
      textHex: '#064E3B',
    },
    dark: {
      bg: 'bg-emerald-950/30 hover:bg-emerald-900/40',
      border: 'border-emerald-500/25 hover:border-emerald-500/40',
      text: 'text-emerald-200',
      descriptionText: 'text-emerald-300/70',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-emerald-500/50',
      glow: 'rgba(16, 185, 129, 0.35)',
      cardBgHex: 'rgba(6, 78, 59, 0.35)',
      cardBorderHex: 'rgba(16, 185, 129, 0.3)',
      textHex: '#A7F3D0',
    },
  },
  [MENTOR_CATEGORY_KEYS.INTERVIEW]: {
    id: MENTOR_CATEGORY_KEYS.INTERVIEW,
    icon: 'Target',
    light: {
      bg: 'bg-amber-50 hover:bg-amber-100/70',
      border: 'border-amber-200',
      text: 'text-amber-900',
      descriptionText: 'text-amber-700/80',
      badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 shadow-amber-300',
      glow: 'rgba(245, 158, 11, 0.25)',
      cardBgHex: 'rgba(254, 243, 199, 0.9)',
      cardBorderHex: 'rgba(253, 230, 138, 1)',
      textHex: '#78350F',
    },
    dark: {
      bg: 'bg-amber-950/30 hover:bg-amber-900/40',
      border: 'border-amber-500/25 hover:border-amber-500/40',
      text: 'text-amber-200',
      descriptionText: 'text-amber-300/70',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400 shadow-amber-500/50',
      glow: 'rgba(245, 158, 11, 0.35)',
      cardBgHex: 'rgba(69, 26, 3, 0.35)',
      cardBorderHex: 'rgba(245, 158, 11, 0.3)',
      textHex: '#FDE68A',
    },
  },
  [MENTOR_CATEGORY_KEYS.GENERAL]: {
    id: MENTOR_CATEGORY_KEYS.GENERAL,
    icon: 'Sparkles',
    light: {
      bg: 'bg-pink-50 hover:bg-pink-100/70',
      border: 'border-pink-200',
      text: 'text-pink-900',
      descriptionText: 'text-pink-700/80',
      badgeBg: 'bg-pink-100 text-pink-700 border-pink-200',
      dot: 'bg-pink-500 shadow-pink-300',
      glow: 'rgba(236, 72, 153, 0.25)',
      cardBgHex: 'rgba(253, 242, 248, 0.9)',
      cardBorderHex: 'rgba(251, 207, 232, 1)',
      textHex: '#831843',
    },
    dark: {
      bg: 'bg-pink-950/30 hover:bg-pink-900/40',
      border: 'border-pink-500/25 hover:border-pink-500/40',
      text: 'text-pink-200',
      descriptionText: 'text-pink-300/70',
      badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      dot: 'bg-pink-400 shadow-pink-500/50',
      glow: 'rgba(236, 72, 153, 0.35)',
      cardBgHex: 'rgba(80, 7, 36, 0.35)',
      cardBorderHex: 'rgba(236, 72, 153, 0.3)',
      textHex: '#FBCFE8',
    },
  },
};

/**
 * Neutral UI Tokens: Non-category specific interface styles
 */
export const NEUTRAL_TOKENS = {
  light: {
    modalOverlay: 'bg-black/30 backdrop-blur-md',
    modalBg: 'bg-white/95 border-zinc-200 text-zinc-900 shadow-2xl backdrop-blur-xl',
    headerBg: 'bg-zinc-50/80 border-b border-zinc-200',
    sidebarBg: 'bg-zinc-50 border-r border-zinc-200',
    chatAreaBg: 'bg-white',
    footerBg: 'bg-zinc-50 border-t border-zinc-200 text-zinc-500',
    newChatBtn: 'bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-300/80 shadow-sm',
    sessionActive: 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold',
    sessionInactive: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 border-transparent',
    userBubble: 'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm',
    assistantBubble: 'bg-transparent text-zinc-900',
    inputContainer: 'bg-zinc-50/90 border-zinc-300/80 focus-within:border-indigo-500 focus-within:bg-white',
    inputField: 'bg-transparent text-zinc-900 placeholder:text-zinc-400 caret-zinc-900',
    sendBtnActive: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20',
    sendBtnDisabled: 'bg-zinc-200 text-zinc-400 cursor-not-allowed',
    progressBarBg: 'bg-zinc-200',
    progressBarFill: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    toggleBtn: 'hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900',
    subtleBorder: 'border-zinc-200',
  },
  dark: {
    modalOverlay: 'bg-black/65 backdrop-blur-md',
    modalBg: 'bg-[#18181B]/95 border-zinc-800/80 text-zinc-100 shadow-2xl backdrop-blur-xl',
    headerBg: 'bg-[#18181B] border-b border-zinc-800/80',
    sidebarBg: 'bg-[#131316] border-r border-zinc-800/80',
    chatAreaBg: 'bg-[#0E0E11]',
    footerBg: 'bg-[#131316] border-t border-zinc-800/80 text-zinc-400',
    newChatBtn: 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-sm hover:border-zinc-600',
    sessionActive: 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300 font-semibold',
    sessionInactive: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border-transparent',
    userBubble: 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50 shadow-sm',
    assistantBubble: 'bg-transparent text-zinc-100',
    inputContainer: 'bg-zinc-900/90 border-zinc-800 focus-within:border-indigo-500/70 focus-within:bg-[#131316]',
    inputField: 'bg-transparent text-zinc-100 placeholder:text-zinc-500 caret-zinc-100',
    sendBtnActive: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
    sendBtnDisabled: 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
    progressBarBg: 'bg-zinc-800',
    progressBarFill: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    toggleBtn: 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100',
    subtleBorder: 'border-zinc-800/80',
  },
};

/**
 * Quick Prompts for Empty State (2x2 Grid)
 */
export const QUICK_PROMPTS = [
  {
    id: 'roadmap',
    category: MENTOR_CATEGORY_KEYS.ROADMAP,
    title: { ru: 'Построить Roadmap', en: 'Build Roadmap' },
    description: { ru: 'Пошаговый план изучения темы с нуля', en: 'Step-by-step learning path from scratch' },
    promptText: {
      ru: 'Составь подробный roadmap и план обучения для темы: ',
      en: 'Create a comprehensive roadmap and study plan for: '
    },
  },
  {
    id: 'concept',
    category: MENTOR_CATEGORY_KEYS.CONCEPT,
    title: { ru: 'Разобрать концепцию', en: 'Explain Concept' },
    description: { ru: 'Понятное объяснение сложной темы с аналогиями', en: 'Intuitive explanation with practical analogies' },
    promptText: {
      ru: 'Объясни мне простыми словами и примерами, как работает: ',
      en: 'Explain simply with practical examples how this works: '
    },
  },
  {
    id: 'code',
    category: MENTOR_CATEGORY_KEYS.CODE,
    title: { ru: 'Код-ревью и баги', en: 'Code Review & Bugs' },
    description: { ru: 'Анализ ошибки, оптимизация и лучшие практики', en: 'Debug errors, optimize code and apply best practices' },
    promptText: {
      ru: 'Помоги найти ошибку и сделать ревью этого кода:\n\n```\n// Вставь код сюда\n```',
      en: 'Help me debug and review this code:\n\n```\n// Paste code here\n```'
    },
  },
  {
    id: 'interview',
    category: MENTOR_CATEGORY_KEYS.INTERVIEW,
    title: { ru: 'Тестовое собеседование', en: 'Mock Interview' },
    description: { ru: '3 контрольных вопроса по твоей специальности', en: '3 deep questions to assess your skill level' },
    promptText: {
      ru: 'Проведи для меня мини-собеседование: задай 3 вопроса уровня Middle по теме ',
      en: 'Conduct a mini mock interview: ask 3 Middle-level questions about '
    },
  },
];

/**
 * Heuristic detector for session titles to assign an appropriate category color dot
 */
export function getSessionCategory(title = '') {
  const lower = (title || '').toLowerCase();
  if (
    lower.includes('роудмап') ||
    lower.includes('roadmap') ||
    lower.includes('план') ||
    lower.includes('курс') ||
    lower.includes('изучение') ||
    lower.includes('путь')
  ) {
    return MENTOR_CATEGORY_KEYS.ROADMAP;
  }
  if (
    lower.includes('объясни') ||
    lower.includes('теория') ||
    lower.includes('что такое') ||
    lower.includes('концепц') ||
    lower.includes('архитектур')
  ) {
    return MENTOR_CATEGORY_KEYS.CONCEPT;
  }
  if (
    lower.includes('код') ||
    lower.includes('ошибк') ||
    lower.includes('баг') ||
    lower.includes('react') ||
    lower.includes('javascript') ||
    lower.includes('typescript') ||
    lower.includes('python') ||
    lower.includes('golang') ||
    lower.includes('go') ||
    lower.includes('ревью') ||
    lower.includes('function')
  ) {
    return MENTOR_CATEGORY_KEYS.CODE;
  }
  if (
    lower.includes('собеседован') ||
    lower.includes('interview') ||
    lower.includes('тест') ||
    lower.includes('вопрос') ||
    lower.includes('middle') ||
    lower.includes('junior') ||
    lower.includes('senior')
  ) {
    return MENTOR_CATEGORY_KEYS.INTERVIEW;
  }
  return MENTOR_CATEGORY_KEYS.GENERAL;
}

/**
 * Returns category visual tokens for a given title or category key
 */
export function getCategoryTokens(categoryOrTitle, isDark = true) {
  let categoryKey = categoryOrTitle;
  if (!CATEGORY_TOKENS[categoryKey]) {
    categoryKey = getSessionCategory(categoryOrTitle);
  }
  const categoryConfig = CATEGORY_TOKENS[categoryKey] || CATEGORY_TOKENS[MENTOR_CATEGORY_KEYS.GENERAL];
  const mode = isDark ? 'dark' : 'light';
  return {
    id: categoryConfig.id,
    icon: categoryConfig.icon,
    ...categoryConfig[mode],
  };
}
