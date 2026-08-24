import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronDown, 
  Download, 
  Layers, 
  Lightbulb, 
  Baby, 
  Presentation,
  Check
} from 'lucide-react';
import { useLocale } from '../../../i18n.js';

export default function LessonToolsDropdown({
  onOpenFlashcards,
  onOpenExport,
  onOpenInsight,
  onOpenELI5,
  onOpenSlides,
  flashcardsCount = 0,
  hasInsight = false,
  hasELI5 = false,
  hasSlides = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const locale = useLocale();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (callback) => {
    setIsOpen(false);
    callback();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all shadow-sm active:scale-95"
        title={locale === 'en' ? 'Lesson Tools & Materials' : 'Материалы и опции урока'}
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>{locale === 'en' ? 'Lesson Tools' : 'Опции урока'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-outline-variant shadow-2xl p-1.5 z-[120] text-on-surface backdrop-blur-xl"
          >
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/50">
              {locale === 'en' ? 'Interactive Materials' : 'Интерактивные материалы'}
            </div>

            <div className="py-1 space-y-0.5">
              {/* 1. Flashcards */}
              <button
                type="button"
                onClick={() => handleAction(onOpenFlashcards)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">{locale === 'en' ? 'Interactive Flashcards' : 'Интерактивные карточки'}</p>
                    <p className="text-[10px] text-on-surface-variant font-normal">
                      {locale === 'en' ? `${flashcardsCount || '5-7'} terms for practice` : `${flashcardsCount || '5-7'} терминов для повторения`}
                    </p>
                  </div>
                </div>
                {flashcardsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md">
                    {flashcardsCount}
                  </span>
                )}
              </button>

              {/* 2. Real-World Insight */}
              <button
                type="button"
                onClick={() => handleAction(onOpenInsight)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-105 transition-transform">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">{locale === 'en' ? 'Why learn this?' : 'Зачем мне это?'}</p>
                    <p className="text-[10px] text-on-surface-variant font-normal">
                      {locale === 'en' ? 'Real-world application' : 'Реальное применение в жизни'}
                    </p>
                  </div>
                </div>
                {hasInsight && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* 3. ELI5 */}
              <button
                type="button"
                onClick={() => handleAction(onOpenELI5)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-purple-500/10 hover:text-purple-400 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Baby className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">{locale === 'en' ? 'Explain Like I’m 5' : 'Просто о сложном'}</p>
                    <p className="text-[10px] text-on-surface-variant font-normal">
                      {locale === 'en' ? 'Simplified explanation' : 'Объяснение на пальцах'}
                    </p>
                  </div>
                </div>
                {hasELI5 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* 4. Slides */}
              <button
                type="button"
                onClick={() => handleAction(onOpenSlides)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-blue-500/10 hover:text-blue-400 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <Presentation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold">{locale === 'en' ? 'Slides & Pitch' : 'Слайды урока'}</p>
                    <p className="text-[10px] text-on-surface-variant font-normal">
                      {locale === 'en' ? 'Interactive visual presentation' : 'Интерактивная презентация'}
                    </p>
                  </div>
                </div>
                {hasSlides && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>

            <div className="border-t border-outline-variant/50 my-1 pt-1">
              {/* 5. Export */}
              <button
                type="button"
                onClick={() => handleAction(onOpenExport)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold">{locale === 'en' ? 'Export Materials' : 'Экспорт конспекта'}</p>
                  <p className="text-[10px] text-on-surface-variant font-normal">
                    {locale === 'en' ? 'Download Markdown, Homework, Anki' : 'Скачать .md, ДЗ или Anki CSV'}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
