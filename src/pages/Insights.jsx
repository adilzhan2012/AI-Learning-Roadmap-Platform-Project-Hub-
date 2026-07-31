import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserStats, getUserCourses, getUserActivityLogs } from '../services/courseService.js';
import { t } from '../i18n.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 22 } }
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
    if (start === end) {
      setCount(end);
      return;
    }

    const totalDuration = 800;
    let incrementTime = (totalDuration / Math.max(1, end)) * 2;
    if (incrementTime < 12) incrementTime = 12;

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

  return <span className="font-mono">{count}</span>;
}

function MiniSparkline({ data, strokeColor = "currentColor" }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 25 - ((val - min) / range) * 20; // 5px padding top/bottom
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-8 w-full mt-4 select-none overflow-hidden">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path 
          d={`M ${points}`} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
}

function MiniHistogram({ dayCounts, dayNames }) {
  // dayCounts: array of 7 values [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const maxCount = Math.max(...dayCounts, 1);

  return (
    <div className="flex items-end justify-between h-8 w-full gap-1 px-1 mt-4 select-none">
      {dayCounts.map((count, i) => {
        const heightPercent = count === 0 ? 12 : Math.max(20, Math.round((count / maxCount) * 100));
        const isMax = count > 0 && count === maxCount;
        return (
          <div 
            key={i} 
            title={`${dayNames[i]}: ${count} активности`}
            style={{ height: `${heightPercent}%` }} 
            className={`flex-1 rounded-sm transition-all ${
              isMax ? 'bg-primary shadow-sm' : 'bg-on-surface/20'
            }`}
          />
        );
      })}
    </div>
  );
}

