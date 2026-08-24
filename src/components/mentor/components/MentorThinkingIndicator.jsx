import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

/**
 * Thinking indicator showing pulsing logo + 3 jumping dots before token stream starts
 */
export default function MentorThinkingIndicator({ locale, isStreaming = false }) {
  if (isStreaming) {
    // When actively streaming tokens, show inline blinking cursor
    return (
      <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 rounded-sm animate-pulse align-middle" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 w-fit rounded-2xl px-3.5 py-2.5 select-none shadow-sm"
    >
      {/* Pulsing AI Logo */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-5 h-5 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25"
      >
        <BrainCircuit className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
      </motion.div>

      <span className="font-medium">
        {locale === 'en' ? 'Mentor is thinking' : 'Наставник думает'}
      </span>

      {/* 3 Staggered Bouncing Dots */}
      <div className="flex items-center gap-1 ml-0.5">
        {[0, 0.15, 0.3].map((delay, idx) => (
          <motion.span
            key={idx}
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            }}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 inline-block"
          />
        ))}
      </div>
    </motion.div>
  );
}
