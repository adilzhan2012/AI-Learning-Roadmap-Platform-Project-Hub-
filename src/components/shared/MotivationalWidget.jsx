import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Quote } from 'lucide-react';
import { callGeminiWithRetry } from '../../services/courseService.js';
import { parseAIJson } from '../../utils/aiResponseParser.js';

const FALLBACK_QUOTES = [
  "Каждый написанный код делает тебя на шаг ближе к мастерству.",
  "Ошибки — это не провал, это ступеньки к пониманию.",
  "Маленький прогресс каждый день дает огромные результаты в долгосроке."
];

export default function MotivationalWidget({ variant = 'dashboard' }) {
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchQuotes() {
      // Check cache first to avoid re-generating on every mount
      const cached = localStorage.getItem('ai_motivational_quotes');
      const cacheTime = localStorage.getItem('ai_motivational_quotes_time');
      
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
        const prompt = `You are a technical mentor. Generate exactly 5 very short, highly inspiring and motivational phrases (1 sentence each) in Russian for a student learning software engineering. Return ONLY a valid JSON array of strings. Example: ["Фраза 1", "Фраза 2", "Фраза 3", "Фраза 4", "Фраза 5"]`;
        
        const res = await callGeminiWithRetry(null, prompt, 'ai_question');
        const parsed = parseAIJson(res);
        
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setQuotes(parsed);
          localStorage.setItem('ai_motivational_quotes', JSON.stringify(parsed));
          localStorage.setItem('ai_motivational_quotes_time', Date.now().toString());
        } else if (isMounted) {
          setQuotes(FALLBACK_QUOTES);
        }
      } catch (err) {
        console.error("Failed to generate quotes:", err);
        if (isMounted) {
          setQuotes(FALLBACK_QUOTES);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchQuotes();
    
    return () => { isMounted = false; };
  }, []);

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
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
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
                <span>ИИ-ментор придумывает вдохновение...</span>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
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