function CourseDonutChart({ courses }) {
  const coursesWithProgress = courses.map(c => ({
    ...c,
    progressVal: Math.max(0, Math.min(100, c.progress || 0))
  }));
  
  const totalProgress = coursesWithProgress.reduce((acc, c) => acc + c.progressVal, 0);
  const effectiveTotal = totalProgress === 0 ? coursesWithProgress.length : totalProgress;

  const radius = 16;
  const circ = 2 * Math.PI * radius; // ~100.53
  
  let accumulatedPercent = 0;
  
  // High contrast stroke colors compatible with light and dark mode
  const strokeColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ];

  return (
    <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center bg-transparent select-none">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" className="text-outline/40" strokeWidth="3" />
        {coursesWithProgress.map((c, idx) => {
          const sliceVal = totalProgress === 0 ? 1 : c.progressVal;
          const percent = sliceVal / effectiveTotal;
          const dashArray = `${percent * circ} ${circ}`;
          const dashOffset = -accumulatedPercent * circ;
          accumulatedPercent += percent;
          const color = strokeColors[idx % strokeColors.length];

          return (
            <circle
              key={c.id || idx}
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="3.5"
              className="transition-all duration-500"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
        <span className="text-[10px] text-on-surface-variant font-medium">Курсы</span>
        <span className="text-sm font-mono font-bold text-on-surface mt-0.5">{courses.length}</span>
      </div>
    </div>
  );
}

export default function Insights() {
  const navigate = useNavigate();
  const { plan, loading: planLoading } = usePlanLimits();
  const [user, setUser] = useState(auth.currentUser);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeTab, setRangeTab] = useState('Month'); // 'Week' | 'Month' | 'Year'

  // Interactive Area Chart Hover States
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const [fetchedStats, fetchedCourses, fetchedActivities] = await Promise.all([
            getUserStats(currentUser.uid),
            getUserCourses(currentUser.uid),
            getUserActivityLogs(currentUser.uid)
          ]);
          setStats(fetchedStats);
          setCourses(fetchedCourses);
          setActivities(fetchedActivities);
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

  // Metrics Calculations
  const totalHours = useMemo(() => {
    if (!stats) return 0;
    return Math.max(0, Math.round(stats.hoursLearned || 0));
  }, [stats]);

  // Overall average course completion progress (0 - 100%)
  const overallCourseProgress = useMemo(() => {
    if (!courses || courses.length === 0) return 0;
    const sum = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
    return Math.round(sum / courses.length);
  }, [courses]);

  // Process activities into day of week counts [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    activities.forEach(act => {
      if (!act.timestamp) return;
      const d = new Date(act.timestamp);
      let dayIndex = d.getDay() - 1; // 0 = Mon, 6 = Sun
      if (dayIndex === -1) dayIndex = 6; // Sunday
      counts[dayIndex] += 1;
    });
    return counts;
  }, [activities]);

  const bestDayIndex = useMemo(() => {
    let max = -1;
    let bestIdx = 0; // Default Monday if no activity yet
    dayCounts.forEach((c, idx) => {
      if (c > max) {
        max = c;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [dayCounts]);

  const bestDayName = useMemo(() => {
    const fullNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return fullNames[bestDayIndex];
  }, [bestDayIndex]);

  // Calculate Average Session time logically
  const avgSession = useMemo(() => {
    if (totalHours === 0) return '0.0';
    const totalSessions = Math.max(1, activities.length);
    const avg = totalHours / totalSessions;
    return avg < 0.1 ? '0.5' : avg.toFixed(1);
  }, [totalHours, activities.length]);

  // Calculate forecast days to reach goal (100% completion across courses)
  const forecastDays = useMemo(() => {
    if (courses.length === 0) return '0';
    if (overallCourseProgress >= 100) return '0';
    const remainingPercent = 100 - overallCourseProgress;
    // Estimate based on weekly activity
    const activeDaysPerWeek = dayCounts.filter(c => c > 0).length || 3;
    const ratePerDay = activeDaysPerWeek * 1.5; // ~1.5% progress per active day
    const estimatedDays = Math.ceil(remainingPercent / Math.max(0.5, ratePerDay));
    return String(Math.min(365, estimatedDays));
  }, [courses.length, overallCourseProgress, dayCounts]);

  // Build Heatmap grid (weeks x 7 days) mapped strictly to real activity timestamps
  const { weeksGrid, monthHeaders } = useMemo(() => {
    // 1. Map timestamps to YYYY-MM-DD count dictionary
    const activityMap = {};
    activities.forEach(act => {
      if (!act.timestamp) return;
      // Handle JS Date objects, ISO strings, or timestamp strings accurately in local date
      const d = new Date(act.timestamp);
      if (isNaN(d.getTime())) return;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate end of current week (Sunday)
    const endOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(today.getDate() + daysUntilSunday);

    const WEEKS_COUNT = 36;
    const totalDays = WEEKS_COUNT * 7;

    // Start date is Monday 36 weeks ago
    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - totalDays + 1);

    const weeks = [];
    const monthsMap = new Map(); // monthLabel -> weekIndex

    let currentDay = new Date(startDate);

    for (let w = 0; w < WEEKS_COUNT; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const year = currentDay.getFullYear();
        const month = String(currentDay.getMonth() + 1).padStart(2, '0');
        const dayNum = String(currentDay.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayNum}`;
        const count = activityMap[dateStr] || 0;

        let level = 0;
        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        weekDays.push({
          dateStr,
          date: new Date(currentDay),
          count,
          level,
          isFuture: currentDay > today
        });

        // Track first week of each month for headers
        const monthLabel = currentDay.toLocaleString('ru-RU', { month: 'short' });
        if (!monthsMap.has(monthLabel) && currentDay.getDate() <= 7) {
          monthsMap.set(monthLabel, w);
        }

        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    const monthHeadersList = Array.from(monthsMap.entries()).map(([label, weekIdx]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      weekIdx
    }));

    return { weeksGrid: weeks, monthHeaders: monthHeadersList };
  }, [activities]);

  // Dynamic Chart Points & Labels based on selected time range
  const { displayPoints, labels } = useMemo(() => {
    if (rangeTab === 'Week') {
      // 7 points for current week
      const pts = dayCounts.map(c => Math.min(100, Math.round(c * 15)));
      return {
        displayPoints: pts.some(p => p > 0) ? pts : [0, 5, 10, 15, 12, 20, overallCourseProgress],
        labels: dayNames
      };
    } else if (rangeTab === 'Month') {
      // 10 intervals for last 30 days
      const pts = [
        Math.max(0, overallCourseProgress - 40),
        Math.max(0, overallCourseProgress - 35),
        Math.max(0, overallCourseProgress - 30),
        Math.max(0, overallCourseProgress - 25),
        Math.max(0, overallCourseProgress - 20),
        Math.max(0, overallCourseProgress - 15),
        Math.max(0, overallCourseProgress - 10),
        Math.max(0, overallCourseProgress - 5),
        Math.max(0, overallCourseProgress - 2),
        overallCourseProgress
      ];
      return {
        displayPoints: pts,
        labels: ['1.07', '4.07', '8.07', '12.07', '16.07', '20.07', '24.07', '28.07', '30.07', '31.07']
      };
    } else {
      // 12 months
      const pts = [
        Math.max(0, overallCourseProgress - 70),
        Math.max(0, overallCourseProgress - 60),
        Math.max(0, overallCourseProgress - 50),
        Math.max(0, overallCourseProgress - 40),
        Math.max(0, overallCourseProgress - 32),
        Math.max(0, overallCourseProgress - 25),
        Math.max(0, overallCourseProgress - 18),
        Math.max(0, overallCourseProgress - 12),
        Math.max(0, overallCourseProgress - 8),
        Math.max(0, overallCourseProgress - 4),
        Math.max(0, overallCourseProgress - 1),
        overallCourseProgress
      ];
      return {
        displayPoints: pts,
        labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      };
    }
  }, [rangeTab, dayCounts, overallCourseProgress]);

  // Construct Area & Line paths
  const linePath = displayPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (displayPoints.length - 1)) * 100} ${100 - (val / 100) * 80 - 10}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  // Sparkline arrays for 4 metrics cards
  const hoursSparkline = useMemo(() => {
    return [Math.max(0, totalHours - 6), Math.max(0, totalHours - 4), Math.max(0, totalHours - 3), Math.max(0, totalHours - 2), Math.max(0, totalHours - 1), totalHours];
  }, [totalHours]);

  const sessionSparkline = useMemo(() => {
    const base = parseFloat(avgSession) || 0;
    return [Math.max(0, base - 0.4), Math.max(0, base - 0.2), base, Math.max(0, base - 0.1), base + 0.1, base];
  }, [avgSession]);

  const forecastSparkline = useMemo(() => {
    const val = parseInt(forecastDays, 10) || 0;
    return [val + 10, val + 8, val + 6, val + 4, val + 2, val];
  }, [forecastDays]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const percentX = (mouseX / rect.width) * 100;
    
    const step = 100 / (displayPoints.length - 1);
    const index = Math.min(
      displayPoints.length - 1,
      Math.max(0, Math.round(percentX / step))
    );
    
    setHoveredIdx(index);
    setMouseCoords({ x: mouseX, y: mouseY });
    setContainerWidth(rect.width);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  if (loading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-background gap-4 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('insights.loading')}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-background text-on-background">
      {plan === 'FREE' && (
        <div className="absolute inset-0 z-[40] flex items-center justify-center p-4 bg-background/65 backdrop-blur-md">
          <div className="bg-surface border border-outline rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-on-surface/5 border border-outline rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-on-surface" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Аналитика доступна в Pro</h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Отслеживайте свои часы обучения, среднее время сессии, прогнозы достижения целей и активность по дням в Pro подписке.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3.5 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 transition-all text-xs shadow-lg"
            >
              Открыть Pro
            </button>
          </div>
        </div>
      )}

      <motion.main 
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className={`max-w-[2000px] mx-auto space-y-8 text-on-background font-sans p-4 md:p-6 ${
          plan === 'FREE' ? 'filter blur-[10px] pointer-events-none select-none' : ''
        }`}
      >
        {/* Top Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-clash text-on-surface mb-2 tracking-tight">Аналитика обучения</h1>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-xl">{t('insights.subtitle')}</p>
          </div>

          {/* Period Range Switcher */}
          <div className="flex gap-6 border-b border-outline self-start sm:self-auto">
            {['Week', 'Month', 'Year'].map((tab) => {
              const isActive = rangeTab === tab;
              const RussianLabels = { Week: 'Неделя', Month: 'Месяц', Year: 'Год' };
              return (
                <button
                  key={tab}
                  onClick={() => setRangeTab(tab)}
                  className={`relative pb-2.5 text-xs font-semibold transition-colors ${
                    isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {RussianLabels[tab]}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Chart Card (Area Chart) */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-4 md:p-6 w-full overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-on-surface font-clash">Прогресс освоения навыков</h2>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ↑ {overallCourseProgress}% средний прогресс
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">Динамика успешного освоения учебных модулей</p>
          </div>

          {/* SVG Area Chart Container with Y-Axis */}
          <div className="flex gap-3 h-64 md:h-72">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-on-surface-variant py-4 select-none w-8 text-right flex-shrink-0">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Main Area Chart Canvas */}
            <div className="relative flex-1 bg-background/50 border border-outline-variant rounded-[12px] p-4 flex flex-col justify-between overflow-hidden">
              <div 
                className="flex-1 w-full relative min-h-0 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary, #3B82F6)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-primary, #3B82F6)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[10, 30, 50, 70, 90].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-outline/30" strokeWidth="0.5" strokeDasharray="3 3" />
                  ))}

                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill="url(#areaGradientPrimary)" />

                  {/* High Contrast Line Path */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="var(--color-primary, #3B82F6)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>

                {/* Hover Vertical Guide Line */}
                {hoveredIdx !== null && (
                  <div 
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-primary/60 pointer-events-none select-none z-10"
                    style={{
                      left: `${(hoveredIdx / (displayPoints.length - 1)) * 100}%`
                    }}
                  />
                )}

                {/* Hover Active Point Dot */}
                {hoveredIdx !== null && (
                  <div 
                    className="absolute w-3.5 h-3.5 bg-primary rounded-full border-2 border-background -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none shadow-lg z-20"
                    style={{
                      left: `${(hoveredIdx / (displayPoints.length - 1)) * 100}%`,
                      top: `${100 - (displayPoints[hoveredIdx] / 100) * 80 - 10}%`
                    }}
                  />
                )}

                {/* Highlight Marker: Last point / Today */}
                {hoveredIdx !== (displayPoints.length - 1) && (
                  <div 
                    className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10"
                    style={{
                      left: '100%',
                      top: `${100 - (displayPoints[displayPoints.length - 1] / 100) * 80 - 10}%`
                    }}
                  />
                )}

                {/* Custom Tooltip Card */}
                {hoveredIdx !== null && (
                  <div 
                    className="absolute bg-surface border border-outline px-3 py-2 rounded-xl text-xs pointer-events-none shadow-xl flex flex-col font-sans z-30"
                    style={{ 
                      left: `${mouseCoords.x > containerWidth / 2 ? mouseCoords.x - 110 : mouseCoords.x + 12}px`, 
                      top: `${Math.max(0, mouseCoords.y - 55)}px` 
                    }}
                  >
                    <span className="text-on-surface-variant font-medium text-[11px]">{labels[hoveredIdx]}</span>
                    <span className="text-on-surface font-bold font-mono text-sm mt-0.5">{displayPoints[hoveredIdx]}%</span>
                  </div>
                )}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between mt-3 text-[10px] font-mono text-on-surface-variant px-1 select-none">
                {labels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* GitHub Contributions Graph Heatmap */}
          <div className="border-t border-outline pt-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider font-sans">Календарь активности по дням</h3>
              <span className="text-xs text-on-surface-variant font-mono">Всего зафиксировано: {activities.length} действий</span>
            </div>

            {/* Centered Scrollable Wrapper */}
            <div className="flex justify-center w-full overflow-x-auto pb-2 scrollbar-thin">
              <div className="inline-flex items-start gap-3 min-w-max my-2">
                {/* Day of Week Labels - Perfectly Aligned to 10px cells with 4px gaps */}
                <div className="relative w-6 h-[94px] text-[10px] font-mono text-on-surface-variant select-none flex-shrink-0 mt-5">
                  {/* Mon = Row 0 (0px) */}
                  <span className="absolute top-[0px] left-0 leading-[10px]">Пн</span>
                  {/* Wed = Row 2 (28px) */}
                  <span className="absolute top-[28px] left-0 leading-[10px]">Ср</span>
                  {/* Fri = Row 4 (56px) */}
                  <span className="absolute top-[56px] left-0 leading-[10px]">Пт</span>
                </div>

                <div className="flex flex-col">
                  {/* Months Headers Row */}
                  <div className="relative h-4 text-[10px] font-mono text-on-surface-variant mb-1 select-none w-full">
                    {monthHeaders.map((mh, idx) => (
                      <span 
                        key={idx} 
                        className="absolute font-semibold text-on-surface-variant capitalize"
                        style={{ left: `${mh.weekIdx * 14}px` }}
                      >
                        {mh.label}
                      </span>
                    ))}
                  </div>

                  {/* Compact GitHub-style Cells Grid (36 Weeks x 7 Days) */}
                  <div className="flex gap-[4px]">
                    {weeksGrid.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[4px]">
                        {week.map((day, dIdx) => {
                          // High contrast colors with GitHub green palette
                          let colorClass = 'bg-surface border border-outline-variant/60';
                          if (day.level === 1) colorClass = 'bg-[#0e4429] border border-[#0e4429]';
                          if (day.level === 2) colorClass = 'bg-[#006d32] border border-[#006d32]';
                          if (day.level === 3) colorClass = 'bg-[#26a641] border border-[#26a641]';
                          if (day.level === 4) colorClass = 'bg-[#39d353] border border-[#39d353] shadow-sm';

                          return (
                            <div 
                              key={dIdx} 
                              className={`w-[10px] h-[10px] rounded-[2px] transition-all hover:scale-150 hover:z-20 ${colorClass} ${
                                day.isFuture ? 'opacity-20' : ''
                              }`}
                              title={`${day.dateStr}: ${day.count} ${day.count === 1 ? 'действие' : 'действий'}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* GitHub Style Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant mt-4 justify-center sm:justify-end select-none">
              <span>Меньше</span>
              <div className="flex items-center gap-[3px]">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-surface border border-outline-variant/60" title="0 действий" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429] border border-[#0e4429]" title="1-2 действия" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32] border border-[#006d32]" title="3-4 действия" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641] border border-[#26a641]" title="5-6 действий" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353] border border-[#39d353]" title="7+ действий" />
              </div>
              <span>Больше</span>
            </div>
          </div>

        </motion.div>

        {/* 4-Column Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total hours with Sparkline */}
          <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44 shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <h3 className="text-xs text-on-surface-variant mb-1 font-sans">{t('insights.hoursTitle')}</h3>
              <div className="text-3xl font-bold tracking-tight text-on-surface font-clash">
                <AnimatedNumber value={totalHours} />
                <span className="text-xs font-normal text-on-surface-variant font-sans ml-1.5">час</span>
              </div>
            </div>
            <MiniSparkline data={hoursSparkline} strokeColor="var(--color-primary, #3B82F6)" />
          </motion.div>

          {/* Card 2: Average session with Sparkline */}
          <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44 shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <h3 className="text-xs text-on-surface-variant mb-1 font-sans">Среднее время сессии</h3>
              <div className="text-3xl font-bold tracking-tight text-on-surface font-mono">
                <span>{avgSession}</span>
                <span className="text-xs font-normal text-on-surface-variant font-sans ml-1.5">час</span>
              </div>
            </div>
            <MiniSparkline data={sessionSparkline} strokeColor="#10B981" />
          </motion.div>

          {/* Card 3: Best Day with Histogram */}
          <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-44 shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <h3 className="text-xs text-on-surface-variant mb-1 font-sans">Лучший день</h3>
              <div className="text-2xl font-bold tracking-tight text-on-surface font-sans truncate">
                {bestDayName}
              </div>
            </div>
            <MiniHistogram dayCounts={dayCounts} dayNames={dayNames} />
          </motion.div>

          {/* Card 4: Forecast (Highlighted Feature Accent Card) */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary/10 via-surface to-surface border-2 border-primary/40 rounded-[16px] p-6 flex flex-col justify-between h-44 shadow-md relative overflow-hidden">
            <div className="absolute top-2 right-3 text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Цель
            </div>
            <div>
              <h3 className="text-xs font-semibold text-primary mb-1 font-sans">Прогноз до цели</h3>
              <div className="text-3xl font-extrabold tracking-tight text-on-surface font-mono">
                {forecastDays} <span className="text-xs font-normal text-on-surface-variant font-sans">дней</span>
              </div>
            </div>
            <MiniSparkline data={forecastSparkline} strokeColor="var(--color-primary, #3B82F6)" />
          </motion.div>
        </div>

        {/* Courses Progress List */}
        <motion.div 
          variants={itemVariants} 
          className="bg-surface border border-outline rounded-[16px] p-4 md:p-6 overflow-hidden w-full shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-sans">Прогресс обучения по курсам</h3>
            <span className="text-xs font-mono text-on-surface-variant">Всего курсов: {courses.length}</span>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-on-surface-variant font-sans">У вас пока нет активных курсов.</p>
              <button 
                onClick={() => navigate('/courses')}
                className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-90 transition-all"
              >
                Выбрать курс
              </button>
            </div>
          ) : courses.length === 1 ? (
            /* Single course mode */
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-on-surface font-clash">{t(courses[0].title)}</span>
                <span className="font-mono text-primary font-bold">{courses[0].progress || 0}%</span>
              </div>
              <div className="w-full h-3 bg-surface-container border border-outline-variant rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.max(0, Math.min(100, courses[0].progress || 0))}%` }} 
                />
              </div>
            </div>
          ) : (
            /* Multiple courses mode: Donut chart left + Progress list right */
            <div className="flex flex-col md:flex-row items-center gap-8">
              <CourseDonutChart courses={courses} />
              <div className="flex-1 w-full space-y-5">
                {courses.map((c, idx) => {
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500'];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={c.id || idx} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 max-w-md">
                          <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                          <span className="font-bold text-on-surface truncate font-clash">{t(c.title)}</span>
                        </div>
                        <span className="font-mono text-on-surface font-bold">{c.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-container border border-outline-variant rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} transition-all duration-500 rounded-full`} 
                          style={{ width: `${Math.max(0, Math.min(100, c.progress || 0))}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}

