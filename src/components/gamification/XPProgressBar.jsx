import React from 'react';
import { motion } from 'framer-motion';

export default function XPProgressBar({ levelData }) {
  if (!levelData || !levelData.current) return null;

  const { current, next, progress } = levelData;

  return (
    <div className="flex items-center gap-3 bg-surface border border-outline px-3 py-1.5 rounded-[12px] font-sans">
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-on-background font-mono">Ур. {current.level}</span>
        <span className="text-[10px] text-[#8A8A8E] leading-none">{current.title}</span>
      </div>
      
      <div className="w-32 md:w-48 h-[3px] bg-surface-container border border-outline-variant rounded-sm overflow-hidden relative">
        <motion.div 
          className="absolute top-0 left-0 bottom-0 bg-on-surface"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
      </div>

      {next && (
        <span className="text-xs font-bold text-[#8A8A8E] font-mono">Ур. {next.level}</span>
      )}
    </div>
  );
}
