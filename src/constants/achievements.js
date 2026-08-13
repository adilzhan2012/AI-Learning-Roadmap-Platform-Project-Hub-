export const ACHIEVEMENTS = [
  // 🎓 Начало пути
  { id: "first_step", category: "starter", title: "First Step", description: "Зарегистрироваться на платформе", descriptionEn: "Sign up for the platform", icon: "👋", xpReward: 20 },
  { id: "first_roadmap", category: "starter", title: "Pioneer", description: "Создать первую дорожную карту", descriptionEn: "Create your first learning roadmap", icon: "🗺️", xpReward: 50 },
  { id: "first_lesson", category: "starter", title: "Curious Learner", description: "Завершить свой первый урок", descriptionEn: "Complete your first lesson", icon: "📚", xpReward: 40 },
  { id: "first_quiz", category: "starter", title: "Test Subject", description: "Пройти свой первый тест", descriptionEn: "Complete your first quiz", icon: "✅", xpReward: 50 },
  { id: "first_mentor", category: "starter", title: "Hello, AI!", description: "Задать первый вопрос ИИ-ментору", descriptionEn: "Ask your first question to the AI Mentor", icon: "🎯", xpReward: 25 },
  { id: "first_course", category: "starter", title: "Course Creator", description: "Создать свой первый курс", descriptionEn: "Create your first course", icon: "💾", xpReward: 60 },

  // 📖 Обучение
  { id: "lessons_5", category: "learning", title: "Student", description: "Пройти 5 уроков", descriptionEn: "Complete 5 lessons", icon: "📘", xpReward: 100 },
  { id: "lessons_25", category: "learning", title: "Scholar", description: "Пройти 25 уроков", descriptionEn: "Complete 25 lessons", icon: "📙", xpReward: 250 },
  { id: "lessons_100", category: "learning", title: "Master Student", description: "Пройти 100 уроков", descriptionEn: "Complete 100 lessons", icon: "📕", xpReward: 700 },
  { id: "lessons_250", category: "learning", title: "Professor", description: "Пройти 250 уроков", descriptionEn: "Complete 250 lessons", icon: "🎓", xpReward: 1800 },

  // 🧠 Тесты
  { id: "quiz_5", category: "quiz", title: "Quizzer", description: "Пройти 5 тестов", descriptionEn: "Complete 5 quizzes", icon: "📝", xpReward: 100 },
  { id: "quiz_25", category: "quiz", title: "Quiz Master", description: "Пройти 25 тестов", descriptionEn: "Complete 25 quizzes", icon: "🧪", xpReward: 300 },
  { id: "quiz_100", category: "quiz", title: "Grandmaster Quizzer", description: "Пройти 100 тестов", descriptionEn: "Complete 100 quizzes", icon: "🏆", xpReward: 1000 },
  { id: "perfectionist_1", category: "quiz", title: "First 100%", description: "Получить 100% за тест в первый раз", descriptionEn: "Get 100% on a quiz for the first time", icon: "💯", xpReward: 150 },
  { id: "perfectionist_10", category: "quiz", title: "Perfectionist", description: "Получить 100% за тест 10 раз", descriptionEn: "Get 100% on a quiz 10 times", icon: "🔥", xpReward: 600 },
  { id: "accuracy_master", category: "quiz", title: "Accuracy Master", description: "Иметь среднюю точность ответов выше 90% после 30 тестов", descriptionEn: "Maintain an average quiz accuracy above 90% after 30 quizzes", icon: "🎯", xpReward: 1000 },

  // 🗺️ Roadmaps
  { id: "path_builder", category: "roadmaps", title: "Path Builder", description: "Создать 5 дорожных карт (Roadmap)", descriptionEn: "Create 5 roadmaps", icon: "🌱", xpReward: 150 },
  { id: "architect", category: "roadmaps", title: "Architect", description: "Создать 20 дорожных карт (Roadmap)", descriptionEn: "Create 20 roadmaps", icon: "🛣️", xpReward: 500 },
  { id: "explorer_10", category: "roadmaps", title: "Explorer Pro", description: "Изучить 10 разных дорожных карт (Roadmap)", descriptionEn: "Explore 10 different roadmaps", icon: "🌍", xpReward: 350 },
  { id: "knowledge_network", category: "roadmaps", title: "Knowledge Network", description: "Полностью завершить одну дорожную карту (Roadmap)", descriptionEn: "Fully complete one roadmap", icon: "🚀", xpReward: 400 },
  { id: "completionist_10", category: "roadmaps", title: "Completionist", description: "Завершить 10 дорожных карт (Roadmap)", descriptionEn: "Complete 10 roadmaps", icon: "🧩", xpReward: 1500 },

  // 🤖 AI
  { id: "curious_mind", category: "ai", title: "Curious Mind", description: "Задать 25 вопросов ИИ-ментору", descriptionEn: "Ask 25 questions to the AI Mentor", icon: "💬", xpReward: 150 },
  { id: "ai_explorer", category: "ai", title: "AI Explorer", description: "Задать 100 вопросов ИИ-ментору", descriptionEn: "Ask 100 questions to the AI Mentor", icon: "🧠", xpReward: 500 },
  { id: "ai_power_user", category: "ai", title: "AI Power User", description: "Задать 500 вопросов ИИ-ментору", descriptionEn: "Ask 500 questions to the AI Mentor", icon: "⚡", xpReward: 2000 },
  { id: "example_hunter", category: "ai", title: "Example Hunter", description: "Сгенерировать 50 примеров из реального мира", descriptionEn: "Generate 50 real-world examples", icon: "🌟", xpReward: 300 },

  // 📇 Карточки (Flashcards)
  { id: "flash_starter", category: "flashcards", title: "Flash Starter", description: "Просмотреть 20 карточек для запоминания", descriptionEn: "Review 20 flashcards", icon: "🃏", xpReward: 100 },
  { id: "memory_builder", category: "flashcards", title: "Memory Builder", description: "Просмотреть 100 карточек для запоминания", descriptionEn: "Review 100 flashcards", icon: "📚", xpReward: 350 },
  { id: "memory_master", category: "flashcards", title: "Memory Master", description: "Просмотреть 500 карточек для запоминания", descriptionEn: "Review 500 flashcards", icon: "🧠", xpReward: 1200 },
  { id: "spaced_learner", category: "flashcards", title: "Spaced Learner", description: "Выполнить первое интервальное повторение", descriptionEn: "Complete your first spaced repetition review", icon: "🔁", xpReward: 80 },
  { id: "never_forget", category: "flashcards", title: "Never Forget", description: "Выполнить 30 интервальных повторений", descriptionEn: "Complete 30 spaced repetition reviews", icon: "⏰", xpReward: 500 },

  // 🔥 Стрики
  { id: "streak_3", category: "streaks", title: "3-Day Streak", description: "Заниматься 3 дня подряд", descriptionEn: "Study for 3 days in a row", icon: "🔥", xpReward: 80 },
  { id: "streak_7_ach", category: "streaks", title: "7-Day Streak", description: "Заниматься 7 дней подряд", descriptionEn: "Study for 7 days in a row", icon: "🔥", xpReward: 150 },
  { id: "streak_14", category: "streaks", title: "14-Day Streak", description: "Заниматься 14 дней подряд", descriptionEn: "Study for 14 days in a row", icon: "🔥", xpReward: 300 },
  { id: "streak_30", category: "streaks", title: "30-Day Streak", description: "Заниматься 30 дней подряд", descriptionEn: "Study for 30 days in a row", icon: "🔥", xpReward: 700 },
  { id: "streak_100", category: "streaks", title: "100-Day Streak", description: "Заниматься 100 дней подряд", descriptionEn: "Study for 100 days in a row", icon: "🔥", xpReward: 2500 },
  { id: "streak_365", category: "streaks", title: "365-Day Legend", description: "Заниматься 365 дней подряд", descriptionEn: "Study for 365 days in a row", icon: "♾️", xpReward: 10000 },

  // ⭐ XP
  { id: "xp_100", category: "xp", title: "First 100 XP", description: "Набрать первые 100 XP", descriptionEn: "Earn your first 100 XP", icon: "⭐", xpReward: 50 },
  { id: "xp_500", category: "xp", title: "500 XP", description: "Набрать 500 XP", descriptionEn: "Earn 500 XP", icon: "⭐", xpReward: 100 },
  { id: "xp_1000", category: "xp", title: "1000 XP", description: "Набрать 1000 XP", descriptionEn: "Earn 1000 XP", icon: "⭐", xpReward: 150 },
  { id: "xp_5000", category: "xp", title: "5000 XP", description: "Набрать 5000 XP", descriptionEn: "Earn 5000 XP", icon: "⭐", xpReward: 500 },
  { id: "xp_10000", category: "xp", title: "10000 XP", description: "Набрать 10000 XP", descriptionEn: "Earn 10000 XP", icon: "⭐", xpReward: 1200 },
  { id: "xp_50000", category: "xp", title: "50000 XP", description: "Набрать 50000 XP", descriptionEn: "Earn 50000 XP", icon: "⭐", xpReward: 5000 },

  // 🏅 Уровни
  { id: "level_5_ach", category: "levels", title: "Level 5", description: "Достичь 5 уровня", descriptionEn: "Reach Level 5", icon: "🌟", xpReward: 150 },
  { id: "level_10", category: "levels", title: "Level 10", description: "Достичь 10 уровня", descriptionEn: "Reach Level 10", icon: "🌟", xpReward: 300 },
  { id: "level_25", category: "levels", title: "Level 25", description: "Достичь 25 уровня", descriptionEn: "Reach Level 25", icon: "🌟", xpReward: 800 },
  { id: "level_50", category: "levels", title: "Level 50", description: "Достичь 50 уровня", descriptionEn: "Reach Level 50", icon: "🌟", xpReward: 2500 },

  // 🌍 Исследование платформы
  { id: "dashboard_explorer", category: "exploration", title: "Dashboard Explorer", description: "Открыть панель управления (Dashboard)", descriptionEn: "Open the personal dashboard", icon: "🧭", xpReward: 20 },
  { id: "settings_master", category: "exploration", title: "Settings Master", description: "Открыть настройки профиля", descriptionEn: "Open account settings", icon: "⚙️", xpReward: 20 },
  { id: "polyglot", category: "exploration", title: "Polyglot", description: "Сменить язык интерфейса приложения", descriptionEn: "Switch UI language", icon: "🌐", xpReward: 40 },
  { id: "night_owl", category: "exploration", title: "Night Owl", description: "Переключить тему на тёмную", descriptionEn: "Toggle dark mode", icon: "🌙", xpReward: 30 },
  { id: "progress_tracker", category: "exploration", title: "Progress Tracker", description: "Открыть страницу статистики (Insights)", descriptionEn: "Open the insights statistics page", icon: "📈", xpReward: 50 },

  // 💎 Редкие достижения
  { id: "speed_runner", category: "rare", title: "Speed Runner", description: "Пройти урок менее чем за 3 минуты", descriptionEn: "Complete a lesson in under 3 minutes", icon: "⚡", xpReward: 120 },
  { id: "never_give_up", category: "rare", title: "Never Give Up", description: "Вернуться к обучению после 30 дней отсутствия", descriptionEn: "Return to studying after 30 days of absence", icon: "🚫", xpReward: 200 },
  { id: "dedicated", category: "rare", title: "Dedicated", description: "Заниматься обучением более 3 часов за один день", descriptionEn: "Study for more than 3 hours in a single day", icon: "🎯", xpReward: 350 },
  { id: "weekend_warrior", category: "rare", title: "Weekend Warrior", description: "Заниматься обучением по выходным 10 раз", descriptionEn: "Study on weekends 10 times", icon: "📅", xpReward: 300 },
  { id: "early_bird", category: "rare", title: "Early Bird", description: "Начать обучение до 08:00 утра 20 раз", descriptionEn: "Start studying before 08:00 AM 20 times", icon: "🌅", xpReward: 400 },
  { id: "night_coder", category: "rare", title: "Night Coder", description: "Заниматься обучением после 23:00 вечера 20 раз", descriptionEn: "Study after 11:00 PM 20 times", icon: "🌙", xpReward: 400 },

  // 👑 Легендарные
  { id: "roadmap_legend", category: "legendary", title: "Roadmap Legend", description: "Полностью завершить 50 дорожных карт (Roadmap)", descriptionEn: "Fully complete 50 roadmaps", icon: "🏆", xpReward: 10000 },
  { id: "knowledge_king", category: "legendary", title: "Knowledge King", description: "Набрать суммарно 100 000 XP", descriptionEn: "Earn 100,000 XP in total", icon: "👑", xpReward: 15000 },
  { id: "completionist_all", category: "legendary", title: "Completionist", description: "Разблокировать все остальные достижения на платформе", descriptionEn: "Unlock all other achievements on the platform", icon: "💎", xpReward: 25000 }
];
