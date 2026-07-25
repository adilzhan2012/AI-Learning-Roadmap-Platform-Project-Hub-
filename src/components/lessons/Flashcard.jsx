import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Loader2, CheckCircle2, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { saveFlashcardProgress, getFlashcardProgress } from '../../services/flashcardService.js';

export default function Flashcard({ term, definition, onRated }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      if (!term) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getFlashcardProgress(term);
        setProgress(data);
      } catch (err) {
        console.error("Failed to load flashcard progress:", err);
      } finally {
        setLoading(false);
      }
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
        setTimeout(() => onRated(quality), 300); // smooth delay for visual transition
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
      className="relative w-full min-h-[22rem] sm:min-h-[24rem] cursor-pointer group max-w-2xl mx-auto select-none"
      style={{ perspective: '1200px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d', display: 'grid' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* Front Face */}
        <div 
          className={`bg-gradient-to-br from-surface-container via-surface to-surface-container-high border-2 ${
            isDue ? 'border-outline-variant/60 hover:border-indigo-500/50' : 'border-emerald-500/40 hover:border-emerald-500/60'
          } rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 w-full min-h-[22rem] sm:min-h-[24rem]`}
          style={{ backfaceVisibility: 'hidden', gridArea: '1 / 1' }}
        >
          {/* Decorative ambient background */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

          {/* Top Status Header */}
          <div className="w-full flex items-center justify-between relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Термин
            </span>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant" />
            ) : !isDue ? (
              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Изучено
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> К повторению
              </div>
            )}
          </div>

          {/* Center Content: Term */}
          <div className="my-auto py-6 relative z-10 max-w-lg">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface tracking-tight leading-snug drop-shadow-sm">
              {term || "Неизвестный термин"}
            </h3>
          </div>

          {/* Bottom Flip Prompt */}
          <div className="relative z-10 w-full flex justify-center mt-auto pt-2">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 py-2.5 px-6 rounded-full group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all shadow-sm">
              <RotateCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" /> 
              <span>Нажмите, чтобы узнать ответ</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div 
          className="bg-gradient-to-br from-indigo-950/50 via-surface-container-high to-purple-950/50 border-2 border-indigo-500/50 text-on-surface rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden w-full min-h-[22rem] sm:min-h-[24rem]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', gridArea: '1 / 1' }}
        >
          {/* Decorative ambient background */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="w-full flex items-center justify-between relative z-10 pb-2 border-b border-outline-variant/30">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              💡 Объяснение
            </span>
            <span className="text-xs text-on-surface-variant font-medium">Оцените сложность ↓</span>
          </div>

          {/* Center Content: Definition */}
          <div className="overflow-y-auto custom-scrollbar flex-1 flex items-center justify-center my-4 px-2 max-h-[12rem] sm:max-h-[14rem] relative z-10">
            <p className="text-base sm:text-lg font-medium text-on-surface/95 leading-relaxed">
              {definition || "Объяснение отсутствует."}
            </p>
          </div>
          
          {/* Bottom Anki Rating Bar */}
          <div 
            className="relative z-10 pt-4 border-t border-outline-variant/30 w-full mt-auto"
            onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking rating buttons
          >
            {saving ? (
              <div className="flex justify-center items-center py-3 bg-surface/50 rounded-2xl border border-white/5">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="ml-2 text-xs font-bold text-on-surface-variant">Сохранение прогресса...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <button 
                  onClick={(e) => handleRate(e, 1)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  title="Снова (Сброс интервала)"
                >
                  <span>Снова</span>
                  <span className="text-[10px] font-normal opacity-75">1 мин</span>
                </button>
                <button 
                  onClick={(e) => handleRate(e, 2)}
                  className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  title="Трудно"
                >
                  <span>Трудно</span>
                  <span className="text-[10px] font-normal opacity-75">1 день</span>
                </button>
                <button 
                  onClick={(e) => handleRate(e, 3)}
                  className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  title="Хорошо (Увеличение интервала)"
                >
                  <span>Хорошо</span>
                  <span className="text-[10px] font-normal opacity-75">3 дня</span>
                </button>
                <button 
                  onClick={(e) => handleRate(e, 4)}
                  className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  title="Легко (Значительное увеличение интервала)"
                >
                  <span>Легко</span>
                  <span className="text-[10px] font-normal opacity-75">7 дней</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
