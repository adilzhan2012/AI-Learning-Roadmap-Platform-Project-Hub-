export const PLAN_LIMITS = {
  FREE: {
    price: 'Бесплатно',
    maxActiveRoadmaps: 1,
    aiQuestionsPerDay: 5,
    onboardingDays: 7,
    onboardingMessagesTotal: 20,
    aiMentorPerDay: 5, // после онбординга
    allowedDifficulties: ['beginner'],
    allowedCardCounts: [3, 5],
    features: [
      '1 активный курс',
      '5 AI-вопросов в день',
      'Базовая генерация пути'
    ]
  },
  PRO: {
    priceNumeric: 500,
    price: '₽ 500 / месяц',
    maxActiveRoadmaps: Infinity,
    aiQuestionsPerDay: Infinity,
    aiMentorPerDay: 40, // Мягкий лимит сообщений в день
    allowedDifficulties: ['beginner', 'intermediate'],
    allowedCardCounts: [3, 5, 8],
    features: [
      'Безлимитные курсы',
      'Безлимитные AI-вопросы',
      'Улучшенный промпт генерации',
      'Продвинутая сложность'
    ]
  },
  ULTRA: {
    priceNumeric: 1500,
    price: '₽ 1500 / месяц',
    maxActiveRoadmaps: Infinity,
    aiQuestionsPerDay: Infinity,
    aiMentorTokensPerDay: 300000, // Бюджет токенов в день
    allowedDifficulties: ['beginner', 'intermediate', 'advanced'],
    allowedCardCounts: [3, 5, 8],
    features: [
      'Все фичи PRO',
      'Генерация с RAG',
      'Ревью кода ИИ-ментором',
      'Адаптивный граф курса'
    ]
  }
};

