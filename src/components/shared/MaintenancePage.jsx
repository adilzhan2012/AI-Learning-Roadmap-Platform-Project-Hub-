import React, { useState, useEffect } from 'react';
import { Wrench, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, t, setLocale } from '../../i18n.js';

export default function MaintenancePage({ endTime }) {
  const locale = useLocale();
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime) return;

    const targetDate = endTime.toDate ? endTime.toDate() : new Date(endTime);

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setRemaining({ hours: h, minutes: m, seconds: s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatNum = (num) => String(num).padStart(2, '0');

  const toggleLanguage = () => {
    setLocale(locale === 'ru' ? 'en' : 'ru');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-background w-full px-4 overflow-hidden relative transition-colors duration-200">
      {/* Top controls: Language toggle and Admin sign-in */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <a
          href="/login"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold shadow-sm transition-all active:scale-95 text-indigo-400 hover:text-indigo-300"
        >
          <span>Вход для STAFF</span>
        </a>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-amber-500/10 dark:bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-2xl text-center"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-on-surface tracking-tight mb-3 sm:mb-4 font-clash">
          {t('maintenance.title')}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-on-surface-variant mb-8 sm:mb-12 max-w-lg leading-relaxed">
          {t('maintenance.subtitle')}
        </p>

        {endTime && (
          <div className="flex flex-col items-center">
            <p className="text-xs sm:text-sm font-bold text-on-surface-variant/80 uppercase tracking-widest mb-4">
              {t('maintenance.estimatedCompletion')}
            </p>
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="w-18 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28 bg-surface border border-outline-variant rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-on-surface">{formatNum(remaining.hours)}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-on-surface-variant mt-2 sm:mt-3 uppercase tracking-wider font-semibold">{t('maintenance.hours')}</span>
              </div>
              
              <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-outline-variant -mt-5">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="w-18 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28 bg-surface border border-outline-variant rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-on-surface">{formatNum(remaining.minutes)}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-on-surface-variant mt-2 sm:mt-3 uppercase tracking-wider font-semibold">{t('maintenance.minutes')}</span>
              </div>
              
              <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-outline-variant -mt-5">:</div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="w-18 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28 bg-surface border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-amber-500 dark:text-amber-400">{formatNum(remaining.seconds)}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-2 sm:mt-3 uppercase tracking-wider font-bold">{t('maintenance.seconds')}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
