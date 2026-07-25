import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePage({ endTime }) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime) return;

    const targetDate = endTime.toDate ? endTime.toDate() : new Date(endTime);

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0 });
        // The parent component should automatically re-render when maintenance is over,
        // but just in case, we can trigger a hard reload if it reaches zero while watching.
        // We'll let the Layout listener handle it first.
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background w-full px-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-2xl text-center"
      >
        <div className="w-24 h-24 mb-8 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Wrench className="w-12 h-12 text-amber-500 animate-pulse" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
          Технические работы
        </h1>
        <p className="text-lg text-zinc-400 mb-12 max-w-lg">
          Мы обновляем платформу, чтобы сделать ее лучше. Пожалуйста, подождите, сайт скоро заработает.
        </p>

        {endTime && (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Ориентировочное время завершения
            </p>
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-24 md:w-24 md:h-28 bg-[#18181B] border border-white/10 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                  <span className="text-4xl md:text-5xl font-mono font-bold text-white">{formatNum(remaining.hours)}</span>
                </div>
                <span className="text-xs text-zinc-500 mt-3 uppercase tracking-wider font-medium">Часов</span>
              </div>
              
              <div className="text-4xl md:text-5xl font-mono font-bold text-zinc-700 mt-6 md:mt-8">:</div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-24 md:w-24 md:h-28 bg-[#18181B] border border-white/10 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                  <span className="text-4xl md:text-5xl font-mono font-bold text-white">{formatNum(remaining.minutes)}</span>
                </div>
                <span className="text-xs text-zinc-500 mt-3 uppercase tracking-wider font-medium">Минут</span>
              </div>
              
              <div className="text-4xl md:text-5xl font-mono font-bold text-zinc-700 mt-6 md:mt-8">:</div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-24 md:w-24 md:h-28 bg-[#18181B] border border-white/10 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
                  <span className="text-4xl md:text-5xl font-mono font-bold text-amber-400">{formatNum(remaining.seconds)}</span>
                </div>
                <span className="text-xs text-zinc-500 mt-3 uppercase tracking-wider font-medium">Секунд</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
