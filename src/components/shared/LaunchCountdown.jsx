import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LaunchCountdown() {
  // Target date: September 1st, 2026
  const targetDate = new Date('2026-09-01T00:00:00').getTime();
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    // Initial calculation so it doesn't flash 00:00:00
    const calcTime = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setIsLaunched(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calcTime());

    const interval = setInterval(() => {
      const t = calcTime();
      setTimeLeft(t);
      if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const timeUnits = [
    { label: 'Дней', value: timeLeft.days },
    { label: 'Часов', value: timeLeft.hours },
    { label: 'Минут', value: timeLeft.minutes },
    { label: 'Секунд', value: timeLeft.seconds }
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-surface-container-low/60 backdrop-blur-2xl border border-outline-variant/50 rounded-[2.5rem] w-full max-w-2xl mx-auto mb-16 shadow-2xl relative overflow-hidden group">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-center z-10 w-full"
      >
        <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface mb-2 tracking-tight">
          Официальный запуск
        </h2>
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1 opacity-50 max-w-[100px]" />
          <p className="text-primary font-bold text-sm md:text-base uppercase tracking-[0.25em] bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
            1 Сентября 2026
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent flex-1 opacity-50 max-w-[100px]" />
        </div>

        {!isLaunched ? (
          <div className="flex gap-3 sm:gap-6 justify-center">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-surface/80 backdrop-blur-md border border-outline rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden transform transition-transform hover:scale-105 duration-300">
                  <span className="text-3xl sm:text-5xl font-black text-on-surface font-mono z-10 tracking-tighter">
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                  {/* Glossy highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-2xl pointer-events-none" />
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold text-on-surface-variant uppercase tracking-[0.2em] mt-4">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8"
          >
            <span className="text-4xl font-black text-primary uppercase tracking-widest">
              Мы запустились! 🎉
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
