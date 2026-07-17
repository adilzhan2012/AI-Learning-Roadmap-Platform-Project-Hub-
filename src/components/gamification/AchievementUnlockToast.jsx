import React from 'react';
import { motion } from 'framer-motion';

export default function AchievementUnlockToast({ achievement }) {
  if (!achievement) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="bg-surface border border-amber-500/30 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
    >
      <div className="text-4xl filter drop-shadow-md">{achievement.icon}</div>
      <div className="flex-1">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">Достижение открыто!</p>
        <p className="font-bold text-on-surface text-lg leading-tight">{achievement.title}</p>
        <p className="text-xs text-on-surface-variant mt-1">{achievement.description}</p>
      </div>
      <div className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-xs font-black self-start mt-1">
        +{achievement.xpReward} XP
      </div>
    </motion.div>
  );
}
