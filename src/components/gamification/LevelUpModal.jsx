import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelUpModal({ oldLevel, newLevel, onClose }) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#818cf8', '#c084fc', '#f472b6'],
      zIndex: 300,
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="w-full max-w-sm bg-surface border border-outline-variant rounded-[2rem] p-8 shadow-2xl relative z-10 text-center flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center relative z-10 shadow-inner">
            <Trophy className="w-12 h-12 text-on-surface drop-shadow-md" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-2">
          Уровень повышен!
        </h2>
        
        <div className="flex items-center gap-3 text-on-surface-variant font-bold text-xl mb-6 bg-surface-container px-4 py-2 rounded-2xl">
          <span className="opacity-50">{oldLevel.level}</span>
          <ChevronUp className="w-6 h-6 text-indigo-500" />
          <span className="text-on-surface text-2xl">{newLevel.level}</span>
        </div>

        <p className="text-sm text-on-surface-variant mb-8">
          Вы достигли звания <span className="font-bold text-on-surface">"{newLevel.title}"</span>. Продолжайте в том же духе!
        </p>

        <button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-on-surface py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          Продолжить
        </button>
      </motion.div>
    </div>
  );
}
