export const PLAN_LIMITS = {
  FREE: {
    name: 'Free',
    maxRoadmaps: 1,
    maxAiQuestions: 5,
    maxMentorMessages: 5,
    price: '$0/mo',
    features: ['1 Сгенерированный Roadmap', '5 вопросов ИИ в день', '5 пробных сообщений AI-ментора', 'Базовая система достижений']
  },
  PRO: {
    name: 'Pro',
    maxRoadmaps: Infinity,
    maxAiQuestions: Infinity,
    maxMentorMessages: 50,
    price: '$9.99/mo',
    features: ['Безлимитные Roadmap', '50 сообщений AI-ментору в день', 'Продвинутая система достижений', 'Приоритетная поддержка']
  }
};
