import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

export default function QuizQuestion({ question, selectedOption, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <h3 className="text-xl font-bold text-on-surface mb-6">{question.question}</h3>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                isSelected 
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 shadow-md' 
                  : 'bg-surface-container border-outline-variant text-on-surface hover:border-indigo-500/50 hover:bg-surface-container-high'
              }`}
            >
              <div className="flex-shrink-0">
                {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 opacity-50" />}
              </div>
              <span className="font-medium text-sm leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
