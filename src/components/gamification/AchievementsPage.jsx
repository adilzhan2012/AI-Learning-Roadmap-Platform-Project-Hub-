import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronDown, ChevronUp, Trophy, Loader2 } from 'lucide-react';
import { ACHIEVEMENTS } from '../../constants/achievements.js';
import { useAchievements } from '../../hooks/useAchievements.js';
import { usePlanLimits } from '../../hooks/usePlanLimits.js';
import { useNavigate } from 'react-router-dom';
import { t, useLocale } from '../../i18n.js';
import LeaguesComponent from '../../pages/Leagues.jsx';

const getCategoryLabel = (id, locale) => {
  const labels = {
    all: { ru: 'Все', en: 'All' },
    start: { ru: 'Начало пути', en: 'Getting Started' },
    learning: { ru: 'Обучение', en: 'Learning' },
    quiz: { ru: 'Тесты', en: 'Quizzes' },
    roadmaps: { ru: 'Roadmaps', en: 'Roadmaps' },
    ai: { ru: 'AI', en: 'AI Mentor' },
    flashcards: { ru: 'Карточки', en: 'Flashcards' },
    streaks: { ru: 'Стрики', en: 'Streaks' },
    xp: { ru: 'XP', en: 'XP' },
    levels: { ru: 'Уровни', en: 'Levels' },
    exploration: { ru: 'Исследование', en: 'Exploration' },
    rare: { ru: 'Редкие', en: 'Rare' },
    legendary: { ru: 'Легендарные', en: 'Legendary' }
  };
  return labels[id]?.[locale] || labels[id]?.['ru'] || id;
};

const CATEGORY_IDS = ['all', 'start', 'learning', 'quiz', 'roadmaps', 'ai', 'flashcards', 'streaks', 'xp', 'levels', 'exploration', 'rare', 'legendary'];

