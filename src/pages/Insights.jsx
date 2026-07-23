import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserStats, getUserCourses } from '../services/courseService.js';
import { t, useLocale } from '../i18n.js';
import { usePlanLimits } from '../hooks/usePlanLimits.js';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

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
    if (start === end) return;

    const totalDuration = 800;
    let incrementTime = (totalDuration / end) * 2;
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

function MiniSparkline({ data }) {
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
    <div className="h-8 w-full mt-4 select-none">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path d={`M ${points}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MiniHistogram() {
  const days = [30, 45, 90, 60, 50, 20, 15]; // Wednesday is highest (90%)
  return (
    <div className="flex items-end justify-between h-8 w-full gap-1 px-1 mt-4 select-none">
      {days.map((h, i) => (
        <div 
          key={i} 
          style={{ height: `${h}%` }} 
          className={`flex-1 rounded-sm ${h === 90 ? 'bg-on-surface' : 'bg-on-surface/25'}`}
        />
      ))}
    </div>
  );
}

function CourseDonutChart({ courses }) {
  const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0) || 1;
  const radius = 16;
  const circ = 2 * Math.PI * radius; // 100.53
  
  let accumulatedPercent = 0;
  const shades = [
    'stroke-on-surface',
    'stroke-[#8E8E93]',
    'stroke-[#3A3A3C]',
    'stroke-[#48484A]'
  ];

  return (
    <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center bg-transparent select-none">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        {courses.map((c, idx) => {
          const percent = (c.progress || 0) / totalProgress;
          const dashArray = `${percent * circ} ${circ}`;
          const dashOffset = -accumulatedPercent * circ;
          accumulatedPercent += percent;
          const strokeClass = shades[idx % shades.length];
          return (
            <circle
              key={c.id}
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              strokeWidth="3"
              className={`${strokeClass} transition-all duration-500`}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
        <span className="text-[10px] text-on-surface-variant">Курсы</span>
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
  const [loading, setLoading] = useState(true);
  const [rangeTab, setRangeTab] = useState('Month'); // 'Week' | 'Month' | 'Year'

  // Interactive Area Chart Hover States
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(600);

  // Mock static mock arrays for sparklines
  const hoursSparkline = [10, 15, 12, 18, 22, 28, 30];
  const sessionSparkline = [1.2, 1.5, 1.8, 1.4, 1.9, 1.8, 2.1];
  const forecastSparkline = [40, 48, 55, 62, 70, 78, 85];

  // Generate 24 weeks * 7 days activity values (levels 0 to 4)
  const [heatmapDays] = useState(() => {
    const arr = [];
    for (let i = 0; i < 168; i++) {
      // Create random-like learning waves
      const factor = Math.sin(i / 10) * Math.cos(i / 5);
      let level = 0;
      if (factor > 0.6) level = 4;
      else if (factor > 0.3) level = 3;
      else if (factor > 0) level = 2;
      else if (factor > -0.4) level = 1;
      arr.push(level);
    }
    return arr;
  });

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

  if (loading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-on-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-on-surface" />
        <p className="text-sm font-medium tracking-wide font-clash">{t('insights.loading')}</p>
      </div>
    );
  }

  // Calculations
  const totalHours = stats ? Math.round(stats.hoursLearned || 0) : 0;
  const avgSession = totalHours > 0 ? (totalHours / Math.max(1, courses.length * 1.5)).toFixed(1) : '1.8';
  const bestDay = 'Вторник'; 

  // Build chart points
  let displayPoints = [];
  let labels = [];
  if (rangeTab === 'Week') {
    displayPoints = [12, 18, 15, 24, 30, 22, 35];
    labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  } else if (rangeTab === 'Month') {
    displayPoints = [10, 15, 12, 22, 18, 30, 25, 42, 38, 52];
    labels = ['1.07', '4.07', '8.07', '12.07', '16.07', '20.07', '24.07', '28.07', '30.07', '31.07'];
  } else {
    displayPoints = [15, 25, 20, 35, 45, 40, 58, 62, 55, 68, 75, 85];
    labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  }

  const linePath = displayPoints.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (displayPoints.length - 1)) * 100} ${100 - (val / 100) * 80 - 10}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

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

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-background">
      {plan === 'FREE' && (
        <div className="absolute inset-0 z-[40] flex items-center justify-center p-4 bg-background/65">
          <div className="bg-surface border border-outline rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-outline">
            <div className="w-12 h-12 bg-on-surface/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-on-surface" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Аналитика доступна в Pro</h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Отслеживайте свои часы обучения, среднее время сессии, прогнозы достижения целей и активность по дням в Pro подписке.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3.5 rounded-xl font-bold bg-on-surface text-inverse-on-surface hover:bg-[#F5F5F7] transition-all text-xs"
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
        className={`max-w-[2000px] mx-auto space-y-8 text-on-background font-sans bg-background p-4 md:p-6 ${
          plan === 'FREE' ? 'filter blur-[10px] pointer-events-none select-none' : ''
        }`}
      >
      {/* Top Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-bold font-clash text-on-surface mb-2 tracking-tight">Аналитика обучения</h1>
          <p className="text-sm text-on-surface-variant max-w-xl">{t('insights.subtitle')}</p>
        </div>

        {/* Text tab switcher (Underline only, no pill background) */}
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
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-on-surface"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Chart Card */}
      <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-4 md:p-6 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-on-surface font-clash">{t('insights.trajectory')}</h2>
            <span className="text-xs text-on-surface-variant font-normal font-sans">
              ↑ +24% к прошлому периоду
            </span>
          </div>
          <p className="text-xs text-on-surface-variant hidden sm:block">{t('insights.trajectoryDesc')}</p>
        </div>

        {/* SVG Area Chart with hover guides and tooltip */}
        <div className="relative w-full h-56 md:h-72 bg-background/30 border border-outline-variant rounded-[12px] p-4 flex flex-col justify-between">
          <div 
            className="flex-1 w-full relative min-h-0 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[25, 50, 75].map(y => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              ))}

              {/* Gradient Area Fill */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* White Curve Line */}
              <path d={linePath} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Hover Vertical Guide (HTML Overlay - Undistorted) */}
            {hoveredIdx !== null && (
              <div 
                className="absolute top-0 bottom-0 border-l border-dashed border-[rgba(255,255,255,0.25)] pointer-events-none select-none"
                style={{
                  left: `${(hoveredIdx / (displayPoints.length - 1)) * 100}%`
                }}
              />
            )}

            {/* Hover Active Dot (HTML Overlay - Undistorted) */}
            {hoveredIdx !== null && (
              <div 
                className="absolute w-3 h-3 bg-on-surface rounded-full border border-[#1C1C1E] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none shadow-lg"
                style={{
                  left: `${(hoveredIdx / (displayPoints.length - 1)) * 100}%`,
                  top: `${100 - (displayPoints[hoveredIdx] / 100) * 80 - 10}%`
                }}
              />
            )}

            {/* Highlight Marker: Last point / Today (HTML Overlay - Undistorted) */}
            {hoveredIdx !== (displayPoints.length - 1) && (
              <>
                <div 
                  className="absolute w-2.5 h-2.5 bg-on-surface rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                  style={{
                    left: '100%',
                    top: `${100 - (displayPoints[displayPoints.length - 1] / 100) * 80 - 10}%`
                  }}
                />
                <div 
                  className="absolute w-4 h-4 border border-[#FFFFFF] rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none select-none"
                  style={{
                    left: '100%',
                    top: `${100 - (displayPoints[displayPoints.length - 1] / 100) * 80 - 10}%`
                  }}
                />
                <div 
                  className="absolute text-[10px] font-mono font-bold text-on-surface -translate-x-full -translate-y-1/2 pr-2.5 pointer-events-none select-none"
                  style={{
                    left: '100%',
                    top: `${100 - (displayPoints[displayPoints.length - 1] / 100) * 80 - 10}%`
                  }}
                >
                  {displayPoints[displayPoints.length - 1]}%
                </div>
              </>
            )}

            {/* Custom Tooltip Card */}
            {hoveredIdx !== null && (
              <div 
                className="absolute bg-surface border border-outline px-3 py-2 rounded-[8px] text-[11px] pointer-events-none shadow-xl flex flex-col font-sans z-20"
                style={{ 
                  left: `${mouseCoords.x > containerWidth / 2 ? mouseCoords.x - 110 : mouseCoords.x + 12}px`, 
                  top: `${Math.max(0, mouseCoords.y - 55)}px` 
                }}
              >
                <span className="text-on-surface-variant font-sans">{labels[hoveredIdx]}</span>
                <span className="text-on-surface font-bold font-mono text-xs mt-0.5">{displayPoints[hoveredIdx]}%</span>
              </div>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between mt-3 text-[9px] font-mono text-on-surface-variant px-1 select-none">
            {labels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>

        {/* GitHub Contributions Graph Heatmap */}
        <div className="border-t border-outline pt-6 mt-8">
          <h3 className="text-xs font-bold text-on-surface mb-4 font-sans">Активность по дням</h3>
          <div className="flex overflow-x-auto pb-2 scrollbar-thin">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[650px] mx-auto lg:mx-0">
              {heatmapDays.map((val, idx) => {
                let colorClass = 'bg-transparent border border-outline-variant';
                if (val === 1) colorClass = 'bg-on-surface/10';
                if (val === 2) colorClass = 'bg-on-surface/25';
                if (val === 3) colorClass = 'bg-on-surface/55';
                if (val === 4) colorClass = 'bg-on-surface';
                return (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${colorClass}`}
                    title={`День ${idx + 1}: ${val > 0 ? `${val} ч` : 'нет активности'}`}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant mt-3 font-sans justify-end select-none">
            <span>Меньше</span>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-transparent border border-outline-variant" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-on-surface/10" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-on-surface/25" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-on-surface/55" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-on-surface" />
            <span>Больше</span>
          </div>
        </div>
      </motion.div>

      {/* Balanced 4-Column Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total hours with Sparkline */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-40">
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1.5 font-sans">{t('insights.hoursTitle')}</h3>
            <div className="text-3xl font-bold tracking-tight text-on-surface font-clash">
              <AnimatedNumber value={totalHours} />
              <span className="text-xs text-on-surface-variant font-sans ml-1.5">час</span>
            </div>
          </div>
          <MiniSparkline data={hoursSparkline} />
        </motion.div>

        {/* Card 2: Average session with Sparkline */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-40">
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1.5 font-sans">Среднее время сессии</h3>
            <div className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              <span>{avgSession}</span>
              <span className="text-xs text-on-surface-variant font-sans ml-1.5">час</span>
            </div>
          </div>
          <MiniSparkline data={sessionSparkline} />
        </motion.div>

        {/* Card 3: Best Day with Mini Histogram */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-40">
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1.5 font-sans">Лучший день</h3>
            <div className="text-3xl font-bold tracking-tight text-on-surface font-sans">
              {bestDay}
            </div>
          </div>
          <MiniHistogram />
        </motion.div>

        {/* Card 4: Forecast with Progression Sparkline */}
        <motion.div variants={itemVariants} className="bg-surface border border-outline rounded-[16px] p-6 flex flex-col justify-between h-40">
          <div>
            <h3 className="text-xs text-on-surface-variant mb-1.5 font-sans">Прогноз до цели</h3>
            <div className="text-3xl font-bold tracking-tight text-on-surface font-mono">
              12 дней
            </div>
          </div>
          <MiniSparkline data={forecastSparkline} />
        </motion.div>
      </div>

      {/* Courses Progress List */}
      <motion.div 
        variants={itemVariants} 
        className={`bg-surface border border-outline rounded-[16px] p-4 md:p-6 overflow-hidden ${
          courses.length === 1 ? 'max-w-2xl' : 'w-full'
        }`}
      >
        <h3 className="text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-6 font-sans">Прогресс обучения по курсам</h3>
        
        {courses.length === 0 ? (
          <p className="text-xs text-on-surface-variant font-sans">Нет активных курсов для отображения.</p>
        ) : courses.length === 1 ? (
          /* Single course: compact container size */
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-on-background truncate font-clash">{t(courses[0].title)}</span>
              <span className="font-mono text-on-surface font-bold">{courses[0].progress || 0}%</span>
            </div>
            <div className="w-full h-[2px] bg-surface-container border border-outline-variant rounded-sm overflow-hidden">
              <div className="h-full bg-on-surface" style={{ width: `${courses[0].progress || 0}%` }} />
            </div>
          </div>
        ) : (
          /* Multiple courses: Donut chart left + Progress list right */
          <div className="flex flex-col md:flex-row items-center gap-8">
            <CourseDonutChart courses={courses} />
            <div className="flex-1 w-full space-y-6">
              {courses.map(c => (
                <div key={c.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-on-background truncate max-w-md font-clash">{t(c.title)}</span>
                    <span className="font-mono text-on-surface font-bold">{c.progress || 0}%</span>
                  </div>
                  <div className="w-full h-[2px] bg-surface-container border border-outline-variant rounded-sm overflow-hidden">
                    <div className="h-full bg-on-surface" style={{ width: `${c.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.main>
    </div>
  );
}
