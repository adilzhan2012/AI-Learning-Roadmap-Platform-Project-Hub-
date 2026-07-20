export const ACHIEVEMENTS = [
  // 🎓 Начало пути
  { id: "first_step", category: "start", title: "First Step", description: "Зарегистрироваться в приложении", icon: "👋", xpReward: 20 },
  { id: "explorer_first", category: "start", title: "Explorer", description: "Создать первую дорожную карту (Roadmap)", icon: "🗺️", xpReward: 50 },
  { id: "first_lesson", category: "start", title: "First Lesson", description: "Пройти первый урок", icon: "📚", xpReward: 40 },
  { id: "first_quiz", category: "start", title: "First Quiz", description: "Завершить первый тест", icon: "✅", xpReward: 50 },
  { id: "knowledge_seeker", category: "start", title: "Knowledge Seeker", description: "Задать первый вопрос ИИ-ментору", icon: "🎯", xpReward: 25 },
  { id: "course_creator", category: "start", title: "Course Creator", description: "Создать первый курс", icon: "💾", xpReward: 60 },

  // 📖 Обучение
  { id: "student_5", category: "learning", title: "Student", description: "Завершить 5 уроков", icon: "📘", xpReward: 100 },
  { id: "learner_25", category: "learning", title: "Learner", description: "Завершить 25 уроков", icon: "📙", xpReward: 250 },
  { id: "scholar_100", category: "learning", title: "Scholar", description: "Завершить 100 уроков", icon: "📕", xpReward: 700 },
  { id: "master_student", category: "learning", title: "Master Student", description: "Завершить 250 уроков", icon: "🎓", xpReward: 1800 },

  // 🧠 Тесты
  { id: "quiz_rookie", category: "quiz", title: "Quiz Rookie", description: "Пройти 5 тестов", icon: "📝", xpReward: 100 },
  { id: "exam_solver", category: "quiz", title: "Exam Solver", description: "Пройти 25 тестов", icon: "🧪", xpReward: 300 },
  { id: "quiz_champion", category: "quiz", title: "Quiz Champion", description: "Пройти 100 тестов", icon: "🏆", xpReward: 1000 },
  { id: "perfect_score_first", category: "quiz", title: "Perfect Score", description: "Получить 100% за тест впервые", icon: "💯", xpReward: 150 },
  { id: "perfectionist_10", category: "quiz", title: "Perfectionist", description: "Получить 100% за тест 10 раз", icon: "🔥", xpReward: 600 },
  { id: "accuracy_master", category: "quiz", title: "Accuracy Master", description: "Иметь среднюю точность ответов выше 90% после 30 тестов", icon: "🎯", xpReward: 1000 },

  // 🗺️ Roadmaps
  { id: "path_builder", category: "roadmaps", title: "Path Builder", description: "Создать 5 дорожных карт (Roadmap)", icon: "🌱", xpReward: 150 },
  { id: "architect", category: "roadmaps", title: "Architect", description: "Создать 20 дорожных карт (Roadmap)", icon: "🛣️", xpReward: 500 },
  { id: "explorer_10", category: "roadmaps", title: "Explorer Pro", description: "Изучить 10 разных дорожных карт (Roadmap)", icon: "🌍", xpReward: 350 },
  { id: "knowledge_network", category: "roadmaps", title: "Knowledge Network", description: "Полностью завершить одну дорожную карту (Roadmap)", icon: "🚀", xpReward: 400 },
  { id: "completionist_10", category: "roadmaps", title: "Completionist", description: "Завершить 10 дорожных карт (Roadmap)", icon: "🧩", xpReward: 1500 },

  // 🤖 AI
  { id: "curious_mind", category: "ai", title: "Curious Mind", description: "Задать 25 вопросов ИИ-ментору", icon: "💬", xpReward: 150 },
  { id: "ai_explorer", category: "ai", title: "AI Explorer", description: "Задать 100 вопросов ИИ-ментору", icon: "🧠", xpReward: 500 },
  { id: "ai_power_user", category: "ai", title: "AI Power User", description: "Задать 500 вопросов ИИ-ментору", icon: "⚡", xpReward: 2000 },
  { id: "example_hunter", category: "ai", title: "Example Hunter", description: "Сгенерировать 50 примеров из реального мира", icon: "🌟", xpReward: 300 },

  // 📇 Карточки (Flashcards)
  { id: "flash_starter", category: "flashcards", title: "Flash Starter", description: "Просмотреть 20 карточек для запоминания", icon: "🃏", xpReward: 100 },
  { id: "memory_builder", category: "flashcards", title: "Memory Builder", description: "Просмотреть 100 карточек для запоминания", icon: "📚", xpReward: 350 },
  { id: "memory_master", category: "flashcards", title: "Memory Master", description: "Просмотреть 500 карточек для запоминания", icon: "🧠", xpReward: 1200 },
  { id: "spaced_learner", category: "flashcards", title: "Spaced Learner", description: "Выполнить первое интервальное повторение", icon: "🔁", xpReward: 80 },
  { id: "never_forget", category: "flashcards", title: "Never Forget", description: "Выполнить 30 интервальных повторений", icon: "⏰", xpReward: 500 },

  // 🔥 Стрики
  { id: "streak_3", category: "streaks", title: "3-Day Streak", description: "Заниматься 3 дня подряд", icon: "🔥", xpReward: 80 },
  { id: "streak_7_ach", category: "streaks", title: "7-Day Streak", description: "Заниматься 7 дней подряд", icon: "🔥", xpReward: 150 },
  { id: "streak_14", category: "streaks", title: "14-Day Streak", description: "Заниматься 14 дней подряд", icon: "🔥", xpReward: 300 },
  { id: "streak_30", category: "streaks", title: "30-Day Streak", description: "Заниматься 30 дней подряд", icon: "🔥", xpReward: 700 },
  { id: "streak_100", category: "streaks", title: "100-Day Streak", description: "Заниматься 100 дней подряд", icon: "🔥", xpReward: 2500 },
  { id: "streak_365", category: "streaks", title: "365-Day Legend", description: "Заниматься 365 дней подряд", icon: "♾️", xpReward: 10000 },

  // ⭐ XP
  { id: "xp_100", category: "xp", title: "First 100 XP", description: "Набрать первые 100 XP", icon: "⭐", xpReward: 50 },
  { id: "xp_500", category: "xp", title: "500 XP", description: "Набрать 500 XP", icon: "⭐", xpReward: 100 },
  { id: "xp_1000", category: "xp", title: "1000 XP", description: "Набрать 1000 XP", icon: "⭐", xpReward: 150 },
  { id: "xp_5000", category: "xp", title: "5000 XP", description: "Набрать 5000 XP", icon: "⭐", xpReward: 500 },
  { id: "xp_10000", category: "xp", title: "10000 XP", description: "Набрать 10000 XP", icon: "⭐", xpReward: 1200 },
  { id: "xp_50000", category: "xp", title: "50000 XP", description: "Набрать 50000 XP", icon: "⭐", xpReward: 5000 },

  // 🏅 Уровни
  { id: "level_5_ach", category: "levels", title: "Level 5", description: "Достичь 5 уровня", icon: "🌟", xpReward: 150 },
  { id: "level_10", category: "levels", title: "Level 10", description: "Достичь 10 уровня", icon: "🌟", xpReward: 300 },
  { id: "level_25", category: "levels", title: "Level 25", description: "Достичь 25 уровня", icon: "🌟", xpReward: 800 },
  { id: "level_50", category: "levels", title: "Level 50", description: "Достичь 50 уровня", icon: "🌟", xpReward: 2500 },

  // 🌍 Исследование платформы
  { id: "dashboard_explorer", category: "exploration", title: "Dashboard Explorer", description: "Открыть панель управления (Dashboard)", icon: "🧭", xpReward: 20 },
  { id: "settings_master", category: "exploration", title: "Settings Master", description: "Открыть настройки профиля", icon: "⚙️", xpReward: 20 },
  { id: "polyglot", category: "exploration", title: "Polyglot", description: "Сменить язык интерфейса приложения", icon: "🌐", xpReward: 40 },
  { id: "night_owl", category: "exploration", title: "Night Owl", description: "Переключить тему на тёмную", icon: "🌙", xpReward: 30 },
  { id: "progress_tracker", category: "exploration", title: "Progress Tracker", description: "Открыть страницу статистики (Insights)", icon: "📈", xpReward: 50 },

  // 💎 Редкие достижения
  { id: "speed_runner", category: "rare", title: "Speed Runner", description: "Пройти урок менее чем за 3 минуты", icon: "⚡", xpReward: 120 },
  { id: "never_give_up", category: "rare", title: "Never Give Up", description: "Вернуться к обучению после 30 дней отсутствия", icon: "🚫", xpReward: 200 },
  { id: "dedicated", category: "rare", title: "Dedicated", description: "Заниматься обучением более 3 часов за один день", icon: "🎯", xpReward: 350 },
  { id: "weekend_warrior", category: "rare", title: "Weekend Warrior", description: "Заниматься обучением по выходным 10 раз", icon: "📅", xpReward: 300 },
  { id: "early_bird", category: "rare", title: "Early Bird", description: "Начать обучение до 08:00 утра 20 раз", icon: "🌅", xpReward: 400 },
  { id: "night_coder", category: "rare", title: "Night Coder", description: "Заниматься обучением после 23:00 вечера 20 раз", icon: "🌙", xpReward: 400 },

  // 👑 Легендарные
  { id: "roadmap_legend", category: "legendary", title: "Roadmap Legend", description: "Полностью завершить 50 дорожных карт (Roadmap)", icon: "🏆", xpReward: 10000 },
  { id: "knowledge_king", category: "legendary", title: "Knowledge King", description: "Набрать суммарно 100 000 XP", icon: "👑", xpReward: 15000 },
  { id: "completionist_all", category: "legendary", title: "Completionist", description: "Разблокировать все остальные достижения на платформе", icon: "💎", xpReward: 25000 }
];
