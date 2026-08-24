import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated backdrop with 2 slow drifting gradient blur spots
 */
export default function MentorBackdrop({ isDark }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none md:rounded-2xl z-0">
      {/* Spot 1 - Indigo / Violet */}
      <motion.div
        animate={{
          x: [-30, 40, -20, -30],
          y: [-20, 30, -40, -20],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] ${
          isDark 
            ? 'bg-indigo-600/20' 
            : 'bg-indigo-400/25'
        }`}
      />

      {/* Spot 2 - Cyan / Purple */}
      <motion.div
        animate={{
          x: [30, -40, 20, 30],
          y: [30, -30, 40, 30],
          scale: [0.95, 1.2, 1, 0.95],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -bottom-20 -right-20 w-88 h-88 rounded-full blur-[110px] ${
          isDark 
            ? 'bg-purple-600/15' 
            : 'bg-cyan-400/20'
        }`}
      />
    </div>
  );
}
