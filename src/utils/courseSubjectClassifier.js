import { 
  Code2, 
  Globe, 
  Brain, 
  Calculator, 
  Palette, 
  Briefcase, 
  Languages, 
  BookOpenCheck, 
  Sparkles 
} from 'lucide-react';

export const SUBJECT_NAMES = {
  PROGRAMMING: 'Программирование',
  WEB: 'Веб-разработка',
  AI: 'Искусственный интеллект',
  MATH: 'Математика',
  DESIGN: 'Дизайн & UX',
  BUSINESS: 'Бизнес & Менеджмент',
  LANGUAGES: 'Языки',
  SCIENCE: 'Науки & Гуманитария',
  OTHER: 'Общее'
};

const KEYWORD_RULES = [
  {
    subject: SUBJECT_NAMES.WEB,
    keywords: [
      'web', 'html', 'css', 'react', 'vue', 'angular', 'next.js', 'nextjs', 'node',
      'nodejs', 'javascript', 'typescript', 'frontend', 'backend', 'fullstack',
      'tailwind', 'express.js', 'django', 'fastapi', 'rest api', 'dom', 'browser',
      'верстк', 'сайт', 'веб', 'фронтенд', 'бэкенд'
    ]
  },
  {
    subject: SUBJECT_NAMES.AI,
    keywords: [
      'artificial intelligence', 'machine learning', 'deep learning',
      'neural', 'nlp', 'computer vision', 'data science', 'llm', 'gemini', 'gpt',
      'transformer', 'нейросеть', 'нейронн', 'искусственн', 'интеллект', 'машинн',
      'обучени', 'дата сайнс', 'модель'
    ],
    wordExactKeywords: ['ai', 'ml']
  },
  {
    subject: SUBJECT_NAMES.PROGRAMMING,
    keywords: [
      'programming', 'python', 'c++', 'cpp', 'c#', 'java', 'rust', 'go', 'golang',
      'swift', 'kotlin', 'algorithm', 'data structure', 'git', 'linux', 'docker',
      'sql', 'postgres', 'database', 'ооп', 'алгоритм', 'программ', 'код',
      'разработк', 'баз данных', 'структур данных'
    ]
  },
  {
    subject: SUBJECT_NAMES.MATH,
    keywords: [
      'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics',
      'probability', 'trigonometry', 'matrix', 'linear algebra', 'дискретн',
      'математик', 'алгебр', 'геометри', 'матанализ', 'статистик', 'вероятност',
      'уравнени', 'дифференциал'
    ]
  },
  {
    subject: SUBJECT_NAMES.DESIGN,
    keywords: [
      'design', 'figma', 'graphic', 'animation', 'blender', '3d',
      'typography', 'photoshop', 'illustrator', 'дизайн', 'интерфейс', 'макет',
      'анимаци', 'график'
    ],
    wordExactKeywords: ['ui', 'ux']
  },
  {
    subject: SUBJECT_NAMES.BUSINESS,
    keywords: [
      'business', 'management', 'marketing', 'finance', 'startup', 'agile',
      'scrum', 'product', 'economics', 'бизнес', 'маркетинг', 'финанс',
      'менеджмент', 'стартап', 'продукт', 'продаж', 'управлени'
    ]
  },
  {
    subject: SUBJECT_NAMES.LANGUAGES,
    keywords: [
      'english', 'spanish', 'german', 'french', 'chinese', 'japanese', 'grammar',
      'vocabulary', 'ielts', 'toefl', 'language', 'английск', 'испанск', 'немецк',
      'язык', 'грамматик', 'словар'
    ]
  },
  {
    subject: SUBJECT_NAMES.SCIENCE,
    keywords: [
      'physics', 'chemistry', 'biology', 'history', 'philosophy', 'astronomy',
      'физик', 'хими', 'биологи', 'истори', 'философи', 'астрономи'
    ]
  }
];

/**
 * Classifies a course into a subject based on topic, title, and node labels.
 */
export function classifyCourseSubject(topic = '', title = '', nodes = []) {
  const combinedText = [
    topic,
    title,
    ...(Array.isArray(nodes) ? nodes.map(n => n.label || n.title || '') : [])
  ].filter(Boolean).join(' ').toLowerCase();

  for (const rule of KEYWORD_RULES) {
    // 1. Check exact word keywords (e.g. 'ai', 'ml', 'ui', 'ux')
    if (rule.wordExactKeywords) {
      for (const ekw of rule.wordExactKeywords) {
        const regex = new RegExp(`\\b${ekw}\\b`, 'i');
        if (regex.test(combinedText)) {
          return rule.subject;
        }
      }
    }

    // 2. Check substring keywords
    for (const kw of rule.keywords) {
      if (combinedText.includes(kw.toLowerCase())) {
        return rule.subject;
      }
    }
  }

  return SUBJECT_NAMES.OTHER;
}