const getCategoryIcon = (category, isUnlocked) => {
  const colorClass = isUnlocked ? 'text-on-surface' : 'text-[#636366]';
  switch (category) {
    case 'start':
    case 'learning':
      return (
        <svg className={`w-8 h-8 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg className={`w-8 h-8 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      );
    case 'streaks':
      return (
        <svg className={`w-8 h-8 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
        </svg>
      );
    case 'roadmaps':
      return (
        <svg className={`w-8 h-8 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 18l6-6-6-6" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    default:
      return (
        <svg className={`w-8 h-8 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5c0 2.2 1.8 4 4 4s4-1.8 4-4V6a4 4 0 0 0-4-4Z" />
        </svg>
      );
  }
};

export default function AchievementsPage() {
  const navigate = useNavigate();
  const locale = useLocale();
  const { plan } = usePlanLimits();
  const { unlockedAchievements, isLoading } = useAchievements();
  const [showAll, setShowAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('achievements'); // 'achievements' | 'leagues'

  const unlockedCount = Object.keys(unlockedAchievements).length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = Math.round((unlockedCount / totalCount) * 100) || 0;

  // Filter only unlocked achievements for the summary view
  const unlockedList = ACHIEVEMENTS.filter(ach => !!unlockedAchievements[ach.id]);

  // Filter full list by active category
  const filteredAchievements = activeCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(ach => ach.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)] text-on-surface">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-mono text-on-surface-variant">
          {locale === 'en' ? 'Syncing achievements...' : 'Синхронизация достижений...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[2000px] mx-auto min-h-[calc(100vh-4.5rem)] text-on-background font-sans p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-clash text-on-surface mb-2 flex items-center">
          {locale === 'en' ? 'Achievements & Leagues' : 'Достижения и Лиги'}
        </h1>
        <p className="text-on-surface-variant text-sm">
          {locale === 'en' 
            ? 'Complete goals, earn XP, and climb to elite learning leagues!' 
            : 'Выполняйте задания, набирайте XP и продвигайтесь в элитные лиги обучения!'}
        </p>
      </div>

      {/* Segmented Period Toggle (iOS Style) */}
      <div className="flex mb-8">
        <div className="relative bg-surface p-1 rounded-full flex items-center border border-outline shadow-inner">
          <button
            onClick={() => setActiveMainTab('achievements')}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition-all leading-none ${
              activeMainTab === 'achievements' ? 'text-inverse-on-surface bg-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {locale === 'en' ? `Achievements (${unlockedCount}/${totalCount})` : `Достижения (${unlockedCount}/${totalCount})`}
          </button>
          <button
            onClick={() => setActiveMainTab('leagues')}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition-all leading-none ${
              activeMainTab === 'leagues' ? 'text-inverse-on-surface bg-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {locale === 'en' ? 'Competitive Leagues' : 'Лиги обучения'}
          </button>
        </div>
      </div>

      {activeMainTab === 'achievements' && (
        <>
          {/* Progress Card */}
          <div className="bg-surface border border-outline rounded-[16px] p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-surface-container/50 border border-outline rounded-[12px] flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold font-mono text-on-surface">{progress}%</span>
            </div>
            <div className="flex-1 w-full">
              <h2 className="text-sm font-bold text-on-background mb-2 font-clash">
                {locale === 'en' ? 'Overall Unlock Progress' : 'Общий прогресс разблокировки'}
              </h2>
              <div className="w-full h-[3px] bg-surface-container border border-outline-variant rounded-sm overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-on-surface"
                />
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant mt-2 text-right">
                {locale === 'en' 
                  ? <>Unlocked: <span className="font-mono">{unlockedCount}</span> of <span className="font-mono">{totalCount}</span></>
                  : <>Разблокировано: <span className="font-mono">{unlockedCount}</span> из <span className="font-mono">{totalCount}</span></>}
              </p>
            </div>
          </div>

          {/* Unlocked Achievements Highlight Grid (Summary Section) */}
          <div className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-tight text-[#636366] mb-6 font-sans">
              {locale === 'en' ? 'Unlocked Achievements' : 'Разблокированные достижения'}
            </h2>
            
            {unlockedList.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-outline rounded-[16px]">
                <p className="text-sm font-semibold text-on-surface-variant">
                  {locale === 'en' ? "You haven't unlocked any achievements yet" : 'Вы пока не разблокировали ни одного достижения'}
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-1">
                  {locale === 'en' 
                    ? 'Start taking lessons, creating courses, and finishing quizzes to unlock them!' 
                    : 'Начните проходить уроки, создавать курсы и выполнять тесты, чтобы открыть их!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedList.slice(0, 6).map(ach => (
                  <motion.div 
                    key={ach.id}
                    whileHover={{ y: -2 }}
                    className="p-6 rounded-[16px] border bg-surface border-[#FFFFFF] relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="text-3xl">
                        {getCategoryIcon(ach.category, true)}
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-surface-container border border-outline text-on-surface px-2 py-0.5 rounded-[4px] uppercase tracking-tight">
                        {locale === 'en' ? 'Unlocked' : 'Открыто'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-1 text-on-surface font-clash">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant mb-4 min-h-[32px] leading-snug">
                        {locale === 'en' && ach.descriptionEn ? ach.descriptionEn : ach.description}
                      </p>
                    </div>
                    <div className="inline-block self-start px-2 py-0.5 rounded-[4px] text-[10px] font-bold font-mono bg-surface-container text-on-surface border border-outline">
                      +{ach.xpReward} XP
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {unlockedList.length > 6 && (
              <p className="text-xs text-on-surface-variant mt-4 text-center font-sans">
                {locale === 'en' 
                  ? <>And <span className="font-mono">{unlockedList.length - 6}</span> more unlocked achievements in the full catalog.</>
                  : <>И еще <span className="font-mono">{unlockedList.length - 6}</span> разблокированных достижений в полном списке.</>}
              </p>
            )}
          </div>

          {/* Button to Open All Achievements */}
          <div className="flex justify-center mb-10 border-t border-outline pt-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 bg-on-surface hover:bg-surface-container text-inverse-on-surface font-bold px-8 py-3.5 rounded-[12px] text-xs transition-colors font-sans"
            >
              {showAll 
                ? (locale === 'en' ? 'Hide all achievements' : 'Скрыть список всех достижений') 
                : (locale === 'en' ? 'Show all achievements' : 'Открыть полный список достижений')}
              {showAll ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {/* Grouped Category View (Show All) */}
          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 w-full min-w-0"
              >
                {/* Category Tabs */}
                <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-thin">
                  {CATEGORY_IDS.map(catId => (
                    <button
                      key={catId}
                      onClick={() => setActiveCategory(catId)}
                      className={`px-4 py-2 rounded-[8px] font-bold text-xs whitespace-nowrap border transition-all ${
                        activeCategory === catId
                          ? 'bg-on-surface border-[#FFFFFF] text-inverse-on-surface'
                          : 'bg-surface border-outline text-on-surface-variant hover:text-on-background hover:bg-surface-container'
                      }`}
                    >
                      {getCategoryLabel(catId, locale)}
                    </button>
                  ))}
                </div>

                {/* Achievements Grid */}
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredAchievements.map(ach => {
                    const isUnlocked = !!unlockedAchievements[ach.id];
                    return (
                      <motion.div 
                        layout
                        key={ach.id}
                        className={`p-6 rounded-[16px] border transition-all flex flex-col justify-between ${
                          isUnlocked 
                            ? 'bg-surface border-[#FFFFFF] opacity-100' 
                            : 'bg-surface/30 border-outline-variant opacity-25'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">
                            {getCategoryIcon(ach.category, isUnlocked)}
                          </div>
                          {!isUnlocked && (
                            <div className="p-1.5 bg-surface-container border border-outline rounded-[6px]">
                              <Lock className="w-3.5 h-3.5 text-on-surface-variant" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold mb-1 font-clash ${isUnlocked ? 'text-on-surface' : 'text-[#636366]'}`}>
                            {ach.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant mb-4 min-h-[32px] leading-snug">
                            {locale === 'en' && ach.descriptionEn ? ach.descriptionEn : ach.description}
                          </p>
                        </div>
                        <div className={`inline-block self-start px-2 py-0.5 rounded-[4px] text-[10px] font-bold font-mono border ${
                          isUnlocked 
                            ? 'bg-surface-container text-on-surface border-outline' 
                            : 'bg-transparent text-on-surface-variant border-transparent'
                        }`}>
                          +{ach.xpReward} XP
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeMainTab === 'leagues' && (
        <div className="mt-4 -mx-4 md:-mx-6">
          <LeaguesComponent embedded={true} />
        </div>
      )}
    </div>
  );
}
