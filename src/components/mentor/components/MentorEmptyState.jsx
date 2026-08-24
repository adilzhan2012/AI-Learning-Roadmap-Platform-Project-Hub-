import React from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Lightbulb, 
  Code2, 
  Target, 
  Sparkles,
  ArrowUpRight 
} from 'lucide-react';
import { QUICK_PROMPTS } from '../constants/mentorTheme.js';

const ICON_MAP = {
  Compass,
  Lightbulb,
  Code2,
  Target,
  Sparkles,
};

export default function MentorEmptyState({
  profile,
  locale,
  onSelectPrompt,
  getCategoryTokens,
  themeTokens,
}) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 6
    ? (locale === 'en' ? 'Good night' : 'Доброй ночи')
    : currentHour < 12
    ? (locale === 'en' ? 'Good morning' : 'Доброе утро')
    : currentHour < 18
    ? (locale === 'en' ? 'Good afternoon' : 'Добрый день')
    : (locale === 'en' ? 'Good evening' : 'Добрый вечер');

  const userName = profile?.firstName || (locale === 'en' ? 'Learner' : 'Пользователь');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10 w-full max-w-xl mx-auto my-auto animate-in fade-in zoom-in-95 duration-300 select-none">
      {/* Personalized Greeting */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
          {greeting}, {userName}!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {locale === 'en' 
            ? 'What would you like to learn or practice today?' 
            : 'Чем сегодня займемся? Выберите сценарий или задайте вопрос:'}
        </p>
      </div>

      {/* 2x2 Quick Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {QUICK_PROMPTS.map((item, idx) => {
          const catTokens = getCategoryTokens(item.category);
          const IconComponent = ICON_MAP[catTokens.icon] || Sparkles;
          const title = item.title[locale] || item.title.ru;
          const desc = item.description[locale] || item.description.ru;
          const prompt = item.promptText[locale] || item.promptText.ru;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectPrompt(prompt)}
              className={`group text-left p-3.5 rounded-2xl border transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${catTokens.bg} ${catTokens.border}`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                {/* Icon in colored badge */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform duration-150 group-hover:scale-110 ${catTokens.badgeBg}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0" />
              </div>

              <div>
                <h3 className={`text-xs font-bold leading-snug mb-0.5 ${catTokens.text}`}>
                  {title}
                </h3>
                <p className={`text-[11px] leading-tight line-clamp-2 ${catTokens.descriptionText}`}>
                  {desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
