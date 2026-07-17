import React from 'react';
import { motion } from 'framer-motion';

export default function XPProgressBar({ levelData }) {
  if (!levelData || !levelData.current) return null;

  const { current, next, progress } = levelData;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-indigo-500">Ур. {current.level}</span>
        <span className="text-[10px] text-on-surface-variant leading-none">{current.title}</span>
      </div>
      
      <div className="w-32 md:w-48 h-3 bg-surface-container-high rounded-full overflow-hidden relative border border-outline-variant/30">
        <motion.div 
          className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
      </div>

      {next && (
        <span className="text-xs font-bold text-on-surface-variant opacity-50">Ур. {next.level}</span>
      )}
    </div>
  );
}
