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
    subject: SUBJECT_NAMES.LANGUAGES,
    keywords: [
      'english', 'spanish', 'german', 'french', 'chinese', 'japanese', 'grammar',
      'vocabulary', 'ielts', 'toefl', 'language', 'английск', 'испанск', 'немецк',
      'язык', 'грамматик', 'словар'
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
    subject: SUBJECT_NAMES.WEB,
    keywords: [
      'html', 'css', 'react', 'vue', 'angular', 'next.js', 'nextjs',
      'javascript', 'typescript', 'frontend', 'backend', 'fullstack',
      'tailwind', 'express.js', 'django', 'fastapi', 'rest api', 'browser',
      'верстк', 'сайт', 'фронтенд', 'бэкенд'
    ],
    wordExactKeywords: ['web', 'dom', 'node', 'nodejs']
  },
  {
    subject: SUBJECT_NAMES.PROGRAMMING,
    keywords: [
      'programming', 'python', 'algorithm', 'data structure', 'linux', 'docker',
      'postgres', 'database', 'ооп', 'алгоритм', 'программ', 'код',
      'разработк', 'баз данных', 'структур данных'
    ],
    wordExactKeywords: ['c++', 'cpp', 'c#', 'java', 'rust', 'go', 'golang', 'swift', 'kotlin', 'git', 'sql']
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
    subject: SUBJECT_NAMES.SCIENCE,
    keywords: [
      'physics', 'chemistry', 'biology', 'history', 'philosophy', 'astronomy',
      'geography', 'географи', 'физик', 'хими', 'биологи', 'истори', 'философи', 'астрономи'
    ]
  }
];

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasExactWord(text, word) {
  const escaped = escapeRegex(word.toLowerCase());
  const regex = new RegExp(`(?:^|[^a-z0-9_#+])${escaped}(?:$|[^a-z0-9_#+])`, 'i');
  return regex.test(text);
}

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
    // 1. Check exact word keywords (e.g. 'ai', 'ml', 'ui', 'ux', 'c++', 'c#', 'dom')
    if (rule.wordExactKeywords) {
      for (const ekw of rule.wordExactKeywords) {
        if (hasExactWord(combinedText, ekw)) {
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
export function getSubjectTheme(subject, fallbackTopic = '', fallbackTitle = '', fallbackNodes = []) {
  const finalSubject = subject || classifyCourseSubject(fallbackTopic, fallbackTitle, fallbackNodes);

  switch (finalSubject) {
    case SUBJECT_NAMES.WEB:
      return {
        subject: SUBJECT_NAMES.WEB,
        borderClass: 'border-t-[3px] border-t-cyan-500',
        bgBadgeClass: 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
        accentGradient: 'from-cyan-500 to-blue-600',
        icon: Globe
      };
    case SUBJECT_NAMES.PROGRAMMING:
      return {
        subject: SUBJECT_NAMES.PROGRAMMING,
        borderClass: 'border-t-[3px] border-t-indigo-500',
        bgBadgeClass: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
        accentGradient: 'from-indigo-500 to-blue-600',
        icon: Code2
      };
    case SUBJECT_NAMES.AI:
      return {
        subject: SUBJECT_NAMES.AI,
        borderClass: 'border-t-[3px] border-t-purple-500',
        bgBadgeClass: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400',
        accentGradient: 'from-purple-500 to-violet-600',
        icon: Brain
      };
    case SUBJECT_NAMES.MATH:
      return {
        subject: SUBJECT_NAMES.MATH,
        borderClass: 'border-t-[3px] border-t-emerald-500',
        bgBadgeClass: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        accentGradient: 'from-emerald-500 to-teal-600',
        icon: Calculator
      };
    case SUBJECT_NAMES.DESIGN:
      return {
        subject: SUBJECT_NAMES.DESIGN,
        borderClass: 'border-t-[3px] border-t-pink-500',
        bgBadgeClass: 'bg-pink-500/10 dark:bg-pink-500/15 border-pink-500/30 text-pink-700 dark:text-pink-400',
        accentGradient: 'from-pink-500 to-rose-600',
        icon: Palette
      };
    case SUBJECT_NAMES.BUSINESS:
      return {
        subject: SUBJECT_NAMES.BUSINESS,
        borderClass: 'border-t-[3px] border-t-amber-500',
        bgBadgeClass: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
        accentGradient: 'from-amber-500 to-orange-600',
        icon: Briefcase
      };
    case SUBJECT_NAMES.LANGUAGES:
      return {
        subject: SUBJECT_NAMES.LANGUAGES,
        borderClass: 'border-t-[3px] border-t-sky-500',
        bgBadgeClass: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400',
        accentGradient: 'from-sky-500 to-blue-600',
        icon: Languages
      };
    case SUBJECT_NAMES.SCIENCE:
      return {
        subject: SUBJECT_NAMES.SCIENCE,
        borderClass: 'border-t-[3px] border-t-teal-500',
        bgBadgeClass: 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-400',
        accentGradient: 'from-teal-500 to-emerald-600',
        icon: BookOpenCheck
      };
    default:
      return {
        subject: SUBJECT_NAMES.OTHER,
        borderClass: 'border-t-[3px] border-t-zinc-400 dark:border-t-zinc-500',
        bgBadgeClass: 'bg-zinc-500/10 dark:bg-zinc-500/15 border-zinc-500/30 text-zinc-700 dark:text-zinc-400',
        accentGradient: 'from-zinc-500 to-slate-600',
        icon: Sparkles
      };
  }
}

/**
 * Maps subject identifier/russian name to localized user-facing name.
 */
export function getSubjectLabel(subject = '', locale = 'ru') {
  const isEn = locale === 'en';
  switch (subject) {
    case SUBJECT_NAMES.WEB:
    case 'Веб-разработка':
    case 'Web Development':
      return isEn ? 'Web Development' : 'Веб-разработка';
    case SUBJECT_NAMES.PROGRAMMING:
    case 'Программирование':
    case 'Programming':
      return isEn ? 'Programming' : 'Программирование';
    case SUBJECT_NAMES.AI:
    case 'Искусственный интеллект':
    case 'AI':
      return isEn ? 'AI & Data Science' : 'Искусственный интеллект';
    case SUBJECT_NAMES.LANGUAGES:
    case 'Языки':
    case 'Languages':
      return isEn ? 'Languages' : 'Языки';
    case SUBJECT_NAMES.DESIGN:
    case 'Дизайн & UX':
    case 'Design & UX':
      return isEn ? 'Design & UX' : 'Дизайн & UX';
    case SUBJECT_NAMES.MATH:
    case 'Математика':
    case 'Mathematics':
      return isEn ? 'Mathematics' : 'Математика';
    case SUBJECT_NAMES.BUSINESS:
    case 'Бизнес & Менеджмент':
    case 'Business & Management':
      return isEn ? 'Business & Management' : 'Бизнес & Менеджмент';
    case SUBJECT_NAMES.SCIENCE:
    case 'Науки & Гуманитария':
    case 'Science & Humanities':
      return isEn ? 'Science & Humanities' : 'Науки & Гуманитария';
    default:
      return isEn ? 'General' : 'Общее';
  }
}

/**
 * Formats raw course hours metadata to localized string.
 */
export function formatCourseHours(rawHours, locale = 'ru') {
  const isEn = locale === 'en';
  if (!rawHours || rawHours === 'null' || rawHours === 'undefined') return isEn ? '0h' : '0 ч';
  
  const val = String(rawHours).trim();

  if (/^(express|экспресс)$/i.test(val)) return isEn ? 'Express' : 'Экспресс';
  if (/^(standard|стандарт)$/i.test(val)) return isEn ? 'Standard' : 'Стандарт';
  if (/^(deep dive|masterclass|глубокое погружение|углубленный|углублённый)$/i.test(val)) return isEn ? 'Deep Dive' : 'Глубокое погружение';

  // If format is like "12h" or "1.5h" or "12 ч"
  const hourMatch = val.match(/^(\d+(?:\.\d+)?)\s*(?:h|ч|час|часа|часов)?$/i);
  if (hourMatch) {
    const num = hourMatch[1];
    return isEn ? `${num}h` : `${num} ч`;
  }

  return val;
}