/**
 * Returns visual theme metadata for a subject category.
 */
export function getSubjectTheme(subject) {
  switch (subject) {
    case SUBJECT_NAMES.WEB:
      return {
        subject: SUBJECT_NAMES.WEB,
        borderClass: 'border-t-4 border-t-cyan-500',
        bgBadgeClass: 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
        accentGradient: 'from-cyan-500 to-blue-600',
        icon: Globe
      };
    case SUBJECT_NAMES.PROGRAMMING:
      return {
        subject: SUBJECT_NAMES.PROGRAMMING,
        borderClass: 'border-t-4 border-t-emerald-500',
        bgBadgeClass: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        accentGradient: 'from-emerald-500 to-teal-600',
        icon: Code2
      };
    case SUBJECT_NAMES.AI:
      return {
        subject: SUBJECT_NAMES.AI,
        borderClass: 'border-t-4 border-t-violet-500',
        bgBadgeClass: 'bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400',
        accentGradient: 'from-violet-500 to-purple-600',
        icon: Brain
      };
    case SUBJECT_NAMES.MATH:
      return {
        subject: SUBJECT_NAMES.MATH,
        borderClass: 'border-t-4 border-t-amber-500',
        bgBadgeClass: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
        accentGradient: 'from-amber-500 to-orange-600',
        icon: Calculator
      };
    case SUBJECT_NAMES.DESIGN:
      return {
        subject: SUBJECT_NAMES.DESIGN,
        borderClass: 'border-t-4 border-t-pink-500',
        bgBadgeClass: 'bg-pink-500/10 dark:bg-pink-500/15 border-pink-500/30 text-pink-600 dark:text-pink-400',
        accentGradient: 'from-pink-500 to-rose-600',
        icon: Palette
      };
    case SUBJECT_NAMES.BUSINESS:
      return {
        subject: SUBJECT_NAMES.BUSINESS,
        borderClass: 'border-t-4 border-t-blue-500',
        bgBadgeClass: 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
        accentGradient: 'from-blue-500 to-indigo-600',
        icon: Briefcase
      };
    case SUBJECT_NAMES.LANGUAGES:
      return {
        subject: SUBJECT_NAMES.LANGUAGES,
        borderClass: 'border-t-4 border-t-teal-500',
        bgBadgeClass: 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400',
        accentGradient: 'from-teal-500 to-emerald-600',
        icon: Languages
      };
    case SUBJECT_NAMES.SCIENCE:
      return {
        subject: SUBJECT_NAMES.SCIENCE,
        borderClass: 'border-t-4 border-t-indigo-500',
        bgBadgeClass: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
        accentGradient: 'from-indigo-500 to-violet-600',
        icon: BookOpenCheck
      };
    default:
      return {
        subject: SUBJECT_NAMES.OTHER,
        borderClass: 'border-t-4 border-t-zinc-400 dark:border-t-zinc-500',
        bgBadgeClass: 'bg-zinc-500/10 dark:bg-zinc-500/15 border-zinc-500/30 text-zinc-600 dark:text-zinc-400',
        accentGradient: 'from-zinc-500 to-slate-600',
        icon: Sparkles
      };
  }
}

/**
 * Formats raw course hours metadata to localized Russian string.
 * Resolves bug where "Express" / "Standard" / "Deep Dive" or raw English strings leakage occurred.
 */
export function formatCourseHours(rawHours) {
  if (!rawHours || rawHours === 'null' || rawHours === 'undefined') return '0 ч';
  
  const val = String(rawHours).trim();

  if (/^express$/i.test(val)) return 'Экспресс';
  if (/^standard$/i.test(val)) return 'Стандарт';
  if (/^(deep dive|masterclass)$/i.test(val)) return 'Глубокое погружение';

  // If format is like "12h" or "1.5h" -> convert "h" to " ч"
  if (/^\d+(\.\d+)?h$/i.test(val)) {
    return val.replace(/h/i, ' ч');
  }

  // If pure number like "12" -> "12 ч"
  if (/^\d+(\.\d+)?$/.test(val)) {
    return `${val} ч`;
  }

  return val;
}
