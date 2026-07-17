export const PLAN_LIMITS = {
  FREE: {
    name: 'Free',
    maxRoadmaps: 2,
    maxAiQuestions: 5,
    price: '$0/mo',
    features: ['2 Сгенерированных Roadmap', '5 вопросов ИИ в день', 'Базовая система достижений']
  },
  PRO: {
    name: 'Pro',
    maxRoadmaps: Infinity,
    maxAiQuestions: Infinity,
    price: '$9.99/mo',
    features: ['Безлимитные Roadmap', 'Безлимитный ИИ-ментор', 'Продвинутая система достижений', 'Приоритетная поддержка']
  }
};
