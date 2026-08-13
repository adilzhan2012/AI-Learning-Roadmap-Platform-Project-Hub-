export const PLAN_LIMITS = {
  FREE: {
    price: 'Бесплатно',
    maxActiveRoadmaps: 1,
    aiQuestionsPerDay: 5,
    onboardingDays: 7,
    onboardingMessagesTotal: 20,
    aiMentorPerDay: 5, // после онбординга
    contextualMentorPerLesson: 3,
    homeworkReviewsPerMonth: 2,
    groupLessonsPerMonth: 2,
    allowedDifficulties: ['beginner'],
    allowedCardCounts: [3, 5],
    features: [
      '1 активный курс',
      '5 AI-вопросов в день',
      '3 вопроса ИИ на каждый урок',
      '2 проверки домашки в месяц',
      '2 групповых урока в месяц',
      'Базовая генерация пути'
    ]
  },
  PRO: {
    priceNumeric: 500,
    price: '₽ 500 / месяц',
    maxActiveRoadmaps: Infinity,
    aiRoadmapsPerMonth: 2,
    aiQuestionsPerDay: Infinity,
    aiMentorPerDay: 40, // Мягкий лимит сообщений в день
    homeworkReviewsPerMonth: 30,
    groupLessonsPerMonth: 7,
    allowedDifficulties: ['beginner', 'intermediate'],
    allowedCardCounts: [3, 5, 8],
    features: [
      'Безлимитные курсы',
      '2 AI-генерации курсов в месяц',
      'Безлимитный AI-ментор по урокам',
      'Безлимитные AI-вопросы',
      '30 проверок домашки в месяц',
      '7 групповых уроков в месяц',
      'Улучшенный промпт генерации',
      'Продвинутая сложность'
    ]
  },
  ULTRA: {
    priceNumeric: 1500,
    price: '₽ 1500 / месяц',
    maxActiveRoadmaps: Infinity,
    aiRoadmapsPerMonth: Infinity,
    aiQuestionsPerDay: Infinity,
    aiMentorTokensPerDay: 300000, // Бюджет токенов в день
    homeworkReviewsPerMonth: Infinity,
    groupLessonsPerMonth: 18,
    allowedDifficulties: ['beginner', 'intermediate', 'advanced'],
    allowedCardCounts: [3, 5, 8],
    features: [
      'Все фичи PRO',
      'Безлимитная проверка домашки',
      '18 групповых уроков в месяц',
      'Генерация с RAG',
      'Ревью кода ИИ-ментором',
      'Адаптивный граф курса'
    ]
  }
};

