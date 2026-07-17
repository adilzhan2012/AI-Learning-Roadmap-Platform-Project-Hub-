import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Activity, Loader2 } from 'lucide-react';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserStats, getUserCourses } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';

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
    const end = Math.round(parseFloat(value) || 0);
    if (end <= 0) {
      setCount(0);
      return;
    }
    if (start === end) return;

    const totalDuration = 1000;
    let incrementTime = (totalDuration / end) * 2;
    if (incrementTime < 10) incrementTime = 10;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Insights() {
  const locale = useLocale();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const fetchedStats = await getUserStats(currentUser.uid);
          setStats(fetchedStats);

          const fetchedCourses = await getUserCourses(currentUser.uid);
          setCourses(fetchedCourses);
        } catch (e) {
          console.error("Error fetching insights data:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-surface gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">{t('insights.loading')}</p>
      </div>
    );
  }

  // Calculate stats
  const totalHours = stats ? Math.round(stats.hoursLearned || 0) : 0;
  const activeRoadmaps = stats ? stats.activeCoursesCount || 0 : 0;
  const streakDays = stats ? stats.streakDays || 1 : 1;

  // Calculate average completion rate
  let avgCompletion = 0;
  if (courses.length > 0) {
    const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
    avgCompletion = Math.round(totalProgress / courses.length);
  }

  // Build chart data points based on course progress sorted by date
  // We want at least 5 points to draw a nice curve
  let learningData = [10, 20, 15, 30, 45]; // default fallback
  if (courses.length > 0) {
    // Take progress of all courses, reverse to show chronological order
    const progressList = courses.map(c => c.progress || 0).reverse();
    if (progressList.length === 1) {
      learningData = [0, progressList[0] * 0.25, progressList[0] * 0.5, progressList[0] * 0.75, progressList[0]];
    } else {
      learningData = progressList;
      // Pad to have at least 5 elements
      while (learningData.length < 5) {
        // Linearly interpolate backwards or pad with 0s
        learningData.unshift(0);
      }
    }
  } else {
    learningData = [0, 0, 0, 0, 0];
  }

  const points = learningData.map((val, i) => `${(i / (learningData.length - 1)) * 100},${100 - val}`).join(' ');

  return (
    <motion.main initial="hidden" animate="show" variants={containerVariants} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <motion.div variants={itemVariants} className="mb-4">
        <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">{t('insights.title')}</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">{t('insights.subtitle')}</p>
      </motion.div>

      {/* Main Chart */}
      <motion.div variants={itemVariants} className="bg-surface border border-outline-variant rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{t('insights.trajectory')}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{t('insights.trajectoryDesc')}</p>
          </div>
          <select className="bg-surface-container text-on-surface border border-outline-variant rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary">
            <option>{t('insights.allTimeRoadmaps')}</option>
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
          <Clock className="w-8 h-8 text-white/80 mb-6" />
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">{t('insights.hoursTitle')}</h3>
          <div className="text-5xl font-bold tracking-tight mb-2"><AnimatedNumber value={totalHours} /><span className="text-2xl text-white/60 ml-1">h</span></div>
          <p className="text-sm text-green-300 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {t('insights.trackerActive')}</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          <Target className="w-8 h-8 text-primary mb-6" />
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{t('insights.avgProgress')}</h3>
          <div className="text-5xl font-bold text-on-surface mb-2"><AnimatedNumber value={avgCompletion} /><span className="text-2xl text-on-surface-variant ml-1">%</span></div>
          <p className="text-sm text-green-500 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {t('insights.acrossRoadmaps', { count: courses.length })}</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
          <Zap className="w-8 h-8 text-orange-500 mb-6" />
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{t('insights.currentStreak')}</h3>
          <div className="text-5xl font-bold text-on-surface mb-2"><AnimatedNumber value={streakDays} /><span className="text-2xl text-on-surface-variant ml-1"> {t('insights.days')}</span></div>
          <p className="text-sm text-on-surface-variant font-medium flex items-center gap-1">{t('insights.streakDesc')}</p>
        </motion.div>

      </div>

    </motion.main>
  );
}
