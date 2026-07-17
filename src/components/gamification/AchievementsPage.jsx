import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../../constants/achievements.js';
import { useAchievements } from '../../hooks/useAchievements.js';

export default function AchievementsPage() {
  const { unlockedAchievements } = useAchievements();

  const unlockedCount = Object.keys(unlockedAchievements).length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = Math.round((unlockedCount / totalCount) * 100) || 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-on-surface mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-amber-500" />
          Мои достижения
        </h1>
        <p className="text-on-surface-variant text-lg">Выполняйте задания и получайте ценные награды (XP) за свои успехи!</p>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl p-6 mb-10 shadow-lg flex items-center gap-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-black text-amber-500">{progress}%</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-on-surface mb-2">Общий прогресс</h2>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, type: 'spring' }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
            />
          </div>
          <p className="text-sm font-bold text-on-surface-variant mt-2 text-right">
            Разблокировано: {unlockedCount} из {totalCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = !!unlockedAchievements[ach.id];
          return (
            <motion.div 
              key={ach.id}
              whileHover={isUnlocked ? { scale: 1.02, y: -2 } : {}}
              className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
                isUnlocked 
                  ? 'bg-surface border-amber-500/30 shadow-lg' 
                  : 'bg-surface-container border-outline-variant/50 opacity-60 grayscale'
              }`}
            >
              {isUnlocked && (
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
              )}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`text-5xl filter ${isUnlocked ? 'drop-shadow-md' : 'opacity-50'}`}>
                  {ach.icon}
                </div>
                {!isUnlocked && <Lock className="w-6 h-6 text-on-surface-variant" />}
              </div>
              <h3 className={`text-lg font-black mb-1 ${isUnlocked ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {ach.title}
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 min-h-[40px] leading-snug">
                {ach.description}
              </p>
              <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                isUnlocked ? 'bg-amber-500/10 text-amber-500' : 'bg-on-surface/5 text-on-surface-variant'
              }`}>
                +{ach.xpReward} XP
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
