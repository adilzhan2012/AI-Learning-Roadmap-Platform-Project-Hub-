import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Loader2, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { saveFlashcardProgress, getFlashcardProgress } from '../../services/flashcardService.js';
import { useLocale } from '../../i18n.js';

export default function Flashcard({ term, definition, onRated, forceFlipped = null }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    setIsFlipped(false);
  }, [term]);

  useEffect(() => {
    if (forceFlipped !== null && forceFlipped !== undefined) {
      setIsFlipped(forceFlipped);
    }
  }, [forceFlipped]);

  useEffect(() => {
    let isMounted = true;
    async function loadProgress() {
      if (!term) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setLoading(true);
      try {
        const data = await getFlashcardProgress(term);
        if (isMounted) setProgress(data);
      } catch (err) {
        console.warn("Failed to load flashcard progress:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProgress();
    return () => { isMounted = false; };
  }, [term]);

  const handleRate = async (e, quality) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const result = await saveFlashcardProgress(term, quality);
      if (result) {
        setProgress((prev) => ({
          ...prev,
          interval: result.interval,
          nextReview: result.nextReview ? result.nextReview.toISOString() : null
        }));
      }
    } catch (err) {
      console.warn("Failed to save flashcard progress:", err);
    } finally {
      setSaving(false);
      if (onRated) {
        setTimeout(() => onRated(quality), 150);
      }
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
          className={`bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-surface-container dark:via-surface dark:to-surface-container-high border-2 ${
            isDue ? 'border-zinc-300 dark:border-outline-variant/60 hover:border-indigo-500/50' : 'border-emerald-500/40 hover:border-emerald-500/60'
          } rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 w-full min-h-[22rem] sm:min-h-[24rem] text-zinc-900 dark:text-on-surface`}
          style={{ backfaceVisibility: 'hidden', gridArea: '1 / 1' }}
        >
          {/* Decorative ambient background */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

          {/* Top Status Header */}
          <div className="w-full flex items-center justify-between relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> {locale === 'en' ? 'Term' : 'Термин'}
            </span>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400 dark:text-on-surface-variant" />
            ) : !isDue ? (
              <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> {locale === 'en' ? 'Mastered' : 'Изучено'}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> {locale === 'en' ? 'Due' : 'К повторению'}
              </div>
            )}
          </div>

          {/* Center Content: Term */}
          <div className="my-auto py-6 relative z-10 max-w-lg">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-on-surface tracking-tight leading-snug drop-shadow-sm">
              {term || (locale === 'en' ? "Concept Term" : "Ключевой термин")}
            </h3>
          </div>

          {/* Bottom Flip Prompt */}
          <div className="relative z-10 w-full flex justify-center mt-auto pt-2">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 py-2.5 px-6 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all shadow-sm">
              <RotateCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" /> 
              <span>{locale === 'en' ? 'Click card to reveal definition' : 'Нажмите, чтобы узнать ответ'}</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div 
          className="bg-gradient-to-br from-indigo-50/95 via-white to-purple-50/95 dark:from-[#1c1b2f] dark:via-[#161622] dark:to-[#1a172e] border-2 border-indigo-200 dark:border-indigo-500/40 text-zinc-900 dark:text-zinc-100 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between text-center relative overflow-hidden w-full min-h-[22rem] sm:min-h-[24rem]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', gridArea: '1 / 1' }}
        >
          {/* Decorative ambient background */}
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="w-full flex items-center justify-between relative z-10 pb-2 border-b border-zinc-200 dark:border-white/10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              💡 {locale === 'en' ? 'Definition & Rationale' : 'Объяснение и суть'}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{locale === 'en' ? 'Rate difficulty ↓' : 'Оцените сложность ↓'}</span>
          </div>

          {/* Center Content: Definition */}
          <div className="overflow-y-auto custom-scrollbar flex-1 flex items-center justify-center my-4 px-2 max-h-[12rem] sm:max-h-[14rem] relative z-10">
            <p className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed drop-shadow-xs">
              {definition || (locale === 'en' ? "Explanation not provided." : "Объяснение отсутствует.")}
            </p>
          </div>
          
          {/* Bottom Anki Rating Bar */}
          <div 
            className="relative z-10 pt-4 border-t border-zinc-200 dark:border-white/10 w-full mt-auto"
            onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking rating buttons
          >
            {saving ? (
              <div className="flex justify-center items-center py-3 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="ml-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">{locale === 'en' ? 'Saving...' : 'Сохранение...'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <button 
                  type="button"
                  onClick={(e) => handleRate(e, 1)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white border border-red-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                  title={locale === 'en' ? 'Again (Reset interval)' : 'Снова (Сброс интервала)'}
                >
                  <span>{locale === 'en' ? 'Again' : 'Снова'}</span>
                  <span className="text-[10px] font-normal opacity-75">{locale === 'en' ? '1 min' : '1 мин'}</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleRate(e, 2)}
                  className="bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white dark:hover:text-white border border-amber-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                  title={locale === 'en' ? 'Hard (Review in 1 day)' : 'Трудно (1 день)'}
                >
                  <span>{locale === 'en' ? 'Hard' : 'Трудно'}</span>
                  <span className="text-[10px] font-normal opacity-75">{locale === 'en' ? '1 day' : '1 день'}</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleRate(e, 3)}
                  className="bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white border border-blue-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                  title={locale === 'en' ? 'Good (Review in 3 days)' : 'Хорошо (3 дня)'}
                >
                  <span>{locale === 'en' ? 'Good' : 'Хорошо'}</span>
                  <span className="text-[10px] font-normal opacity-75">{locale === 'en' ? '3 days' : '3 дня'}</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleRate(e, 4)}
                  className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white border border-emerald-500/30 font-extrabold py-2.5 px-1 sm:px-2 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                  title={locale === 'en' ? 'Easy (Review in 7 days)' : 'Легко (7 дней)'}
                >
                  <span>{locale === 'en' ? 'Easy' : 'Легко'}</span>
                  <span className="text-[10px] font-normal opacity-75">{locale === 'en' ? '7 days' : '7 дней'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
