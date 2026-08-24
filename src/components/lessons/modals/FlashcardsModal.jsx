import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, ChevronLeft, ChevronRight, RotateCw, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import Flashcard from '../Flashcard.jsx';
import { useLocale } from '../../../i18n.js';
import { extractFlashcardsFromMarkdown } from '../../../services/ai/lessonSchema.js';

export default function FlashcardsModal({
  isOpen,
  onClose,
  topic = 'Термины урока',
  flashcards = [],
  lessonContent = ''
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forceFlipped, setForceFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const locale = useLocale();

  if (!isOpen) return null;

  // Resolve flashcards list: prefer passed array, fallback to dynamic extraction from markdown text
  let safeCards = [];
  if (Array.isArray(flashcards) && flashcards.length > 0) {
    safeCards = flashcards;
  } else if (lessonContent) {
    safeCards = extractFlashcardsFromMarkdown(lessonContent, topic, locale);
  }

  if (safeCards.length === 0) {
    safeCards = [
      {
        term: topic || (locale === 'en' ? 'Topic Overview' : 'Обзор темы'),
        definition: locale === 'en' 
          ? 'Key concept and subject of study for this lesson. Study the lesson text for in-depth insights and examples.' 
          : 'Ключевая концепция и предмет изучения данного урока. Изучите теоретический материал урока для более подробного понимания.'
      }
    ];
  }

  const currentCard = safeCards[currentIndex] || safeCards[0];
  const progressPercent = Math.round(((currentIndex + 1) / safeCards.length) * 100);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === safeCards.length - 1;

  const handleNext = () => {
    setForceFlipped(false);
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    setForceFlipped(false);
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleCardRated = (quality) => {
    if (!isLast) {
      setTimeout(() => {
        setForceFlipped(false);
        setCurrentIndex(prev => prev + 1);
      }, 200);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
      }, 200);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setForceFlipped(false);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 bg-white dark:bg-surface border border-zinc-200 dark:border-outline-variant/60 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden text-zinc-900 dark:text-on-surface flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-outline-variant/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-on-surface tracking-tight">
                {locale === 'en' ? 'Interactive Flashcards' : 'Интерактивные карточки'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-on-surface-variant font-medium">
                {isCompleted 
                  ? (locale === 'en' ? 'Session Complete' : 'Повторение завершено')
                  : `${locale === 'en' ? 'Card' : 'Карточка'} ${currentIndex + 1} ${locale === 'en' ? 'of' : 'из'} ${safeCards.length} • ${topic}`
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-surface-container dark:hover:bg-surface-container-high dark:text-on-surface-variant dark:hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-100 dark:bg-surface-container h-1.5 rounded-full overflow-hidden mt-3 mb-4">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
            animate={{ width: `${isCompleted ? 100 : progressPercent}%` }} 
            transition={{ ease: 'easeOut', duration: 0.2 }}
          />
        </div>

        {/* Interactive Flashcard Container */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 w-full min-h-0">
          <AnimatePresence mode="wait">
            {!isCompleted ? (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Flashcard 
                  term={currentCard.term || currentCard.front} 
                  definition={currentCard.definition || currentCard.back} 
                  forceFlipped={forceFlipped}
                  onRated={handleCardRated}
                />
              </motion.div>
            ) : (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8 px-4 my-auto"
              >
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black mb-2 text-zinc-900 dark:text-on-surface">
                  {locale === 'en' ? 'All Cards Reviewed!' : 'Все карточки изучены!'}
                </h3>
                <p className="text-zinc-600 dark:text-on-surface-variant max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                  {locale === 'en'
                    ? `Great job! You reviewed all ${safeCards.length} key terms for this lesson. Intervals have been updated in your study queue.`
                    : `Отличная работа! Вы повторили все ${safeCards.length} ключевых терминов этого урока. Интервалы повторения успешно обновлены.`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs text-zinc-800 dark:bg-surface-container dark:hover:bg-surface-container-high dark:border-outline-variant dark:text-on-surface transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{locale === 'en' ? 'Review Again' : 'Повторить заново'}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-xs cursor-pointer"
                  >
                    <span>{locale === 'en' ? 'Done' : 'Готово'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar */}
        {!isCompleted && (
          <div className="pt-4 border-t border-zinc-200 dark:border-outline-variant/40 flex items-center justify-between gap-3 mt-auto">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-800 dark:bg-surface-container dark:border-outline-variant dark:hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-surface-container transition-all text-xs dark:text-on-surface cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{locale === 'en' ? 'Previous' : 'Назад'}</span>
            </button>

            {/* Flip toggle and dot pagination */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForceFlipped(prev => !prev)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/25 transition-all cursor-pointer"
                title={locale === 'en' ? 'Flip card' : 'Перевернуть карточку'}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'Flip' : 'Перевернуть'}</span>
              </button>

              <div className="flex items-center gap-1">
                {safeCards.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setForceFlipped(false);
                      setCurrentIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex 
                        ? 'w-5 bg-indigo-500 shadow-md shadow-indigo-500/40' 
                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-surface-container-high dark:hover:bg-on-surface-variant'
                    }`}
                    title={`${locale === 'en' ? 'Card' : 'Карточка'} ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-xs cursor-pointer"
            >
              <span>{isLast ? (locale === 'en' ? 'Finish' : 'Завершить') : (locale === 'en' ? 'Next' : 'Далее')}</span>
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
