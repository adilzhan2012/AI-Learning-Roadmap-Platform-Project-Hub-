import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Award, Activity } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) return;
    if (start === end) return;

    const totalDuration = 1500;
    let incrementTime = (totalDuration / end) * 2;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Insights() {
  const learningData = [20, 35, 25, 45, 55, 40, 65, 80, 75, 90, 85, 100];
  const points = learningData.map((val, i) => `${(i / (learningData.length - 1)) * 100},${100 - val}`).join(' ');

  return (
    <motion.main initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <motion.div variants={itemVariants} className="mb-4">
        <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">Learning Insights</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">Track your momentum, mastery progression, and consistency over time.</p>
      </motion.div>

      {/* Main Chart */}
      <motion.div variants={itemVariants} className="bg-surface border border-outline-variant rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Knowledge Growth Trajectory</h2>
            <p className="text-sm text-on-surface-variant mt-1">Based on course completions, quiz scores, and daily activity.</p>
          </div>
          <select className="bg-surface-container text-on-surface border border-outline-variant rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="relative w-full h-64 md:h-80 bg-surface-container/30 rounded-2xl p-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-outline-variant/30 stroke-[0.5]" />
            ))}
            
            {/* Area Fill */}
            <motion.polygon 
              points={`0,100 ${points} 100,100`} 
              fill="url(#gradientFill)" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            />

            {/* Line Path */}
            <motion.polyline 
              points={points} 
              fill="none" 
              stroke="var(--md-primary)" 
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            <defs>
              <linearGradient id="gradientFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
          <Activity className="w-8 h-8 text-white/80 mb-6" />
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">Total Learning Hours</h3>
          <div className="text-5xl font-bold tracking-tight mb-2"><AnimatedNumber value={148} /><span className="text-2xl text-white/60 ml-1">h</span></div>
          <p className="text-sm text-green-300 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +12h this week</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          <Target className="w-8 h-8 text-primary mb-6" />
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Quiz Accuracy</h3>
          <div className="text-5xl font-bold text-on-surface mb-2"><AnimatedNumber value={92} /><span className="text-2xl text-on-surface-variant ml-1">%</span></div>
          <p className="text-sm text-green-500 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Top 5% of learners</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
          <Zap className="w-8 h-8 text-orange-500 mb-6" />
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Current Streak</h3>
          <div className="text-5xl font-bold text-on-surface mb-2"><AnimatedNumber value={23} /><span className="text-2xl text-on-surface-variant ml-1">days</span></div>
          <p className="text-sm text-on-surface-variant font-medium flex items-center gap-1">Personal record is 31 days</p>
        </motion.div>

      </div>

    </motion.main>
  );
}
