import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, ArrowRight } from 'lucide-react';

export default function MentorBubble({ 
  isOpen, 
  onOpenMentor, 
  streakDays = 0, 
  isInLesson = false,
  isLessonCompleted = false 
}) {
  const [activeBubble, setActiveBubble] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveBubble(null);
      return;
    }

    const checkAndShowBubble = (triggerType, message, actionText = 'Спросить') => {
      try {
        const now = Date.now();
        const lastTime = parseInt(sessionStorage.getItem('last_mentor_bubble_time') || '0', 10);
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (now - lastTime < FIVE_MINUTES) return false;

        let shownTriggers = [];
        try {
          shownTriggers = JSON.parse(sessionStorage.getItem('shown_mentor_bubbles') || '[]');
        } catch {
          shownTriggers = [];
        }
        if (Array.isArray(shownTriggers) && shownTriggers.includes(triggerType)) return false;

        setActiveBubble({ type: triggerType, message, actionText });
        sessionStorage.setItem('last_mentor_bubble_time', now.toString());
        sessionStorage.setItem('shown_mentor_bubbles', JSON.stringify([...(Array.isArray(shownTriggers) ? shownTriggers : []), triggerType]));

        // Auto dismiss bubble after 8 seconds
        setTimeout(() => {
          setActiveBubble(prev => prev?.type === triggerType ? null : prev);
        }, 8000);

        return true;
      } catch (err) {
        console.warn('[MentorBubble] Storage access failed:', err);
        return false;
      }
    };

    // Priority 1: Streak risk (after 18:00 local time and streak > 0)
    const currentHour = new Date().getHours();
    if (streakDays > 0 && currentHour >= 18) {
      const shown = checkAndShowBubble(
        'streak_risk',
        `Серия ${streakDays} дней под угрозой! Заглянем в урок на пару минут?`,
        'Учиться'
      );
      if (shown) return;
    }

    // Priority 2: Lesson completion
    if (isLessonCompleted) {
      const shown = checkAndShowBubble(
        'lesson_completed',
        'Отличный результат! Отвечу на любые вопросы по теме урока.',
        'Обсудить'
      );
      if (shown) return;
    }

    // Priority 3: Inactivity in lesson (90 seconds)
    if (isInLesson) {
      const timer = setTimeout(() => {
        checkAndShowBubble(
          'inactivity',
          'Застряли на этом материале? Спросите меня, я объясню простыми словами!',
          'Помоги'
        );
      }, 90000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, streakDays, isInLesson, isLessonCompleted]);

  if (!activeBubble || isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-24 right-6 md:left-8 md:right-auto z-[89] max-w-[280px] sm:max-w-[320px] bg-surface-container-high/95 border border-indigo-500/30 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2 font-sans select-none text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BrainCircuit className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">AI Наставник</span>
          </div>
          <button 
            onClick={() => setActiveBubble(null)}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-on-surface leading-relaxed">
          {activeBubble.message}
        </p>

        <button
          onClick={() => {
            setActiveBubble(null);
            onOpenMentor();
          }}
          className="mt-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95"
        >
          <span>{activeBubble.actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
