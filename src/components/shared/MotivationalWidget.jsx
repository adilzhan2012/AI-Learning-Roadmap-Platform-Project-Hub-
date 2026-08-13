import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Quote } from 'lucide-react';
import { callGeminiWithRetry } from '../../services/courseService.js';
import { parseAIJson } from '../../utils/aiResponseParser.js';
import { useLocale, t } from '../../i18n.js';

const FALLBACK_QUOTES_RU = [
  "Каждое новое знание приближает тебя к твоей мечте.",
  "Ошибки — это не провал, это ступеньки к глубокому пониманию.",
  "Маленький прогресс каждый день дает огромные результаты в будущем."
];

const FALLBACK_QUOTES_EN = [
  "Every new concept brings you one step closer to your goals.",
  "Mistakes are not failures, but stepping stones to deep mastery.",
  "Small daily improvements lead to staggering long-term results."
];

export default function MotivationalWidget({ variant = 'dashboard' }) {
  const locale = useLocale();
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const shouldReduceMotion = useReducedMotion();

  const textTransition = shouldReduceMotion 
    ? { duration: 0 } 
    : { duration: 0.38, ease: "easeInOut" };

  const textInitial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 };
  const textAnimate = { opacity: 1, y: 0 };
  const textExit = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 };

  useEffect(() => {
    let isMounted = true;
    async function fetchQuotes() {
      const activeFallbacks = locale === 'en' ? FALLBACK_QUOTES_EN : FALLBACK_QUOTES_RU;
      const cacheKey = `ai_motivational_quotes_${locale}`;
      const cacheTimeKey = `ai_motivational_quotes_time_${locale}`;
      
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      // Cache valid for 24 hours
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (isMounted) {
              setQuotes(parsed);
              setLoading(false);
            }
            return;
          }
        } catch(e) {}
      }

      try {
        const langName = locale === 'en' ? 'English' : 'Russian';
        const prompt = `You are an inspiring educational mentor. Generate exactly 5 very short, highly inspiring and motivational phrases (1 sentence each) in ${langName} for a student learning new subjects and skills. Return ONLY a valid JSON array of strings. Example: ["Phrase 1", "Phrase 2", "Phrase 3", "Phrase 4", "Phrase 5"]`;
        
        const res = await callGeminiWithRetry(null, prompt, 'ai_question');
        const parsed = parseAIJson(res);
        
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setQuotes(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        } else if (isMounted) {
          setQuotes(activeFallbacks);
        }
      } catch (err) {
        console.error("Failed to generate quotes:", err);
        if (isMounted) {
          setQuotes(activeFallbacks);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchQuotes();
    
    return () => { isMounted = false; };
  }, [locale]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  // Determine styles based on variant
  const containerClasses = variant === 'dashboard' 
    ? "bg-surface border border-outline rounded-[16px] p-6 relative overflow-hidden group shadow-sm flex flex-col justify-center min-h-[140px]"
    : "bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-[16px] p-6 relative overflow-hidden group mb-8";

  const iconColor = variant === 'dashboard' ? "text-primary" : "text-indigo-500 dark:text-indigo-400";
  const textColor = variant === 'dashboard' ? "text-on-surface" : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className={containerClasses}>
      {/* Animated Background Glow (fills the entire block) */}
      <div className="absolute inset-0 rounded-[16px] overflow-hidden pointer-events-none z-0">
        <div className="border-glow-element" />
      </div>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none z-0">
        <Quote className="w-24 h-24" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-shrink-0 bg-surface-container rounded-full p-2.5">
          <Sparkles className={`w-5 h-5 ${iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden relative h-16 flex items-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-on-surface-variant text-sm font-medium"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{locale === 'en' ? 'AI Mentor is finding daily inspiration...' : 'ИИ-ментор придумывает вдохновение...'}</span>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex}
                initial={textInitial}
                animate={textAnimate}
                exit={textExit}
                transition={textTransition}
                className={`text-sm md:text-base font-bold font-clash ${textColor} leading-snug w-full pr-8`}
              >
                "{quotes[currentIndex]}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {!loading && quotes.length > 1 && (
          <div className="flex gap-1.5 flex-shrink-0 z-20">
            <button 
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-surface-container hover:bg-outline-variant text-on-surface-variant transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-surface-container hover:bg-outline-variant text-on-surface-variant transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {!loading && quotes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {quotes.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1 bg-outline'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
