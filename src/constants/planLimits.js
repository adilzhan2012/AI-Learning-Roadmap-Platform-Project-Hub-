export const PLAN_LIMITS = {
  FREE: {
    maxActiveRoadmaps: 1,
    aiQuestionsPerDay: 5,
    onboardingDays: 7,
    onboardingMessagesTotal: 20,
    aiMentorPerDay: 5, // после онбординга
    allowedDifficulties: ['beginner'],
    allowedCardCounts: [3, 5],
    features: { advancedPrompt: false, ragGeneration: false, codeReview: false, adaptiveGraph: false }
  },
  PRO: {
    maxActiveRoadmaps: Infinity,
    aiQuestionsPerDay: Infinity,
    aiMentorPerDay: 40, // Мягкий лимит сообщений в день
    allowedDifficulties: ['beginner', 'intermediate'],
    allowedCardCounts: [3, 5, 8],
    features: { advancedPrompt: true, ragGeneration: false, codeReview: false, adaptiveGraph: false }
  },
  ULTRA: {
    maxActiveRoadmaps: Infinity,
    aiQuestionsPerDay: Infinity,
    aiMentorTokensPerDay: 300000, // Бюджет токенов в день
    allowedDifficulties: ['beginner', 'intermediate', 'advanced'],
    allowedCardCounts: [3, 5, 8],
    features: { advancedPrompt: true, ragGeneration: true, codeReview: true, adaptiveGraph: true }
  }
};

