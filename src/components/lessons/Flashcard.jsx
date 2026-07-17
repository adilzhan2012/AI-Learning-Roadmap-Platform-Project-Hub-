import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';

export default function Flashcard({ term, definition }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full h-48 md:h-56 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-surface border-2 border-primary/20 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">{term}</h3>
          <div className="absolute bottom-4 text-on-surface-variant flex items-center gap-1.5 text-xs font-medium">
            <RotateCw className="w-3.5 h-3.5" /> Нажми, чтобы перевернуть
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 bg-primary text-on-primary rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-base font-medium leading-relaxed">{definition}</p>
        </div>
      </motion.div>
    </div>
  );
}
