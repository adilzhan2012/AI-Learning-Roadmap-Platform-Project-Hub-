import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Loader2, CheckCircle2 } from 'lucide-react';
import { saveFlashcardProgress, getFlashcardProgress } from '../../services/flashcardService.js';

export default function Flashcard({ term, definition, onRated }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      setLoading(true);
      const data = await getFlashcardProgress(term);
      setProgress(data);
      setLoading(false);
    }
    loadProgress();
  }, [term]);

  const handleRate = async (e, quality) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const result = await saveFlashcardProgress(term, quality);
      setProgress((prev) => ({
        ...prev,
        interval: result.interval,
        nextReview: result.nextReview.toISOString()
      }));
      if (onRated) {
        setTimeout(() => onRated(quality), 400); // short delay for visual feedback
      }
    } catch (err) {
      console.error("Failed to save flashcard progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const isDue = !progress || !progress.nextReview || new Date(progress.nextReview) <= new Date();

  return (
    <div 
      className="relative w-full min-h-[14rem] md:min-h-[16rem] cursor-pointer group"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d', display: 'grid' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className={`bg-surface border-2 ${isDue ? 'border-primary/30' : 'border-green-500/30'} rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center relative transition-colors`}
          style={{ backfaceVisibility: 'hidden', gridArea: '1 / 1' }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary/50 absolute top-4 right-4" />
          ) : !isDue ? (
            <div className="absolute top-4 right-4 flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Повторено
            </div>
          ) : (
            <div className="absolute top-4 right-4 flex items-center gap-1 text-orange-500 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 px-2 py-1 rounded-full">
              Пора повторить
            </div>
          )}

          <h3 className="text-xl md:text-2xl font-bold text-primary mb-6 mt-4">{term}</h3>
          
          <div className="text-on-surface-variant flex items-center justify-center gap-1.5 text-xs font-medium mt-auto pt-2 w-full opacity-60 group-hover:opacity-100 transition-opacity">
            <RotateCw className="w-3.5 h-3.5" /> Нажми, чтобы перевернуть
          </div>
        </div>

        {/* Back */}
        <div 
          className="bg-primary text-on-primary rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center relative"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', gridArea: '1 / 1' }}
        >
          <div className="overflow-y-auto custom-scrollbar flex-1 flex items-center justify-center w-full mb-12">
            <p className="text-sm md:text-base font-medium leading-relaxed">{definition}</p>
          </div>
          
          {/* Anki Rating Buttons */}
          <div 
            className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2"
            onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking buttons
          >
            {saving ? (
              <div className="col-span-4 flex justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-on-primary" />
              </div>
            ) : (
              <>
                <button 
                  onClick={(e) => handleRate(e, 1)}
                  className="bg-red-500/20 hover:bg-red-500/40 text-white text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors border border-red-500/30"
                  title="Снова (Сброс интервала)"
                >
                  Again
                </button>
                <button 
                  onClick={(e) => handleRate(e, 2)}
                  className="bg-orange-500/20 hover:bg-orange-500/40 text-white text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors border border-orange-500/30"
                  title="Трудно"
                >
                  Hard
                </button>
                <button 
                  onClick={(e) => handleRate(e, 3)}
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-white text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors border border-blue-500/30"
                  title="Хорошо (Увеличение интервала)"
                >
                  Good
                </button>
                <button 
                  onClick={(e) => handleRate(e, 4)}
                  className="bg-green-500/20 hover:bg-green-500/40 text-white text-[10px] sm:text-xs font-bold py-2 rounded-lg transition-colors border border-green-500/30"
                  title="Легко (Значительное увеличение интервала)"
                >
                  Easy
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
